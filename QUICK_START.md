# ⚡ Quick Start Guide - New Architecture

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd /Users/gulshan/StudioJewelai/backend
pip install -r requirements.txt
```

### Step 2: Verify Environment
```bash
cd /Users/gulshan/StudioJewelai
python3 health_check.py
```

### Step 3: Start Backend
```bash
cd backend
python3 -m uvicorn main:app --port 32000 --reload
```

### Step 4: Test Health Check
```bash
curl http://localhost:32000/api/health/status
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/main.py` | Entry point |
| `backend/config/settings.py` | Configuration |
| `backend/routes/*.py` | API endpoints |
| `backend/services/` | Business logic |
| `frontend/src/config/api.js` | API config |
| `frontend/src/services/api.js` | API client |

## Common Commands

```bash
# Backend
cd backend && python3 -m uvicorn main:app --port 32000 --reload

# Health check
python3 health_check.py

# API Docs
# Visit: http://localhost:32000/docs
```

## Next Steps

1. ✅ Install dependencies: `pip install -r backend/requirements.txt`
2. ✅ Run health check: `python3 health_check.py`
3. ✅ Start backend: `python3 -m uvicorn main:app --port 32000 --reload`
4. ⏳ Update frontend to use new API client

---

See RESTRUCTURING_GUIDE.md for detailed instructions.
