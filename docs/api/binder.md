# Binder

Bind multiple pools together for complex resource allocation.

::: tip Use Case
Binder is perfect when you need to select items from multiple pools at once, like combining a proxy, account, and server for a task.
:::

## Constructor

`Binder<TMap>` is generic over a type map that links each bound name to the type of its pool's data:

```typescript
interface Proxy { ip: string; country: string; }
interface Account { username: string; service: string; }

const binder = new Binder<{ proxy: Proxy; account: Account }>();
```

Every name passed to `bind()`, `where()`, and `selectWith()` is checked against `TMap`, and `execute()` returns a fully typed result.

## Methods

### bind()

Binds a pool with a name. The pool can carry any metadata type; only its data type must match `TMap[name]`.

```text
binder.bind<K extends keyof TMap & string>(name: K, pool: Pool<TMap[K]>): this
```

**Example:**
```typescript
const binder = new Binder<{ proxy: Proxy; account: Account; service: Service }>()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .bind('service', services);
```

### where()

Adds a filter for a specific pool.

```text
binder.where<K extends keyof TMap & string>(poolName: K, filter: Filter<TMap[K]>): this
```

**Example:**
```typescript
binder
  .where('proxy', ({ data }) => data.country === 'US')
  .where('account', ({ data }) => data.service === 'twitter');
```

### selectWith()

Sets the selector for a specific pool.

```text
binder.selectWith<K extends keyof TMap & string>(poolName: K, selector: Selector<TMap[K]>): this
```

**Example:**
```typescript
import { Selectors } from 'object-pools';

binder
  .selectWith('proxy', Selectors.minBy('usedCount'))
  .selectWith('account', Selectors.random);
```

### execute()

Executes the binding and returns the selected item from each pool.

```text
binder.execute(): BinderResult<TMap> | null
```

`BinderResult<TMap>` maps every bound name to its data type:

```typescript
type BinderResult<TMap extends Record<string, any>> = {
  [K in keyof TMap]: TMap[K];
};
```

Returns `null` if any pool has no matching entries.

**Example:**
```typescript
const result = binder.execute();

if (result) {
  console.log(result.proxy);  // Proxy
  console.log(result.account); // Account
  console.log(result.service); // Service
}
```

## Complete Example

```typescript
import { Pool, Binder, Selectors } from 'object-pools';

interface Proxy { ip: string; country: string; speed: number; }
interface Account { username: string; service: string; }
interface Service { name: string; url: string; }

// Create pools
const proxies = new Pool<Proxy>();
const accounts = new Pool<Account>();
const services = new Pool<Service>();

// Add data
proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });
accounts.add({ username: 'user1', service: 'twitter' });
services.add({ name: 'API', url: 'https://api.twitter.com' });

// Bind pools together
const combo = new Binder<{ proxy: Proxy; account: Account; service: Service }>()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .bind('service', services)
  // Filter each pool
  .where('proxy', ({ data }) => data.country === 'US')
  .where('account', ({ data }) => data.service === 'twitter')
  .where('service', ({ data }) => data.name === 'API')
  // Select from each pool
  .selectWith('proxy', Selectors.minBy('usedCount'))
  .selectWith('account', Selectors.random)
  .selectWith('service', Selectors.first)
  // Execute
  .execute();

if (combo) {
  // Use all resources together
  await doTask(combo.proxy, combo.account, combo.service);
}
```

## Use Cases

### Resource Allocation

Allocate multiple resources for a task:

```typescript
const resources = new Binder<{ proxy: Proxy; account: Account }>()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .where('proxy', ({ meta }) => meta.usedCount < 10)
  .where('account', entry => !entry.meta.banned)
  .selectWith('proxy', Selectors.minBy('usedCount'))
  .selectWith('account', Selectors.weighted(entry => 1 / (entry.meta.failCount + 1)))
  .execute();
```

### Server + Session Selection

Select a server and session together:

```typescript
const combo = new Binder<{ server: Server; session: Session }>()
  .bind('server', servers)
  .bind('session', sessions)
  .where('server', ({ data }) => data.region === 'EU')
  .where('session', entry => !entry.meta.expired)
  .selectWith('server', Selectors.minBy('load'))
  .selectWith('session', Selectors.random)
  .execute();
```

### Multi-Pool Filtering

```typescript
// Find matching proxy and account from different providers
const result = new Binder<{ proxy: Proxy; account: Account }>()
  .bind('proxy', proxies)
  .bind('account', accounts)
  .where('proxy', ({ data }) => data.provider === 'ProviderA')
  .where('account', ({ data }) => data.provider === 'ProviderB')
  .execute();
```