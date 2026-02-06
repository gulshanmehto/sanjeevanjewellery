#!/bin/bash
# Setup script for new refactored backend

set -e

echo "=================================================="
echo "StudioJewelai Backend Setup (Refactored)"
echo "=================================================="
echo ""

# Check Python version
echo "1️⃣  Checking Python version..."
python3_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Found Python $python3_version"

# Check if venv exists
echo ""
echo "2️⃣  Setting up virtual environment..."
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/backend" && pwd)"
VENV_DIR="$BACKEND_DIR/venv"

if [ -d "$VENV_DIR" ]; then
    echo "   Virtual environment already exists at $VENV_DIR"
else
    echo "   Creating new virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo "   ✅ Virtual environment created"
fi

# Activate venv
echo ""
echo "3️⃣  Activating virtual environment..."
source "$VENV_DIR/bin/activate"
echo "   ✅ Virtual environment activated"

# Install/upgrade pip
echo ""
echo "4️⃣  Upgrading pip..."
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
echo "   ✅ pip upgraded"

# Install dependencies
echo ""
echo "5️⃣  Installing dependencies..."
cd "$BACKEND_DIR"
pip install -r requirements.txt
echo "   ✅ All dependencies installed"

# Check environment configuration
echo ""
echo "6️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    echo "   ✅ .env file found"
    
    # Check for required keys
    if grep -q "GEMINI_API_KEY" .env; then
        echo "   ✅ GEMINI_API_KEY configured"
    else
        echo "   ⚠️  GEMINI_API_KEY not in .env (using environment variable?)"
    fi
    
    if grep -q "MONGO_URL" .env; then
        echo "   ✅ MONGO_URL configured"
    else
        echo "   ⚠️  MONGO_URL not in .env"
    fi
else
    echo "   ⚠️  .env file not found"
    echo "   Copy .env.example to .env and update with your values"
fi

# Test imports
echo ""
echo "7️⃣  Testing imports..."
python3 -c "
import fastapi
import pydantic
import motor
import google.generativeai
print('   ✅ All critical imports successful')
" || {
    echo "   ❌ Import test failed"
    exit 1
}

# Check MongoDB
echo ""
echo "8️⃣  Checking MongoDB..."
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        print('   ✅ MongoDB is running and accessible')
        client.close()
    except Exception as e:
        print(f'   ⚠️  MongoDB check failed: {e}')
        print('   Start MongoDB with: brew services start mongodb-community')

asyncio.run(check_db())
" || true

echo ""
echo "9️⃣  Running health check..."
cd /Users/gulshan/StudioJewelai
python3 health_check.py || true

echo ""
echo "=================================================="
echo "✅ Backend setup complete!"
echo "=================================================="
echo ""
echo "To start the server, run:"
echo ""
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python3 -m uvicorn main:app --port 32000 --reload"
echo ""
echo "API will be available at: http://localhost:32000"
echo "API Docs: http://localhost:32000/docs"
echo ""
