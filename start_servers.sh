#!/bin/bash

# Kleveer Jewellery AI - Start All Servers
# This script starts both backend and frontend servers

echo "🚀 Starting Kleveer Jewellery AI Servers..."
echo ""

# Kill any existing servers
echo "Stopping existing servers..."
pkill -f "uvicorn server:app" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true
pkill -f "craco" 2>/dev/null || true
sleep 2

# Start Backend
echo "✨ Starting Backend on port 32000..."
cd backend
source venv/bin/activate
uvicorn server:app --port 32000 --host 0.0.0.0 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Check backend
if lsof -ti:32000 > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:32000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start Frontend
echo "✨ Starting Frontend on port 31000..."
cd frontend
BROWSER=none PORT=31000 npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 8

# Check frontend
if lsof -ti:31000 > /dev/null 2>&1; then
    echo "✅ Frontend running on http://localhost:31000"
else
    echo "⚠️  Frontend starting (may take a few more seconds)..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Kleveer Jewellery AI is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Frontend: http://localhost:31000"
echo "⚙️  Backend:  http://localhost:32000"
echo "📄 API Docs: http://localhost:32000/api/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait
