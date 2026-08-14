# Query

Query builder for filtering, sorting, and selecting entries from a pool.

::: tip
Create a query using `pool.query()`, then chain methods to build your query.
:::

::: tip Destructuring Option
You can use destructuring for shorter syntax. Both ways are valid:

```text
// With destructuring (shorter)
.where(({ data, meta }) => data.country === 'US' && meta.active)

// Without destructuring (also fine)
.where(e => e.data.country === 'US' && e.meta.active)
```

:::

## Filtering

### where()

Adds a filter to the query.

```text
query.where(filter: Filter<T, M>): Query<T, M>
```

**Example:**

```typescript
// Using destructuring for cleaner syntax
const result = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.where(({ meta }) => meta.active === true)
	.toArray();
```

### whereOr()

Adds an OR filter (matches any of the predicates).

```text
query.whereOr(filters: Filter<T, M>[]): Query<T, M>
```

**Example:**

```typescript
const result = pool
	.query()
	.whereOr([({ data }) => data.provider === 'A', ({ data }) => data.provider === 'B'])
	.toArray();
```

## Sorting

### orderBy()

Sorts by a field or custom comparator.

```text
query.orderBy(field: keyof T, order: 'asc' | 'desc'): Query<T>
query.orderBy(compareFn: (a: PoolEntry<T, M>, b: PoolEntry<T, M>) => number): Query<T, M>
```

**Examples:**

```typescript
// By field
pool.query().orderBy('speed', 'desc');

// Custom comparator
pool.query().orderBy((a, b) => b.data.speed - a.data.speed);
```

### orderByMeta()

Sorts by a metadata field.

```text
query.orderByMeta(field: string, order: 'asc' | 'desc'): Query<T>
```

**Example:**

```typescript
pool.query().orderByMeta('usedCount', 'asc');
```

## Pagination

### limit()

Limits the number of results.

```text
query.limit(count: number): Query<T>
```

**Example:**

```typescript
pool.query().limit(10).toArray(); // Get first 10
```

### offset()

Skips a number of results.

```text
query.offset(count: number): Query<T>
```

**Example:**

```typescript
pool.query().offset(20).limit(10).toArray(); // Get 10 items starting from 20
```

## Materialization

### select()

Selects a single entry using a selector.

```text
query.select(selector: Selector<T, M>): T | null
```

**Example:**

```typescript
import { Selectors } from 'object-pools';

const proxy = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.select(Selectors.random);
```

### toArray()

Returns all filtered and sorted entries as an array.

```text
query.toArray(): T[]
```

**Example:**

```typescript
const users = pool
	.query()
	.where(({ data }) => data.active)
	.orderBy('name', 'asc')
	.toArray();
```

### toPool()

Converts the query to a new Pool.

```text
query.toPool(): Pool<T, M>
```

**Example:**

```typescript
const activeUsers = pool
	.query()
	.where(({ data }) => data.active)
	.toPool();
```

### count

Gets the count of filtered entries.

```text
query.count: number
```

**Example:**

```typescript
const activeCount = pool.query().where(({ data }) => data.active).count;
```

## Chaining Example

```typescript
const result = pool
	.query()
	// Filter by country
	.where(({ data }) => data.country === 'US')
	// Filter by active status
	.where(({ meta }) => meta.active === true)
	// Allow multiple providers
	.whereOr([({ data }) => data.provider === 'A', ({ data }) => data.provider === 'B'])
	// Sort by speed (descending)
	.orderBy('speed', 'desc')
	// Sort by usage (ascending)
	.orderByMeta('usedCount', 'asc')
	// Skip first 10
	.offset(10)
	// Take next 5
	.limit(5)
	// Get as array
	.toArray();
```
