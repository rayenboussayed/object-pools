import type { MethodArguments, MethodReturn, PoolEntry, PoolMeta, Filter, Selector } from './types';
import { Pool } from './pool';

const compareValues = (a: any, b: any) => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

/**
 * Query builder for filtering and selecting pool entries
 * @template T - The type of data in the pool
 * @template M - The type of metadata on entries
 */
export class Query<T, M extends PoolMeta = PoolMeta> {
	private entries: PoolEntry<T, M>[];
	private filters: Filter<T, M>[] = [];
	private sorters: Array<(a: PoolEntry<T, M>, b: PoolEntry<T, M>) => number> = [];
	private offsetCount: number = 0;
	private limitCount: number = Infinity;

	constructor(entries: PoolEntry<T, M>[]) {
		this.entries = entries;
	}

	/**
	 * Applies all registered filters to the entries
	 * @returns Filtered entries
	 */
	private applyFilters() {
		let result = this.entries;
		for (const filter of this.filters) {
			result = result.filter((entry) => filter(entry));
		}
		return result;
	}

	/**
	 * Filters pool entries based on predicate
	 * @param filter - Function that returns true for entries to keep
	 * @returns This query instance for chaining
	 * @example
	 * pool.query()
	 *   .where(e => e.data.country === 'US')
	 *   .where(e => e.meta.active === true)
	 */
	where(filter: Filter<T, M>): this {
		this.filters.push(filter);
		return this;
	}

	/**
	 * Filters pool entries using OR logic across multiple filters
	 * @param filters - Array of filter functions
	 * @returns This query instance for chaining
	 * @example
	 * pool.query()
	 *   .whereOr([
	 *     e => e.data.provider === 'ProviderA',
	 *     e => e.data.provider === 'ProviderB'
	 *   ])
	 */
	whereOr(filters: Filter<T, M>[]): this {
		this.filters.push((entry) => filters.some((f) => f(entry)));
		return this;
	}

	/**
	 * Sorts entries using custom comparator or by field
	 * @param functionOrField - Comparator function or field name
	 * @param order - Sort order ('asc' or 'desc')
	 * @returns This query instance for chaining
	 */
	orderBy(
		functionOrField: ((a: PoolEntry<T, M>, b: PoolEntry<T, M>) => number) | keyof T,
		order: 'asc' | 'desc' = 'asc',
	): this {
		if (typeof functionOrField === 'function') {
			this.sorters.push(functionOrField);
		} else {
			const field = functionOrField;
			this.sorters.push((a, b) => {
				const aValue = a.data[field];
				const bValue = b.data[field];
				const comparison = compareValues(aValue, bValue);
				return order === 'asc' ? comparison : -comparison;
			});
		}
		return this;
	}

	/**
	 * Sorts entries by metadata field
	 * @param field - Metadata field name
	 * @param order - Sort order ('asc' or 'desc')
	 * @returns This query instance for chaining
	 */
	orderByMeta(field: keyof M, order: 'asc' | 'desc' = 'asc'): this {
		this.sorters.push((a, b) => {
			const aValue = a.meta[field];
			const bValue = b.meta[field];
			const comparison = compareValues(aValue, bValue);
			return order === 'asc' ? comparison : -comparison;
		});
		return this;
	}

	/**
	 * Skips the first N entries
	 * @param count - Number of entries to skip
	 * @returns This query instance for chaining
	 */
	offset(count: number): this {
		this.offsetCount = count;
		return this;
	}

	/**
	 * Takes only the first N entries after filtering and sorting
	 * @param count - Number of entries to take
	 * @returns This query instance for chaining
	 */
	limit(count: number): this {
		this.limitCount = count;
		return this;
	}

	/**
	 * Materializes the query by applying all filters, sorts, and pagination
	 * @returns Array of filtered and sorted entries
	 */
	materialize() {
		let result = this.applyFilters();

		// Apply all sorters
		if (this.sorters.length > 0) {
			result = [...result].sort((a, b) => {
				for (const sorter of this.sorters) {
					const comparison = sorter(a, b);
					if (comparison !== 0) return comparison;
				}
				return 0;
			});
		}

		// Apply pagination
		if (this.offsetCount > 0 || this.limitCount !== Infinity) {
			result = result.slice(this.offsetCount, this.offsetCount + this.limitCount);
		}

		return result;
	}

	/**
	 * Selects a single entry using the provided selector
	 * @param selector - Selector function to choose an entry
	 * @returns The selected data or null
	 */
	select(selector: Selector<T, M>) {
		const materialized = this.materialize();
		const selected = selector(materialized);
		return selected ? selected.data : null;
	}

	/**
	 * Returns all filtered and sorted entries as an array of data
	 * @returns Array of data objects
	 */
	toArray() {
		return this.materialize().map((entry) => entry.data);
	}

	/**
	 * Allows iterating over the query's data with for...of
	 * Applies all filters, sorting, and pagination (offset/limit) before iterating
	 * @returns An iterator over the query's data objects
	 * @example
	 * for (const item of pool.query().where(e => e.meta.active)) {
	 *   console.log(item);
	 * }
	 */
	[Symbol.iterator](): IterableIterator<T> {
		return this.toArray()[Symbol.iterator]();
	}

	/**
	 * Converts the query to a Pool
	 * @returns New pool with query results
	 */
	toPool(): Pool<T> {
		const pool = new Pool<T>();
		const entries = this.materialize();
		for (const entry of entries) {
			pool.add(entry.data, entry.meta);
		}
		return pool;
	}

	/**
	 * Gets the count of entries after filtering
	 * @returns Number of entries
	 */
	get count() {
		return this.applyFilters().length;
	}

	/**
	 * Wraps a method with custom behavior
	 * @param method - Method name to wrap
	 * @param wrapper - Wrapper function
	 */
	wrap<K extends keyof this>(method: K, wrapper: (original: this[K], ...arguments_: MethodArguments<this, K>) => MethodReturn<this, K>): void {
		const original = (this[method] as (...arguments_: never[]) => any).bind(this);
		Object.assign(this, { [method]: (...arguments_: MethodArguments<this, K>) => wrapper(original as this[K], ...arguments_) });
	}
}
