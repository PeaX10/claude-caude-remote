#!/bin/bash

PROJECT_NAME="${1:-Claude Project}"
PROJECT_ID="${2:-project-$(date +%s)}"
PROJECT_PATH="${3:-$(pwd)}"
REMOTE_SERVER="${4:-http://localhost:3000}"
SCRIPT_DIR="$(dirname "$0")"


MCP_CONFIG="/tmp/mcp-config-${PROJECT_ID}.json"
cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "remote-control": {
      "command": "node",
      "args": ["${SCRIPT_DIR}/mcp-bridge.js"],
      "env": {
        "INSTANCE_NAME": "${PROJECT_NAME}",
        "INSTANCE_ID": "${PROJECT_ID}",
        "REMOTE_SERVER": "${REMOTE_SERVER}",
        "PROJECT_PATH": "${PROJECT_PATH}"
      }
    }
  }
}
EOF


exec claude --mcp-config "$MCP_CONFIG"