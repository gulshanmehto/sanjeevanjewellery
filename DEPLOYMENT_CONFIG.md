# Production Deployment Configuration

## Backend (Google Cloud Run)

**Service Name**: `sanjeevanjewellery-backend`  
**Region**: `us-central1`  
**URL**: `https://sanjeevanjewellery-backend-381211478432.us-central1.run.app`

### Environment Variables
⚠️ **SECURITY NOTE**: Set these via Google Cloud Console, not in code!

```bash
# Navigate to: Cloud Run → sanjeevanjewellery-backend → Edit & Deploy New Revision → Variables & Secrets
MONGO_URL=<your-mongodb-connection-string>
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-3-pro-image-preview
CORS_ORIGINS=*
DB_NAME=jewelai
```

### Resources
- **Memory**: 2Gi
- **CPU**: 2
- **Timeout**: 300s
- **Min Instances**: 0
- **Max Instances**: 10

## Frontend (Vercel)

**Project Name**: `sanjeevanjewellery`  
**URL**: `https://sanjeevanjewellery.vercel.app`

### Environment Variables (Required in Vercel)
```
REACT_APP_BACKEND_URL=https://sanjeevanjewellery-backend-381211478432.us-central1.run.app
```

**Steps to configure in Vercel:**
1. Go to https://vercel.com → sanjeevanjewellery project
2. Settings → Environment Variables
3. Add `REACT_APP_BACKEND_URL` with the backend URL above
4. Apply to Production, Preview, and Development environments
5. Redeploy the application

## Database (MongoDB Atlas)

**Database Name**: `jewelai`  
**Cluster**: `Cluster0`
⚠️ **Connection string stored in Cloud Run environment variables**

## Deployment Commands

### Backend Deployment
```bash
cd backend
./deploy.sh
```

⚠️ **Note**: Environment variables are already configured in Cloud Run. The deploy script no longer contains sensitive credentials.

### Frontend Deployment
Frontend automatically deploys via Vercel on every push to `main` branch.

## Health Check
```bash
curl https://sanjeevanjewellery-backend-381211478432.us-central1.run.app/api/docs
```

## Status
- ✅ Backend: Live on Google Cloud Run
- ✅ Frontend: Live on Vercel
- ✅ Database: Connected to MongoDB Atlas
- ✅ CORS: Configured to allow all origins
- ✅ API Documentation: Available at `/api/docs`
- ✅ Secrets: Managed securely via Cloud Run environment variables
