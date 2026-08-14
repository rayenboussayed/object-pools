import { Query } from "./query";
import type {
  MethodArguments,
  MethodReturn,
  PoolEntry,
  PoolMeta,
} from "./types";

/**
 * A source for merging: a pool, a query, or an array of them
 */
type PoolSource<T> = Pool<T> | Query<T> | (Pool<T> | Query<T>)[];

/**
 * Default equality check used by pool comparisons
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns Whether both values are the same reference or deep-equal
 */
function isDefaultEqual(a: unknown, b: unknown) {
  return Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
}
/**
 * Flattens a mix of individual sources and arrays of sources into one list
 * @param sources - Sources to flatten
 * @returns Flattened source list
 */
function flattenSources<T>(sources: PoolSource<T>[]): (Pool<T> | Query<T>)[] {
  const flat: (Pool<T> | Query<T>)[] = [];
  for (const source of sources) {
    if (Array.isArray(source)) flat.push(...source);
    else flat.push(source);
  }
  return flat;
}
/**
 * Main Pool class for managing collections of data
 * @template T - The type of data stored in the pool
 * @template M - The type of metadata stored on entries
 */
export class Pool<T, M extends PoolMeta = PoolMeta> {
  /**
   * Merges multiple pools into one
   * @param pools - Pools to merge
   * @returns New merged pool
   */
  static merge<T>(...pools: Pool<T>[]): Pool<T> {
    const merged = new Pool<T>();
    for (const pool of pools) {
      merged.merge(pool);
    }
    return merged;
  }

  /**
   * Merges multiple pools/queries with uniqueness constraint
   * @param sources - Pools or queries to merge
   * @param uniqueBy - Field or function to determine uniqueness
   * @returns New merged pool
   */
  static mergeUnique<T>(
    sources: (Pool<T> | Query<T>)[],
    uniqueBy: keyof T | ((item: T) => any),
  ): Pool<T> {
    const merged = new Pool<T>();
    for (const source of sources) merged.mergeUnique(uniqueBy, source);
    return merged;
  }

  /**
   * Merges multiple pools/queries with uniqueness and custom duplicate resolution
   * @param sources - Pools or queries to merge
   * @param uniqueBy - Field or function to determine uniqueness
   * @param resolveDuplicate - Function to resolve duplicates
   * @returns New merged pool
   */
  static mergeUniqueWith<T>(
    sources: (Pool<T> | Query<T>)[],
    uniqueBy: keyof T | ((item: T) => any),
    resolveDuplicate: (
      existing: PoolEntry<T>,
      duplicate: PoolEntry<T>,
    ) => PoolEntry<T>,
  ): Pool<T> {
    const getKey =
      typeof uniqueBy === "function" ? uniqueBy : (item: T) => item[uniqueBy];

    const entries = this.collectEntries(sources);

    const map = new Map<any, PoolEntry<T>>();

    for (const entry of entries) {
      const key = getKey(entry.data);
      if (map.has(key)) {
        const existing = map.get(key)!;
        map.set(key, resolveDuplicate(existing, entry));
      } else {
        map.set(key, entry);
      }
    }

    const merged = new Pool<T>();
    merged.entries = [...map.values()];
    return merged;
  }

  private static collectEntries<T>(
    sources: (Pool<T> | Query<T>)[],
  ) {
    const entries: PoolEntry<T>[] = [];
    for (const source of sources) {
      if (source instanceof this) {
        entries.push(...source.entries);
      } else {
        for (const data of source) {
          entries.push({ data, meta: {} });
        }
      }
    }
    return entries;
  }

  /**
   * Intersects two pools
   * @param pool1 - First pool
   * @param pool2 - Second pool
   * @param isEqual - Optional comparison function
   * @returns New pool with intersection
   */
  static intersect<T>(
    pool1: Pool<T>,
    pool2: Pool<T>,
    isEqual?: (a: T, b: T) => boolean,
  ): Pool<T> {
    const result = pool1.clone();
    result.intersect(pool2, isEqual);
    return result;
  }

  /**
   * Groups entries from multiple sources
   * @param sources - Pools or queries to group
   * @param groupBy - Field or function to group by
   * @returns Map of group keys to pools
   */
  static groupBy<T, K extends keyof T>(
    sources: (Pool<T> | Query<T>)[],
    groupBy: K,
  ): Map<T[K], Pool<T>>;
  static groupBy<T, K extends PropertyKey>(
    sources: (Pool<T> | Query<T>)[],
    groupBy: (item: T) => K,
  ): Map<K, Pool<T>>;
  static groupBy<T>(
    sources: (Pool<T> | Query<T>)[],
    groupBy: keyof T | ((item: T) => PropertyKey),
  ): Map<any, Pool<T>> {
    const merged = new Pool<T>();
    for (const source of sources) merged.merge(source);
    const getKey =
      typeof groupBy === "function" ? groupBy : (item: T) => item[groupBy];
    return merged.groupBy(getKey as (item: T) => PropertyKey);
  }

