import { Pool } from './pool';
import type { Filter, PoolMeta, Selector } from './types';
import { Selectors } from './selectors';

/**
 * Result of executing a Binder: the selected item for each bound pool.
 * `TMap` maps the name of each bound pool to the type of its data.
 *
 * When `execute()` returns a non-null result, every bound pool produced a
 * selection, so every bound name is present and non-null.
 * @template TMap - Maps the name of each bound pool to the type of its data
 */
type BinderResult<TMap extends Record<string, any>> = {
	[K in keyof TMap]: TMap[K];
};

/**
 * Binder allows binding multiple pools together and selecting from them
 * @template TMap - Maps the name of each bound pool to the type of its data
 */
export class Binder<TMap extends Record<string, any> = Record<string, any>> {
	private pools: Map<keyof TMap & string, Pool<any, any>> = new Map();
	private filters: Map<keyof TMap & string, Filter<any, any>[]> = new Map();
	private selectors: Map<keyof TMap & string, Selector<any, any>> = new Map();

	/**
	 * Binds a pool with a name
	 * @param name - Name to reference this pool
	 * @param pool - The pool to bind
	 * @returns This binder for chaining
	 */
	bind<K extends keyof TMap & string, M extends PoolMeta = PoolMeta>(
		name: K,
		pool: Pool<TMap[K], M>,
	): this {
		this.pools.set(name, pool);
		return this;
	}

	/**
	 * Adds a filter for a specific pool
	 * @param poolName - Name of the pool to filter
	 * @param filter - Filter function
	 * @returns This binder for chaining
	 */
	where<K extends keyof TMap & string>(poolName: K, filter: Filter<TMap[K]>): this {
		this.filters.set(poolName, [...(this.filters.get(poolName) ?? []), filter]);
		return this;
	}

	/**
	 * Sets the selector for a specific pool
	 * @param poolName - Name of the pool
	 * @param selector - Selector function
	 * @returns This binder for chaining
	 */
	selectWith<K extends keyof TMap & string>(poolName: K, selector: Selector<TMap[K]>): this {
		this.selectors.set(poolName, selector);
		return this;
	}

	/**
	 * Executes the binding and returns selected items from all pools
	 * @returns Object with selected items or null if any selection fails
	 */
	execute() {
		const result = {} as BinderResult<TMap>;

		for (const [name, pool] of this.pools) {
			// Build query with filters
			let query = pool.query();

			const poolFilters = this.filters.get(name) ?? [];
			for (const filter of poolFilters) {
				query = query.where(filter);
			}

			// Select using selector or default to first
			const selector = this.selectors.get(name) ?? Selectors.first;
			const selected = query.select(selector);

			if (selected === null) {
				return null;
			}

			result[name] = selected;
		}

		return result;
	}
}