#!/usr/bin/env node
/**
 * SetSmart MCP bridge.
 *
 * Speaks stdio to your MCP client (Claude Desktop, Cursor, Claude Code, ...)
 * and forwards every request to the hosted SetSmart MCP server over
 * Streamable HTTP, authenticated with your workspace API key.
 *
 * There is no business logic here on purpose: Instagram, WhatsApp and
 * Messenger messaging all has to go through SetSmart's Meta-approved app,
 * so this process is a thin, auditable pipe and nothing else.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const { version: VERSION } = JSON.parse(
  readFileSync(join(HERE, '..', 'package.json'), 'utf8'),
)

const API_KEY = process.env.SETSMART_API_KEY?.trim()
const ENDPOINT = (
  process.env.SETSMART_MCP_URL?.trim() || 'https://setsmart.io/api/mcp'
)

if (!API_KEY) {
  process.stderr.write(
    '\n[setsmart] SETSMART_API_KEY is not set.\n' +
      '[setsmart] Create a key under Settings -> Integrations at https://setsmart.io\n' +
      '[setsmart] and pass it through the "env" block of your MCP client config.\n\n',
  )
  process.exit(1)
}

/** Connect to the hosted SetSmart MCP server. */
async function connectUpstream() {
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    },
  })

  const client = new Client(
    {
      name: 'setsmart-mcp-bridge',
      version: VERSION,
    },
    {
      capabilities: {},
    },
  )

  await client.connect(transport)
  return client
}

/**
 * The upstream is stateless, so a dropped connection is cheap to rebuild.
 * Reconnect once on failure rather than killing the client's session.
 */
function withReconnect(getClient, setClient) {
  return async (fn) => {
    try {
      return await fn(await getClient())
    } catch (err) {
      process.stderr.write(
        `[setsmart] upstream call failed (${err?.message || err}), reconnecting once\n`,
      )
      const fresh = await connectUpstream()
      setClient(fresh)
      return await fn(fresh)
    }
  }
}

async function main() {
  let upstream = await connectUpstream()
  const call = withReconnect(
    async () => upstream,
    (c) => {
      upstream = c
    },
  )

  const server = new Server(
    {
      name: 'setsmart',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () =>
    call((c) => c.listTools()),
  )

  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    call((c) =>
      c.callTool({
        name: request.params.name,
        arguments: request.params.arguments ?? {},
      }),
    ),
  )

  server.setRequestHandler(ListResourcesRequestSchema, async () =>
    call((c) => c.listResources()),
  )

  server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    call((c) => c.readResource({ uri: request.params.uri })),
  )

  await server.connect(new StdioServerTransport())
  process.stderr.write(`[setsmart] bridge ${VERSION} ready -> ${ENDPOINT}\n`)
}

main().catch((err) => {
  process.stderr.write(`[setsmart] fatal: ${err?.stack || err}\n`)
  process.exit(1)
})
