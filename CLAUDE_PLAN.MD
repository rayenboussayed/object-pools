# Project Summary: Pools

## Project Essence

**Pools** is a lightweight TypeScript library for conveniently working with data collections. It is a **replacement for arrays, objects, and Maps** with built-in filters, sorting, metadata, and pool combination.

**It is not:**

-   An ORM or database replacement
-   A solution for millions of records
-   An enterprise framework

**It is:**

-   A utility for daily work with collections
-   An abstraction over arrays with a convenient API
-   A tool for quickly creating pools of any entities

---

## What Problems It Solves

### The Problem (without the library):

```typescript
// Working with proxies
const proxies = [
	{ ip: '1.1.1.1', country: 'US' },
	{ ip: '2.2.2.2', country: 'UK' },
];

// Manual filtering
const usProxies = proxies.filter((p) => p.country === 'US');

// Manual sorting
usProxies.sort((a, b) => a.usedCount - b.usedCount);

// Pick a random one
const proxy = usProxies[Math.floor(Math.random() * usProxies.length)];

// Track usage - manually everywhere
proxy.usedCount++;
proxy.lastUsed = new Date();

// Binding with accounts - manually
const account = accounts.find((a) => a.status === 'active');
if (!proxy || !account) return null;

// Combining from different sources - painful
const allProxies = [...usProxies, ...ukProxies, ...euProxies];
const unique = Array.from(new Map(allProxies.map((p) => [p.ip, p])).values());
```

### The Solution (with the library):

```typescript
// Create a pool in seconds
const proxies = new Pool<Proxy>();
proxies.add({ ip: '1.1.1.1', country: 'US' }, { usedCount: 0 });

// Automatic metadata updates
proxies.on('get', (entry) => {
	entry.meta.usedCount++;
	entry.meta.lastUsed = new Date();
});

// Chainable filters and sorting
const proxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.where((e) => e.meta.usedCount < 10)
	.sortByMeta('usedCount', 'asc')
	.select(Selectors.random);

// Type-safe pool binding
const combo = new PoolBinder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.where('proxy', (e) => e.data.country === 'US')
	.where('account', (e) => e.meta.status === 'active')
	.execute();
// { proxy: {...}, account: {...} }

// Combine pools in one line
const allProxies = Pool.mergeUnique([usProxies, ukProxies, euProxies], 'ip');
```

---

## Final Architecture Plan

### Core Types:

```typescript
type PoolEntry<T> = {
	data: T; // user data
	meta: Record<string, any>; // service metadata
};

type Filter<T> = (entry: PoolEntry<T>) => boolean;
type Selector<T> = (entries: PoolEntry<T>[]) => PoolEntry<T> | null;
```

---

### The Pool<T> Class

**CRUD operations:**

-   `add(data: T, meta?: Record<string, any>): PoolEntry<T>`
-   `addBatch(items: { data: T, meta?: Record<string, any> }[]): PoolEntry<T>[]`
-   `remove(predicate: (data: T) => boolean): PoolEntry<T>[]`
-   `removeBatch(predicates: ((data: T) => boolean)[]): PoolEntry<T>[]`

**Query API:**

-   `query(): PoolQuery<T>`

**Pool combination:**

-   `merge(source: Pool<T> | PoolQuery<T>): this`
-   `mergeUnique(source: Pool<T> | PoolQuery<T>, uniqueBy: keyof T | ((item: T) => any)): this`
-   `union(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this`
-   `intersect(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this`
-   `difference(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this`
-   `deduplicate(uniqueBy: keyof T | ((item: T) => any)): this`

**Transformation:**

-   `clone(): Pool<T>`
-   `partition(predicate: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>]`
-   `sample(count: number): Pool<T>`
-   `shuffle(): this`
-   `groupBy(groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>>`

**Static methods:**

-   `static merge<T>(...pools: Pool<T>[]): Pool<T>`
-   `static mergeUnique<T>(sources: (Pool<T> | PoolQuery<T>)[], uniqueBy: keyof T | ((item: T) => any)): Pool<T>`
-   `static mergeUniqueWith<T>(sources: (Pool<T> | PoolQuery<T>)[], uniqueBy: keyof T | ((item: T) => any), resolveDuplicate: (existing: PoolEntry<T>, duplicate: PoolEntry<T>) => PoolEntry<T>): Pool<T>`
-   `static intersect<T>(pool1: Pool<T>, pool2: Pool<T>, compareFn?: (a: T, b: T) => boolean): Pool<T>`
-   `static groupBy<T>(sources: (Pool<T> | PoolQuery<T>)[], groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>>`

