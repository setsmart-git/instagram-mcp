<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://setsmart.io/setsmart_full_logo.png">
    <img src="https://setsmart.io/setsmart_full_logo_black.png" alt="SetSmart" height="44">
  </picture>
</p>

# Instagram MCP Server (also WhatsApp and Messenger)

An [MCP](https://modelcontextprotocol.io) server that lets Claude, Cursor, Claude Code and any other MCP client read and reply to **Instagram DMs, WhatsApp messages and Facebook Messenger conversations**, through the official Meta Business APIs.

Ask your assistant to *"find the lead who asked about pricing on Instagram and send them the booking template"*, and it happens on the real account.

## Why this one is different

Most Instagram and WhatsApp MCP servers drive a personal account: a browser automation session, an unofficial bridge, or a reverse engineered mobile API. They break when Meta changes something, and they put the account at risk of being disabled.

This one talks to the **official Instagram Messaging API, WhatsApp Cloud API and Messenger Platform**, through SetSmart's Meta-approved Business app. Messaging Instagram, WhatsApp or Messenger programmatically is not possible without an approved app, which is why this bridge requires a SetSmart workspace rather than your Instagram password.

That is the tradeoff, stated plainly: it is not self-hostable against your own account, and it needs a SetSmart API key.

## Requirements

- Node.js 18 or newer
- A [SetSmart](https://setsmart.io) workspace with at least one channel connected (Instagram, WhatsApp or Messenger)
- Your workspace API key, from Settings then Integrations

## Quick start

### Claude Desktop / Claude Code

Add this to your MCP config (`claude_desktop_config.json`, or `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "setsmart": {
      "command": "npx",
      "args": ["-y", "setsmart-mcp"],
      "env": {
        "SETSMART_API_KEY": "your-workspace-api-key"
      }
    }
  }
}
```

### Cursor

Same block, in `~/.cursor/mcp.json`.

### Remote MCP, without this bridge

The SetSmart MCP server is also reachable directly over Streamable HTTP with OAuth, so clients that support remote MCP can skip this package entirely:

```
https://setsmart.io/api/mcp
```

Use this bridge when your client only speaks stdio, or when you would rather authenticate with a static API key than an interactive OAuth consent.

## Tools

30 tools, grouped by what they touch.

### Messaging

| Tool | What it does |
| --- | --- |
| `message_send_text` | Send a text message on Instagram, WhatsApp or Messenger |
| `message_send_image` | Send an image |
| `message_send_video` | Send a video |
| `message_send_audio` | Send a voice message |
| `message_send_template` | Send an approved WhatsApp template |
| `message_send_reaction` | React to a message |

### Conversations

| Tool | What it does |
| --- | --- |
| `conversation_list` | List conversations in the workspace |
| `conversation_search` | Search conversations by name, number or content |
| `conversation_get` | Read one conversation and its status |
| `conversation_get_messages` | Read the message history |
| `conversation_add_tag` | Tag a conversation |
| `conversation_remove_tag` | Remove a tag |
| `conversation_set_notes` | Write internal notes |

### Contacts

| Tool | What it does |
| --- | --- |
| `contact_find` | Find a contact by phone, email, Instagram username or tag |
| `contact_get` | Read one contact |
| `contact_import` | Create a contact |
| `contact_add_tags` | Add tags |
| `contact_remove_tags` | Remove tags |

### AI control

| Tool | What it does |
| --- | --- |
| `ai_get_all_status` | See where the AI assistant is active |
| `ai_pause_conversation` | Stop the assistant on one conversation, for a human handover |
| `ai_resume_conversation` | Hand it back to the assistant |
| `ai_pause_channel` | Pause a whole channel |
| `ai_resume_channel` | Resume a channel |

### Instagram

| Tool | What it does |
| --- | --- |
| `instagram_post_list` | List the account's posts |
| `instagram_post_get_triggers` | Read the comment triggers on a post |
| `comment_reply_get_auto_reply` | Read the automatic comment reply setup |

### Scheduling, templates and stats

| Tool | What it does |
| --- | --- |
| `scheduled_list` | List messages scheduled but not sent |
| `scheduled_cancel` | Cancel a scheduled message |
| `template_list` | List message templates |
| `analytics_stats` | Read conversation and reply stats |

## What it deliberately cannot do

An API key is a long lived static secret, so it gets a restricted surface. These are reachable through interactive OAuth on the remote server, never through this bridge:

- billing and subscription changes
- workspace settings
- connecting or disconnecting a channel
- creating or rewriting AI assistants
- bulk deletion, blacklists, blocked countries

Rotating the key in your SetSmart settings revokes access immediately, on the next request.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `SETSMART_API_KEY` | required | Your workspace API key |
| `SETSMART_MCP_URL` | `https://setsmart.io/api/mcp` | Override the upstream endpoint |

## How it works

This package contains no messaging logic. It is a stdio to Streamable HTTP pipe: your client speaks MCP over stdin and stdout, the bridge forwards each request to the hosted SetSmart MCP server with your key in the `Authorization` header, and streams the answer back. Around 150 lines, in [`src/index.js`](src/index.js), so you can read all of it before trusting it with an account.

## Links

- [SetSmart](https://setsmart.io)
- [REST API documentation](https://setsmart.io/api-documentation)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT
