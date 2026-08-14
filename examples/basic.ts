import { Pool, Selectors, Binder } from '../src';
import type { PoolEntry } from '../src/types';

console.log('=== Basic Pool Example ===\n');

// Create a pool of proxies
interface Proxy {
	ip: string;
	country: string;
	speed: number;
}

const proxies = new Pool<Proxy>();

// Add some proxies
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });
proxies.add({ ip: '2.2.2.2', country: 'UK', speed: 200 }, { usedCount: 5 });
proxies.add({ ip: '3.3.3.3', country: 'US', speed: 150 }, { usedCount: 2 });

console.log(`Total proxies: ${proxies.size}`);

// Query with filter
const usProxy = proxies
	.query()
	.where((entry) => entry.data.country === 'US')
	.select(Selectors.first);

console.log('First US proxy:', usProxy);

// Query with sorting
const fastestProxy = proxies.query().orderBy('speed', 'desc').select(Selectors.first);

console.log('Fastest proxy:', fastestProxy);

// Query with multiple filters and sorting
const bestUsProxy = proxies
	.query()
	.where((entry) => entry.data.country === 'US')
	.where((entry) => entry.meta.usedCount < 5)
	.orderBy('speed', 'desc')
	.select(Selectors.first);

console.log('Best US proxy (low usage, high speed):', bestUsProxy);

// Using events
console.log('\n=== Events Example ===\n');

proxies.on('get', (entry: PoolEntry<Proxy>) => {
	entry.meta.usedCount++;
	console.log(`Proxy ${entry.data.ip} used, count: ${entry.meta.usedCount}`);
});

proxies.query().select(Selectors.random);
proxies.query().select(Selectors.random);

// Binder example
console.log('\n=== Binder Example ===\n');

interface Account {
	username: string;
	service: string;
}

const accounts = new Pool<Account>();
accounts.add({ username: 'user1', service: 'twitter' });
accounts.add({ username: 'user2', service: 'facebook' });

const combo = new Binder<{ proxy: Proxy; account: Account }>()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
	.where('account', (entry: PoolEntry<Account>) => entry.data.service === 'twitter')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.first)
	.execute();

console.log('Combo result:', combo);

// GroupBy example
console.log('\n=== GroupBy Example ===\n');

const byCountry = proxies.groupBy('country');
console.log(`Countries: ${[...byCountry.keys()]}`);
for (const [country, pool] of byCountry) {
	console.log(`${country}: ${pool.size} proxies`);
}

// Merge example
console.log('\n=== Merge Example ===\n');

const pool1 = new Pool<Proxy>();
const pool2 = new Pool<Proxy>();

pool1.add({ ip: '1.1.1.1', country: 'US', speed: 100 });
pool2.add({ ip: '1.1.1.1', country: 'US', speed: 100 });
pool2.add({ ip: '4.4.4.4', country: 'DE', speed: 300 });

const merged = Pool.mergeUnique([pool1, pool2], 'ip');
console.log(`Merged unique proxies: ${merged.size}`);
console.log(
	'IPs:',
	merged.all.map((p) => p.ip)
);

// Pool of pools example
console.log('\n=== Pool of Pools Example ===\n');

const usPool = new Pool<Proxy>();
const ukPool = new Pool<Proxy>();
const dePool = new Pool<Proxy>();

usPool.add({ ip: '7.7.7.7', country: 'US', speed: 150 });
usPool.add({ ip: '8.8.8.8', country: 'US', speed: 200 });

ukPool.add({ ip: '9.9.9.9', country: 'UK', speed: 180 });

dePool.add({ ip: '10.10.10.10', country: 'DE', speed: 220 });
dePool.add({ ip: '11.11.11.11', country: 'DE', speed: 190 });
dePool.add({ ip: '12.12.12.12', country: 'DE', speed: 210 });

// Create pool of pools
const poolOfPools = new Pool<Pool<Proxy>>();
poolOfPools.add(usPool, { region: 'Americas' });
poolOfPools.add(ukPool, { region: 'Europe' });
poolOfPools.add(dePool, { region: 'Europe' });

console.log(`Total pools: ${poolOfPools.size}`);

// Find the biggest pool
const biggestPool = poolOfPools
	.query()
	.orderBy((a, b) => b.data.size - a.data.size)
	.select(Selectors.first);

if (biggestPool) {
	console.log(`Biggest pool has ${biggestPool.size} proxies`);
	console.log(
		'Countries:',
		biggestPool.all.map((p) => p.country)
	);
}

// Find pools in Europe with more than 1 proxy
const europePool = poolOfPools
	.query()
	.where((entry) => entry.meta.region === 'Europe')
	.where((entry) => entry.data.size > 1)
	.select(Selectors.first);

if (europePool) {
	console.log(`\nEurope pool with 2+ proxies: ${europePool.size} proxies`);
}

console.log('\n=== Example Complete ===');