**Events:**

-   `on(event: string, handler: Function): void`
-   `off(event: string, handler: Function): void`
-   `emit(event: string, ...args: any[]): void` (internal)

**Events that are emitted:**

-   `'add'` - `(entry: PoolEntry<T>) => void`
-   `'remove'` - `(entry: PoolEntry<T>) => void`
-   `'get'` - `(entry: PoolEntry<T>) => void`
-   `'set'` - `(entry: PoolEntry<T>, changes: Partial<T>) => void`
-   `'batchAdd'` - `(entries: PoolEntry<T>[]) => void`
-   `'batchRemove'` - `(entries: PoolEntry<T>[]) => void`
-   `'beforeSelect'` - `(entries: PoolEntry<T>[]) => void`
-   `'afterSelect'` - `(entry: PoolEntry<T> | null) => void`

**Extension:**

-   `wrap<K extends keyof this>(method: K, wrapper: (original: Function, ...args: any[]) => any): void`

**Utilities:**

-   `get size(): number`
-   `get all(): T[]`
-   `get allEntries(): PoolEntry<T>[]`

---

### The PoolQuery<T> Class

**Filtering:**

-   `where(filter: Filter<T>): this`
-   `whereOr(filters: Filter<T>[]): this`

**Sorting (chainable):**

-   `sortBy(fn: (a: PoolEntry<T>, b: PoolEntry<T>) => number): this`
-   `sortBy(field: keyof T, order?: 'asc' | 'desc'): this`
-   `sortByMeta(field: string, order?: 'asc' | 'desc'): this`

**Pagination:**

-   `offset(count: number): this`
-   `take(count: number): this`

**Materialization:**

-   `select(selector: Selector<T>): T | null`
-   `toArray(): T[]`
-   `toPool(): Pool<T>`
-   `get count(): number`

**Extension:**

-   `wrap<K extends keyof this>(method: K, wrapper: (original: Function, ...args: any[]) => any): void`

---

### Built-in Selectors

```typescript
export const Selectors = {
  random: <T>(entries: PoolEntry<T>[]) => PoolEntry<T> | null
  first: <T>(entries: PoolEntry<T>[]) => PoolEntry<T> | null
  last: <T>(entries: PoolEntry<T>[]) => PoolEntry<T> | null
  minBy: <T>(field: string) => (entries: PoolEntry<T>[]) => PoolEntry<T> | null
  weighted: <T>(weightFn: (entry: PoolEntry<T>) => number) => (entries: PoolEntry<T>[]) => PoolEntry<T> | null
}
```

---

### The PoolBinder Class

**Binding pools:**

-   `bind<T>(name: string, pool: Pool<T>): this`
-   `where<T>(poolName: string, filter: Filter<T>): this`
-   `selectWith<T>(poolName: string, selector: Selector<T>): this`
-   `execute(): Record<string, any> | null`

---

## Putting It All Together

