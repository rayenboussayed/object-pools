# Pools

> Lightweight TypeScript library for managing data collections with filters, sorting, and composition

## What is Pools?

**Pools** is a modern TypeScript library that replaces arrays, objects, and Maps with a powerful abstraction for working with collections. Think of it as a smart wrapper around your data that gives you filtering, sorting, metadata tracking, and pool composition out of the box.

### Not a replacement for:

-   ORMs or databases
-   Processing millions of records
-   Enterprise frameworks

### Perfect for:

-   Daily work with collections in memory
-   Managing pools of resources (proxies, accounts, sessions)
-   Quick prototyping with typed data
-   Building tools that need smart data selection

## Installation

```bash
npm install
```

## Compatibility

**Pools** targets **ECMAScript 2015 (ES6)** as its runtime floor — the library only relies on ES6 features (classes, iterators, `Symbol.iterator`, spread, etc.) and avoids later ECMAScript additions.

This also matches the engine profile of Hermes (React Native's JavaScript engine), which — per [facebook/hermes `doc/Features.md`](https://github.com/facebook/hermes/blob/main/doc/Features.md) — "plans to target ECMAScript 2015 (ES6), with some carefully considered exceptions".

The shipped `dist` build is real ES6 ESM (`.js` files with `import`/`export` statements), consumable by any ES6-compatible bundler or runtime.

## Quick Start

```typescript
import { Pool, Selectors } from './src';

interface Proxy {
	ip: string;
	country: string;
	speed: number;
}

const proxies = new Pool<Proxy>();

// Add data with metadata
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0, active: true });

// Query with filters and sorting
const bestProxy = proxies
	.query()
	.where((entry) => entry.data.country === 'US')
	.where((entry) => entry.meta.active === true)
	.orderBy('speed', 'desc')
	.select(Selectors.first);

console.log(bestProxy); // { ip: '1.1.1.1', country: 'US', speed: 100 }

// Pool of pools - store pools as data
const usProxies = new Pool<Proxy>();
const ukProxies = new Pool<Proxy>();
const poolOfPools = new Pool<Pool<Proxy>>();
poolOfPools.add(usProxies);
poolOfPools.add(ukProxies);
```

## Core Concepts

### PoolEntry<T>

Every item in a pool is wrapped in a `PoolEntry`:

```typescript
type PoolEntry<T> = {
	data: T; // Your data
	meta: Record<string, any>; // Metadata (usage stats, flags, etc.)
};
```

### Filter<T>

A function that decides whether to include an entry:

```typescript
type Filter<T> = (entry: PoolEntry<T>) => boolean;

// Example
const isUSFilter = (entry) => entry.data.country === 'US';
```

### Selector<T>

A function that picks one entry from filtered results:

```typescript
type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;

// Built-in selectors
Selectors.first; // First entry
Selectors.last; // Last entry
Selectors.random; // Random entry
Selectors.minBy('field'); // Entry with minimum value
Selectors.weighted(fn); // Weighted random
```

## API Reference

### Pool<T>

#### Creating Pools

```typescript
// Empty pool
const pool = new Pool<Proxy>();

// Pool of pools - pools as data
const usProxies = new Pool<Proxy>();
const ukProxies = new Pool<Proxy>();
const poolOfPools = new Pool<Pool<Proxy>>();
poolOfPools.add(usProxies);
poolOfPools.add(ukProxies);

// Query pools from pool of pools
const bestPool = poolOfPools
	.query()
	.where((entry) => entry.data.size > 10)
	.select(Selectors.first);
```

#### CRUD Operations

```typescript
// Add single entry
pool.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });

// Add batch
pool.addBatch([
	{ data: { ip: '2.2.2.2', country: 'UK', speed: 200 }, meta: {} },
	{ data: { ip: '3.3.3.3', country: 'DE', speed: 150 }, meta: {} },
]);

// Remove entries
pool.remove((data) => data.country === 'UK');

// Remove batch
pool.removeBatch([(data) => data.country === 'UK', (data) => data.speed < 100]);
```

#### Map-like Operations

```typescript
// Get by field (like Map.get)
const proxy = pool.get('ip', '1.1.1.1');

// Get by predicate
const fastProxy = pool.get((entry) => entry.data.speed > 200);

// Check existence (like Map.has)
const exists = pool.has('ip', '1.1.1.1');
const hasFast = pool.has((entry) => entry.data.speed > 200);

// Set (update or add)
pool.set('ip', '1.1.1.1', { ip: '1.1.1.1', country: 'US', speed: 150 });

// Delete (like Map.delete)
const deleted = pool.delete('ip', '1.1.1.1'); // returns boolean
```

#### Query API

```typescript
// Build queries with chaining
const result = pool
	.query()
	.where((entry) => entry.data.country === 'US')
	.where((entry) => entry.meta.active === true)
	.orderBy('speed', 'desc')
	.orderByMeta('usedCount', 'asc')
	.limit(10)
	.toArray();

// Select single entry
const proxy = pool
	.query()
	.where((entry) => entry.data.country === 'US')
	.select(Selectors.random);

// Convert query to pool
const usProxies = pool
	.query()
	.where((entry) => entry.data.country === 'US')
	.toPool();
```

#### Events

```typescript
// Auto-update metadata on use
pool.on('get', (entry) => {
	entry.meta.usedCount++;
	entry.meta.lastUsed = new Date();
});

// Logging
pool.on('add', (entry) => {
	console.log(`Added: ${entry.data.ip}`);
});

// Available events:
// 'add', 'remove', 'get', 'set'
// 'batchAdd', 'batchRemove'
// 'beforeSelect', 'afterSelect'
```

#### Combining Pools

```typescript
const pool1 = new Pool<Proxy>();
const pool2 = new Pool<Proxy>();

// Merge all
pool1.merge(pool2);

// Merge unique by field
pool1.mergeUnique(pool2, 'ip');

// Merge unique by function
pool1.mergeUnique(pool2, (p) => `${p.ip}:${p.provider}`);

// Union (no duplicates)
pool1.union(pool2, (a, b) => a.ip === b.ip);

// Intersect (only common)
pool1.intersect(pool2, (a, b) => a.ip === b.ip);

// Difference (remove items from other)
pool1.difference(pool2, (a, b) => a.ip === b.ip);

// Remove duplicates
pool.deduplicate('ip');
```

#### Transformations

```typescript
// Clone
const backup = pool.clone();

// Partition into two pools
const [active, inactive] = pool.partition((entry) => entry.meta.active === true);

// Random sample
const sample = pool.sample(10);

// Shuffle in place
pool.shuffle();

// Group by field
const byCountry = pool.groupBy('country');
// Map<string, Pool<Proxy>>

// Group by function
const bySpeed = pool.groupBy((p) => (p.speed > 200 ? 'fast' : 'slow'));
```

#### Static Methods

```typescript
// Merge multiple pools
const merged = Pool.merge(pool1, pool2, pool3);

// Merge unique
const unique = Pool.mergeUnique([pool1, pool2], 'ip');

// Merge with conflict resolution
const best = Pool.mergeUniqueWith([pool1, pool2], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

// Intersect two pools
const common = Pool.intersect(pool1, pool2, (a, b) => a.provider === b.provider);

// Group multiple sources
const groups = Pool.groupBy([pool1, pool2, pool3], 'country');
```

#### Properties

```typescript
pool.size; // Number of entries
pool.all; // Array of data objects
pool.allEntries; // Array of PoolEntry objects
```

#### Method Wrapping

```typescript
// Wrap methods to add custom behavior
pool.wrap('add', (original, data, meta) => {
	console.log('Before add');
	const result = original(data, meta);
	console.log('After add');
	return result;
});

// Example: Database sync
pool.wrap('add', async (original, data, meta) => {
	const entry = original(data, meta);
	await db.insert('proxies', { data, meta });
	return entry;
});
```

### Query<T>

```typescript
const query = pool.query();

// Filtering
query.where((entry) => entry.data.country === 'US');
query.whereOr([(entry) => entry.data.provider === 'A', (entry) => entry.data.provider === 'B']);

// Sorting (chainable)
query.orderBy('speed', 'desc');
query.orderBy((a, b) => a.data.speed - b.data.speed);
query.orderByMeta('usedCount', 'asc');

// Pagination
query.offset(20).limit(10);

// Materialization
query.select(Selectors.first); // Single entry
query.toArray(); // Array of data
query.toPool(); // Convert query to Pool
query.count; // Number of entries
```

### Binder

Bind multiple pools together for complex selections:

```typescript
const combo = new Binder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.bind('service', services)
	.where('proxy', (entry) => entry.data.country === 'US')
	.where('account', (entry) => entry.data.service === 'twitter')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.random)
	.execute();

// Result:
// {
//   proxy: { ip: '1.1.1.1', ... },
//   account: { username: 'user1', ... },
//   service: { name: 'API', ... }
// }

// Returns null if any pool has no matching entry
```

### Built-in Selectors

```typescript
import { Selectors } from './src';

// Random entry
pool.query().select(Selectors.random);

// First entry
pool.query().select(Selectors.first);

// Last entry
pool.query().select(Selectors.last);

// Minimum by field (checks both data and meta)
pool.query().select(Selectors.minBy('usedCount'));

// Weighted random (higher weight = higher probability)
pool.query().select(Selectors.weighted((entry) => 1 / (entry.meta.usedCount + 1)));
```

## Examples

### Basic Usage

See [examples/basic.ts](examples/basic.ts):

```bash
npm run example:basic
```

### Proxy Pool Management

See [examples/proxy-pool.ts](examples/proxy-pool.ts):

```bash
npm run example:proxy-pool
```

This example demonstrates:

-   CRUD operations
-   Event handling
-   Complex queries with multiple filters
-   Pool combination
-   Transformations
-   Binder usage
-   Weighted selectors

### Map-like Usage

See [examples/map-like.ts](examples/map-like.ts):

```bash
npm run example:map-like
```

This example demonstrates:

-   Using Pool as a Map replacement
-   get/has/set/delete operations
-   Pool of pools with identifiers
-   Cache implementation
-   Config management

### Game Service

See [examples/game-service.ts](examples/game-service.ts):

```bash
npm run example:game-service
```

Comprehensive example demonstrating ALL library features:

-   Multiple interconnected pools (games, accounts, servers, sessions)
-   Complex matchmaking logic
-   Event-driven architecture
-   Pool of pools for regional organization
-   Weighted server selection
-   Statistics and analytics

## Use Cases

### Managing Proxies

```typescript
const proxies = new Pool<Proxy>();

// Auto-track usage
proxies.on('get', (entry) => {
	entry.meta.usedCount++;
	entry.meta.lastUsed = new Date();
});

// Get least-used US proxy
const proxy = proxies
	.query()
	.where((entry) => entry.data.country === 'US')
	.where((entry) => entry.meta.active)
	.orderByMeta('usedCount', 'asc')
	.select(Selectors.first);
```

### Session Management

```typescript
const sessions = new Pool<Session>();

// Auto-expire old sessions
sessions.on('get', (entry) => {
	if (Date.now() - entry.meta.lastUsed > 3_600_000) {
		entry.meta.expired = true;
	}
});

// Get valid session
const session = sessions
	.query()
	.where((entry) => !entry.meta.expired)
	.select(Selectors.random);
```

### Resource Allocation

```typescript
// Bind proxy + account + service
const resources = new Binder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.bind('service', services)
	.where('proxy', (entry) => entry.meta.usedCount < 10)
	.where('account', (entry) => !entry.meta.banned)
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.random)
	.execute();

if (resources) {
	await doTask(resources.proxy, resources.account, resources.service);
}
```

## TypeScript Support

Full TypeScript support with generic types:

```typescript
interface MyData {
	id: number;
	name: string;
}

const pool = new Pool<MyData>();

// TypeScript knows the type
const result = pool.query().select(Selectors.first);
// result: MyData | null

// Autocomplete works
result?.name; // ✓
result?.invalid; // ✗ TypeScript error
```

## Performance

Pools is designed for collections of hundreds to thousands of items. For very large datasets (100k+ items), consider:

-   Using pagination with `offset()` and `limit()`
-   Filtering early to reduce the working set
-   Using `query.toPool()` to cache filtered results

## Project Structure

```
pools/
├── src/
│   ├── types.ts       # Core types
│   ├── pool.ts        # Main Pool class
│   ├── query.ts       # Query builder
│   ├── binder.ts      # Multi-pool binding
│   ├── selectors.ts   # Built-in selectors
│   └── index.ts       # Public API
├── examples/
│   ├── basic.ts       # Basic usage
│   └── proxy-pool.ts  # Advanced example
└── README.md
```

## License

MIT

## Contributing

Contributions welcome! This is a learning project but pull requests and issues are appreciated.
