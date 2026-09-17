# Plotly MCP server

## Security

The server generates a new 256-bit authentication token on every startup and prints it to the launching process's standard output. Every HTTP request must include it:

```text
Authorization: Bearer <startup-token>
```

By default, only `localhost`, `127.0.0.1`, and `[::1]` Host headers and browser origins are accepted. Add trusted hostnames with the comma-separated `MCP_ALLOWED_HOSTS` environment variable. Add exact trusted browser origins, including scheme and port, with `MCP_ALLOWED_ORIGINS`.

The REST `/tools` bridge and `/test` routes are disabled by default. Set `ENABLE_REST_TOOL_BRIDGE=true` only when they are required; Host, Origin, and bearer-token checks still apply. The `/mcp` endpoint is always protected by the same checks.

Never publish the startup token or pass it in a URL. Treat access to this server as privileged because `execute-python-and-capture-chart` executes Python supplied by an authenticated caller.