```typescript
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
]);

// ========== EVENTS ==========

// Auto-update usage statistics on use
proxies.on('get', (entry) => {
	entry.meta.usedCount = (entry.meta.usedCount || 0) + 1;
	entry.meta.lastUsed = new Date();
});

// Logging
proxies.on('add', (entry) => {
	console.log(`[Pool] Added proxy: ${entry.data.ip}`);
});

// ========== WRAP FOR DATABASE ==========

// Sync with the database
proxies.wrap('add', async (original, data, meta) => {
	const entry = original(data, meta);

	// Save to the database
	await db.insert('proxies', {
		data: JSON.stringify(data),
		meta: JSON.stringify(meta),
	});

	return entry;
});

// Lazy loading from the database
proxies.wrap('query', (original) => {
	return () => {
		// Load from the database on first query if the pool is empty
		if (proxies.size === 0) {
			const rows = db.querySync('SELECT * FROM proxies');
			rows.forEach((row) => {
				proxies.add(JSON.parse(row.data), JSON.parse(row.meta));
			});
		}

		return original();
	};
});

// ========== QUERY API ==========

// Simple query
const proxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.select(Selectors.random);

// Complex query composing filters and sort orders
const bestProxy = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.where((e) => e.meta.active === true)
	.whereOr([(e) => e.data.provider === 'ProviderA', (e) => e.data.provider === 'ProviderB'])
	.where((e) => e.meta.usedCount < 10)
	.sortBy('speed', 'desc') // first sort: by speed
	.sortByMeta('usedCount', 'asc') // second sort: by usage
	.sortBy('country') // third sort: by country
	.select(Selectors.first);

// Pagination
const page2Proxies = proxies
	.query()
	.where((e) => e.meta.active)
	.sortBy('speed', 'desc')
	.offset(20) // skip the first 20
	.take(10) // take the next 10
	.toArray();

// Get all filtered entries
const activeProxies = proxies
	.query()
	.where((e) => e.meta.active)
	.toArray();

// Convert query into a Pool
const usProxiesPool = proxies
	.query()
	.where((e) => e.data.country === 'US')
	.toPool();

// ========== POOL COMBINATION ==========

const usProxies = new Pool<Proxy>();
const ukProxies = new Pool<Proxy>();
const euProxies = new Pool<Proxy>();

// Merge - add everything from another pool
usProxies.merge(ukProxies);

// Merge with a query - add only the filtered entries
usProxies.merge(euProxies.query().where((e) => e.data.speed > 100));

// Merge unique by IP
usProxies.mergeUnique(ukProxies, 'ip');

// Merge unique by a field combination
usProxies.mergeUnique(ukProxies, (p) => `${p.ip}:${p.provider}`);

// Union - merge without duplicates
usProxies.union(ukProxies, (a, b) => a.ip === b.ip);

// Intersect - keep only common entries
usProxies.intersect(ukProxies, (a, b) => a.ip === b.ip);

// Difference - remove the ones present in ukProxies
usProxies.difference(ukProxies, (a, b) => a.ip === b.ip);

// Deduplicate - remove duplicates inside the pool
proxies.deduplicate('ip');

// ========== STATIC METHODS ==========

// Merge from multiple pools
const allProxies = Pool.merge(usProxies, ukProxies, euProxies);

// Unique entries from multiple pools
const uniqueProxies = Pool.mergeUnique([usProxies, ukProxies, euProxies], 'ip');

// Unique with priority (keep the fastest)
const bestProxies = Pool.mergeUniqueWith([usProxies, ukProxies, euProxies], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

// Intersection of two pools
const commonProxies = Pool.intersect(usProxies, ukProxies, (a, b) => a.provider === b.provider);

// Group multiple pools
const byCountry = Pool.groupBy([usProxies, ukProxies, euProxies], 'country');
// Map { 'US' => Pool, 'UK' => Pool, 'DE' => Pool, ... }

const germanProxies = byCountry.get('DE');

// ========== TRANSFORMATIONS ==========

// Clone - clone the pool
const backupProxies = proxies.clone();

// Partition - split into two pools
const [active, inactive] = proxies.partition((e) => e.meta.active === true);

// Sample - take N random entries
const randomSample = proxies.sample(10);

// Shuffle - randomize order
proxies.shuffle();

// GroupBy at the instance level
const proxyGroups = proxies.groupBy('provider');
// Map { 'ProviderA' => Pool, 'ProviderB' => Pool, ... }

const providerAProxies = proxyGroups.get('ProviderA');

// Group by a custom function
const speedGroups = proxies.groupBy((p) => (p.speed < 100 ? 'slow' : p.speed < 300 ? 'medium' : 'fast'));
// Map { 'slow' => Pool, 'medium' => Pool, 'fast' => Pool }

// ========== POOL BINDING ==========

const binder = new PoolBinder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.bind('service', services)
	.where('proxy', (e) => e.data.country === 'US')
	.where('proxy', (e) => e.meta.active === true)
	.where('account', (e) => e.data.service === 'twitter')
	.where('service', (e) => e.data.name === 'API')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.random)
	.selectWith('service', Selectors.first);

const combo = binder.execute();
// {
//   proxy: { ip: '1.1.1.1', country: 'US', ... },
//   account: { username: 'user1', ... },
//   service: { name: 'API', url: 'https://...' }
// }

if (!combo) {
	console.log('Failed to find a combination');
}

// ========== COMPLEX WORKFLOW ==========

// 1. Load proxies from three sources
const provider1 = new Pool<Proxy>();
const provider2 = new Pool<Proxy>();
const provider3 = new Pool<Proxy>();

// Loading data...

// 2. Merge with speed priority
const masterPool = Pool.mergeUniqueWith([provider1, provider2, provider3], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

// 3. Group by country
const poolsByCountry = masterPool.groupBy('country');

// 4. For each country, take top-20 by speed
const topPools = new Map<string, Pool<Proxy>>();

poolsByCountry.forEach((pool, country) => {
	const top20 = pool
		.query()
		.where((e) => e.meta.active)
		.sortBy('speed', 'desc')
		.take(20)
		.toPool();

	topPools.set(country, top20);
});

// 5. Work with the top pools
const usTop = topPools.get('US')!;

// Rotation hook for heavy usage
usTop.on('get', (entry) => {
	if (entry.meta.usedCount > 50) {
		// Deactivate the overloaded proxy
		entry.meta.active = false;
	}
});

// 6. Bind with accounts and run tasks
for (let i = 0; i < 100; i++) {
	const combo = new PoolBinder()
		.bind('proxy', usTop)
		.bind('account', accounts)
		.where('proxy', (e) => e.meta.active && e.meta.usedCount < 50)
		.where('account', (e) => e.data.service === 'twitter')
		.selectWith('proxy', Selectors.minBy('usedCount'))
		.selectWith('account', Selectors.random)
		.execute();

	if (!combo) {
		console.log('No combinations available');
		break;
	}

	// Run the task with combo.proxy and combo.account
	await performTask(combo.proxy, combo.account);
}
```

