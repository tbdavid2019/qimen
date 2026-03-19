## ADDED Requirements

### Requirement: MCP Server Transport
The implementation must support both local and remote access.

#### Scenario: Local Claude Desktop connection
- **WHEN** the server is started via `node scripts/mcp-server.js`.
- **THEN** it should communicate via `stdio` using the MCP SDK.

#### Scenario: Remote SSE connection
- **WHEN** a client connects to `qi.david888.com/api/mcp`.
- **THEN** it should establish a Server-Sent Events (SSE) session for MCP communication.

### Requirement: Authentication
The remote MCP endpoint must be protected.

#### Scenario: Authorized access
- **WHEN** an MCP request is made with a valid `X-MCP-API-KEY` header.
- **THEN** the server should process the request.
