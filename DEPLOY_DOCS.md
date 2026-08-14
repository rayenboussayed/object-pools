# Deploying documentation to GitHub Pages

## Automatic setup

Documentation is automatically built and published on every push to the `main` branch.

### Step 1: Enable GitHub Pages

1. Go to repository Settings on GitHub
2. Select **Pages** in the left menu
3. In the **Source** section select:
   - Source: **GitHub Actions**

That's it! Nothing else needs to be configured.

### Step 2: Push the code

```bash
git add .
git commit -m "Add documentation"
git push
```

GitHub Actions automatically:
1. Installs dependencies with npm
2. Builds the documentation (`npm run docs:build`)
3. Publishes to GitHub Pages

The documentation will be available at:
```
https://yourusername.github.io/pools/
```

## Local development

### Start the dev server

```bash
npm run docs:dev
```

Opens at `http://localhost:5173`

### Build the documentation

```bash
npm run docs:build
```

The result will be in `docs/.vitepress/dist/`

### Preview the production version

```bash
npm run docs:preview
```

## Documentation structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── index.md               # Home page
├── guide/
│   ├── installation.md    # Installation
│   └── quick-start.md     # Quick start
├── api/
│   ├── index.md           # API overview
│   ├── pool.md            # Pool overview
│   ├── pool/              # Pool API sections
│   │   ├── crud.md        #   CRUD methods
│   │   ├── events.md      #   Events
│   │   ├── iteration.md   #   Iteration methods
│   │   ├── map-like.md    #   Map-like usage
│   │   ├── merge.md       #   Merging pools
│   │   ├── properties.md  #   Properties
│   │   ├── query.md       #   Pool.query()
│   │   └── transform.md   #   Transform methods
│   ├── query.md           # Query API
│   ├── binder.md          # Binder API
│   └── selectors.md       # Selectors API
└── examples/
    ├── index.md           # Examples overview
    ├── basic.md           # Basic example
    ├── proxy-pool.md      # Proxy pool
    ├── map-like.md        # Map-like usage
    └── game-service.md    # Game service
```

## Updating the documentation

1. Edit the desired `.md` files in `docs/`
2. Check locally: `npm run docs:dev`
3. Commit and push

GitHub Actions will automatically update the site.

## What is used

- **VitePress** - modern static site generator
- **GitHub Pages** - free hosting from GitHub
- **GitHub Actions** - automatic build and deploy

## Setting the base URL

In the `docs/.vitepress/config.ts` file:

```typescript
export default defineConfig({
  base: '/pools/',  // Repository name
  // ...
});
```

If you have a custom domain, change it to `/`.

## Custom domain (optional)

1. Create a `docs/public/CNAME` file with the domain:
   ```
   docs.example.com
   ```

2. Configure DNS:
   ```
   docs  CNAME  yourusername.github.io
   ```

3. In GitHub Settings > Pages specify your domain

## Troubleshooting

### 404 error after publication

Check `base` in `config.ts` - it should match the repository name.

### The site is not updated

1. Check GitHub Actions: the **Actions** tab in the repository
2. Look at the build logs
3. Check that GitHub Pages is enabled

### Works locally, but not on GitHub Pages

Check resource paths - they should be relative or use `base`.