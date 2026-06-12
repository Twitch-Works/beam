import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const src = join(root, 'src')

const files = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path)
      continue
    }
    if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(entry)) {
      files.push(path)
    }
  }
}

walk(src)

function read(path) {
  return readFileSync(path, 'utf8')
}

function rel(path) {
  return relative(root, path)
}

function countMatches(pattern) {
  let count = 0
  for (const file of files) {
    const matches = read(file).match(pattern)
    if (matches) count += matches.length
  }
  return count
}

function hasText(path, pattern) {
  return existsSync(path) && pattern.test(read(path))
}

const packageJson = JSON.parse(read(join(root, 'package.json')))
const deps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

const checks = [
  {
    name: 'Route protection middleware exists',
    pass:
      hasText(join(root, 'middleware.ts'), /createServerClient/) &&
      hasText(join(root, 'middleware.ts'), /supabase\.auth\.getUser/) &&
      hasText(join(root, 'middleware.ts'), /role !== 'admin' && role !== 'super_admin'/),
    detail: 'Expected root middleware.ts to refresh Supabase session and redirect non-admin users.',
  },
  {
    name: 'Dashboard SSR role guard is wired',
    pass: !hasText(join(src, 'app', '(dashboard)', 'layout.tsx'), /return null|TODO Phase 2|uncomment once Supabase auth is wired/),
    detail: `${rel(join(src, 'app', '(dashboard)', 'layout.tsx'))} still has the Supabase session and role guard scaffolded out.`,
  },
  {
    name: 'Login uses real auth',
    pass:
      hasText(join(src, 'app', '(auth)', 'login', 'page.tsx'), /signInWithPassword/) &&
      !hasText(join(src, 'app', '(auth)', 'login', 'page.tsx'), /Simulate login|setTimeout\(/),
    detail: 'Login currently simulates success instead of creating a Supabase session.',
  },
  {
    name: 'Privileged pages have SSR guards',
    pass:
      hasText(join(root, 'middleware.ts'), /SUPER_ADMIN_ONLY/) &&
      hasText(join(root, 'middleware.ts'), /isSuperAdminRoute/) &&
      hasText(join(root, 'middleware.ts'), /role !== 'super_admin'/),
    detail: 'Settings and audit logs must be protected by active super_admin middleware.',
  },
  {
    name: 'Mock data removed from production paths',
    pass: countMatches(/\bmockData\b|\bMock[A-Z]\w*|\bmock[A-Z]\w*|@\/lib\/mock-data/g) === 0,
    detail: `Found ${countMatches(/\bmockData\b|\bMock[A-Z]\w*|\bmock[A-Z]\w*|@\/lib\/mock-data/g)} mock-data references under src.`,
  },
  {
    name: 'Admin API/schema packages are wired',
    pass: Boolean(deps['@beam/api-client'] && deps['@beam/hooks'] && deps['@beam/schemas']),
    detail: 'Admin package should depend on typed API client, hooks, and schemas before live data/mutations ship.',
  },
  {
    name: 'Realtime client dependency exists',
    pass: Boolean(deps['socket.io-client']),
    detail: 'Socket.io dashboard/SOS readiness requires socket.io-client or an equivalent realtime client.',
  },
  {
    name: 'No admin TODO markers remain',
    pass: countMatches(/\bTODO\b/g) === 0,
    detail: `Found ${countMatches(/\bTODO\b/g)} TODO markers under src.`,
  },
  {
    name: 'No npm lockfile drift inside pnpm workspace',
    pass: !existsSync(join(root, 'package-lock.json')),
    detail: 'apps/admin/package-lock.json exists; this repo is a pnpm workspace.',
  },
  {
    name: 'Lint command is non-interactive',
    pass: packageJson.scripts?.lint && !packageJson.scripts.lint.includes('next lint'),
    detail: 'next lint prompts for setup when no ESLint config exists.',
  },
]

const failures = checks.filter((check) => !check.pass)

console.log('Admin production readiness check')
console.log('')

for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`)
  if (!check.pass) {
    console.log(`  ${check.detail}`)
  }
}

console.log('')
console.log(`${checks.length - failures.length}/${checks.length} checks passing`)

if (failures.length > 0) {
  process.exitCode = 1
}
