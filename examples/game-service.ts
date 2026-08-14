import { Pool, Selectors, Binder } from '../src';
import type { PoolEntry } from '../src/types';

// ========== TYPES ==========

interface Game {
	id: string;
	title: string;
	genre: string;
	minPlayers: number;
	maxPlayers: number;
	requiresAuth: boolean;
}

interface Account {
	id: string;
	username: string;
	email: string;
	level: number;
	premium: boolean;
	reputation: number;
}

interface AuthSession {
	sessionId: string;
	accountId: string;
	token: string;
	ip: string;
	createdAt: Date;
}

interface GameServer {
	id: string;
	gameId: string;
	region: string;
	host: string;
	port: number;
	maxCapacity: number;
	ping: number;
}

interface PlayerSession {
	id: string;
	accountId: string;
	serverId: string;
	gameId: string;
	joinedAt: Date;
}

console.log('🎮 === GAME SERVICE POOLS EXAMPLE === 🎮\n');

// ========== CREATING POOLS ==========

const games = new Pool<Game>();
const accounts = new Pool<Account>();
const authSessions = new Pool<AuthSession>();
const gameServers = new Pool<GameServer>();
const playerSessions = new Pool<PlayerSession>();

// ========== DATA INITIALIZATION ==========

console.log('📦 Initializing data...\n');

// Games
games.addBatch([
	{
		data: { id: 'game1', title: 'Battle Royale', genre: 'shooter', minPlayers: 50, maxPlayers: 100, requiresAuth: true },
		meta: { popularity: 95, releaseYear: 2023 },
	},
	{
		data: { id: 'game2', title: 'Chess Online', genre: 'strategy', minPlayers: 2, maxPlayers: 2, requiresAuth: true },
		meta: { popularity: 70, releaseYear: 2020 },
	},
	{
		data: { id: 'game3', title: 'Racing Mania', genre: 'racing', minPlayers: 2, maxPlayers: 16, requiresAuth: false },
		meta: { popularity: 85, releaseYear: 2022 },
	},
	{
		data: { id: 'game4', title: 'Fantasy Quest', genre: 'rpg', minPlayers: 1, maxPlayers: 4, requiresAuth: true },
		meta: { popularity: 90, releaseYear: 2024 },
	},
	{
		data: { id: 'game5', title: 'Party Games', genre: 'casual', minPlayers: 4, maxPlayers: 8, requiresAuth: false },
		meta: { popularity: 60, releaseYear: 2021 },
	},
]);

// Accounts
accounts.addBatch([
	{
		data: { id: 'acc1', username: 'ProGamer123', email: 'pro@game.com', level: 50, premium: true, reputation: 95 },
		meta: { registered: new Date('2023-01-15'), banned: false, warnings: 0 },
	},
	{
		data: { id: 'acc2', username: 'CasualPlayer', email: 'casual@game.com', level: 15, premium: false, reputation: 70 },
		meta: { registered: new Date('2024-06-20'), banned: false, warnings: 1 },
	},
	{
		data: { id: 'acc3', username: 'EliteWarrior', email: 'elite@game.com', level: 99, premium: true, reputation: 100 },
		meta: { registered: new Date('2022-03-10'), banned: false, warnings: 0 },
	},
	{
		data: { id: 'acc4', username: 'Newbie2024', email: 'newbie@game.com', level: 5, premium: false, reputation: 50 },
		meta: { registered: new Date('2024-11-01'), banned: false, warnings: 0 },
	},
	{
		data: { id: 'acc5', username: 'ToxicPlayer', email: 'toxic@game.com', level: 30, premium: false, reputation: 20 },
		meta: { registered: new Date('2023-08-15'), banned: false, warnings: 5 },
	},
	{
		data: { id: 'acc6', username: 'SpeedRunner', email: 'speed@game.com', level: 75, premium: true, reputation: 88 },
		meta: { registered: new Date('2023-02-20'), banned: false, warnings: 0 },
	},
]);

