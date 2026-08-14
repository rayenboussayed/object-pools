# Map-like Operations

Methods that make Pool behave like a Map for easy get/set/has/delete operations.

## get()

Gets an entry by field value or predicate.

```text
pool.get(key: keyof T, value: any): T | null
pool.get(predicate: (entry: PoolEntry<T>) => boolean): T | null
```

**Parameters:**
- `key` - Field name to match
- `value` - Value to match for the key
- OR `predicate` - Function that returns true for the entry to get

**Returns:** The matching data or null

**Example:**
```typescript
// By field
const user = pool.get('id', 'user123');

// By predicate (with destructuring)
const admin = pool.get(({ data }) => data.role === 'admin');
```

## has()

Checks if an entry exists.

```text
pool.has(key: keyof T, value: any): boolean
pool.has(predicate: (entry: PoolEntry<T>) => boolean): boolean
```

**Parameters:**
- `key` - Field name to match
- `value` - Value to match
- OR `predicate` - Function that returns true for the entry to check

**Returns:** True if entry exists

**Example:**
```typescript
if (pool.has('id', 'user123')) {
  console.log('User exists');
}

// With destructuring
if (pool.has(({ data }) => data.age > 18)) {
  console.log('Has adults');
}
```

## set()

Sets (updates or adds) an entry in the pool.

```text
pool.set(key: keyof T, value: any, data: T, meta?: M): PoolEntry<T, M>
```

**Parameters:**
- `key` - Field name to use as key
- `value` - Value to match for the key
- `data` - New data to set
- `meta` - Optional metadata

**Returns:** The created or updated pool entry

**Example:**
```typescript
// Update if exists, add if not
pool.set('id', 'user123', { id: 'user123', name: 'Alice' });
```

## delete()

Deletes an entry from the pool.

```text
pool.delete(key: keyof T, value: any): boolean
```

**Parameters:**
- `key` - Field name to use as key
- `value` - Value to match for the key

**Returns:** True if entry was deleted

**Example:**
```typescript
const deleted = pool.delete('id', 'user123');
if (deleted) {
  console.log('User deleted');
}
```
