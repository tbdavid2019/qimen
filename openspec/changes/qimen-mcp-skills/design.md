## Context

The user wants a **lightweight**, **zero-dependency** MCP bridge that calls the remote APIs of `qi.david888.com`. 

## Goals

- **No Installation**: The script should run with standard Node.js without `npm install`.
- **Remote Access**: Connect local LLMs to the production service.
- **Easy Configuration**: Simple instructions for Claude Desktop or Cursor.

## Decisions

### 1. Minimalistic MCP Implementation
Instead of using the `@modelcontextprotocol/sdk`, we will implement a basic JSON-RPC 2.0 handler over `stdio` using only Node.js `process.stdin` and `process.stdout`. 

### 2. Remote Communication
Use the built-in `https` module to call:
- `POST https://qi.david888.com/api/qimen-question`
- `POST https://qi.david888.com/api/meihua-question`

### 3. File Location
A standalone file `mcp-bridge.js` (location to be determined - possibly in a `temp/` or `dist/` folder, or just provided as a snippet). Since the user doesn't want it "installed in the set", I will suggest placing it outside the main project's source tree if desired.

## Tools

- `qimen_divination(question, datetime)`: Returns analysis from the remote server.
- `meihua_divination(question, method)`: Returns analysis from the remote server.

## Risks

- **JSON-RPC Complexity**: implementing the protocol from scratch requires careful handling of message framing (length-prefix or character-delimited). *Decision*: Use character-delimited (newline) as it's common for stdio MCP.
