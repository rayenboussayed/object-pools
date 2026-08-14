import { describe, test, expect, beforeEach } from 'vitest';
import { Pool } from '../src/pool';
import { Binder } from '../src/binder';
import { Selectors } from '../src/selectors';
import type { PoolEntry } from '../src/types';

interface Proxy {
	ip: string;
	country: string;
	speed: number;
}

interface Account {
	username: string;
	service: string;
}

interface Server {
	name: string;
	region: string;
}

describe('Binder', () => {
	let proxies: Pool<Proxy>;
	let accounts: Pool<Account>;
	let servers: Pool<Server>;

	beforeEach(() => {
		proxies = new Pool<Proxy>();
		proxies.add({ ip: '1.1.1.1', country: 'US', speed: 100 }, { usedCount: 0 });
		proxies.add({ ip: '2.2.2.2', country: 'UK', speed: 200 }, { usedCount: 5 });
		proxies.add({ ip: '3.3.3.3', country: 'US', speed: 150 }, { usedCount: 2 });

		accounts = new Pool<Account>();
		accounts.add({ username: 'user1', service: 'twitter' });
		accounts.add({ username: 'user2', service: 'facebook' });
		accounts.add({ username: 'user3', service: 'twitter' });

		servers = new Pool<Server>();
		servers.add({ name: 'server1', region: 'US' });
		servers.add({ name: 'server2', region: 'EU' });
		servers.add({ name: 'server3', region: 'US' });
	});

	describe('Binding Pools', () => {
		test('bind() should add pool to binder', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>().bind('proxy', proxies);

			const result = binder.execute();

			expect(result).not.toBeNull();
			expect(result).toHaveProperty('proxy');
		});

		test('bind() should chain multiple pools', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>().bind('proxy', proxies).bind('account', accounts).bind('server', servers);

			const result = binder.execute();

			expect(result).not.toBeNull();
			expect(result).toHaveProperty('proxy');
			expect(result).toHaveProperty('account');
			expect(result).toHaveProperty('server');
		});

		test('execute() should return null if no pools bound', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>();

			const result = binder.execute();

			expect(result).not.toBeNull();
			expect(Object.keys(result ?? {})).toHaveLength(0);
		});
	});

	describe('Filtering', () => {
		test('where() should filter pool entries', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US');

			const result = binder.execute();

			expect(result?.proxy.country).toBe('US');
		});

		test('where() should chain multiple filters', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.meta.usedCount < 5);

			const result = binder.execute();

			expect(result?.proxy.country).toBe('US');
			// Result only contains data, not meta
			expect(['1.1.1.1', '3.3.3.3']).toContain(result?.proxy.ip ?? '');
		});

		test('where() should work on multiple pools', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.bind('account', accounts)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.where('account', (entry: PoolEntry<Account>) => entry.data.service === 'twitter');

			const result = binder.execute();

			expect(result?.proxy.country).toBe('US');
			expect(result?.account.service).toBe('twitter');
		});

		test('execute() should return null if any pool has no matches', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'FR');

			const result = binder.execute();

			expect(result).toBeNull();
		});
	});

	describe('Selection', () => {
		test('selectWith() should use custom selector', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.selectWith('proxy', Selectors.minBy('usedCount'));

			const result = binder.execute();

			// minBy should select the proxy with lowest usedCount (1.1.1.1 has 0)
			expect(result?.proxy.ip).toBe('1.1.1.1');
		});

		test('selectWith() should work on multiple pools', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.bind('account', accounts)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.where('account', (entry: PoolEntry<Account>) => entry.data.service === 'twitter')
				.selectWith('proxy', Selectors.minBy('usedCount'))
				.selectWith('account', Selectors.first);

			const result = binder.execute();

			expect(result?.proxy.ip).toBe('1.1.1.1');
			expect(result?.account.username).toBe('user1');
		});

		test('should use first selector by default', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>().bind('proxy', proxies);

			const result = binder.execute();

			expect(result?.proxy).toBeDefined();
			expect(['1.1.1.1', '2.2.2.2', '3.3.3.3']).toContain(result!.proxy.ip);
		});
	});

	describe('Complex Scenarios', () => {
		test('should bind three pools with filters and selectors', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.bind('account', accounts)
				.bind('server', servers)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.where('account', (entry: PoolEntry<Account>) => entry.data.service === 'twitter')
				.where('server', (entry: PoolEntry<Server>) => entry.data.region === 'US')
				.selectWith('proxy', Selectors.minBy('usedCount'))
				.selectWith('account', Selectors.random)
				.selectWith('server', Selectors.first);

			const result = binder.execute();

			expect(result).not.toBeNull();
			expect(result?.proxy.country).toBe('US');
			expect(result?.account.service).toBe('twitter');
			expect(result?.server.region).toBe('US');
			expect(result?.server.name).toBe('server1');
		});

		test('should handle empty pools gracefully', () => {
			const emptyPool = new Pool<Proxy>();
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>().bind('proxy', emptyPool);

			const result = binder.execute();

			expect(result).toBeNull();
		});

		test('should return null when filter makes pool empty', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.bind('account', accounts)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.where('account', (entry: PoolEntry<Account>) => entry.data.service === 'instagram');

			const result = binder.execute();

			expect(result).toBeNull();
		});

		test('should work with only one pool', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.speed > 100)
				.selectWith('proxy', Selectors.first);

			const result = binder.execute();

			expect(result).not.toBeNull();
			expect(result?.proxy.speed).toBeGreaterThan(100);
		});
	});

	describe('Result Structure', () => {
		test('should return data objects not entries', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.ip === '1.1.1.1')
				.selectWith('proxy', Selectors.first);

			const result = binder.execute();

			// Results are data objects, not PoolEntry objects
			expect(result?.proxy).toBeDefined();
			expect(result?.proxy.ip).toBe('1.1.1.1');
			expect(result?.proxy.country).toBe('US');
		});

		test('should return data for all bound pools', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account; server: Server }>()
				.bind('proxy', proxies)
				.bind('account', accounts)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.ip === '1.1.1.1')
				.selectWith('proxy', Selectors.first)
				.selectWith('account', Selectors.first);

			const result = binder.execute();

			expect(result?.proxy.ip).toBeDefined();
			expect(result?.account.username).toBeDefined();
		});
	});

	describe('Type Safety', () => {
		test('should return correctly typed results', () => {
			const binder = new Binder<{ proxy: Proxy; account: Account }>()
				.bind('proxy', proxies)
				.bind('account', accounts);

			const result = binder.execute();

			// TypeScript should recognize these properties
			expect(result).not.toBeNull();
			expect(typeof result?.proxy.ip).toBe('string');
			expect(typeof result?.proxy.country).toBe('string');
			expect(typeof result?.proxy.speed).toBe('number');
			expect(typeof result?.account.username).toBe('string');
			expect(typeof result?.account.service).toBe('string');
		});
	});

	describe('Weighted Selection', () => {
		test('should work with weighted selector', () => {
			const binder = new Binder<{ proxy: Proxy }>()
				.bind('proxy', proxies)
				.where('proxy', (entry: PoolEntry<Proxy>) => entry.data.country === 'US')
				.selectWith(
					'proxy',
					Selectors.weighted((entry: PoolEntry<Proxy>) => 1 / (entry.meta.usedCount + 1))
				);

			const result = binder.execute();

			expect(result).not.toBeNull();
			expect(result?.proxy.country).toBe('US');
		});
	});
});
