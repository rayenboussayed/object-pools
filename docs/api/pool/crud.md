# CRUD Operations

Methods for adding, updating, and removing entries from the pool.

::: tip Destructuring Option
You can use destructuring for shorter syntax. Both ways are valid:
```typescript
pool.remove(({ data }) => data.id === '123')  // With destructuring
pool.remove(entry => entry.data.id === '123')         // Without destructuring
```
:::

## add()

Adds an entry to the pool.

```text
pool.add(data: T, meta?: M): PoolEntry<T, M>
```

**Parameters:**
- `data` - The data to add
- `meta` - Optional metadata

**Returns:** The created pool entry

**Example:**
```typescript
const pool = new Pool<User>();
pool.add({ id: '1', name: 'Alice' }, { active: true });
```

## addBatch()

Adds multiple entries at once. Fires a single `batchAdd` event instead of multiple `add` events.

```text
pool.addBatch(items: Array<{ data: T; meta?: M }>): PoolEntry<T, M>[]
```

**Parameters:**
- `items` - Array of items with data and optional metadata

**Returns:** Array of created pool entries

**Example:**
```typescript
pool.addBatch([
  { data: { id: '1', name: 'Alice' }, meta: { active: true } },
  { data: { id: '2', name: 'Bob' }, meta: { active: false } },
]);
```

**Why use batch?**
- Fires one `batchAdd` event instead of N `add` events
- Better performance when adding many entries

## remove()

Removes entries matching a predicate.

```text
pool.remove(predicate: (data: T) => boolean): PoolEntry<T>[]
```

**Parameters:**
- `predicate` - Function that returns true for entries to remove

**Returns:** Array of removed entries

**Example:**
```typescript
// Using destructuring for cleaner syntax
const removed = pool.remove(({ data }) => data.id === '123');
```

## removeBatch()

Removes entries matching any of the predicates. Fires a single `batchRemove` event.

```text
pool.removeBatch(predicates: Array<(data: T) => boolean>): PoolEntry<T>[]
```

**Parameters:**
- `predicates` - Array of predicate functions

**Returns:** Array of removed entries

**Example:**
```typescript
pool.removeBatch([
  ({ data }) => data.id === '1',
  ({ data }) => data.id === '2',
]);
```

**Note:** You can often achieve the same with a single predicate:
```typescript
pool.remove(({ data }) => data.id === '1' || data.id === '2');
```
