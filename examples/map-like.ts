import { Pool } from '../src';
import type { PoolEntry } from '../src/types';

console.log('=== Pool as Map Replacement ===\n');

// ========== SIMPLE EXAMPLE ==========

interface User {
	id: string;
	username: string;
	email: string;
	age: number;
}

const users = new Pool<User>();

console.log('--- Adding users ---\n');

// Add users
users.add({ id: 'user1', username: 'alice', email: 'alice@example.com', age: 25 });
users.add({ id: 'user2', username: 'bob', email: 'bob@example.com', age: 30 });
users.add({ id: 'user3', username: 'charlie', email: 'charlie@example.com', age: 35 });

console.log(`Total users: ${users.size}`);

// ========== GET ==========

console.log('\n--- Getting users ---\n');

// Get by id (like a Map)
const user1 = users.get('id', 'user1');
console.log('Get by id:', user1);

// Get by username
const alice = users.get('username', 'alice');
console.log('Get by username:', alice);

// Get by predicate
const adult = users.get((entry) => entry.data.age >= 30);
console.log('Get by predicate (age >= 30):', adult);

// ========== HAS ==========

console.log('\n--- Checking existence ---\n');

console.log('Has user1?', users.has('id', 'user1')); // true
console.log('Has user999?', users.has('id', 'user999')); // false
console.log('Has user named bob?', users.has('username', 'bob')); // true
console.log('Has user over 40?', users.has((entry) => entry.data.age > 40)); // false

// ========== SET ==========

console.log('\n--- Updating users ---\n');

// Update an existing user
users.set('id', 'user1', { id: 'user1', username: 'alice_updated', email: 'alice_new@example.com', age: 26 });

console.log('Updated user1:', users.get('id', 'user1'));

// Add a new user via set (if it doesn't exist)
users.set('id', 'user4', { id: 'user4', username: 'dave', email: 'dave@example.com', age: 28 });

console.log('New user4:', users.get('id', 'user4'));
console.log(`Total users: ${users.size}`);

// ========== DELETE ==========

console.log('\n--- Deleting users ---\n');

const deleted = users.delete('id', 'user2');
console.log('Deleted user2?', deleted); // true

const deletedAgain = users.delete('id', 'user2');
console.log('Deleted user2 again?', deletedAgain); // false (already deleted)

console.log(`Total users: ${users.size}`);

// ========== POOL OF POOLS ==========

console.log('\n=== Pool of Pools with get/has ===\n');

interface Project {
	id: string;
	name: string;
}

const webProjects = new Pool<Project>();
webProjects.add({ id: 'p1', name: 'Website' });
webProjects.add({ id: 'p2', name: 'Web App' });

const mobileProjects = new Pool<Project>();
mobileProjects.add({ id: 'p3', name: 'iOS App' });
mobileProjects.add({ id: 'p4', name: 'Android App' });

const backendProjects = new Pool<Project>();
backendProjects.add({ id: 'p5', name: 'API Server' });
backendProjects.add({ id: 'p6', name: 'Database' });

// Create a pool of pools with ids in metadata
const projectPools = new Pool<Pool<Project>>();
projectPools.add(webProjects, { id: 'web', category: 'Frontend' });
projectPools.add(mobileProjects, { id: 'mobile', category: 'Mobile' });
projectPools.add(backendProjects, { id: 'backend', category: 'Backend' });

console.log(`Total project pools: ${projectPools.size}`);

// Get a pool by id in metadata
const webPool = projectPools.get((entry) => entry.meta.id === 'web');
if (webPool) {
	console.log(`\nWeb projects pool has ${webPool.size} projects:`);
	for (const p of webPool.all) console.log(`  - ${p.name}`);
}

// Get a pool by category
const mobilePool = projectPools.get((entry) => entry.meta.category === 'Mobile');
if (mobilePool) {
	console.log(`\nMobile projects pool has ${mobilePool.size} projects:`);
	for (const p of mobilePool.all) console.log(`  - ${p.name}`);
}

// Check if a pool exists
console.log('\nHas web pool?', projectPools.has((entry) => entry.meta.id === 'web')); // true
console.log('Has desktop pool?', projectPools.has((entry) => entry.meta.id === 'desktop')); // false

// Get the pool with the most projects
const biggestPool = projectPools.get((entry) => {
	return entry.data.size === Math.max(...projectPools.all.map((p) => p.size));
});

if (biggestPool) {
	const entry = projectPools.allEntries.find((entry_) => entry_.data === biggestPool);
	console.log(`\nBiggest pool: ${entry?.meta.id} with ${biggestPool.size} projects`);
}

// ========== COMPLEX EXAMPLE ==========

console.log('\n=== Complex Map-like Usage ===\n');

interface Config {
	key: string;
	value: string | number | boolean;
	type: string;
}

const config = new Pool<Config>();

// Use as a config Map
config.set('key', 'apiUrl', { key: 'apiUrl', value: 'https://api.example.com', type: 'string' });
config.set('key', 'timeout', { key: 'timeout', value: 5000, type: 'number' });
config.set('key', 'debug', { key: 'debug', value: true, type: 'boolean' });

console.log('Config entries:');
for (const c of config.all) {
	console.log(`  ${c.key}: ${c.value} (${c.type})`);
}

// Get a config value
const apiUrl = config.get('key', 'apiUrl');
console.log('\nAPI URL:', apiUrl?.value);

// Update config
config.set('key', 'timeout', { key: 'timeout', value: 10_000, type: 'number' });
console.log('Updated timeout:', config.get('key', 'timeout')?.value);

// Check existence
console.log('\nHas apiUrl?', config.has('key', 'apiUrl'));
console.log('Has maxRetries?', config.has('key', 'maxRetries'));

// Delete config
config.delete('key', 'debug');
console.log('\nAfter deleting debug, size:', config.size);

// ========== EVENTS WITH GET/SET ==========

console.log('\n=== Events with get/set/delete ===\n');

const cache = new Pool<{ key: string; value: string }>();

// Log on get
cache.on('get', (entry: PoolEntry<{ key: string; value: string }>) => {
	console.log(`  [Cache] GET: ${entry.data.key}`);
});

// Log on set
cache.on('set', (entry: PoolEntry<{ key: string; value: string }>) => {
	console.log(`  [Cache] SET: ${entry.data.key} = ${entry.data.value}`);
});

// Log on remove
cache.on('remove', (entry: PoolEntry<{ key: string; value: string }>) => {
	console.log(`  [Cache] DELETE: ${entry.data.key}`);
});

console.log('Cache operations:');
cache.set('key', 'user:123', { key: 'user:123', value: 'John Doe' });
cache.get('key', 'user:123');
cache.set('key', 'user:123', { key: 'user:123', value: 'Jane Doe' }); // Update
cache.delete('key', 'user:123');

console.log('\n=== Example Complete ===');
