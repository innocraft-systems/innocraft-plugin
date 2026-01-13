---
description: Create a Neon database branch for testing, development, or preview environments. Branches are instant copy-on-write snapshots.
---

# Neon Branch Command

Create an isolated database branch for development, testing, or preview deployments.

## Why Branching?

Neon branches are instant (~1 second) copy-on-write snapshots:
- Test schema changes without affecting production
- Each PR can have its own database branch
- Preview deployments with real data
- Safe experimentation with rollback capability

## Instructions

1. **Determine the use case**:
   - **Development**: Long-lived branch for feature work
   - **Testing**: Ephemeral branch for CI/CD
   - **Preview**: Branch per PR for Vercel/Netlify previews

2. **For manual branching**, guide user to:
   - Neon Console → Project → Branches → Create Branch
   - Or use `neonctl` CLI:
     ```bash
     npx neonctl branches create --name feature-xyz
     ```

3. **For CI/CD automation**, create GitHub Actions workflow:
   ```yaml
   - name: Create Neon Branch
     uses: neondatabase/create-branch-action@v6
     with:
       project_id: ${{ vars.NEON_PROJECT_ID }}
       branch_name: pr-${{ github.event.number }}
       api_key: ${{ secrets.NEON_API_KEY }}
   ```

4. **For ephemeral test databases** (programmatic):
   ```typescript
   import { NeonToolkit } from '@neondatabase/toolkit';

   const toolkit = new NeonToolkit(process.env.NEON_API_KEY!);
   const project = await toolkit.createProject({ name: 'test-db' });
   // Use project.connectionURIs[0].connection_uri
   // ... run tests ...
   await toolkit.deleteProject(project);
   ```

5. **Provide connection string** for the new branch

## Templates

- `${CLAUDE_PLUGIN_ROOT}/templates/drizzle/github-actions.yml` - Full CI/CD workflow
- `${CLAUDE_PLUGIN_ROOT}/scripts/create-ephemeral-db.ts` - Programmatic creation
- `${CLAUDE_PLUGIN_ROOT}/scripts/destroy-ephemeral-db.ts` - Cleanup utilities

## Output

Provide the branch connection string and remind user:
- Branches inherit data from parent at creation time
- Use schema-only branches for clean slate: `--schema-only` flag
- Delete branches when done to avoid clutter
