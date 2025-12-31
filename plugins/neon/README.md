# Neon Plugin for Claude Code

Complete Neon serverless PostgreSQL integration. Covers Drizzle ORM, serverless driver, ephemeral databases, Neon Auth, unified SDK, MCP server integration, and vector/RAG capabilities with hybrid search.

## Features

- **7 Skills**: Auto-triggering knowledge for Neon components
- **9 Commands**: User-initiated setup workflows
- **2 Agents**: Autonomous validation and migration assistance
- **MCP Integration**: AI assistant database interaction
- **Templates**: Ready-to-use code for common setups

## Skills

| Skill | Triggers On |
|-------|-------------|
| `neon-drizzle` | Drizzle ORM setup, schemas, migrations |
| `neon-serverless` | Serverless driver, HTTP/WebSocket adapters |
| `neon-toolkit` | Ephemeral databases, testing, CI/CD |
| `neon-auth` | Authentication, Better Auth, RLS |
| `neon-js` | Unified SDK, auth + data client |
| `neon-mcp` | MCP server, AI integration |
| `neon-vector` | pgvector, embeddings, RAG, hybrid search |

## Commands

| Command | Description |
|---------|-------------|
| `/neon:setup-drizzle` | Set up Drizzle ORM with Neon |
| `/neon:setup-auth-nextjs` | Set up Neon Auth for Next.js |
| `/neon:setup-auth-react` | Set up Neon Auth for React SPA |
| `/neon:setup-serverless` | Configure serverless driver |
| `/neon:setup-neon-js` | Set up unified SDK |
| `/neon:create-ephemeral-db` | Create test database |
| `/neon:add-docs` | Add AI rules files |
| `/neon:setup-vector` | Set up vector/RAG infrastructure |
| `/neon:setup-mcp` | Configure MCP server |

## Agents

| Agent | Purpose |
|-------|---------|
| `neon-setup-verifier` | Validates Neon configuration |
| `neon-migration-helper` | Assists with schema changes and migrations |

## Prerequisites

- **Neon Account**: Sign up at [neon.tech](https://neon.tech)
- **API Key** (for toolkit/MCP): Get from Neon Console > Account settings > API keys
- **Node.js 18+**

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
NEON_API_KEY=your_api_key
```

## License

MIT
