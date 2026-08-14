# Installation

## Using Bun

```bash
npm install pools
```

## Using npm

```bash
npm install pools
```

## Using pnpm

```bash
pnpm add pools
```

## Using yarn

```bash
yarn add pools
```

## TypeScript

The library is written in TypeScript and includes full type definitions. No additional `@types` packages needed.

Ensure you have TypeScript configured with strict mode:

```json
{
	"compilerOptions": {
		"strict": true,
		"noUncheckedIndexedAccess": true
	}
}
```

## Importing

```typescript
// Import main classes
import { Pool, Binder, Selectors } from 'object-pools';

// Import types
import type { PoolEntry, Filter, Selector } from 'object-pools';
```

## Requirements

-   TypeScript 5.0+
-   Modern JavaScript runtime (Bun, Node.js 18+, Deno)

## Next Steps

-   [Quick Start](/guide/quick-start) - Get started in 5 minutes
-   [API Reference](/api/) - Complete API documentation
