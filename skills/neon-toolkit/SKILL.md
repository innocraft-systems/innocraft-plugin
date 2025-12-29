---
name: neon-toolkit
description: This skill covers the Neon Toolkit (@neondatabase/toolkit) for creating ephemeral databases. Use when the user asks about "ephemeral database", "test database", "CI/CD database testing", "Neon branching for tests", "isolated test environment", "Jest with Neon", or needs to create temporary databases for testing.
---

# Neon Toolkit - Ephemeral Databases

The `@neondatabase/toolkit` simplifies creating, querying, and destroying ephemeral Neon databases. Ideal for testing, CI/CD, and AI agents.

## Installation

```bash
npm install @neondatabase/toolkit
```

## Setup

Get a Neon API key from Neon Console: **Account settings > API keys > Generate new API key**

```bash
export NEON_API_KEY="your_api_key"
```

## Basic Usage

```typescript
import { NeonToolkit } from '@neondatabase/toolkit';

const toolkit = new NeonToolkit(process.env.NEON_API_KEY!);

// Create project
const project = await toolkit.createProject({ name: 'test-db' });

// Run SQL
await toolkit.sql(project, `
  CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255))
`);

await toolkit.sql(project, `INSERT INTO users (name) VALUES ('Sam')`);
const users = await toolkit.sql(project, `SELECT * FROM users`);

// Cleanup
await toolkit.deleteProject(project);
```

## API Reference

### createProject

```typescript
const project = await toolkit.createProject({
  name?: string,        // Project name (default: auto-generated)
  pg_version?: number,  // Postgres version (default: 16)
  region_id?: string,   // Region (default: aws-us-east-2)
});
```

Returns `ToolkitProject` with:
- `project` - Project details
- `connectionURIs` - Array of connection strings

### sql

```typescript
const results = await toolkit.sql(project, sqlQuery);
```

### deleteProject

```typescript
await toolkit.deleteProject(project);
```

### apiClient

Access full Neon API for advanced operations:

```typescript
const api = toolkit.apiClient;
const { data } = await api.listProjects({});
```

## Test Setup Pattern

```typescript
// tests/setup.ts
import { NeonToolkit } from '@neondatabase/toolkit';

interface EphemeralDb {
  project: any;
  connectionString: string;
  cleanup: () => Promise<void>;
}

export async function createEphemeralDb(name?: string): Promise<EphemeralDb> {
  const toolkit = new NeonToolkit(process.env.NEON_API_KEY!);
  const project = await toolkit.createProject({
    name: name || `test-${Date.now()}`,
  });

  return {
    project,
    connectionString: project.connectionURIs[0].connection_uri,
    cleanup: async () => toolkit.deleteProject(project),
  };
}
```

## Jest Integration

```typescript
// jest.setup.ts
import { NeonToolkit } from '@neondatabase/toolkit';

let toolkit: NeonToolkit;
let testProject: any;

beforeAll(async () => {
  toolkit = new NeonToolkit(process.env.NEON_API_KEY!);
  testProject = await toolkit.createProject({ name: `jest-${Date.now()}` });
  process.env.DATABASE_URL = testProject.connectionURIs[0].connection_uri;
});

afterAll(async () => {
  await toolkit.deleteProject(testProject);
});

beforeEach(async () => {
  await toolkit.sql(testProject, `TRUNCATE users RESTART IDENTITY CASCADE;`);
});
```

## GitHub Actions

```yaml
- name: Create Neon Branch
  id: create-branch
  uses: neondatabase/create-branch-action@v6
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    branch_name: test/pr-${{ github.event.number }}
    api_key: ${{ secrets.NEON_API_KEY }}

- name: Run Tests
  run: npm test
  env:
    DATABASE_URL: ${{ steps.create-branch.outputs.db_url }}

- name: Delete Branch
  if: always()
  uses: neondatabase/delete-branch-action@v3
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    branch: ${{ steps.create-branch.outputs.branch_id }}
    api_key: ${{ secrets.NEON_API_KEY }}
```

## Scripts

Use the provided scripts at `${CLAUDE_PLUGIN_ROOT}/scripts/`:

```bash
# Create ephemeral database
npx tsx ${CLAUDE_PLUGIN_ROOT}/scripts/create-ephemeral-db.ts my-test-db

# Destroy ephemeral database
npx tsx ${CLAUDE_PLUGIN_ROOT}/scripts/destroy-ephemeral-db.ts <project-id>

# Validate connection
npx tsx ${CLAUDE_PLUGIN_ROOT}/scripts/validate-connection.ts
```

## Best Practices

1. **Use unique names**: Include timestamps to avoid collisions
2. **Always cleanup**: Use `finally` blocks or `afterAll` hooks
3. **Prefer branches**: For testing with existing data, branch from production/staging
4. **Use pooled connections**: In tests, use `-pooler` connection strings
