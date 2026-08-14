import { Pool } from '../src';
import type { PoolEntry } from '../src/types';

console.log('=== Pool Iteration Methods ===\n');

interface Product {
	id: string;
	name: string;
	price: number;
	category: string;
	inStock: boolean;
}

const products = new Pool<Product>();

// Add products
products.addBatch([
	{ data: { id: 'p1', name: 'Laptop', price: 1000, category: 'Electronics', inStock: true }, meta: { sold: 5 } },
	{ data: { id: 'p2', name: 'Mouse', price: 25, category: 'Electronics', inStock: true }, meta: { sold: 20 } },
	{ data: { id: 'p3', name: 'Keyboard', price: 75, category: 'Electronics', inStock: false }, meta: { sold: 10 } },
	{ data: { id: 'p4', name: 'Desk', price: 300, category: 'Furniture', inStock: true }, meta: { sold: 3 } },
	{ data: { id: 'p5', name: 'Chair', price: 150, category: 'Furniture', inStock: true }, meta: { sold: 7 } },
	{ data: { id: 'p6', name: 'Book', price: 15, category: 'Books', inStock: true }, meta: { sold: 50 } },
]);

console.log(`Total products: ${products.size}\n`);

// ========== FOREACH ==========

console.log('=== forEach: Logging all products ===\n');

products.forEach((entry, index) => {
	const stock = entry.data.inStock ? '✓' : '✗';
	console.log(`${index + 1}. ${entry.data.name} - $${entry.data.price} ${stock}`);
});

// ========== MAP ==========

console.log('\n=== map: Extract product names ===\n');

const productNames = products.map((entry) => entry.data.name);
console.log('Product names:', productNames.join(', '));

const prices = products.map((entry) => entry.data.price);
console.log('Prices:', prices);

// ========== FILTER ==========

console.log('\n=== filter: In stock products ===\n');

const inStockEntries = products.filter((entry) => entry.data.inStock);
console.log(`In stock: ${inStockEntries.length} products`);
for (const entry of inStockEntries) {
	console.log(`  - ${entry.data.name} ($${entry.data.price})`);
}

// ========== REDUCE ==========

console.log('\n=== reduce: Calculate totals ===\n');

// Total value of all products
const totalValue = products.reduce((sum, entry) => sum + entry.data.price, 0);
console.log(`Total product value: $${totalValue}`);

// Total units sold
const totalSold = products.reduce((sum, entry) => sum + (entry.meta.sold || 0), 0);
console.log(`Total units sold: ${totalSold}`);

// Average price
const avgPrice = totalValue / products.size;
console.log(`Average price: $${avgPrice.toFixed(2)}`);

// Group by category (reduce to object)
const byCategory = products.reduce<Record<string, number>>((accumulator, entry) => {
	const cat = entry.data.category;
	accumulator[cat] = (accumulator[cat] || 0) + 1;
	return accumulator;
}, {});
console.log('Products by category:', byCategory);

// ========== SOME / EVERY ==========

console.log('\n=== some / every: Boolean checks ===\n');

const hasExpensive = products.some((entry) => entry.data.price > 500);
console.log(`Has expensive products (>$500)? ${hasExpensive}`);

const hasCheap = products.some((entry) => entry.data.price < 50);
console.log(`Has cheap products (<$50)? ${hasCheap}`);

const allInStock = products.every((entry) => entry.data.inStock);
console.log(`All products in stock? ${allInStock}`);

const allElectronics = products.every((entry) => entry.data.category === 'Electronics');
console.log(`All electronics? ${allElectronics}`);

// ========== FIND / FINDINDEX ==========

console.log('\n=== find / findIndex: Searching ===\n');

const laptopEntry = products.find((entry) => entry.data.name === 'Laptop');
if (laptopEntry) {
	console.log('Found laptop:', laptopEntry.data);
	console.log(`  Sold: ${laptopEntry.meta.sold} units`);
}

const furnitureIndex = products.findIndex((entry) => entry.data.category === 'Furniture');
console.log(`First furniture item at index: ${furnitureIndex}`);

const notFoundIndex = products.findIndex((entry) => entry.data.name === 'NonExistent');
console.log(`Non-existent product index: ${notFoundIndex}`);

// ========== COMPLEX OPERATIONS ==========

console.log('\n=== Complex: Revenue calculation ===\n');

// Calculate revenue for each product
interface RevenueReport {
	product: string;
	unitPrice: number;
	unitsSold: number;
	revenue: number;
}

const revenueReport = products
	.map((entry): RevenueReport => {
		return {
			product: entry.data.name,
			unitPrice: entry.data.price,
			unitsSold: entry.meta.sold || 0,
			revenue: entry.data.price * (entry.meta.sold || 0),
		};
	})
	.sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

console.log('Revenue report (sorted by revenue):');
for (const [index, item] of revenueReport.entries()) {
	console.log(`  ${index + 1}. ${item.product}: ${item.unitsSold} × $${item.unitPrice} = $${item.revenue}`);
}

const totalRevenue = revenueReport.reduce((sum, item) => sum + item.revenue, 0);
console.log(`\nTotal revenue: $${totalRevenue}`);

