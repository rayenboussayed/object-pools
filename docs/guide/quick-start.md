# Quick Start

Get started with Pools in 5 minutes.

## Installation

```bash
npm install pools
```

## Basic Example

```typescript
import { Pool, Selectors } from 'object-pools';

// 1. Define your data type
interface User {
	id: string;
	name: string;
	email: string;
	age: number;
}

// 2. Create a pool
const users = new Pool<User>();

// 3. Add data
users.add({ id: '1', name: 'Alice', email: 'alice@example.com', age: 25 }, { active: true, lastLogin: new Date() });

users.add({ id: '2', name: 'Bob', email: 'bob@example.com', age: 30 }, { active: false, lastLogin: new Date('2024-01-01') });

// 4. Query data
const activeUser = users
	.query()
	.where(({ meta }) => meta.active === true)
	.select(Selectors.first);

console.log(activeUser); // Alice
```

## Working with Metadata

Every entry can have metadata for tracking usage, state, etc:

```typescript
// Add metadata
users.add({ id: '1', name: 'Alice', email: 'alice@example.com', age: 25 }, { usedCount: 0, lastUsed: null });

// Auto-update metadata on access
users.on('get', (entry) => {
	entry.meta.usedCount++;
	entry.meta.lastUsed = new Date();
});

// Query with metadata
const leastUsed = users.query().select(Selectors.minBy('usedCount'));
```

## Using Selectors

```typescript
import { Selectors } from 'object-pools';

// Random selection
const random = users.query().select(Selectors.random);

// First/Last
const first = users.query().select(Selectors.first);
const last = users.query().select(Selectors.last);

// Minimum by field
const youngest = users.query().select(Selectors.minBy('age'));

// Weighted random (prefer less-used)
const weighted = users.query().select(Selectors.weighted((entry) => 1 / (entry.meta.usedCount + 1)));
```

## Complex Queries

Chain filters, sorting, and pagination:

```typescript
const result = users
	.query()
	// Filter by age
	.where(({ data }) => data.age >= 18)
	// Filter by active status
	.where(({ meta }) => meta.active === true)
	// Sort by name
	.orderBy('name', 'asc')
	// Get first 10
	.limit(10)
	// Convert to array
	.toArray();
```

## Map-like Operations

Use Pool like a Map:

```typescript
// Get by field
const user = users.get('id', '1');

// Check existence
if (users.has('email', 'alice@example.com')) {
	console.log('Email exists');
}

// Update or add
users.set('id', '1', {
	id: '1',
	name: 'Alice Updated',
	email: 'alice@example.com',
	age: 26,
});

// Delete
users.delete('id', '1');
```

## Binding Multiple Pools

Combine multiple pools for complex selections:

```typescript
import { Binder } from 'object-pools';

const proxies = new Pool<Proxy>();
const accounts = new Pool<Account>();

const combo = new Binder()
	.bind('proxy', proxies)
	.bind('account', accounts)
	.where('proxy', ({ data }) => data.country === 'US')
	.where('account', ({ data }) => data.service === 'twitter')
	.selectWith('proxy', Selectors.minBy('usedCount'))
	.selectWith('account', Selectors.random)
	.execute();

if (combo) {
	await doTask(combo.proxy, combo.account);
}
```

## Pool of Pools

Store pools inside pools:

```typescript
const usProxies = new Pool<Proxy>();
const ukProxies = new Pool<Proxy>();

const poolOfPools = new Pool<Pool<Proxy>>();
poolOfPools.add(usProxies, { region: 'US' });
poolOfPools.add(ukProxies, { region: 'UK' });

// Find biggest pool
const biggest = poolOfPools
	.query()
	.orderBy((a, b) => b.data.size - a.data.size)
	.select(Selectors.first);
```

## Events

Listen to pool operations:

```typescript
// Track usage
pool.on('get', (entry) => {
	entry.meta.usedCount++;
	console.log(`Used: ${entry.data.id}`);
});

// Log additions
pool.on('add', (entry) => {
	console.log(`Added: ${entry.data.id}`);
});

// Track selections
pool.on('afterSelect', (data) => {
	console.log('Selected:', data);
});
```

## Next Steps

-   [API Reference](/api/) - Complete API documentation
-   [Examples](/examples/) - Real-world usage examples
-   Browse the source code on [GitHub](https://github.com/rayenboussayed/object-pools)