// Auth sessions
const now = new Date();
authSessions.addBatch([
	{
		data: { sessionId: 'sess1', accountId: 'acc1', token: 'token_xxx_1', ip: '192.168.1.1', createdAt: new Date(now.getTime() - 30 * 60_000) },
		meta: { lastActivity: new Date(), expiresIn: 7_200_000 },
	},
	{
		data: { sessionId: 'sess2', accountId: 'acc2', token: 'token_xxx_2', ip: '192.168.1.2', createdAt: new Date(now.getTime() - 15 * 60_000) },
		meta: { lastActivity: new Date(), expiresIn: 7_200_000 },
	},
	{
		data: { sessionId: 'sess3', accountId: 'acc3', token: 'token_xxx_3', ip: '192.168.1.3', createdAt: new Date(now.getTime() - 5 * 60_000) },
		meta: { lastActivity: new Date(), expiresIn: 7_200_000 },
	},
	{
		data: { sessionId: 'sess4', accountId: 'acc6', token: 'token_xxx_4', ip: '192.168.1.6', createdAt: new Date(now.getTime() - 120 * 60_000) },
		meta: { lastActivity: new Date(now.getTime() - 90 * 60_000), expiresIn: 7_200_000 },
	},
]);

// Game servers
gameServers.addBatch([
	{
		data: { id: 'srv1', gameId: 'game1', region: 'EU-West', host: 'eu1.game.com', port: 7777, maxCapacity: 100, ping: 25 },
		meta: { status: 'online', load: 0, uptime: 99.9 },
	},
	{
		data: { id: 'srv2', gameId: 'game1', region: 'EU-East', host: 'eu2.game.com', port: 7777, maxCapacity: 100, ping: 35 },
		meta: { status: 'online', load: 0, uptime: 98.5 },
	},
	{
		data: { id: 'srv3', gameId: 'game1', region: 'US-West', host: 'us1.game.com', port: 7777, maxCapacity: 100, ping: 120 },
		meta: { status: 'online', load: 0, uptime: 99.5 },
	},
	{
		data: { id: 'srv4', gameId: 'game2', region: 'EU-West', host: 'eu1.game.com', port: 8888, maxCapacity: 1000, ping: 20 },
		meta: { status: 'online', load: 0, uptime: 100 },
	},
	{
		data: { id: 'srv5', gameId: 'game3', region: 'EU-West', host: 'eu1.game.com', port: 9999, maxCapacity: 16, ping: 15 },
		meta: { status: 'online', load: 0, uptime: 99.8 },
	},
	{
		data: { id: 'srv6', gameId: 'game4', region: 'EU-West', host: 'eu1.game.com', port: 6666, maxCapacity: 50, ping: 18 },
		meta: { status: 'online', load: 0, uptime: 99.9 },
	},
	{
		data: { id: 'srv7', gameId: 'game1', region: 'US-East', host: 'us2.game.com', port: 7777, maxCapacity: 100, ping: 110 },
		meta: { status: 'maintenance', load: 0, uptime: 95 },
	},
]);

console.log(`✅ Games: ${games.size}`);
console.log(`✅ Accounts: ${accounts.size}`);
console.log(`✅ Auth Sessions: ${authSessions.size}`);
console.log(`✅ Game Servers: ${gameServers.size}`);

// ========== EVENTS ==========

console.log('\n🔔 Setting up event handlers...\n');

// Auto-refresh session activity on reads
authSessions.on('get', (entry: PoolEntry<AuthSession>) => {
	entry.meta.lastActivity = new Date();
	console.log(`  [Auth] Session ${entry.data.sessionId} activity updated`);
});

// Track server load when a player session is created
playerSessions.on('add', (entry: PoolEntry<PlayerSession>) => {
	const server = gameServers.allEntries.find((s) => s.data.id === entry.data.serverId);
	if (server) {
		server.meta.load++;
		console.log(`  [Server] ${server.data.id} load: ${server.meta.load}/${server.data.maxCapacity}`);
	}
});