  /**
   * Creates a Pool from a Query
   * @param query - Query to convert to pool
   * @returns New pool with query results
   */
  static fromQuery<T>(query: Query<T>): Pool<T> {
    const pool = new Pool<T>();
    const entries = query.materialize();
    for (const entry of entries) {
      pool.add(entry.data, entry.meta);
    }
    return pool;
  }

  private entries: PoolEntry<T, M>[] = [];
  // Handlers may declare their own argument types; emit passes arbitrary
  // values, so the stored signature is intentionally loose.
  private eventHandlers: Map<string, Function[]> = new Map();

  /**
   * Pushes an entry typed with the default metadata, adapting it to this
   * pool's metadata type. Only meta shapes are unsafe here: the data type
   * is already enforced by the merge signatures.
   * @param entry - Entry to absorb into this pool
   */
  private absorb(entry: PoolEntry<T>) {
    this.entries.push(entry as PoolEntry<T, M>);
  }

  /**
   * Absorbs entries from a single source while enforcing uniqueness
   * @param source - Source pool or query
   * @param getKey - Function that extracts the uniqueness key
   * @param existingKeys - Set of keys already present in this pool
   */
  private absorbUniqueFrom(
    source: Pool<T> | Query<T>,
    getKey: (item: T) => any,
    existingKeys: Set<any>,
  ) {
    if (source instanceof Pool) {
      for (const entry of source.entries) {
        const key = getKey(entry.data);
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          this.absorb(entry);
        }
      }
    } else {
      for (const item of source) {
        const key = getKey(item);
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          this.add(item);
        }
      }
    }
  }

  /**
   * Emits an event
   * @param event - Event name
   * @param payload - Event arguments
   */
  private emit(event: string, ...payload: any[]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...payload);
      }
    }
  }

  /**
   * Adds an entry to the pool
   * @param data - The data to add
   * @param meta - Optional metadata
   * @returns The created pool entry
   */
  add(data: T, meta: M = {} as M) {
    const entry: PoolEntry<T, M> = { data, meta };
    this.entries.push(entry);
    this.emit("add", entry);
    return entry;
  }

  /**
   * Gets an entry from the pool by a predicate or field value
   * @param keyOrPredicate - Field name and value, or predicate function
   * @param value - Value to match (if keyOrPredicate is a field name)
   * @returns The matching data or null
   * @example
   * pool.get('id', 'user123')
   * pool.get(e => e.data.username === 'John')
   */
  get(
    keyOrPredicate: keyof T | ((entry: PoolEntry<T>) => boolean),
    value?: any,
  ) {
    const entry =
      typeof keyOrPredicate === "function"
        ? this.entries.find((candidate) => keyOrPredicate(candidate))
        : this.entries.find(
            (candidate) => candidate.data[keyOrPredicate] === value,
          );

    if (entry) {
      this.emit("get", entry);
      return entry.data;
    }

    return null;
  }

  /**
   * Checks if an entry exists in the pool
   * @param keyOrPredicate - Field name and value, or predicate function
   * @param value - Value to match (if keyOrPredicate is a field name)
   * @returns True if entry exists
   * @example
   * pool.has('id', 'user123')
   * pool.has(e => e.data.username === 'John')
   */
  has(
    keyOrPredicate: keyof T | ((entry: PoolEntry<T>) => boolean),
    value?: any,
  ) {
    return typeof keyOrPredicate === "function"
      ? this.entries.some((entry) => keyOrPredicate(entry))
      : this.entries.some((entry) => entry.data[keyOrPredicate] === value);
  }

  /**
   * Sets (updates or adds) an entry in the pool
   * @param key - Field name to use as key
   * @param value - Value to match for the key
   * @param data - New data to set
   * @param meta - Optional metadata
   * @returns The created or updated pool entry
   * @example
   * pool.set('id', 'user123', { id: 'user123', name: 'John' })
   */
  set(key: keyof T, value: any, data: T, meta: M = {} as M) {
    const existingEntry = this.entries.find(
      (entry) => entry.data[key] === value,
    );

    if (existingEntry) {
      existingEntry.data = data;
      existingEntry.meta = { ...existingEntry.meta, ...meta };
      this.emit("set", existingEntry);
      return existingEntry;
    }
    return this.add(data, meta);
  }

  /**
   * Deletes an entry from the pool
   * @param key - Field name to use as key
   * @param value - Value to match for the key
   * @returns True if entry was deleted
   * @example
   * pool.delete('id', 'user123')
   */
  delete(key: keyof T, value: any) {
    const index = this.entries.findIndex((entry) => entry.data[key] === value);

    if (index !== -1) {
      const entry = this.entries[index];
      if (entry) {
        this.entries.splice(index, 1);
        this.emit("remove", entry);
        return true;
      }
    }

    return false;
  }

  /**
   * Adds multiple entries to the pool at once
   * @param items - Array of items with data and optional meta
   * @returns Array of created pool entries
   */
  addBatch(items: { data: T; meta?: M }[]): PoolEntry<T, M>[] {
    const entries = items.map((item) => ({
      data: item.data,
      meta: item.meta ?? ({} as M),
    }));
    this.entries.push(...entries);
    this.emit("batchAdd", entries);
    return entries;
  }

  /**
   * Removes entries matching the predicate
   * @param shouldRemove - Function that returns true for data to remove
   * @returns Array of removed entries
   */
  remove(shouldRemove: (data: T) => boolean) {
    const removed: PoolEntry<T, M>[] = [];
    this.entries = this.entries.filter((entry) => {
      if (shouldRemove(entry.data)) {
        removed.push(entry);
        this.emit("remove", entry);
        return false;
      }
      return true;
    });
    return removed;
  }

  /**
   * Removes entries matching any of the predicates
   * @param predicates - Array of predicate functions
   * @returns Array of removed entries
   */
  removeBatch(predicates: ((data: T) => boolean)[]) {
    const removed: PoolEntry<T, M>[] = [];
    this.entries = this.entries.filter((entry) => {
      if (predicates.some((predicate) => predicate(entry.data))) {
        removed.push(entry);
        return false;
      }
      return true;
    });
    if (removed.length > 0) {
      this.emit("batchRemove", removed);
    }
    return removed;
  }

  /**
   * Creates a query builder for filtering and selecting entries
   * @returns A new Query instance
   */
  query() {
    const query = new Query(this.entries);

    // Wrap select to emit events
    query.wrap("select", (original, selector) => {
      this.emit("beforeSelect", query.materialize());

      const selected = original(selector);

      this.emit("afterSelect", selected);
      if (selected !== null) {
        const entry = this.entries.find((entry_) => entry_.data === selected);
        if (entry) {
          this.emit("get", entry);
        }
      }

      return selected;
    });

    return query;
  }

  /**
   * Merges one or more pools or queries into this pool
   * @param sources - Pools or queries to merge from (as individual arguments or arrays)
   * @returns This pool for chaining
   * @example
   * pool.merge(pool1, pool2, pool3)
   * pool.merge([pool1, pool2])
   * pool.merge(pool1, [pool2, pool3])
   */
  merge(...sources: PoolSource<T>[]): this {
    const flatSources = flattenSources(sources);

    for (const source of flatSources) {
      if (source instanceof Pool) {
        for (const entry of source.entries) {
          this.absorb(entry);
        }
      } else {
        // Query - convert to entries
        const data = source.toArray();
        for (const item of data) {
          this.add(item);
        }
      }
    }

    return this;
  }

  /**
   * Merges one or more pools or queries ensuring uniqueness by a field or function
   * @param uniqueBy - Field name or function to determine uniqueness
   * @param sources - Pools or queries to merge from (as individual arguments or arrays)
   * @returns This pool for chaining
   * @example
   * pool.mergeUnique('id', pool1, pool2)
   * pool.mergeUnique('id', [pool1, pool2])
   * pool.mergeUnique(x => x.id, pool1, pool2)
   */
  mergeUnique(
    uniqueBy: keyof T | ((item: T) => any),
    ...sources: PoolSource<T>[]
  ): this {
    const getKey =
      typeof uniqueBy === "function" ? uniqueBy : (item: T) => item[uniqueBy];
    const existingKeys = new Set(
      this.entries.map((entry) => getKey(entry.data)),
    );

    for (const source of flattenSources(sources)) {
      this.absorbUniqueFrom(source, getKey, existingKeys);
    }

    return this;
  }

  /**
   * Union with another pool (no duplicates based on compareFn)
   * @param other - Pool to union with
   * @param isEqual - Optional comparison function
   * @returns This pool for chaining
   */
  union(other: Pool<T>, isEqual?: (a: T, b: T) => boolean): this {
    const compare = isEqual ?? isDefaultEqual;

    for (const otherEntry of other.entries) {
      const exists = this.entries.some((entry) =>
        compare(entry.data, otherEntry.data),
      );
      if (!exists) {
        this.absorb(otherEntry);
      }
    }

    return this;
  }

  /**
   * Intersect with another pool (keep only common elements)
   * @param other - Pool to intersect with
   * @param isEqual - Optional comparison function
   * @returns This pool for chaining
   */
  intersect(other: Pool<T>, isEqual?: (a: T, b: T) => boolean): this {
    const compare = isEqual ?? isDefaultEqual;

    this.entries = this.entries.filter((entry) =>
      other.entries.some((otherEntry) => compare(entry.data, otherEntry.data)),
    );

    return this;
  }

  /**
   * Difference with another pool (remove elements that exist in other)
   * @param other - Pool to diff with
   * @param isEqual - Optional comparison function
   * @returns This pool for chaining
   */
  difference(other: Pool<T>, isEqual?: (a: T, b: T) => boolean): this {
    const compare = isEqual ?? isDefaultEqual;

    this.entries = this.entries.filter((entry) =>
      other.entries.every(
        (otherEntry) => !compare(entry.data, otherEntry.data),
      ),
    );

    return this;
  }

  /**
   * Removes duplicate entries based on uniqueBy
   * @param uniqueBy - Field name or function to determine uniqueness
   * @returns This pool for chaining
   */
  deduplicate(uniqueBy: keyof T | ((item: T) => any)): this {
    const getKey =
      typeof uniqueBy === "function" ? uniqueBy : (item: T) => item[uniqueBy];

    const seen = new Set<any>();
    this.entries = this.entries.filter((entry) => {
      const key = getKey(entry.data);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return this;
  }

  /**
   * Clones the pool
   * @returns A new pool with the same entries
   */
  clone() {
    const newPool = new Pool<T, M>();
    newPool.entries = this.entries.map((entry) => ({
      data: entry.data,
      meta: { ...entry.meta },
    }));
    return newPool;
  }

  /**
   * Partitions the pool into two pools based on predicate
   * @param shouldKeep - Function to determine partition
   * @returns Tuple of two pools [matching, notMatching]
   */
  partition(shouldKeep: (entry: PoolEntry<T>) => boolean): [Pool<T>, Pool<T>] {
    const matching = new Pool<T>();
    const notMatching = new Pool<T>();

    for (const entry of this.entries) {
      if (shouldKeep(entry)) {
        matching.entries.push(entry);
      } else {
        notMatching.entries.push(entry);
      }
    }

    return [matching, notMatching];
  }

  /**
   * Returns a random sample of entries
   * @param count - Number of entries to sample
   * @returns A new pool with sampled entries
   */
  sample(count: number): Pool<T> {
    const newPool = new Pool<T>();
    if (count <= 0 || this.entries.length === 0) return newPool;

    const poolSize = this.entries.length;
    const sampleSize = Math.min(count, poolSize);
    const indices = new Set<number>();
    while (indices.size < sampleSize) {
      indices.add(Math.floor(Math.random() * poolSize));
    }

    const sortedIndices = [...indices].sort((a, b) => a - b);
    for (const index of sortedIndices) {
      const entry = this.entries[index];
      if (entry) newPool.entries.push(entry);
    }
    return newPool;
  }

  /**
   * Shuffles the pool in place
   * @returns This pool for chaining
   */
  shuffle(): this {
    for (let index = this.entries.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const current = this.entries[index];
      const random = this.entries[randomIndex];
      if (current && random) {
        this.entries[index] = random;
        this.entries[randomIndex] = current;
      }
    }
    return this;
  }

  /**
   * Groups entries by a field or function
   * @param groupBy - Field name or function to group by
   * @returns Map of group keys to pools
   */
  groupBy<K extends keyof T>(groupBy: K): Map<T[K], Pool<T>>;
  groupBy<K extends PropertyKey>(groupBy: (item: T) => K): Map<K, Pool<T>>;
  groupBy(groupBy: keyof T | ((item: T) => PropertyKey)): Map<any, Pool<T>> {
    const getKey =
      typeof groupBy === "function" ? groupBy : (item: T) => item[groupBy];

    const groups = new Map<any, Pool<T>>();

    for (const entry of this.entries) {
      const key = getKey(entry.data);
      if (!groups.has(key)) {
        groups.set(key, new Pool<T>());
      }
      groups.get(key)!.entries.push(entry);
    }

    return groups;
  }

  /**
   * Registers an event handler
   * @param event - Event name
   * @param handler - Handler function
   */
  on<E extends any[]>(
    event: string,
    handler: (...arguments_: E) => void,
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Unregisters an event handler
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  off<E extends any[]>(
    event: string,
    handler: (...arguments_: E) => void,
  ) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Wraps a method with custom behavior
   * @param method - Method name to wrap
   * @param wrapper - Wrapper function
   */
  wrap<K extends keyof this>(
    method: K,
    wrapper: (
      original: this[K],
      ...arguments_: MethodArguments<this, K>
    ) => MethodReturn<this, K>,
  ): void {
    const original = (this[method] as (...arguments_: never[]) => any).bind(
      this,
    );
    Object.assign(this, {
      [method]: (...arguments_: MethodArguments<this, K>) =>
        wrapper(original as this[K], ...arguments_),
    });
  }

  /**
   * Gets the number of entries in the pool
   * @returns The number of entries in the pool
   */
  get size() {
    return this.entries.length;
  }

  /**
   * Gets all data objects from the pool
   * @returns All data objects in the pool
   */
  get all() {
    return this.entries.map((entry) => entry.data);
  }

  /**
   * Gets all pool entries
   * @returns A live reference to the internal entries array
   */
  get allEntries() {
    return this.entries;
  }

  /**
   * Executes a function for each entry in the pool
   * @param callback - Function to execute for each entry
   * @example
   * pool.forEach(entry => console.log(entry.data))
   */
  forEach(callback: (entry: PoolEntry<T>, index: number) => void) {
    for (const [index, entry] of this.entries.entries()) {
      callback(entry, index);
    }
  }

  /**
   * Maps each entry to a new value
   * @param callback - Function to map each entry
   * @returns Array of mapped values
   * @example
   * const ips = pool.map(entry => entry.data.ip)
   */
  map<U>(callback: (entry: PoolEntry<T>, index: number) => U) {
    return this.entries.map((entry, index) => callback(entry, index));
  }

  /**
   * Filters entries and returns matching entries (not data)
   * @param isMatch - Filter function
   * @returns Array of matching entries
   * @example
   * const active = pool.filter(entry => entry.meta.active)
   */
  filter(
    isMatch: (entry: PoolEntry<T>, index: number) => boolean,
  ): PoolEntry<T>[] {
    return this.entries.filter((entry, index) => isMatch(entry, index));
  }

  /**
   * Reduces the pool to a single value
   * @param callback - Reducer function
   * @param initialValue - Initial value for reduction
   * @returns Reduced value
   * @example
   * const totalSpeed = pool.reduce((sum, entry) => sum + entry.data.speed, 0)
   */
  reduce<U>(
    callback: (accumulator: U, entry: PoolEntry<T>, index: number) => U,
    initialValue: U,
  ) {
    let accumulator = initialValue;
    for (const [index, entry] of this.entries.entries()) {
      accumulator = callback(accumulator, entry, index);
    }
    return accumulator;
  }

  /**
   * Checks if any entry matches the predicate
   * @param isMatch - Predicate function
   * @returns True if any entry matches
   * @example
   * const hasActive = pool.some(entry => entry.meta.active)
   */
  some(isMatch: (entry: PoolEntry<T>, index: number) => boolean) {
    return this.entries.some((entry, index) => isMatch(entry, index));
  }

  /**
   * Checks if all entries match the predicate
   * @param isMatch - Predicate function
   * @returns True if all entries match
   * @example
   * const allActive = pool.every(entry => entry.meta.active)
   */
  every(isMatch: (entry: PoolEntry<T>, index: number) => boolean) {
    return this.entries.every((entry, index) => isMatch(entry, index));
  }

  /**
   * Finds the first entry matching the predicate
   * @param isMatch - Predicate function
   * @returns The first matching entry or undefined
   * @example
   * const firstActive = pool.find(entry => entry.meta.active)
   */
  find(
    isMatch: (entry: PoolEntry<T>, index: number) => boolean,
  ): PoolEntry<T> | undefined {
    return this.entries.find((entry, index) => isMatch(entry, index));
  }

  /**
   * Finds the index of the first entry matching the predicate
   * @param isMatch - Predicate function
   * @returns The index of the first matching entry or -1
   * @example
   * const index = pool.findIndex(entry => entry.data.id === 'user123')
   */
  findIndex(
    isMatch: (entry: PoolEntry<T>, index: number) => boolean,
  ) {
    return this.entries.findIndex((entry, index) => isMatch(entry, index));
  }
}
