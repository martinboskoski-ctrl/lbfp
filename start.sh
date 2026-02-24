#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null
  wait "$SERVER_PID" "$CLIENT_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "Starting PackFlow..."

npm run dev --prefix "$ROOT/server" &
SERVER_PID=$!

npm run dev --prefix "$ROOT/client" &
CLIENT_PID=$!

echo "Server PID: $SERVER_PID  |  Client PID: $CLIENT_PID"
echo "Press Ctrl+C to stop both."

wait