---

## Implementation Plan

### Stage 1: Basic Structure (Core)

**Files:**

-   `src/types.ts` - core types
-   `src/PoolEntry.ts` - PoolEntry class or type
-   `src/Pool.ts` - main Pool class
-   `src/PoolQuery.ts` - Query class

**Tasks:**

1. Define core types: `PoolEntry<T>`, `Filter<T>`, `Selector<T>`
2. Implement `Pool<T>`:
    - Constructor and private `entries: PoolEntry<T>[]` field
    - CRUD: `add()`, `remove()`
    - Query: `query()` returns `PoolQuery<T>`
    - Getters: `size`, `all`, `allEntries`
3. Implement `PoolQuery<T>`:
    - Fields: `entries`, `filters[]`, `sorters[]`, `skipCount`, `takeCount`
    - Methods: `where()`, `whereOr()`
    - `materialize()` method - applies filters and sorting
    - Methods: `select()`, `toArray()`, `count`

**Tests:**

```typescript
test('Pool: add and query', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 });
	pool.add({ id: 2 });

	const result = pool
		.query()
		.where((e) => e.data.id === 1)
		.toArray();
	expect(result).toEqual([{ id: 1 }]);
});
```

---

### Stage 2: Sorting

**Files:**

-   `src/PoolQuery.ts` - extension

**Tasks:**

1. Implement `sortBy()` overloads:
    - `sortBy(fn: Function)`
    - `sortBy(field: keyof T, order?: 'asc' | 'desc')`
2. Implement `sortByMeta(field: string, order?: 'asc' | 'desc')`
3. Chainable composition - `sorters[]` array
4. Apply all sorters sequentially in `materialize()`

**Tests:**

```typescript
test('Query: chained sorting', () => {
	const pool = new Pool<{ name: string; age: number }>();
	pool.add({ name: 'Alice', age: 30 }, { score: 10 });
	pool.add({ name: 'Bob', age: 30 }, { score: 20 });

	const result = pool.query().sortBy('age', 'asc').sortByMeta('score', 'desc').toArray();

	expect(result[0].name).toBe('Bob');
});
```

---

### Stage 3: Pagination

**Files:**

-   `src/PoolQuery.ts` - extension

**Tasks:**

1. Add `offsetCount`, `takeCount` fields
2. Implement `offset(count)` and `take(count)`
3. Apply `slice(offsetCount, offsetCount + takeCount)` in `materialize()`

**Tests:**

