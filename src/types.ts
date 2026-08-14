/**
 * Metadata attached to a pool entry (usage counters, state flags, ...).
 *
 * Values are arbitrary user-supplied data and cannot be statically typed.
 * Widening to `unknown` would break common patterns like
 * `entry.meta.usedCount++`, so this is intentionally left untyped.
 */
export type PoolMeta = Record<string, any>;

/**
 * Represents an entry in a Pool
 * @template T - The type of data stored in the entry
 * @template M - The type of metadata stored on the entry
 */
export type PoolEntry<T, M extends PoolMeta = PoolMeta> = {
	data: T; // User data
	meta: M; // Metadata for tracking usage, state, etc.
};

/**
 * Filter function for pool entries
 * @template T - The type of data in the pool
 * @template M - The type of metadata on the entry
 * @param entry - The pool entry to filter
 * @returns true if the entry should be included
 */
export type Filter<T, M extends PoolMeta = PoolMeta> = (entry: PoolEntry<T, M>) => boolean;

/**
 * Selector function for choosing an entry from a filtered set
 * @template T - The type of data in the pool
 * @template M - The type of metadata on the entry
 * @param entries - The entries to select from
 * @returns The selected entry or null if no entry matches
 */
export type Selector<T, M extends PoolMeta = PoolMeta> = (
	entries: PoolEntry<T, M>[],
) => PoolEntry<T, M> | null;

/**
 * Argument tuple of the function at `T[K]` (or `never` if `T[K]` is not a function)
 * @template T - Type to inspect
 * @template K - Key of T
 */
export type MethodArguments<T, K extends keyof T> = T[K] extends (...arguments_: infer A) => any ? A : never;

/**
 * Return type of the function at `T[K]` (or `never` if `T[K]` is not a function)
 * @template T - Type to inspect
 * @template K - Key of T
 */
export type MethodReturn<T, K extends keyof T> = T[K] extends (...arguments_: never[]) => infer R ? R : never;