// Free up server capacity when a session is removed
playerSessions.on('remove', (entry: PoolEntry<PlayerSession>) => {
	const server = gameServers.allEntries.find((s) => s.data.id === entry.data.serverId);
	if (server) {
		server.meta.load--;
		console.log(`  [Server] ${server.data.id} player left, load: ${server.meta.load}/${server.data.maxCapacity}`);
	}
});

// ========== SCENARIO 1: FINDING POPULAR GAMES ==========

console.log('\n🎯 === SCENARIO 1: Finding Popular Games ===\n');

const popularGames = games
	.query()
	.where((entry) => entry.meta.popularity >= 85)
	.orderByMeta('popularity', 'desc')
	.toArray();

console.log('Popular games (85+ popularity):');
for (const game of popularGames) {
	const entry = games.allEntries.find((entry_) => entry_.data.id === game.id);
	console.log(`  - ${game.title} (${game.genre}) - ${entry?.meta.popularity}% popularity`);
}

// ========== SCENARIO 2: GROUPING GAMES BY GENRE ==========

console.log('\n📊 === SCENARIO 2: Grouping Games by Genre ===\n');

const gamesByGenre = games.groupBy('genre');
console.log('Games by genre:');
for (const [genre, pool] of gamesByGenre) {
	console.log(`  ${genre}: ${pool.size} games`);
	for (const game of pool.all) console.log(`    - ${game.title}`);
}

// ========== SCENARIO 3: FILTERING ACCOUNTS ==========

console.log('\n👥 === SCENARIO 3: Account Filtering ===\n');

// Premium players with high reputation
const elitePlayers = accounts
	.query()
	.where((entry) => entry.data.premium === true)
	.where((entry) => entry.data.reputation >= 85)
	.orderBy('level', 'desc')
	.toArray();

console.log('Elite premium players (rep >= 85):');
for (const accumulator of elitePlayers) {
	console.log(`  - ${accumulator.username} (lvl ${accumulator.level}, rep ${accumulator.reputation})`);
}

// Problem accounts
const problematicAccounts = accounts
	.query()
	.where((entry) => entry.meta.warnings >= 3 || entry.data.reputation < 30)
	.orderBy('reputation', 'asc')
	.toArray();

console.log('\nProblematic accounts:');
for (const accumulator of problematicAccounts) {
	const entry = accounts.allEntries.find((entry_) => entry_.data.id === accumulator.id);
	console.log(`  - ${accumulator.username} (rep ${accumulator.reputation}, warnings: ${entry?.meta.warnings})`);
}

// ========== SCENARIO 4: PARTITIONING ACCOUNTS ==========

console.log('\n✂️  === SCENARIO 4: Partitioning Accounts ===\n');

const [premiumAccounts, freeAccounts] = accounts.partition((entry) => entry.data.premium === true);

console.log(`Premium accounts: ${premiumAccounts.size}`);
console.log(`Free accounts: ${freeAccounts.size}`);

// ========== SCENARIO 5: FINDING BEST SERVERS ==========

console.log('\n🖥️  === SCENARIO 5: Finding Best Servers ===\n');

// Group servers by game
const serversByGame = gameServers.groupBy('gameId');

console.log('Servers per game:');
for (const [gameId, serverPool] of serversByGame) {
	const game = games.all.find((g) => g.id === gameId);
	if (game) {
		console.log(`\n  ${game.title}:`);

		// Best server for the game (low ping, online, low load)
		const bestServer = serverPool
			.query()
			.where((entry) => entry.meta.status === 'online')
			.where((entry) => entry.meta.load < entry.data.maxCapacity * 0.8)
			.orderBy('ping', 'asc')
			.select(Selectors.first);

		if (bestServer) {
			const serverEntry = serverPool.allEntries.find((entry) => entry.data.id === bestServer.id);
			console.log(`    Best server: ${bestServer.region} (ping: ${bestServer.ping}ms, load: ${serverEntry?.meta.load || 0}/${bestServer.maxCapacity})`);
		}

		// Group by region
		const serversByRegion = serverPool.groupBy('region');
		console.log(`    Regions: ${[...serversByRegion.keys()].join(', ')}`);
	}
}

