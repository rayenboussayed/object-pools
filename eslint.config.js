import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import jsdoc from 'eslint-plugin-jsdoc';
import markdown from 'eslint-plugin-markdown';
import unicorn from 'eslint-plugin-unicorn';

export default defineConfig(
	globalIgnores(['dist', 'coverage', 'docs/.vitepress/dist']),
	{
		plugins: {
			js,
			'@typescript-eslint': tseslint.plugin,
			security,
			jsdoc,
		},
		extends: [
			'js/recommended',
			tseslint.configs.recommended,
			sonarjs.configs.recommended,
			'security/recommended',
			'jsdoc/flat/recommended-typescript',
			unicorn.configs.recommended,
		],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			// Custom name mappings: `e` is always a pool entry in this codebase
			// (event handlers already use `entry`/`entries`/`handler` names), so
			// map it to `entry` only. `fn` maps to `callback` instead of the
			// default `function_`, and `args` is the payload of a private emit.
			// 'unicorn/name-replacements': [
			// 	'error',
			// 	{
			// 		replacements: {
			// 			e: { error: false, event: false, entry: true },
			// 			fn: { function: false, callback: true },
			// 			compareFn: { compareFunction: true },
			// 			weightFn: { weightFunction: true },
			// 			args: { arguments: false, payload: true },
			// 		},
			// 	},
			// ],
		},
	},
	{
		name: 'hermes-compat',
		rules: {
			// The library targets the Hermes engine (React Native), which does
			// not implement the ES2023+ array helpers or the ES2025 Iterator
			// Helpers proposal. Unicorn's recommended set demands those APIs,
			// so the rules are disabled in favor of universally supported
			// forms: indexed access, Array#sort on a copy, and spread.
			'unicorn/no-array-sort': 'off', // would force toSorted() (ES2023)
			'unicorn/prefer-at': 'off', // would force .at() (Hermes >= 0.12 only)
			'unicorn/prefer-iterator-to-array': 'off', // Iterator#toArray() (ES2025)
			'unicorn/no-useless-iterator-to-array': 'off', // assumes Iterator Helpers
			'unicorn/prefer-iterator-to-array-at-end': 'off', // assumes Iterator Helpers
		},
	},
	{
		name: 'library-pragmatics',
		rules: {
			// Dynamic key access (get/set/groupBy/wrap by field name) is the pool
			// library's core API, so flagging it everywhere would be pure noise.
			'security/detect-object-injection': 'off',
			// Sample/shuffle order does not need cryptographic randomness.
			'sonarjs/pseudo-random': 'off',
		},
	},
	{
		name: 'unicorn-pragmatics',
		rules: {
			// The pool API uses `null` as the "not found" contract
			// (get/last/selectors return `T | null`), which is idiomatic TS.
			'unicorn/no-null': 'off',
			// Test helpers and example scripts are idiomatic where they are.
			'unicorn/consistent-function-scoping': 'off',
			// `meta: M = {} as M` is a generic-cast default, not a literal.
			'unicorn/no-object-as-default-parameter': 'off',
			// `keyof T` is unioned with function types in the keyed-access API
			// (get/has/wrap accept a method name OR a filter predicate). The rule
			// reports on any union containing a function member — casts, const
			// narrowing, and type guards all re-check the declared union — so
			// there is no idiomatic formulation that satisfies it.
			'unicorn/no-unsafe-property-key': 'off',
			// The library uses class-per-file PascalCase (Pool.ts, PoolBinder.test.ts)
			// and kebab-case elsewhere; all-caps markdown names (README.md,
			// DEPLOY_DOCS.md) are conventional and ignored.
			'unicorn/filename-case': [
				'error',
				{
					ignore: [/^README\.md$/u, /^DEPLOY_DOCS\.md$/u],
				},
			],
		},
	},
	{
		name: 'build-script',
		files: ['scripts/**/*.mjs'],
		languageOptions: {
			globals: {
				URL: 'readonly',
				console: 'readonly',
			},
		},
		rules: {
			// The build script reads and rewrites fixed project paths (dist/),
			// not user-supplied paths, so the fs taint check is noise here.
			'security/detect-non-literal-fs-filename': 'off',
		},
	},
	{
		name: 'fixture-ips',
		files: ['test/**/*.ts', 'examples/**/*.ts'],
		rules: {
			// Fixtures and runnable examples use placeholder IPs (e.g. 1.1.1.1).
			'sonarjs/no-hardcoded-ip': 'off',
		},
	},
	{
		name: 'docs-code-blocks',
		files: ['**/*.md/**'],
		rules: {
			// Docs use placeholder IPs (e.g. 1.1.1.1) for illustration.
			'sonarjs/no-hardcoded-ip': 'off',
			// Doc snippets declare demo variables and chain expressions that are
			// only meant to illustrate the API, not be runnable programs.
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'sonarjs/unused-import': 'off',
			'sonarjs/no-nested-conditional': 'off',
			'no-useless-assignment': 'off',
		},
	},
	{
		name: 'markdown-code-blocks',
		files: ['**/*.md'],
		plugins: { markdown },
		extends: ['markdown/recommended'],
	},
	{
		name: 'vitest-tests',
		files: ['test/**/*.test.ts'],
		plugins: { vitest },
		extends: ['vitest/recommended'],
	},
);
