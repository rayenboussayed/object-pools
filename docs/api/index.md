# API Reference

Complete API documentation for the Pools library.

## Core Classes

-   [Pool](/api/pool) - Main class for managing data collections
-   [Query](/api/query) - Query builder for filtering and sorting
-   [Binder](/api/binder) - Bind multiple pools together
-   [Selectors](/api/selectors) - Built-in selection strategies

## Types

```typescript
// Metadata attached to entries (extendable, index signature)
type PoolMeta = Record<string, any>;

// Entry wrapper
type PoolEntry<T, M extends PoolMeta = PoolMeta> = {
	data: T;
	meta: M;
};

// Filter function
type Filter<T, M extends PoolMeta = PoolMeta> = (entry: PoolEntry<T, M>) => boolean;

// Selector function
type Selector<T, M extends PoolMeta = PoolMeta> = (
	entries: PoolEntry<T, M>[],
) => PoolEntry<T, M> | null;
```

## Quick Navigation

| Class                       | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| [Pool](/api/pool)           | Main pool class with CRUD, Map-like operations, and events |
| [Query](/api/query)         | Chainable query API for filtering and sorting              |
| [Binder](/api/binder)       | Combine multiple pools for complex selections              |
| [Selectors](/api/selectors) | Built-in selectors: first, last, random, minBy, weighted   |