// ========== CHAINING WITH QUERY ==========

console.log('\n=== Combining iteration with query ===\n');

// Query to filter, then map to transform
const electronicsNames = products
	.query()
	.where((entry) => entry.data.category === 'Electronics')
	.where((entry) => entry.data.inStock)
	.toArray()
	.map((p) => p.name);

console.log('In-stock electronics:', electronicsNames.join(', '));

// forEach on filtered data
console.log('\nUpdating prices for furniture (+10%):');
products.forEach((entry) => {
	if (entry.data.category !== 'Furniture') {
		return;
	}

	const oldPrice = entry.data.price;
	entry.data.price = Math.round(entry.data.price * 1.1);
	console.log(`  ${entry.data.name}: $${oldPrice} → $${entry.data.price}`);
});

// ========== STATISTICS ==========

console.log('\n=== Statistics using reduce ===\n');

const stats = products.reduce(
	(accumulator, entry) => {
		return {
			totalPrice: accumulator.totalPrice + entry.data.price,
			totalSold: accumulator.totalSold + (entry.meta.sold || 0),
			inStock: accumulator.inStock + (entry.data.inStock ? 1 : 0),
			outOfStock: accumulator.outOfStock + (entry.data.inStock ? 0 : 1),
			minPrice: Math.min(accumulator.minPrice, entry.data.price),
			maxPrice: Math.max(accumulator.maxPrice, entry.data.price),
		};
	},
	{
		totalPrice: 0,
		totalSold: 0,
		inStock: 0,
		outOfStock: 0,
		minPrice: Infinity,
		maxPrice: -Infinity,
	}
);

console.log('Product Statistics:');
console.log(`  Total value: $${stats.totalPrice}`);
console.log(`  Total sold: ${stats.totalSold} units`);
console.log(`  In stock: ${stats.inStock}`);
console.log(`  Out of stock: ${stats.outOfStock}`);
console.log(`  Price range: $${stats.minPrice} - $${stats.maxPrice}`);
console.log(`  Average price: $${(stats.totalPrice / products.size).toFixed(2)}`);

// ========== SIDE EFFECTS ==========

console.log('\n=== Side effects: Batch operations ===\n');

// Update metadata for all products
products.forEach((entry) => {
	entry.meta.lastChecked = new Date();
	entry.meta.discount = entry.data.price > 100 ? 0.1 : 0.05;
});

console.log('Applied discounts:');
products.forEach((entry) => {
	const discount = (entry.meta.discount * 100).toFixed(0);
	const discountedPrice = (entry.data.price * (1 - entry.meta.discount)).toFixed(2);
	console.log(`  ${entry.data.name}: ${discount}% off → $${discountedPrice}`);
});

// ========== NESTED POOLS ==========

console.log('\n=== Working with nested structures ===\n');

interface Category {
	name: string;
	products: Pool<Product>;
}

const categories = new Pool<Category>();

// Group products into pools by category
const categoryNames = [...new Set(products.map((entry) => entry.data.category))];

for (const catName of categoryNames) {
	const categoryProducts = new Pool<Product>();

	products.forEach((entry) => {
		if (entry.data.category === catName) {
			categoryProducts.add(entry.data, entry.meta);
		}
	});

	categories.add({ name: catName, products: categoryProducts });
}

console.log('Categories with products:');
categories.forEach((catEntry) => {
	const totalValue = catEntry.data.products.reduce((sum, productionEntry) => sum + productionEntry.data.price, 0);

	console.log(`\n  ${catEntry.data.name} (${catEntry.data.products.size} products, $${totalValue} total):`);
	// eslint-disable-next-line unicorn/no-for-each -- Pool#forEach is a library method, not array iteration
	catEntry.data.products.forEach((productionEntry) => {
		console.log(`    - ${productionEntry.data.name}: $${productionEntry.data.price}`);
	});
});

// ========== CUSTOM AGGREGATION ==========

console.log('\n=== Custom aggregation ===\n');

// Find the best-selling product
const bestSeller = products.reduce<{ entry: PoolEntry<Product> | null; maxSold: number }>(
	(accumulator, entry) => {
		const sold = entry.meta.sold || 0;
		if (sold > accumulator.maxSold) {
			return { entry, maxSold: sold };
		}
		return accumulator;
	},
	{ entry: null, maxSold: 0 }
);

if (bestSeller.entry) {
	console.log(`Best seller: ${bestSeller.entry.data.name} (${bestSeller.maxSold} units sold)`);
}

// Find the category with the highest revenue
const categoryRevenue = categories.map((catEntry) => {
	const revenue = catEntry.data.products.reduce((sum, productionEntry) => {
		return sum + productionEntry.data.price * (productionEntry.meta.sold || 0);
	}, 0);

	return {
		category: catEntry.data.name,
		revenue: revenue,
	};
});

const topCategory = categoryRevenue.sort((a, b) => b.revenue - a.revenue)[0];
if (topCategory) {
	console.log(`Top revenue category: ${topCategory.category} ($${topCategory.revenue})`);
}

console.log('\n=== Example Complete ===');
