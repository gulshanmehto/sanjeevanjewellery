# Google Gemini API Setup Guide

## Issue
The API key in your `.env` file is invalid or expired. You need to set up a new valid Google Gemini API key.

## Steps to Get a Valid API Key

### 1. Go to Google AI Studio
Visit: https://aistudio.google.com/app/apikey

### 2. Create or Select a Project
- If you don't have a Google Cloud project, create one
- Click on the project dropdown to select your project

### 3. Generate an API Key
- Click "Create API Key"
- Choose "Create API Key in new project" or select an existing project
- Copy the generated API key

### 4. Update Your .env File
Edit `backend/.env` and replace the `GEMINI_API_KEY` value:

```dotenv
GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Restart the Backend Server
Stop the current backend process and restart it:

```bash
cd backend
# If using the start script
bash ../start_backend.sh

# Or manually
source venv/bin/activate
uvicorn server:app --port 32000 --reload
```

## Troubleshooting

### If you get "API_KEY_INVALID" error:
1. Verify your API key is correct (no extra spaces)
2. Make sure you copied the entire key from Google AI Studio
3. Check that your API key has the Generative Language API enabled
4. Try creating a new API key

### To enable the Generative Language API:
1. Go to: https://console.cloud.google.com/
2. Find your project
3. Search for "Generative Language API"
4. Enable it in the API console

## Verifying Your Setup

After updating the API key, you can test it:

```bash
curl -X POST http://localhost:32000/health
```

You should get a response confirming the backend is running.

## Note
- API keys are sensitive credentials. Never commit them to git.
- Keep your `.env` file out of version control (it's in `.gitignore`)
- For production, use environment variables instead of .env files