```typescript
test('Query: pagination', () => {
	const pool = new Pool<{ id: number }>();
	for (let i = 0; i < 100; i++) pool.add({ id: i });

	const page2 = pool.query().offset(20).take(10).toArray();
	expect(page2.length).toBe(10);
	expect(page2[0].id).toBe(20);
});
```

---

### Stage 4: Selectors

**Files:**

-   `src/Selectors.ts` - built-in selectors

**Tasks:**

1. Implement `Selectors.random`
2. Implement `Selectors.first`
3. Implement `Selectors.last`
4. Implement `Selectors.minBy(field)`
5. Implement `Selectors.weighted(weightFn)`

**Tests:**

```typescript
test('Selectors: minBy', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 }, { score: 10 });
	pool.add({ id: 2 }, { score: 5 });

	const result = pool.query().select(Selectors.minBy('score'));
	expect(result.id).toBe(2);
});
```

---

### Stage 5: Events

**Files:**

-   `src/Pool.ts` - extension

**Tasks:**

1. Add `eventHandlers: Map<string, Function[]>` field
2. Implement `on(event, handler)`
3. Implement `off(event, handler)`
4. Implement `emit(event, ...args)` (private/protected)
5. Emit events at the right places:
    - `add()` → emit('add', entry)
    - `remove()` → emit('remove', entry)
    - `select()` → emit('beforeSelect', entries), emit('afterSelect', entry), emit('get', entry)

**Tests:**

```typescript
test('Events: on get', () => {
	const pool = new Pool<{ id: number }>();
	let counter = 0;

	pool.on('get', (entry) => {
		entry.meta.usedCount = (entry.meta.usedCount || 0) + 1;
		counter++;
	});

	pool.add({ id: 1 });
	pool.query().select(Selectors.first);

	expect(counter).toBe(1);
});
```

---

### Stage 6: Wrap (wrapper method)

**Files:**

-   `src/Pool.ts` - extension
-   `src/PoolQuery.ts` - extension

**Tasks:**

1. Implement `Pool.wrap<K extends keyof this>(method, wrapper)`
2. Implement `PoolQuery.wrap<K extends keyof this>(method, wrapper)`
3. Keep the original method and replace it with the wrapper

**Tests:**

```typescript
test('Wrap: add logging', () => {
	const pool = new Pool<{ id: number }>();
	const logs: string[] = [];

	pool.wrap('add', (original, data, meta) => {
		logs.push('before add');
		const result = original(data, meta);
		logs.push('after add');
		return result;
	});

	pool.add({ id: 1 });
	expect(logs).toEqual(['before add', 'after add']);
});
```

---

### Stage 7: Batch Operations

**Files:**

-   `src/Pool.ts` - extension

**Tasks:**

1. Implement `addBatch(items[])`
2. Implement `removeBatch(predicates[])`
3. Emit `batchAdd`, `batchRemove` events

**Tests:**

```typescript
test('Batch: addBatch', () => {
	const pool = new Pool<{ id: number }>();

	pool.addBatch([
		{ data: { id: 1 }, meta: {} },
		{ data: { id: 2 }, meta: {} },
	]);

	expect(pool.size).toBe(2);
});
```

---

### Stage 8: Pool Combination (instance methods)

**Files:**

-   `src/Pool.ts` - extension

**Tasks:**

1. Implement `merge(source: Pool<T> | PoolQuery<T>)`
2. Implement `mergeUnique(source, uniqueBy)`
3. Implement `union(other, compareFn?)`
4. Implement `intersect(other, compareFn?)`
5. Implement `difference(other, compareFn?)`
6. Implement `deduplicate(uniqueBy)`

**Tests:**

```typescript
test('Pool: merge unique', () => {
	const pool1 = new Pool<{ ip: string }>();
	const pool2 = new Pool<{ ip: string }>();

	pool1.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '2.2.2.2' });

	pool1.mergeUnique(pool2, 'ip');

	expect(pool1.size).toBe(2);
});
```

---

### Stage 9: Transformations

**Files:**

-   `src/Pool.ts` - extension

**Tasks:**

1. Implement `clone()`
2. Implement `partition(predicate)` → returns `[Pool<T>, Pool<T>]`
3. Implement `sample(count)`
4. Implement `shuffle()`
5. Implement `groupBy(groupBy)` → returns `Map<any, Pool<T>>`

**Tests:**

