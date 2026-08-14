# Examples

Real-world examples of using the Pools library.

## Quick Links

- [Basic Usage](/examples/basic) - Simple CRUD operations and queries
- [Proxy Pool](/examples/proxy-pool) - Managing proxies with filtering and selection
- [Map-like Usage](/examples/map-like) - Using Pool as a Map replacement
- [Iteration & Aggregation](/examples/iteration) - Iterating over pool data
- [Game Service](/examples/game-service) - Complex multi-pool application

## Running Examples

All examples are in the `examples/` directory. Run them with:

```bash
npm run example:basic
npm run example:proxy-pool
npm run example:map-like
npm run example:iteration
npm run example:game-service
```

## What Each Example Covers

### Basic Usage

- Creating pools
- Adding and querying data
- Using selectors
- Pool binding
- Pool of pools pattern

[View Example](/examples/basic)

### Proxy Pool

- CRUD operations with metadata
- Event handling and auto-tracking
- Complex queries with multiple filters
- Pool combination and deduplication
- Transformations (partition, groupBy, sample)
- Weighted selectors

[View Example](/examples/proxy-pool)

### Map-like Usage

- Using Pool as a Map replacement
- get/has/set/delete operations
- Pool of pools with identifiers
- Cache implementation
- Config management
- Events with Map-like operations

[View Example](/examples/map-like)

### Iteration & Aggregation

- forEach, map, filter, reduce over pool data
- some / every checks
- find / findIndex lookups
- Chaining iteration with queries
- Statistics and custom aggregation

[View Example](/examples/iteration)

### Game Service

- Multiple interconnected pools
- Complex matchmaking logic
- Event-driven architecture
- Pool of pools for regional organization
- Weighted server selection
- Statistics and analytics

[View Example](/examples/game-service)
