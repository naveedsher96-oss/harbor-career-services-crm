#!/usr/bin/env bash
set -e

if [ -f .env.local ]; then
 set -a
 source .env.local
 set +a
else
 echo ".env.local not found - create it with your DATABASE_URL first"
 exit 1
fi

cleanup() {
 echo ""
 echo "Stopping servers..."
 kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting backend on port 5000..."
PORT=5000 pnpm --filter @workspace/api-server run dev &
BACKEND_PID=$!

echo "Starting frontend on port 5173..."
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/career-services-crm run dev &
FRONTEND_PID=$!

wait