```typescript
test('Pool: partition', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 }, { active: true });
	pool.add({ id: 2 }, { active: false });

	const [active, inactive] = pool.partition((e) => e.meta.active === true);

	expect(active.size).toBe(1);
	expect(inactive.size).toBe(1);
});

test('Pool: groupBy', () => {
	const pool = new Pool<{ country: string }>();
	pool.add({ country: 'US' });
	pool.add({ country: 'UK' });
	pool.add({ country: 'US' });

	const groups = pool.groupBy('country');

	expect(groups.size).toBe(2);
	expect(groups.get('US')!.size).toBe(2);
	expect(groups.get('UK')!.size).toBe(1);
});
```

---

### Stage 10: Static Methods

**Files:**

-   `src/Pool.ts` - extension

**Tasks:**

1. Implement `static merge<T>(...pools: Pool<T>[]): Pool<T>`
2. Implement `static mergeUnique<T>(sources, uniqueBy): Pool<T>`
3. Implement `static mergeUniqueWith<T>(sources, uniqueBy, resolveDuplicate): Pool<T>`
4. Implement `static intersect<T>(pool1, pool2, compareFn?): Pool<T>`
5. Implement `static groupBy<T>(sources, groupBy): Map<any, Pool<T>>`

**Tests:**

```typescript
test('Pool.mergeUnique: from multiple pools', () => {
	const pool1 = new Pool<{ ip: string }>();
	const pool2 = new Pool<{ ip: string }>();
	const pool3 = new Pool<{ ip: string }>();

	pool1.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '1.1.1.1' });
	pool2.add({ ip: '2.2.2.2' });
	pool3.add({ ip: '3.3.3.3' });

	const merged = Pool.mergeUnique([pool1, pool2, pool3], 'ip');

	expect(merged.size).toBe(3);
});

test('Pool.mergeUniqueWith: priority by speed', () => {
	const pool1 = new Pool<{ ip: string; speed: number }>();
	const pool2 = new Pool<{ ip: string; speed: number }>();

	pool1.add({ ip: '1.1.1.1', speed: 100 });
	pool2.add({ ip: '1.1.1.1', speed: 200 });

	const merged = Pool.mergeUniqueWith([pool1, pool2], 'ip', (existing, duplicate) => (existing.data.speed > duplicate.data.speed ? existing : duplicate));

	const result = merged.query().select(Selectors.first);
	expect(result!.speed).toBe(200);
});
```

---

### Stage 11: Query.toPool()

**Files:**

-   `src/PoolQuery.ts` - extension

**Tasks:**

1. Implement `toPool(): Pool<T>`
2. Create a new Pool and copy the filtered entries into it

**Tests:**

```typescript
test('Query: toPool', () => {
	const pool = new Pool<{ country: string }>();
	pool.add({ country: 'US' });
	pool.add({ country: 'UK' });
	pool.add({ country: 'US' });

	const usPool = pool
		.query()
		.where((e) => e.data.country === 'US')
		.toPool();

	expect(usPool.size).toBe(2);
	expect(usPool instanceof Pool).toBe(true);
});
```

---

### Stage 12: PoolBinder

**Files:**

-   `src/PoolBinder.ts` - new class

**Tasks:**

1. Create the `PoolBinder` class
2. Add fields:
    - `pools: Map<string, Pool<any>>`
    - `filters: Map<string, Filter<any>>`
    - `selectors: Map<string, Selector<any>>`
3. Implement methods:
    - `bind(name, pool)`
    - `where(poolName, filter)`
    - `selectWith(poolName, selector)`
    - `execute()` → returns `Record<string, any> | null`
4. In `execute()`:
    - Iterate over all pools
    - Apply filters and selectors
    - If any returns `null` → return `null`
    - Otherwise return an object with the results

**Tests:**

