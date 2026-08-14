# Merge & Combination

Methods for combining multiple pools together.

## merge()

Merges one or more pools or queries into this pool.

```text
pool.merge(...sources: (Pool<T> | Query<T> | Array<Pool<T> | Query<T>>)[]): this
```

**Parameters:**
- `sources` - Pools or Queries to merge (as individual arguments or arrays)

**Returns:** This pool for chaining

**Example:**
```typescript
const pool = new Pool();
const pool1 = new Pool();
const pool2 = new Pool();
const pool3 = new Pool();

// Multiple arguments
pool.merge(pool1, pool2, pool3);

// Array
pool.merge([pool1, pool2]);

// Mixed
pool.merge(pool1, [pool2, pool3]);
```

## mergeUnique()

Merges pools ensuring uniqueness by a field or function.

```text
pool.mergeUnique(
  uniqueBy: keyof T | ((item: T) => any),
  ...sources: (Pool<T> | Query<T> | Array<Pool<T> | Query<T>>)[]
): this
```

**Parameters:**
- `uniqueBy` - Field name or function to determine uniqueness
- `sources` - Pools or Queries to merge

**Returns:** This pool for chaining

**Example:**
```typescript
// By field
pool.mergeUnique('id', pool1, pool2);

// By function
pool.mergeUnique(user => user.email, pool1, pool2);

// With array
pool.mergeUnique('id', [pool1, pool2]);
```

## union()

Union with another pool (no duplicates based on compareFn).

```text
pool.union(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this
```

**Parameters:**
- `other` - Pool to union with
- `compareFn` - Optional comparison function (defaults to JSON.stringify comparison)

**Returns:** This pool for chaining

**Example:**
```typescript
pool.union(otherPool);

// Custom comparison
pool.union(otherPool, (a, b) => a.id === b.id);
```

## intersect()

Keep only entries that exist in both pools.

```text
pool.intersect(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this
```

**Parameters:**
- `other` - Pool to intersect with
- `compareFn` - Optional comparison function

**Returns:** This pool for chaining

**Example:**
```typescript
const premium = new Pool<User>();
const active = new Pool<User>();

// Keep only users who are both premium AND active
premium.intersect(active, (a, b) => a.id === b.id);
```

## difference()

Remove entries that exist in another pool.

```text
pool.difference(other: Pool<T>, compareFn?: (a: T, b: T) => boolean): this
```

**Parameters:**
- `other` - Pool to diff with
- `compareFn` - Optional comparison function

**Returns:** This pool for chaining

**Example:**
```typescript
// Remove banned users
allUsers.difference(bannedUsers, (a, b) => a.id === b.id);
```

## Static Methods

### Pool.merge()

Merges multiple pools into a new pool.

```text
Pool.merge<T>(...pools: Pool<T>[]): Pool<T>
```

### Pool.mergeUnique()

Merges multiple pools/queries with uniqueness constraint.

```text
Pool.mergeUnique<T>(
  sources: Array<Pool<T> | Query<T>>,
  uniqueBy: keyof T | ((item: T) => any)
): Pool<T>
```

### Pool.mergeUniqueWith()

Merges with custom duplicate resolution.

```text
Pool.mergeUniqueWith<T>(
  sources: Array<Pool<T> | Query<T>>,
  uniqueBy: keyof T | ((item: T) => any),
  resolveDuplicate: (existing: PoolEntry<T>, duplicate: PoolEntry<T>) => PoolEntry<T>
): Pool<T>
```

**Example:**
```typescript
// Keep the entry with higher score
const merged = Pool.mergeUniqueWith(
  [pool1, pool2],
  'id',
  (existing, duplicate) =>
    existing.data.score > duplicate.data.score ? existing : duplicate
);
```
