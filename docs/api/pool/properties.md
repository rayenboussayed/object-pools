# Properties & Getters

Properties for accessing pool data and metadata.

## size

Gets the number of entries in the pool.

```text
pool.size: number
```

**Example:**
```typescript
console.log(`Pool has ${pool.size} entries`);
```

## all

Gets all data objects from the pool (without metadata).

```text
pool.all: T[]
```

**Example:**
```typescript
const allUsers = pool.all;
for (const user of allUsers) {
  console.log(user.name);
}
```

## allEntries

Gets all pool entries (with metadata).

```text
pool.allEntries: PoolEntry<T>[]
```

**Example:**
```typescript
for (const entry of pool.allEntries) {
  console.log(entry.data, entry.meta);
}
```
