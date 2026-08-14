# Transformation

Methods for transforming, grouping, and organizing pool data.

## deduplicate()

Removes duplicate entries based on uniqueBy.

```text
pool.deduplicate(uniqueBy: keyof T | ((item: T) => any)): this
```

**Parameters:**
- `uniqueBy` - Field name or function to determine uniqueness

**Returns:** This pool for chaining

**Example:**
```typescript
// Remove duplicates by ID
pool.deduplicate('id');

// Remove duplicates by email
pool.deduplicate(user => user.email);
```

## partition()

Partitions the pool into two pools based on predicate.

```text
pool.partition(predicate: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>]
```

**Parameters:**
- `predicate` - Function to determine partition

**Returns:** Tuple of two pools [matching, notMatching]

**Example:**
```typescript
const [premium, free] = users.partition(({ data }) => data.premium === true);

console.log(`Premium: ${premium.size}, Free: ${free.size}`);
```

## groupBy()

Groups entries by a field or function.

```text
pool.groupBy(groupBy: keyof T | ((item: T) => any)): Map<any, Pool<T>>
```

**Parameters:**
- `groupBy` - Field name or function to group by

**Returns:** Map of group keys to pools

**Example:**
```typescript
const byCountry = users.groupBy('country');
for (const [country, pool] of byCountry) {
  console.log(`${country}: ${pool.size} users`);
}

// By function
const byAgeGroup = users.groupBy(user =>
  user.age < 18 ? 'minor' : (user.age < 65 ? 'adult' : 'senior')
);
```

## clone()

Clones the pool (deep copy of entries).

```text
pool.clone(): Pool<T>
```

**Returns:** A new pool with the same entries

**Example:**
```typescript
const backup = pool.clone();
```

## sample()

Returns a random sample of entries.

```text
pool.sample(count: number): Pool<T>
```

**Parameters:**
- `count` - Number of entries to sample

**Returns:** A new pool with sampled entries

**Example:**
```typescript
const randomThree = pool.sample(3);
```

## shuffle()

Shuffles the pool in place.

```text
pool.shuffle(): this
```

**Returns:** This pool for chaining

**Example:**
```typescript
pool.shuffle();
const first = pool.all[0]; // Random entry
```
