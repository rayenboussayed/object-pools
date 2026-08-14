import type { PoolEntry, PoolMeta } from './types';

/**
 * Reads a field from an entry (data or meta) and converts it to a number.
 * Missing or non-numeric values become `NaN` and sort last.
 * @param entry - The pool entry to read from
 * @param field - Field name in data or meta
 * @returns The numeric value of the field, or `NaN` when missing or non-numeric
 */
function fieldValue<T, M extends PoolMeta>(entry: PoolEntry<T, M>, field: string) {
	const value =
		(entry.data as Record<string, any>)[field] ??
		entry.meta[field];
	return Number(value);
}

/**
 * Built-in selectors for choosing entries from a pool
 */
export const Selectors = {
	/**
	 * Selects a random entry from the pool
	 * @param entries - Pool entries to select from
	 * @returns A random entry, or null when the pool is empty
	 */
	random: <T, M extends PoolMeta = PoolMeta>(entries: PoolEntry<T, M>[]) => {
		if (entries.length === 0) return null;
		const index = Math.floor(Math.random() * entries.length);
		return entries[index] ?? null;
	},

	/**
	 * Selects the first entry
	 * @param entries - Pool entries to select from
	 * @returns The first entry, or null when the pool is empty
	 */
	first: <T, M extends PoolMeta = PoolMeta>(entries: PoolEntry<T, M>[]) => {
		return entries.length > 0 ? (entries[0] ?? null) : null;
	},

	/**
	 * Selects the last entry
	 * @param entries - Pool entries to select from
	 * @returns The last entry, or null when the pool is empty
	 */
	last: <T, M extends PoolMeta = PoolMeta>(entries: PoolEntry<T, M>[]) => {
		return entries.length > 0 ? (entries[entries.length - 1] ?? null) : null;
	},

	/**
	 * Creates a selector that picks the entry with the minimum numeric value for a field
	 * @param field - Numeric field name to compare (can be in data or meta)
	 * @returns A selector function
	 */
		minBy: <T, M extends PoolMeta = PoolMeta>(field: string) => {
			return (entries: PoolEntry<T, M>[]) => {
				if (entries.length === 0) return null;

				let min: PoolEntry<T, M> | null = null;
				let minValue = Infinity;

				for (const entry of entries) {
					const value = fieldValue(entry, field);
					if (Number.isNaN(value)) continue;
					if (value < minValue) {
						minValue = value;
						min = entry;
					}
				}

				return min ?? (entries[0] ?? null);
			};
		},

	/**
	 * Creates a weighted random selector
	 * @param weightFunction - Function that returns weight for an entry
	 * @returns A selector function
	 */
	weighted: <T, M extends PoolMeta = PoolMeta>(weightFunction: (entry: PoolEntry<T, M>) => number) => {
		return (entries: PoolEntry<T, M>[]) => {
			if (entries.length === 0) return null;

			const weights = entries.map((entry) => weightFunction(entry));
			const totalWeight = weights.reduce((sum, w) => sum + w, 0);

			if (totalWeight === 0) {
				// If all weights are 0, select randomly
				return Selectors.random(entries);
			}

			let random = Math.random() * totalWeight;

			for (const [index, entry] of entries.entries()) {
				const weight = weights[index];
				if (weight !== undefined) {
					random -= weight;
					if (random <= 0) {
						return entry ?? null;
					}
				}
			}

			return entries[entries.length - 1] ?? null;
		};
	},
};
