# Query Operations

Create queries for filtering, sorting, and selecting entries.

## query()

Creates a query builder for filtering and selecting entries.

```text
pool.query(): Query<T>
```

**Returns:** A new Query instance

**Example:**

```typescript
// Using destructuring for cleaner syntax
const user = pool
	.query()
	.where(({ data }) => data.country === 'US')
	.where(({ meta }) => meta.active === true)
	.orderBy('age', 'desc')
	.select(Selectors.first);
```

See the [Query API](/api/query) for full query capabilities.