```typescript
test('PoolBinder: basic binding', () => {
	const proxies = new Pool<{ ip: string; country: string }>();
	const accounts = new Pool<{ username: string }>();

	proxies.add({ ip: '1.1.1.1', country: 'US' });
	accounts.add({ username: 'user1' });

	const binder = new PoolBinder()
		.bind('proxy', proxies)
		.bind('account', accounts)
		.where('proxy', (e) => e.data.country === 'US')
		.selectWith('proxy', Selectors.first)
		.selectWith('account', Selectors.random);

	const combo = binder.execute();

	expect(combo).not.toBeNull();
	expect(combo!.proxy.ip).toBe('1.1.1.1');
	expect(combo!.account.username).toBe('user1');
});

test('PoolBinder: returns null when no match', () => {
	const proxies = new Pool<{ country: string }>();
	const accounts = new Pool<{ username: string }>();

	proxies.add({ country: 'UK' });
	accounts.add({ username: 'user1' });

	const binder = new PoolBinder()
		.bind('proxy', proxies)
		.bind('account', accounts)
		.where('proxy', (e) => e.data.country === 'US'); // won't find a match

	const combo = binder.execute();

	expect(combo).toBeNull();
});
```

---

### Stage 13: Type Safety and Exports

**Files:**

-   `src/index.ts` - main exports file
-   `src/types.ts` - type exports

**Tasks:**

1. Create `src/index.ts`:

```typescript
export { Pool } from './Pool';
export { PoolQuery } from './PoolQuery';
export { PoolBinder } from './PoolBinder';
export { Selectors } from './Selectors';
export type { PoolEntry, Filter, Selector } from './types';
```

2. Check all generic types
3. Make sure TypeScript infers types correctly:

```typescript
const pool = new Pool<{ id: number }>();
const result = pool.query().select(Selectors.first);
// result must be of type: {id: number} | null
```

**Tests:**

```typescript
test('TypeScript: correct type inference', () => {
	const pool = new Pool<{ id: number; name: string }>();
	pool.add({ id: 1, name: 'test' });

	const result = pool.query().select(Selectors.first);

	if (result) {
		// TypeScript must know about the id and name fields
		expect(result.id).toBe(1);
		expect(result.name).toBe('test');

		// @ts-expect-error - field doesn't exist
		// expect(result.invalid).toBe(1)
	}
});
```

---

### Stage 14: Documentation and Examples

**Files:**

-   `README.md` - main documentation
-   `examples/` - usage examples
-   JSDoc comments in the code

**Tasks:**

1. Write README.md:
    - Introduction and project essence
    - Installation
    - Quick start
    - Core concepts
    - API Reference
    - Usage examples
2. Create examples in `examples/`:
    - `examples/basic.ts` - simple usage
    - `examples/proxy-pool.ts` - proxy example
    - `examples/database-integration.ts` - DB integration via wrap
    - `examples/advanced-workflow.ts` - complex workflow
3. Add JSDoc for all public methods:

```typescript
/**
 * Filters pool entries based on predicate
 * @param filter - Function that returns true for entries to keep
 * @returns This query instance for chaining
 * @example
 * pool.query()
 *   .where(e => e.data.country === 'US')
 *   .where(e => e.meta.active === true)
 */
where(filter: Filter<T>): this
```

---

### Stage 15: Optimization and Performance

**Files:**

-   All existing files

**Tasks:**

1. **Profiling:**
    - Tests with large pools (10k, 100k elements)
    - Measure operation execution times
2. **Optimizations:**
    - Remove unnecessary array copies
    - Optimize `materialize()` - apply filters and sorting in a single pass
    - Use `Array.prototype` methods efficiently
    - Reuse objects where possible
3. **Memory leaks:**
    - Verify events are properly unsubscribed
    - Verify Map/Set are cleared
4. **Benchmarks:**

```typescript
// benchmark/filter-sort.bench.ts
import { Pool, Selectors } from '../src';

const pool = new Pool<{ id: number; value: number }>();

// Preparation
for (let i = 0; i < 100000; i++) {
	pool.add({ id: i, value: Math.random() * 1000 });
}

// Benchmark
console.time('filter + sort + select');
const result = pool
	.query()
	.where((e) => e.data.value > 500)
	.sortBy('value', 'desc')
	.select(Selectors.first);
console.timeEnd('filter + sort + select');
```

---

### Stage 16: Edge Case Testing

**Files:**

-   `tests/edge-cases.test.ts`

**Tasks:**

1. Empty pool:

```typescript
test('Empty pool: query returns null', () => {
	const pool = new Pool<{ id: number }>();
	const result = pool.query().select(Selectors.first);
	expect(result).toBeNull();
});
```

2. Single element:

```typescript
test('Single element: all operations work', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 });

	expect(pool.size).toBe(1);
	expect(pool.query().toArray()).toHaveLength(1);
});
```

