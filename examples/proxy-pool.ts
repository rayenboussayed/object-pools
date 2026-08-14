import { Pool, Selectors, Binder } from '../src';
import type { PoolEntry } from '../src/types';

// ========== DEFINING TYPES ==========

interface Proxy {
	ip: string;
	country: string;
	speed: number;
	provider: string;
}

interface Account {
	username: string;
	password: string;
	service: string;
}

interface Service {
	name: string;
	url: string;
}

console.log('=== Proxy Pool Advanced Example ===\n');

// ========== CREATING POOLS ==========

const proxies = new Pool<Proxy>();
const accounts = new Pool<Account>();
const services = new Pool<Service>();

// ========== ADDING DATA ==========

// Single add
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100, provider: 'ProviderA' }, { usedCount: 0, lastUsed: null, active: true });

// Batch add
proxies.addBatch([
	{
		data: { ip: '2.2.2.2', country: 'UK', speed: 200, provider: 'ProviderB' },
		meta: { usedCount: 5, lastUsed: new Date(), active: true },
	},
	{
		data: { ip: '3.3.3.3', country: 'DE', speed: 150, provider: 'ProviderA' },
		meta: { usedCount: 0, lastUsed: null, active: false },
	},
	{
		data: { ip: '4.4.4.4', country: 'US', speed: 300, provider: 'ProviderB' },
		meta: { usedCount: 3, lastUsed: new Date(), active: true },
	},
	{
		data: { ip: '5.5.5.5', country: 'US', speed: 250, provider: 'ProviderA' },
		meta: { usedCount: 8, lastUsed: new Date(), active: true },
	},
]);

accounts.addBatch([{ data: { username: 'user1', password: 'pass1', service: 'twitter' } }, { data: { username: 'user2', password: 'pass2', service: 'facebook' } }, { data: { username: 'user3', password: 'pass3', service: 'twitter' } }]);

services.addBatch([{ data: { name: 'API', url: 'https://api.twitter.com' } }, { data: { name: 'Web', url: 'https://twitter.com' } }]);

console.log(`Total proxies: ${proxies.size}`);
console.log(`Total accounts: ${accounts.size}`);
console.log(`Total services: ${services.size}\n`);

// ========== EVENTS ==========

// Auto-update usage statistics on use
proxies.on('get', (entry: PoolEntry<Proxy>) => {
	entry.meta.usedCount = (entry.meta.usedCount || 0) + 1;
	entry.meta.lastUsed = new Date();
	console.log(`[Event] Proxy ${entry.data.ip} used, total: ${entry.meta.usedCount}`);
});

// Logging
proxies.on('add', (entry: PoolEntry<Proxy>) => {
	console.log(`[Event] Added proxy: ${entry.data.ip}`);
});

// ========== QUERY API ==========

console.log('=== Simple Query ===\n');

const proxy = proxies
	.query()
	.where((entry) => entry.data.country === 'US')
	.select(Selectors.random);

console.log('Random US proxy:', proxy);

console.log('\n=== Complex Query ===\n');

// Complex query composing filters and sort orders
const bestProxy = proxies
	.query()
	.where((entry) => entry.data.country === 'US')
	.where((entry) => entry.meta.active === true)
	.whereOr([(entry) => entry.data.provider === 'ProviderA', (entry) => entry.data.provider === 'ProviderB'])
	.where((entry) => entry.meta.usedCount < 10)
	.orderBy('speed', 'desc') // first sort: by speed
	.orderByMeta('usedCount', 'asc') // second sort: by usage
	.select(Selectors.first);

console.log('Best proxy (US, active, Provider A or B, low usage, high speed):', bestProxy);

console.log('\n=== Pagination ===\n');

// Pagination
const page1Proxies = proxies
	.query()
	.where((entry) => entry.meta.active)
	.orderBy('speed', 'desc')
	.limit(2)
	.toArray();

console.log('Top 2 active proxies by speed:', page1Proxies);

const page2Proxies = proxies
	.query()
	.where((entry) => entry.meta.active)
	.orderBy('speed', 'desc')
	.offset(2)
	.limit(2)
	.toArray();

console.log('Next 2 active proxies:', page2Proxies);

// ========== POOL COMBINATION ==========

console.log('\n=== Pool Combination ===\n');

const usProxies = new Pool<Proxy>();
const ukProxies = new Pool<Proxy>();
const euProxies = new Pool<Proxy>();

usProxies.add({ ip: '10.0.0.1', country: 'US', speed: 100, provider: 'P1' });
usProxies.add({ ip: '10.0.0.2', country: 'US', speed: 150, provider: 'P1' });