// ========== SCENARIO 6: CREATING GAME SESSIONS ==========

console.log('\n🎮 === SCENARIO 6: Creating Player Sessions ===\n');

// Creates a game session for a player
/**
 * Joins a player to a game session
 * @param accountId - Account identifier of the player
 * @param gameId - Game identifier to join
 * @param preferredRegion - Region the player prefers, defaults to EU-West
 * @returns True when the player joined the session, false otherwise
 */
function canJoinGame(accountId: string, gameId: string, preferredRegion: string = 'EU-West') {
	console.log(`\nPlayer joining: account=${accountId}, game=${gameId}, region=${preferredRegion}`);

	// Check authentication
	const authSession = authSessions
		.query()
		.where((entry) => entry.data.accountId === accountId)
		.select(Selectors.first);

	if (!authSession) {
		console.log('  ❌ Not authenticated');
		return false;
	}

	// Check account
	const account = accounts
		.query()
		.where((entry) => entry.data.id === accountId)
		.select(Selectors.first);

	if (!account) {
		console.log('  ❌ Account not found');
		return false;
	}

	const accountEntry = accounts.allEntries.find((entry) => entry.data.id === accountId);
	if (accountEntry?.meta.banned) {
		console.log('  ❌ Account is banned');
		return false;
	}

	// Check game
	const game = games
		.query()
		.where((entry) => entry.data.id === gameId)
		.select(Selectors.first);

	if (!game) {
		console.log('  ❌ Game not found');
		return false;
	}

	// Find the best server
	const bestServer = gameServers
		.query()
		.where((entry) => entry.data.gameId === gameId)
		.where((entry) => entry.meta.status === 'online')
		.where((entry) => entry.meta.load < entry.data.maxCapacity)
		.whereOr([
			(entry) => entry.data.region === preferredRegion,
			(entry) => entry.data.region.startsWith('EU'), // Fall back to any EU region
		])
		.orderBy('ping', 'asc')
		.select(Selectors.first);

	if (!bestServer) {
		console.log('  ❌ No available servers');
		return false;
	}

	// Create the game session
	const sessionId = `psess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	playerSessions.add(
		{
			id: sessionId,
			accountId: accountId,
			serverId: bestServer.id,
			gameId: gameId,
			joinedAt: new Date(),
		},
		{
			ping: bestServer.ping,
			region: bestServer.region,
		}
	);

	console.log(`  ✅ Joined server ${bestServer.id} (${bestServer.region}, ${bestServer.ping}ms)`);
	return true;
}

// Players join games
canJoinGame('acc1', 'game1', 'EU-West');
canJoinGame('acc2', 'game1', 'EU-West');
canJoinGame('acc3', 'game1', 'EU-East');
canJoinGame('acc6', 'game2', 'EU-West');
canJoinGame('acc4', 'game3', 'EU-West');

console.log(`\nTotal active player sessions: ${playerSessions.size}`);

// ========== SCENARIO 7: USING BINDER ==========

console.log('\n🔗 === SCENARIO 7: Complex Matchmaking with Binder ===\n');

// Find an optimal combination: game + account + server
const matchmaking = new Binder<{ game: Game; account: Account; server: GameServer }>()
	.bind('game', games)
	.bind('account', accounts)
	.bind('server', gameServers)
	.where('game', (entry: PoolEntry<Game>) => entry.meta.popularity >= 85)
	.where('account', (entry: PoolEntry<Account>) => !entry.meta.banned)
	.where('account', (entry: PoolEntry<Account>) => entry.data.level >= 20)
	.where('server', (entry: PoolEntry<GameServer>) => entry.meta.status === 'online')
	.where('server', (entry: PoolEntry<GameServer>) => entry.meta.load < entry.data.maxCapacity * 0.5)
	.selectWith('game', Selectors.first) // First game with popularity >= 85
	.selectWith('account', Selectors.first) // First account that is not banned and level >= 20
	.selectWith(
		'server',
		Selectors.weighted((entry: PoolEntry<GameServer>) => {
			// Weight = (100 - ping) * (1 - load%)
			const loadPercent = entry.meta.load / entry.data.maxCapacity;
			return (100 - entry.data.ping) * (1 - loadPercent);
		})
	)
	.execute();

if (matchmaking) {
	console.log('Perfect match found:');
	console.log(`  Game: ${matchmaking.game.title} (${matchmaking.game.genre})`);
	console.log(`  Account: ${matchmaking.account.username} (lvl ${matchmaking.account.level})`);
	console.log(`  Server: ${matchmaking.server.region} - ${matchmaking.server.host}:${matchmaking.server.port} (${matchmaking.server.ping}ms)`);
} else {
	console.log('No perfect match found');
}

// ========== SCENARIO 8: ACTIVE SESSIONS STATISTICS ==========

console.log('\n📈 === SCENARIO 8: Active Sessions Statistics ===\n');

// Group game sessions by game
const sessionsByGame = playerSessions.groupBy('gameId');

console.log('Active players by game:');
for (const [gameId, sessionsPool] of sessionsByGame) {
	const game = games.all.find((g) => g.id === gameId);
	if (game) {
		console.log(`  ${game.title}: ${sessionsPool.size} players`);

		// Average player ping
		const totalPing = sessionsPool.allEntries.reduce((sum, entry) => sum + (entry.meta.ping || 0), 0);
		const avgPing = totalPing / sessionsPool.size;
		console.log(`    Average ping: ${avgPing.toFixed(0)}ms`);
	}
}

// ========== SCENARIO 9: EXPIRED SESSIONS CLEANUP ==========

console.log('\n🧹 === SCENARIO 9: Cleaning Expired Sessions ===\n');

const expiredThreshold = 60 * 60_000; // 60 minutes

const removedSessions = authSessions.remove((session) => {
	const entry = authSessions.allEntries.find((entry_) => entry_.data.sessionId === session.sessionId);
	if (entry) {
		const timeSinceActivity = Date.now() - entry.meta.lastActivity.getTime();
		return timeSinceActivity > expiredThreshold;
	}
	return false;
});

console.log(`Removed ${removedSessions.length} expired auth sessions`);
console.log(`Active auth sessions: ${authSessions.size}`);

// ========== SCENARIO 10: POOL OF POOLS ==========

console.log('\n🏊 === SCENARIO 10: Pool of Pools - Regional Organization ===\n');

// Create server pools per region
const euWestServers = gameServers
	.query()
	.where((entry) => entry.data.region === 'EU-West')
	.toPool();

const euEastServers = gameServers
	.query()
	.where((entry) => entry.data.region === 'EU-East')
	.toPool();

const usServers = gameServers
	.query()
	.where((entry) => entry.data.region.startsWith('US'))
	.toPool();

// Create a pool of pools
const regionalServerPools = new Pool<Pool<GameServer>>();
regionalServerPools.add(euWestServers, { region: 'EU-West', datacenter: 'Frankfurt' });
regionalServerPools.add(euEastServers, { region: 'EU-East', datacenter: 'Warsaw' });
regionalServerPools.add(usServers, { region: 'US', datacenter: 'Virginia' });

console.log('Regional server pools:');
for (const entry of regionalServerPools.allEntries) {
	console.log(`  ${entry.meta.region} (${entry.meta.datacenter}): ${entry.data.size} servers`);

	// Statistics per region
	const onlineServers = entry.data.query().where((entry_) => entry_.meta.status === 'online').count;
	const totalCapacity = entry.data.allEntries.reduce((sum, s) => sum + s.data.maxCapacity, 0);
	const totalLoad = entry.data.allEntries.reduce((sum, s) => sum + (s.meta.load || 0), 0);
	const utilizationPercent = totalCapacity > 0 ? ((totalLoad / totalCapacity) * 100).toFixed(1) : '0.0';

	console.log(`    Online: ${onlineServers}/${entry.data.size}`);
	console.log(`    Capacity: ${totalLoad}/${totalCapacity} (${utilizationPercent}% utilization)`);
}

// Find the region with the lowest load
const leastLoadedRegion = regionalServerPools
	.query()
	.orderBy((a, b) => {
		const loadA = a.data.allEntries.reduce((sum, s) => sum + (s.meta.load || 0), 0);
		const capacityA = a.data.allEntries.reduce((sum, s) => sum + s.data.maxCapacity, 0);
		const utilizationA = capacityA > 0 ? loadA / capacityA : 1;

		const loadB = b.data.allEntries.reduce((sum, s) => sum + (s.meta.load || 0), 0);
		const capacityB = b.data.allEntries.reduce((sum, s) => sum + s.data.maxCapacity, 0);
		const utilizationB = capacityB > 0 ? loadB / capacityB : 1;

		return utilizationA - utilizationB;
	})
	.select(Selectors.first);

if (leastLoadedRegion) {
	const entry = regionalServerPools.allEntries.find((entry_) => entry_.data === leastLoadedRegion);
	console.log(`\nLeast loaded region: ${entry?.meta.region}`);
}

// ========== SCENARIO 11: ADVANCED TRANSFORMATIONS ==========

console.log('\n🔄 === SCENARIO 11: Advanced Transformations ===\n');

// Clone and modify
const accountsBackup = accounts.clone();
console.log(`Accounts backup created: ${accountsBackup.size} accounts`);

// Sample for testing
const testAccounts = accounts.sample(3);
console.log(`\nRandom sample of ${testAccounts.size} accounts for testing:`);
for (const accumulator of testAccounts.all) console.log(`  - ${accumulator.username}`);

// Shuffle for random selection
const shuffledGames = games.clone();
shuffledGames.shuffle();
console.log(`\nShuffled games order:`);
for (const [index, game] of shuffledGames.all.slice(0, 3).entries()) console.log(`  ${index + 1}. ${game.title}`);


// ========== SCENARIO 12: MERGE OPERATIONS ==========

console.log('\n🔀 === SCENARIO 12: Merge Operations ===\n');

// Create additional account pools
const newAccounts1 = new Pool<Account>();
newAccounts1.add({ id: 'acc7', username: 'Newcomer1', email: 'new1@game.com', level: 1, premium: false, reputation: 50 });

const newAccounts2 = new Pool<Account>();
newAccounts2.add({ id: 'acc7', username: 'Newcomer1', email: 'new1@game.com', level: 1, premium: false, reputation: 50 }); // Duplicate
newAccounts2.add({ id: 'acc8', username: 'Newcomer2', email: 'new2@game.com', level: 1, premium: false, reputation: 50 });

// Merge unique
const mergedAccounts = Pool.mergeUnique([newAccounts1, newAccounts2], 'id');
console.log(`Merged unique accounts: ${mergedAccounts.size} (duplicates removed)`);

// Union
const unionTest = new Pool<Account>();
unionTest.add({ id: 'acc9', username: 'UnionTest', email: 'union@game.com', level: 10, premium: false, reputation: 60 });
const originalSize = accounts.size;
accounts.union(unionTest, (a, b) => a.id === b.id);
console.log(`Union operation: ${accounts.size - originalSize} new accounts added`);

// Intersect
const premiumPool1 = accounts
	.query()
	.where((entry) => entry.data.premium === true)
	.toPool();

const highLevelPool = accounts
	.query()
	.where((entry) => entry.data.level >= 50)
	.toPool();

const elitePool = Pool.intersect(premiumPool1, highLevelPool, (a, b) => a.id === b.id);
console.log(`Elite players (premium AND high level): ${elitePool.size}`);

// ========== SCENARIO 13: QUERY CHAINING & PAGINATION ==========

console.log('\n📄 === SCENARIO 13: Query Chaining & Pagination ===\n');

console.log('Leaderboard (top 10 players):');
const leaders = accounts
	.query()
	.where((entry) => !entry.meta.banned)
	.orderBy('level', 'desc')
	.orderBy('reputation', 'desc') // Secondary sort
	.limit(10)
	.toArray();
for (const [index, accumulator] of leaders.entries()) {
	console.log(`  ${index + 1}. ${accumulator.username} - Level ${accumulator.level} (Rep: ${accumulator.reputation})`);
}

console.log('\nNext 5 players (pagination):');
const nextPlayers = accounts
	.query()
	.where((entry) => !entry.meta.banned)
	.orderBy('level', 'desc')
	.offset(10)
	.limit(5)
	.toArray();
for (const [index, accumulator] of nextPlayers.entries()) {
	console.log(`  ${index + 11}. ${accumulator.username} - Level ${accumulator.level}`);
}

// ========== SCENARIO 14: METHOD WRAPPING ==========

console.log('\n🎁 === SCENARIO 14: Method Wrapping for Logging ===\n');

const monitoredAccounts = new Pool<Account>();

// Wrap add to log
monitoredAccounts.wrap('add', (original, data, meta) => {
	console.log(`  [Monitor] Adding account: ${data.username}`);
	const result = original(data, meta);
	console.log(`  [Monitor] Account added successfully`);
	return result;
});

// Wrap remove to log
monitoredAccounts.wrap('remove', (original, predicate) => {
	console.log(`  [Monitor] Removing accounts...`);
	const result = original(predicate);
	console.log(`  [Monitor] Removed ${result.length} accounts`);
	return result;
});

monitoredAccounts.add({ id: 'test1', username: 'TestUser1', email: 'test1@game.com', level: 1, premium: false, reputation: 50 });
monitoredAccounts.add({ id: 'test2', username: 'TestUser2', email: 'test2@game.com', level: 1, premium: false, reputation: 50 });
monitoredAccounts.remove((data) => data.id === 'test1');

// ========== SCENARIO 15: WEIGHTED SELECTOR FOR MATCHMAKING ==========

console.log('\n⚖️  === SCENARIO 15: Weighted Server Selection ===\n');

// Weighted server selection based on multiple factors
const selectedServer = gameServers
	.query()
	.where((entry) => entry.data.gameId === 'game1')
	.where((entry) => entry.meta.status === 'online')
	.select(
		Selectors.weighted((entry: PoolEntry<GameServer>) => {
			const loadFactor = 1 - entry.meta.load / entry.data.maxCapacity; // Prefer less loaded servers
			const pingFactor = 1 / (entry.data.ping + 1); // Prefer low ping
			const uptimeFactor = entry.meta.uptime / 100; // Prefer high uptime

			const weight = loadFactor * 40 + pingFactor * 100 + uptimeFactor * 20;
			console.log(`  ${entry.data.id} (${entry.data.region}): load=${loadFactor.toFixed(2)}, ping=${pingFactor.toFixed(3)}, uptime=${uptimeFactor.toFixed(2)} => weight=${weight.toFixed(2)}`);

			return weight;
		})
	);

if (selectedServer) {
	console.log(`\nSelected server: ${selectedServer.id} (${selectedServer.region})`);
}

// ========== FINAL STATISTICS ==========

console.log('\n📊 === FINAL STATISTICS ===\n');

console.log(`Total Games: ${games.size}`);
console.log(`Total Accounts: ${accounts.size}`);
console.log(`Active Auth Sessions: ${authSessions.size}`);
console.log(`Game Servers: ${gameServers.size}`);
console.log(`Active Player Sessions: ${playerSessions.size}`);

// Group by game
console.log('\nPlayers online per game:');
const playersPerGame = playerSessions.groupBy('gameId');
for (const [gameId, pool] of playersPerGame) {
	const game = games.all.find((g) => g.id === gameId);
	console.log(`  ${game?.title || gameId}: ${pool.size} players`);
}

// Average player reputation
const avgReputation = accounts.all.reduce((sum, accumulator) => sum + accumulator.reputation, 0) / accounts.size;
console.log(`\nAverage player reputation: ${avgReputation.toFixed(1)}`);

// Percentage of premium players
const premiumPercent = (premiumAccounts.size / accounts.size) * 100;
console.log(`Premium players: ${premiumPercent.toFixed(1)}%`);

console.log('\n🎮 === GAME SERVICE EXAMPLE COMPLETE === 🎮');
