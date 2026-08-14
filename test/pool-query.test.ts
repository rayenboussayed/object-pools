import { describe, test, expect, beforeEach } from 'vitest';
import { Pool } from '../src/pool';
import { Selectors } from '../src/selectors';

interface TestData {
	id: string;
	name: string;
	value: number;
	category: string;
}

describe('Query', () => {
	let pool: Pool<TestData>;

	beforeEach(() => {
		pool = new Pool<TestData>();
		pool.add({ id: '1', name: 'test1', value: 100, category: 'A' }, { priority: 1, active: true });
		pool.add({ id: '2', name: 'test2', value: 200, category: 'B' }, { priority: 2, active: false });
		pool.add({ id: '3', name: 'test3', value: 300, category: 'A' }, { priority: 3, active: true });
		pool.add({ id: '4', name: 'test4', value: 400, category: 'B' }, { priority: 1, active: true });
		pool.add({ id: '5', name: 'test5', value: 150, category: 'A' }, { priority: 2, active: false });
	});

	describe('Filtering', () => {
		test('where() should filter by predicate', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.category === 'A')
				.toArray();

			expect(result).toHaveLength(3);
			expect(result.every((r) => r.category === 'A')).toBe(true);
		});

		test('where() should chain multiple filters', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.category === 'A')
				.where((entry) => entry.meta.active === true)
				.toArray();

			expect(result).toHaveLength(2);
		});

		test('whereOr() should match any of the predicates', () => {
			const result = pool
				.query()
				.whereOr([(entry) => entry.data.id === '1', (entry) => entry.data.id === '5'])
				.toArray();

			expect(result).toHaveLength(2);
			expect(result.some((r) => r.id === '1')).toBe(true);
			expect(result.some((r) => r.id === '5')).toBe(true);
		});

		test('whereOr() should work with where()', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.category === 'A')
				.whereOr([(entry) => entry.data.value > 200, (entry) => entry.data.value < 120])
				.toArray();

			expect(result).toHaveLength(2);
		});
	});

	describe('Sorting', () => {
		test('orderBy() field should sort ascending', () => {
			const result = pool.query().orderBy('value', 'asc').toArray();

			expect(result[0]?.value).toBe(100);
			expect(result[4]?.value).toBe(400);
		});

		test('orderBy() field should sort descending', () => {
			const result = pool.query().orderBy('value', 'desc').toArray();

			expect(result[0]?.value).toBe(400);
			expect(result[4]?.value).toBe(100);
		});

		test('orderBy() function should sort correctly', () => {
			const result = pool
				.query()
				.orderBy((a, b) => b.data.value - a.data.value)
				.toArray();

			expect(result[0]?.value).toBe(400);
			expect(result[4]?.value).toBe(100);
		});

		test('orderByMeta() should sort by metadata field', () => {
			const result = pool.query().orderByMeta('priority', 'asc').toArray();

			expect(result[0]?.id).toBe('1');
			expect(result[result.length - 1]?.id).toBe('3');
		});

		test('orderBy() should chain multiple sorts', () => {
			const result = pool.query().orderBy('category', 'asc').orderBy('value', 'desc').toArray();

			// Category A first, then sorted by value desc
			expect(result[0]?.category).toBe('A');
			expect(result[0]?.value).toBe(300);
		});
	});

	describe('Pagination', () => {
		test('limit() should limit results', () => {
			const result = pool.query().limit(3).toArray();

			expect(result).toHaveLength(3);
		});

		test('offset() should skip results', () => {
			const result = pool.query().offset(2).toArray();

			expect(result).toHaveLength(3);
		});

		test('offset() and limit() should work together', () => {
			const result = pool.query().offset(1).limit(2).toArray();

			expect(result).toHaveLength(2);
			expect(result[0]?.id).toBe('2');
			expect(result[1]?.id).toBe('3');
		});

		test('limit() more than available should return all', () => {
			const result = pool.query().limit(100).toArray();

			expect(result).toHaveLength(5);
		});

		test('offset() beyond available should return empty', () => {
			const result = pool.query().offset(100).toArray();

			expect(result).toHaveLength(0);
		});
	});

	describe('Selection', () => {
		test('select() should return single entry', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.category === 'A')
				.select(Selectors.first);

			expect(result).not.toBeNull();
			expect(result?.category).toBe('A');
		});

		test('select() should return null if no match', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.value > 1000)
				.select(Selectors.first);

			expect(result).toBeNull();
		});

		test('select() should work with all selectors', () => {
			const first = pool.query().select(Selectors.first);
			const last = pool.query().select(Selectors.last);
			const random = pool.query().select(Selectors.random);

			expect(first?.id).toBe('1');
			expect(last?.id).toBe('5');
			expect(random).not.toBeNull();
		});
	});

	describe('Materialization', () => {
		test('toArray() should return array of data', () => {
			const result = pool.query().toArray();

			expect(result).toHaveLength(5);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('name');
		});

		test('toPool() should return new Pool', () => {
			const filtered = pool
				.query()
				.where((entry) => entry.data.category === 'A')
				.toPool();

			expect(filtered.size).toBe(3);
			expect(filtered.all.every((d) => d.category === 'A')).toBe(true);
		});

		test('toPool() should preserve metadata', () => {
			const filtered = pool
				.query()
				.where((entry) => entry.data.id === '1')
				.toPool();

			expect(filtered.allEntries[0]?.meta.priority).toBe(1);
		});

		test('count should return number of entries', () => {
			const count = pool.query().where((entry) => entry.data.category === 'A').count;

			expect(count).toBe(3);
		});
	});

	describe('Complex Queries', () => {
		test('should combine filters, sorting, and pagination', () => {
			const result = pool
				.query()
				.where((entry) => entry.meta.active === true)
				.orderBy('value', 'desc')
				.limit(2)
				.toArray();

			expect(result).toHaveLength(2);
			expect(result[0]?.value).toBe(400);
			expect(result[1]?.value).toBe(300);
		});

		test('should work with all features chained', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.value > 100)
				.whereOr([(entry) => entry.data.category === 'A', (entry) => entry.meta.priority === 1])
				.orderBy('value', 'asc')
				.orderByMeta('priority', 'desc')
				.offset(1)
				.limit(2)
				.toArray();

			expect(result).toHaveLength(2);
		});

		test('should return empty array for impossible conditions', () => {
			const result = pool
				.query()
				.where((entry) => entry.data.value > 1000)
				.where((entry) => entry.data.value < 50)
				.toArray();

			expect(result).toHaveLength(0);
		});
	});

	describe('Events', () => {
		test('beforeSelect event should fire', () => {
			let isFired = false;
			pool.on('beforeSelect', () => {
				isFired = true;
			});

			pool.query().select(Selectors.first);

			expect(isFired).toBe(true);
		});

		test('afterSelect event should fire with result', () => {
			let result: TestData | null = null;
			pool.on('afterSelect', (data: TestData | null) => {
				result = data;
			});

			const selected = pool.query().select(Selectors.first);

			expect(result).not.toBeNull();
			expect(selected).not.toBeNull();
			expect(selected?.id).toBe('1');
		});

		test('afterSelect should fire even if null', () => {
			let isFired = false;
			pool.on('afterSelect', () => {
				isFired = true;
			});

			pool.query()
				.where((entry) => entry.data.value > 1000)
				.select(Selectors.first);

			expect(isFired).toBe(true);
		});
	});
});
