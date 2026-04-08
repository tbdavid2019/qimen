## Why

To allow LLM agents to interact with the Qimen and Meihua services at `qi.david888.com`, we will expose a lightweight **Model Context Protocol (MCP)** endpoint directly on the Vercel-hosted application.

This fulfills the need for:
1.  **Remote Access**: No local installation required for the user.
2.  **Lightweight Integration**: Reuse existing internal logic/APIs.
3.  **Discovery**: Provide a standard protocol for AI tools (Claude, Cursor, etc.).

## What Changes

1.  **MCP SSE Runtime**: Add a lightweight SSE handler to `app.js` at `/api/mcp`.
2.  **Tool Mapping**:
    - `qimen_ask`: Map to the logic used by `/api/qimen-question`.
    - `meihua_ask`: Map to the logic used by `/api/meihua-question`.
3.  **Minimal Dependencies**: Use only necessary `@modelcontextprotocol/sdk` components if possible, or a custom lightweight JSON-RPC over SSE implementation.

## Capabilities

### New Capabilities
- `remote-mcp-endpoint`: A Vercel-compatible SSE endpoint for MCP.

## Impact

- **Backend**: New routes in `app.js`.
- **Logic**: No changes to `lib/` (reuse).
- **Deployment**: Automatic update via Vercel.