ukProxies.add({ ip: '10.0.0.1', country: 'US', speed: 100, provider: 'P1' }); // duplicate
ukProxies.add({ ip: '20.0.0.1', country: 'UK', speed: 200, provider: 'P2' });

euProxies.add({ ip: '30.0.0.1', country: 'DE', speed: 300, provider: 'P3' });

// Merge unique by IP
const allProxies = Pool.mergeUnique([usProxies, ukProxies, euProxies], 'ip');
console.log(`Total unique proxies by IP: ${allProxies.size}`);
console.log(
	'IPs:',
	allProxies.all.map((p) => p.ip)
);

// Merge with speed priority (keep the fastest)
const pool1 = new Pool<Proxy>();
const pool2 = new Pool<Proxy>();

pool1.add({ ip: '1.1.1.1', country: 'US', speed: 100, provider: 'P1' });
pool2.add({ ip: '1.1.1.1', country: 'US', speed: 200, provider: 'P2' });

const bestProxies = Pool.mergeUniqueWith([pool1, pool2], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

console.log('\nMerged with speed priority (keeping fastest):');
const result = bestProxies.query().select(Selectors.first);
console.log(`IP: ${result!.ip}, Speed: ${result!.speed}, Provider: ${result!.provider}`);

// ========== TRANSFORMATIONS ==========

console.log('\n=== Transformations ===\n');

// Partition - split into two pools
const [active, inactive] = proxies.partition((entry) => entry.meta.active === true);
console.log(`Active proxies: ${active.size}, Inactive: ${inactive.size}`);

// GroupBy
const byCountry = proxies.groupBy('country');
console.log('\nProxies by country:');
for (const [country, pool] of byCountry) {
	console.log(`  ${country}: ${pool.size} proxies`);
}

const byProvider = proxies.groupBy('provider');
console.log('\nProxies by provider:');
for (const [provider, pool] of byProvider) {
	console.log(`  ${provider}: ${pool.size} proxies`);
}

// Sample - take N random entries
const randomSample = proxies.sample(3);
console.log(`\nRandom sample of 3 proxies: ${randomSample.all.map((p) => p.ip).join(', ')}`);

// ========== POOL BINDING ==========

console.log('\n=== Pool Binding ===\n');

const binder = new Binder<{ proxy: Proxy; account: Account; service: Service }>()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.bind('service', services)
	.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
	.where('proxy', (entry: PoolEntry<Proxy>) => entry.meta.active === true)
	.where('account', (entry: PoolEntry<Account>) => entry.data.service === 'twitter')
	.where('service', (entry: PoolEntry<Service>) => entry.data.name === 'API')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.random)
	.selectWith('service', Selectors.first);

const combo = binder.execute();

if (combo) {
	console.log('Successfully bound resources:');
	console.log(`  Proxy: ${combo.proxy.ip} (${combo.proxy.country})`);
	console.log(`  Account: ${combo.account.username} (${combo.account.service})`);
	console.log(`  Service: ${combo.service.name} - ${combo.service.url}`);
} else {
	console.log('Failed to bind resources - no matching combination found');
}

// ========== COMPLEX WORKFLOW ==========

console.log('\n=== Complex Workflow ===\n');

// 1. Group by country
const poolsByCountry = proxies.groupBy('country');

// 2. For each country, take top-2 by speed
const topPools = new Map<string, Pool<Proxy>>();

for (const [country, pool] of poolsByCountry) {
	const top2 = pool
		.query()
		.where((entry) => entry.meta.active)
		.orderBy('speed', 'desc')
		.limit(2)
		.toPool();

	topPools.set(country, top2);
	console.log(`${country}: Top ${top2.size} proxies by speed`);
}

// 3. Get the top pool for US
const usTop = topPools.get('US');
if (usTop) {
	console.log('\nUS top proxies:');
	for (const p of usTop.all) {
		console.log(`  ${p.ip} - ${p.speed}ms`);
	}
}

// ========== WEIGHTED SELECTOR ===

console.log('\n=== Weighted Selector ===\n');

// Weighted selector - the less a proxy is used, the higher its weight
const weightedProxy = proxies
	.query()
	.where((entry) => entry.meta.active === true)
	.select(
		Selectors.weighted((entry) => {
			// Weight is inversely proportional to usage
			return 1 / (entry.meta.usedCount + 1);
		})
	);

console.log('Weighted random proxy (prefers less used):', weightedProxy);

console.log('\n=== Example Complete ===');
