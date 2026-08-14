# Events & Hooks

Event system for reacting to pool changes.

## on()

Registers an event handler.

```text
pool.on(event: string, handler: Function): void
```

**Parameters:**
- `event` - Event name
- `handler` - Handler function

**Available Events:**
- `add` - Fired when an entry is added
- `batchAdd` - Fired when multiple entries are added
- `get` - Fired when an entry is retrieved
- `set` - Fired when an entry is updated
- `remove` - Fired when an entry is removed
- `batchRemove` - Fired when multiple entries are removed
- `beforeSelect` - Fired before query selection
- `afterSelect` - Fired after query selection

**Example:**
```typescript
pool.on('add', (entry: PoolEntry<User>) => {
  console.log(`User ${entry.data.name} added`);
});

pool.on('get', (entry: PoolEntry<Proxy>) => {
  entry.meta.usedCount++;
  entry.meta.lastUsed = new Date();
});
```

## off()

Unregisters an event handler.

```text
pool.off(event: string, handler: Function): void
```

**Parameters:**
- `event` - Event name
- `handler` - Handler function to remove

**Example:**
```typescript
const handler = (entry) => console.log(entry);
pool.on('add', handler);
pool.off('add', handler);
```

## wrap()

Wraps a method with custom behavior.

```text
pool.wrap<K extends keyof Pool<T>>(
  method: K,
  wrapper: (original: Function, ...args: any[]) => any
): void
```

**Parameters:**
- `method` - Method name to wrap
- `wrapper` - Wrapper function

**Example:**
```typescript
// Add logging to the add method
pool.wrap('add', (original, data, meta) => {
  console.log(`Adding: ${data.name}`);
  const result = original(data, meta);
  console.log(`Added successfully`);
  return result;
});

pool.add({ id: '1', name: 'Alice' });
// Logs:
// Adding: Alice
// Added successfully
```
