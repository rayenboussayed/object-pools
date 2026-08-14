# Pool

Main class for managing collections of data with metadata.

## Constructor

```typescript
const pool = new Pool<T, M>(); // M defaults to PoolMeta
```

## CRUD Operations

### add()

Adds an entry to the pool.

```text
pool.add(data: T, meta?: M): PoolEntry<T, M>
```

**Example:**
```typescript
pool.add({ id: '1', name: 'test' }, { active: true });
```

### addBatch()

Adds multiple entries at once.

```text
pool.addBatch(items: Array<{ data: T; meta?: M }>): PoolEntry<T, M>[]
```

**Example:**
```typescript
pool.addBatch([
  { data: { id: '1', name: 'test1' } },
  { data: { id: '2', name: 'test2' } },
]);
```

### remove()

Removes entries matching a predicate.

```text
pool.remove(predicate: (data: T) => boolean): T[]
```

**Example:**
```typescript
const removed = pool.remove(data => data.id === '1');
```

### removeBatch()

Removes multiple entries using multiple predicates.

```text
pool.removeBatch(predicates: Array<(data: T) => boolean>): T[]
```

## Map-like Operations

### get()

Gets an entry by field value or predicate.

```text
pool.get(key: keyof T, value: any): T | null
pool.get(predicate: (entry: PoolEntry<T>) => boolean): T | null
```

**Examples:**
```typescript
// By field
const user = pool.get('id', 'user123');

// By predicate
const admin = pool.get(({ data }) => data.role === 'admin');
```

### has()

Checks if an entry exists.

```text
pool.has(key: keyof T, value: any): boolean
pool.has(predicate: (entry: PoolEntry<T>) => boolean): boolean
```

**Examples:**
```typescript
if (pool.has('id', 'user123')) {
  console.log('User exists');
}
```

### set()

Updates an existing entry or adds a new one.

```text
pool.set(key: keyof T, value: any, data: T, meta?: M): PoolEntry<T, M>
```

**Example:**
```typescript
pool.set('id', 'user123', { id: 'user123', name: 'Updated' });
```

### delete()

Removes an entry and returns true if found.

```text
pool.delete(key: keyof T, value: any): boolean
```

**Example:**
```typescript
const deleted = pool.delete('id', 'user123');
```

## Iteration Methods

### forEach()

Iterates over all entries.

```text
pool.forEach(fn: (entry: PoolEntry<T>, index: number) => void): void
```

### map()

Maps entries to a new array.

```text
pool.map<U>(fn: (entry: PoolEntry<T>, index: number) => U): U[]
```

### filter()

Filters entries.

```text
pool.filter(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T>[]
```

### reduce()

Reduces entries to a single value.

```text
pool.reduce<U>(fn: (accumulator: U, entry: PoolEntry<T>, index: number) => U, initialValue: U): U
```

### some()

Tests if any entry matches.

```text
pool.some(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean
```

### every()

Tests if all entries match.

```text
pool.every(fn: (entry: PoolEntry<T>, index: number) => boolean): boolean
```

### find()

Finds the first matching entry.

```text
pool.find(fn: (entry: PoolEntry<T>, index: number) => boolean): PoolEntry<T> | undefined
```

### findIndex()

Finds the index of the first matching entry.

```text
pool.findIndex(fn: (entry: PoolEntry<T>, index: number) => boolean): number
```

## Query API

### query()

Creates a query builder.

```text
pool.query(): Query<T>
```

See [Query](/api/query) for details.

## Combining Pools

### merge()

Merges another pool into this one.

```text
pool.merge(other: Pool<T>): void
```

### mergeUnique()

Merges with deduplication.

```text
pool.mergeUnique(other: Pool<T>, key: keyof T | ((data: T) => any)): void
```

### union()

Combines pools without duplicates.

```text
pool.union(other: Pool<T>, compareFn: (a: T, b: T) => boolean): void
```

### intersect()

Keeps only common elements.

```text
pool.intersect(other: Pool<T>, compareFn: (a: T, b: T) => boolean): void
```

### difference()

Removes common elements.

```text
pool.difference(other: Pool<T>, compareFn: (a: T, b: T) => boolean): void
```

### deduplicate()

Removes duplicates.

```text
pool.deduplicate(key: keyof T | ((data: T) => any)): void
```

## Transformations

### clone()

Creates a copy of the pool.

```text
pool.clone(): Pool<T>
```

### partition()

Splits pool into two based on predicate.

```text
pool.partition(predicate: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>]
```

### sample()

Returns random sample of entries.

```text
pool.sample(count: number): Pool<T>
```

### shuffle()

Shuffles entries in place.

```text
pool.shuffle(): void
```

### groupBy()

Groups entries by field or function.

```text
pool.groupBy(key: keyof T | ((data: T) => any)): Map<any, Pool<T>>
```

## Static Methods

### Pool.merge()

Merges multiple pools.

```text
Pool.merge<T>(...pools: Pool<T>[]): Pool<T>
```

### Pool.mergeUnique()

Merges with deduplication.

```text
Pool.mergeUnique<T>(pools: Pool<T>[], key: keyof T | ((data: T) => any)): Pool<T>
```

### Pool.mergeUniqueWith()

Merges with custom conflict resolution.

```text
Pool.mergeUniqueWith<T>(
  pools: Pool<T>[],
  key: keyof T | ((data: T) => any),
  resolver: (existing: PoolEntry<T>, duplicate: PoolEntry<T>) => PoolEntry<T>
): Pool<T>
```

### Pool.intersect()

Finds common elements between two pools.

```text
Pool.intersect<T>(pool1: Pool<T>, pool2: Pool<T>, compareFn: (a: T, b: T) => boolean): Pool<T>
```

## Events

### on()

Registers an event handler.

```text
pool.on(event: string, handler: Function): void
```

**Events:**
- `'add'` - When entry is added
- `'remove'` - When entry is removed
- `'get'` - When entry is retrieved
- `'set'` - When entry is updated/added via set()
- `'batchAdd'` - When multiple entries are added
- `'batchRemove'` - When multiple entries are removed
- `'beforeSelect'` - Before selector is applied
- `'afterSelect'` - After selector is applied

**Example:**
```typescript
pool.on('get', (entry) => {
  entry.meta.usedCount++;
  entry.meta.lastUsed = new Date();
});
```

### off()

Unregisters an event handler.

```text
pool.off(event: string, handler: Function): void
```

## Properties

### size

Number of entries in the pool.

```text
pool.size: number
```

### all

Array of all data objects.

```text
pool.all: T[]
```

### allEntries

Array of all pool entries.

```text
pool.allEntries: PoolEntry<T, M>[]
```

## Method Wrapping

### wrap()

Wraps a method with custom behavior.

```text
pool.wrap<K extends keyof Pool<T>>(
  method: K,
  wrapper: (original: Function, ...args: any[]) => any
): void
```

**Example:**
```typescript
pool.wrap('add', (original, data, meta) => {
  console.log('Before add');
  const result = original(data, meta);
  console.log('After add');
  return result;
});
```
