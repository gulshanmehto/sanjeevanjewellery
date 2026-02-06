#!/bin/bash

# Port configuration
FRONTEND_PORT=31000
BACKEND_PORT=32000

echo "Starting JewelAI Studio Pro locally..."

# Start Backend
echo "Setting up backend on port $BACKEND_PORT..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt || echo "Warning: Some dependencies failed to install, check requirements.txt"
# Run backend in background using full path to uvicorn
nohup ./venv/bin/uvicorn server:app --port $BACKEND_PORT --host 0.0.0.0 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID (monitoring backend.log)"

# Start Frontend
echo "Setting up frontend on port $FRONTEND_PORT..."
cd ../frontend
# Ensure .env is set
echo "REACT_APP_BACKEND_URL=http://localhost:$BACKEND_PORT" > .env
echo "PORT=$FRONTEND_PORT" >> .env

# Run frontend
echo "Installing frontend dependencies (may take a minute)..."
npm install --legacy-peer-deps --prefer-offline --no-audit
echo "Starting frontend..."
nohup ./node_modules/.bin/craco start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID (monitoring frontend.log)"

echo "------------------------------------------------"
echo "JewelAI is now running!"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend API: http://localhost:$BACKEND_PORT/api"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop (wait, this script is in background, use: kill $BACKEND_PID $FRONTEND_PID)"
