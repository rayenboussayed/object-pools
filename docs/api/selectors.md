# Selectors

Built-in selection strategies for choosing entries from a pool.

## Overview

Selectors are functions that pick a single entry from an array of entries. They're used with `pool.query().select()`.

```typescript
type Selector<T, M extends PoolMeta = PoolMeta> = (entries: PoolEntry<T, M>[]) => PoolEntry<T, M> | null;
```

## Built-in Selectors

### first

Selects the first entry.

```text
Selectors.first<T, M extends PoolMeta = PoolMeta>(entries: PoolEntry<T, M>[]): PoolEntry<T, M> | null
```

**Example:**

```typescript
const first = pool.query().select(Selectors.first);
```

### last

Selects the last entry.

```text
Selectors.last<T, M extends PoolMeta = PoolMeta>(entries: PoolEntry<T, M>[]): PoolEntry<T, M> | null
```

**Example:**

```typescript
const last = pool.query().select(Selectors.last);
```

### random

Selects a random entry.

```text
Selectors.random<T, M extends PoolMeta = PoolMeta>(entries: PoolEntry<T, M>[]): PoolEntry<T, M> | null
```

**Example:**

```typescript
const random = pool.query().select(Selectors.random);
```

### minBy()

Creates a selector that picks the entry with the minimum value for a field.

```text
Selectors.minBy<T, M extends PoolMeta = PoolMeta>(field: string): Selector<T, M>
```

Checks both `data` and `meta` for the field (prefers `data`).

**Examples:**

```typescript
// Minimum by data field
const leastUsed = pool.query().select(Selectors.minBy('usedCount'));

// Minimum by meta field
const lowestPriority = pool.query().select(Selectors.minBy('priority'));
```

### weighted()

Creates a weighted random selector.

```text
Selectors.weighted<T, M extends PoolMeta = PoolMeta>(weightFn: (entry: PoolEntry<T, M>) => number): Selector<T, M>
```

Higher weight = higher probability of selection.

**Examples:**

```typescript
// Prefer less-used entries
const proxy = pool.query().select(Selectors.weighted((entry) => 1 / (entry.meta.usedCount + 1)));

// Prefer higher-speed entries
const proxy = pool.query().select(Selectors.weighted(({ data }) => data.speed));

// Custom weight function
const proxy = pool.query().select(
	Selectors.weighted((entry) => {
		const speed = entry.data.speed;
		const usage = entry.meta.usedCount;
		return speed / (usage + 1);
	})
);
```

::: tip Zero Weights
If all weights are zero, falls back to random selection.
:::

## Custom Selectors

You can create your own selectors:

```typescript
import type { Selector, PoolEntry } from 'object-pools';

// Select entry with longest name
const longestName: Selector<User> = (entries) => {
	if (entries.length === 0) return null;

	let longest = entries[0]!;
	for (const entry of entries) {
		if (entry.data.name.length > longest.data.name.length) {
			longest = entry;
		}
	}
	return longest;
};

// Use it
const user = pool.query().select(longestName);
```

## Combining with Query

Selectors work perfectly with the query API:

```typescript
import { Selectors } from 'object-pools';

// Random US proxy
const proxy = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.select(Selectors.random);

// Least-used active proxy
const proxy = pool
	.query()
	.where(({ meta }) => meta.active === true)
	.orderBy('speed', 'desc')
	.select(Selectors.minBy('usedCount'));

// Weighted selection based on speed and usage
const proxy = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.select(
		Selectors.weighted((entry) => {
			return entry.data.speed / (entry.meta.usedCount + 1);
		})
	);
```

## Selector Patterns

### Load Balancing

```typescript
// Select least-used server
const server = servers
	.query()
	.where(({ meta }) => meta.healthy)
	.select(Selectors.minBy('activeConnections'));
```

### Failover

```typescript
// Try primary, fallback to secondary
let server = servers
	.query()
	.where(({ data }) => data.type === 'primary')
	.select(Selectors.first);

if (!server) {
	server = servers
		.query()
		.where(({ data }) => data.type === 'secondary')
		.select(Selectors.random);
}
```

### Weighted Distribution

```typescript
// Distribute based on server capacity
const server = servers
	.query()
	.where(({ meta }) => meta.available)
	.select(Selectors.weighted(({ data }) => data.capacity));
```

### Round-Robin (with metadata)

```typescript
// Track last selected index
pool.on('get', (entry) => {
	entry.meta.lastSelectedAt = Date.now();
});

// Select least recently used
const item = pool.query().select(Selectors.minBy('lastSelectedAt'));
```
