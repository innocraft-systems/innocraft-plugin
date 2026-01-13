#!/usr/bin/env npx tsx
/**
 * Validate Neon database connection
 *
 * Usage:
 *   npx tsx validate-connection.ts
 *   npx tsx validate-connection.ts --http   # HTTP only
 *   npx tsx validate-connection.ts --ws     # WebSocket only
 *
 * Environment:
 *   DATABASE_URL - Required database connection string
 */

import { neon, Pool, neonConfig } from '@neondatabase/serverless';

interface ConnectionTestResult {
  httpOk: boolean;
  websocketOk: boolean;
  latencyMs: number;
  timestamp: Date;
  error?: string;
  serverVersion?: string;
}

export async function checkHttpConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  version?: string;
  error?: string;
}> {
  const sql = neon(process.env.DATABASE_URL!);
  const start = Date.now();

  try {
    const result = await sql`SELECT version() as version, 1 as health_check`;
    return {
      ok: result[0]?.health_check === 1,
      latencyMs: Date.now() - start,
      version: result[0]?.version,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function checkPoolConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  version?: string;
  error?: string;
}> {
  // WebSocket setup for Node.js
  let ws: any;
  try {
    ws = await import('ws');
    neonConfig.webSocketConstructor = ws.default || ws;
  } catch {
    // ws not available, skip WebSocket test
    return {
      ok: false,
      latencyMs: 0,
      error: 'ws package not installed (npm install ws)',
    };
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const start = Date.now();

  try {
    const { rows } = await pool.query('SELECT version() as version, NOW() as current_time');
    return {
      ok: true,
      latencyMs: Date.now() - start,
      version: rows[0]?.version,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await pool.end();
  }
}

export async function testConnections(mode?: 'http' | 'ws'): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const result: ConnectionTestResult = {
    httpOk: false,
    websocketOk: false,
    latencyMs: 0,
    timestamp: new Date(),
  };

  try {
    if (!mode || mode === 'http') {
      const httpResult = await checkHttpConnection();
      result.httpOk = httpResult.ok;
      if (httpResult.version) result.serverVersion = httpResult.version;
      if (httpResult.error) result.error = httpResult.error;
    }

    if (!mode || mode === 'ws') {
      const wsResult = await checkPoolConnection();
      result.websocketOk = wsResult.ok;
      if (wsResult.version && !result.serverVersion) result.serverVersion = wsResult.version;
      if (wsResult.error && !result.error) result.error = wsResult.error;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  result.latencyMs = Date.now() - startTime;
  return result;
}

// CLI execution
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const mode = args.includes('--http') ? 'http' : args.includes('--ws') ? 'ws' : undefined;

  console.log('Testing Neon database connection...\n');

  const result = await testConnections(mode);

  console.log('Results:');
  console.log(`  HTTP Connection:      ${result.httpOk ? '✓ OK' : '✗ Failed'}`);
  console.log(`  WebSocket Connection: ${result.websocketOk ? '✓ OK' : '✗ Failed'}`);
  console.log(`  Total Latency:        ${result.latencyMs}ms`);

  if (result.serverVersion) {
    const versionMatch = result.serverVersion.match(/PostgreSQL ([\d.]+)/);
    if (versionMatch) {
      console.log(`  PostgreSQL Version:   ${versionMatch[1]}`);
    }
  }

  if (result.error) {
    console.log(`\nError: ${result.error}`);
  }

  // Exit with error if both failed
  if (!result.httpOk && !result.websocketOk) {
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
