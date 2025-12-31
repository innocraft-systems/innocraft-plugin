#!/usr/bin/env npx tsx
/**
 * Destroy an ephemeral Neon database or cleanup test branches
 *
 * Usage:
 *   npx tsx destroy-ephemeral-db.ts <project-id>
 *   npx tsx destroy-ephemeral-db.ts --project <project-id> --prefix test/
 *   npx tsx destroy-ephemeral-db.ts --project <project-id> --branch <branch-id>
 *
 * Environment:
 *   NEON_API_KEY - Required Neon API key
 */

import { NeonToolkit } from '@neondatabase/toolkit';

interface CleanupOptions {
  projectId?: string;
  branchId?: string;
  branchPrefix?: string;
  deleteProject?: boolean;
}

export async function destroyEphemeralDb(options: CleanupOptions): Promise<void> {
  if (!process.env.NEON_API_KEY) {
    throw new Error('NEON_API_KEY environment variable is required');
  }

  const toolkit = new NeonToolkit(process.env.NEON_API_KEY);
  const api = toolkit.apiClient;

  // Delete entire project
  if (options.deleteProject && options.projectId) {
    console.error(`Deleting project: ${options.projectId}`);
    await api.deleteProject({ projectId: options.projectId });
    console.error('Project deleted');
    return;
  }

  // Delete specific branch
  if (options.branchId && options.projectId) {
    console.error(`Deleting branch: ${options.branchId}`);
    await api.deleteProjectBranch({
      projectId: options.projectId,
      branchId: options.branchId,
    });
    console.error('Branch deleted');
    return;
  }

  // Delete branches by prefix
  if (options.branchPrefix && options.projectId) {
    const { data } = await api.listProjectBranches({
      projectId: options.projectId,
    });

    const branchesToDelete = data.branches.filter((branch) =>
      branch.name?.startsWith(options.branchPrefix!)
    );

    console.error(`Found ${branchesToDelete.length} branches matching prefix "${options.branchPrefix}"`);

    for (const branch of branchesToDelete) {
      try {
        console.error(`Deleting branch: ${branch.name} (${branch.id})`);
        await api.deleteProjectBranch({
          projectId: options.projectId!,
          branchId: branch.id,
        });
      } catch (error) {
        console.error(`Failed to delete ${branch.name}:`, error);
      }
    }

    console.error('Cleanup complete');
    return;
  }

  throw new Error('Invalid options: provide projectId with deleteProject, branchId, or branchPrefix');
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);

  // Simple usage: destroy-ephemeral-db.ts <project-id>
  if (args.length === 1 && !args[0].startsWith('--')) {
    await destroyEphemeralDb({
      projectId: args[0],
      deleteProject: true,
    });
    return;
  }

  // Parse flags
  const options: CleanupOptions = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        options.projectId = args[++i];
        break;
      case '--branch':
        options.branchId = args[++i];
        break;
      case '--prefix':
        options.branchPrefix = args[++i];
        break;
      case '--delete-project':
        options.deleteProject = true;
        break;
    }
  }

  if (!options.projectId) {
    console.error('Usage:');
    console.error('  npx tsx destroy-ephemeral-db.ts <project-id>');
    console.error('  npx tsx destroy-ephemeral-db.ts --project <id> --branch <branch-id>');
    console.error('  npx tsx destroy-ephemeral-db.ts --project <id> --prefix test/');
    process.exit(1);
  }

  try {
    await destroyEphemeralDb(options);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
