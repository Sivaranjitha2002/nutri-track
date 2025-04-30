#!/bin/bash
# Script to start the application with a custom port
# Usage: bash start-local.sh [port]

# Use provided port or default to 5001
PORT=${1:-5001}

# Start the application with the custom port
PORT=$PORT NODE_ENV=development tsx server/index.ts
