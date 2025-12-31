#!/usr/bin/env npx tsx
/**
 * Create an ephemeral Neon database for testing
 *
 * Usage:
 *   npx tsx create-ephemeral-db.ts [name]
 *
 * Environment:
 *   NEON_API_KEY - Required Neon API key
 *
 * Output:
 *   Prints DATABASE_URL to stdout for use in scripts
 */

import { NeonToolkit } from '@neondatabase/toolkit';

interface EphemeralDb {
  project: any;
  projectId: string;
  connectionString: string;
  cleanup: () => Promise<void>;
}

export async function createEphemeralDb(options?: {
  name?: string;
  pgVersion?: number;
  region?: string;
}): Promise<EphemeralDb> {
  if (!process.env.NEON_API_KEY) {
    throw new Error('NEON_API_KEY environment variable is required');
  }

  const toolkit = new NeonToolkit(process.env.NEON_API_KEY);

  const projectName = options?.name || `ephemeral-${Date.now()}`;
  console.error(`Creating ephemeral database: ${projectName}`);

  const project = await toolkit.createProject({
    name: projectName,
    pg_version: options?.pgVersion || 16,
  });

  const connectionString = project.connectionURIs[0].connection_uri;
  const projectId = project.project.id;

  console.error(`Database created: ${projectName}`);
  console.error(`Project ID: ${projectId}`);

  return {
    project,
    projectId,
    connectionString,
    cleanup: async () => {
      console.error(`Deleting ephemeral database: ${projectName}`);
      await toolkit.deleteProject(project);
      console.error('Database deleted');
    },
  };
}

// CLI execution
async function main() {
  const name = process.argv[2];

  try {
    const db = await createEphemeralDb({ name });

    // Output connection string to stdout (for scripting)
    console.log(db.connectionString);

    // Output metadata to stderr (for human reading)
    console.error('\nTo use this database:');
    console.error(`  export DATABASE_URL="${db.connectionString}"`);
    console.error('\nTo cleanup when done:');
    console.error(`  npx tsx destroy-ephemeral-db.ts ${db.projectId}`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