3. Duplicates:

```typescript
test('Duplicates: deduplicate works', () => {
	const pool = new Pool<{ id: number }>();
	pool.add({ id: 1 });
	pool.add({ id: 1 });
	pool.add({ id: 2 });

	pool.deduplicate('id');
	expect(pool.size).toBe(2);
});
```

4. Circular operations:

```typescript
test('Circular merge: does not break', () => {
	const pool1 = new Pool<{ id: number }>();
	const pool2 = new Pool<{ id: number }>();

	pool1.add({ id: 1 });
	pool2.add({ id: 2 });

	pool1.merge(pool2);
	pool2.merge(pool1);

	expect(pool1.size).toBe(2);
	expect(pool2.size).toBe(2);
});
```

5. Large volumes:

```typescript
test('Large pool: 100k elements', () => {
	const pool = new Pool<{ id: number }>();

	for (let i = 0; i < 100000; i++) {
		pool.add({ id: i });
	}

	expect(pool.size).toBe(100000);

	const result = pool
		.query()
		.where((e) => e.data.id > 50000)
		.take(10)
		.toArray();

	expect(result).toHaveLength(10);
});
```

---

### Stage 17: Build and Publishing

**Files:**

-   `package.json`
-   `tsconfig.json`
-   `.npmignore`

**Tasks:**

1. Configure `tsconfig.json`:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "commonjs",
		"declaration": true,
		"outDir": "./dist",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

2. Configure `package.json`:

```json
{
	"name": "pool-lib",
	"version": "1.0.0",
	"description": "Lightweight TypeScript library for managing data collections with filters, sorting, and composition",
	"main": "dist/index.js",
	"types": "dist/index.d.ts",
	"scripts": {
		"build": "tsc",
		"test": "jest",
		"test:watch": "jest --watch",
		"prepublishOnly": "npm run build && npm test"
	},
	"keywords": ["pool", "collection", "filter", "sort", "typescript"],
	"author": "",
	"license": "MIT",
	"devDependencies": {
		"@types/jest": "^29.0.0",
		"@types/node": "^20.0.0",
		"jest": "^29.0.0",
		"ts-jest": "^29.0.0",
		"typescript": "^5.0.0"
	}
}
```

3. Create `.npmignore`:

```
src/
tests/
examples/
benchmark/
tsconfig.json
jest.config.js
*.test.ts
```

4. Build and verify:

```bash
npm run build
npm test
npm pack  # verify what ends up in the package
```

5. Publishing:

```bash
npm publish
```

---

## Project Structure (Final)

```
pool-lib/
├── src/
│   ├── types.ts              # Core types
│   ├── Pool.ts               # Pool class
│   ├── PoolQuery.ts          # PoolQuery class
│   ├── PoolBinder.ts         # PoolBinder class
│   ├── Selectors.ts          # Built-in selectors
│   └── index.ts              # Main exports
├── tests/
│   ├── Pool.test.ts
│   ├── PoolQuery.test.ts
│   ├── PoolBinder.test.ts
│   ├── Selectors.test.ts
│   ├── integration.test.ts
│   └── edge-cases.test.ts
├── examples/
│   ├── basic.ts
│   ├── proxy-pool.ts
│   ├── database-integration.ts
│   └── advanced-workflow.ts
├── benchmark/
│   └── filter-sort.bench.ts
├── dist/                     # Build output (git ignored)
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
├── .npmignore
├── README.md
└── LICENSE
```

---

## Stage Prioritization

### MVP (Minimum Viable Product):

1. ✅ Stage 1: Basic Structure
2. ✅ Stage 2: Sorting
3. ✅ Stage 4: Selectors
4. ✅ Stage 5: Events

**The library is usable after MVP.**

### Full functionality:

5. Stage 3: Pagination
6. Stage 6: Wrap
7. Stage 7: Batch Operations
8. Stage 8: Pool Combination
9. Stage 9: Transformations
10. Stage 10: Static Methods
11. Stage 11: Query.toPool()
12. Stage 12: PoolBinder

### Finalization:

13. Stage 13: Type Safety
14. Stage 14: Documentation
15. Stage 15: Optimization
16. Stage 16: Edge Cases
17. Stage 17: Build and Publishing
