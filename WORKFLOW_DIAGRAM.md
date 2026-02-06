```mermaid
sequenceDiagram
    participant U as User (Frontend)
    participant B as Backend (Cloud Run)
    participant G as Gemini AI
    participant S as Amazon S3
    participant M as MongoDB
    participant W as GPU Worker (VM)

    Note over U,W: Complete Image Generation Workflow

    %% Step 1: User initiates generation
    U->>B: POST /api/generate<br/>(image, category, preset, ratio)
    activate B
    
    %% Step 2: Gemini generation
    B->>G: Generate image with prompt
    activate G
    G-->>B: Generated image (original)
    deactivate G
    
    %% Step 3: Upload to S3
    B->>S: Upload original.png
    B->>S: Upload generated.png
    activate S
    S-->>B: s3://bucket/jobs/{job_id}/
    deactivate S
    
    %% Step 4: Create job
    B->>M: Create job document<br/>{status: "queued", input_s3_key, output_s3_key}
    activate M
    M-->>B: job_id
    deactivate M
    
    %% Step 5: Return to frontend
    B-->>U: {job_id, status: "processing"}
    deactivate B
    
    %% Step 6: Frontend starts polling
    Note over U,B: Frontend polls every 4s
    
    %% Step 7: Worker claims job
    W->>B: POST /api/jobs/next
    activate B
    B->>M: Find queued job & mark processing
    M-->>B: job details
    B-->>W: {job_id, input_s3_key, output_s3_key, aspect_ratio}
    deactivate B
    
    %% Step 8: Worker processes
    activate W
    W->>S: Download input image
    S-->>W: generated.png bytes
    
    Note over W: Real-ESRGAN 4x upscaling<br/>on NVIDIA L4 GPU
    
    W->>S: Upload output.png (4x upscaled)
    S-->>W: s3://bucket/jobs/{job_id}/output.png
    
    %% Step 9: Mark complete
    W->>B: POST /api/jobs/{job_id}/complete<br/>{output_s3_key}
    activate B
    B->>M: Update job {status: "completed", output_s3_key}
    M-->>B: Updated
    deactivate B
    deactivate W
    
    %% Step 10: Frontend polls and gets result
    U->>B: GET /api/jobs/{job_id}
    activate B
    B->>M: Get job status
    M-->>B: {status: "completed", output_s3_key}
    
    B->>S: Generate signed URL (1 hour TTL)
    S-->>B: https://s3...?signed=...
    
    B-->>U: {status: "completed", output_url}
    deactivate B
    
    %% Step 11: Display result
    U->>S: GET signed URL
    S-->>U: Image bytes (4x upscaled)
    
    Note over U: Display final<br/>upscaled image
    
    %% Idle shutdown
    Note over W: If idle > 5 min:<br/>sudo shutdown -h now
```

## Key Points:

### ⚡ Performance
- **Gemini generation**: ~10-30s
- **S3 upload**: <1s
- **GPU upscaling**: ~5-15s depending on image size
- **Total**: ~20-50s end-to-end

### 💰 Cost Optimization
- GPU VM only runs when processing jobs
- Auto-shuts down after 5 minutes of inactivity
- Cloud Run scales to zero when not in use
- S3 storage: only pay for what you store

### 🔒 Security
- Signed S3 URLs with 1-hour expiration
- AWS credentials stored as environment variables
- No images stored in MongoDB (only references)
- Worker authentication via Worker-Id header

### 🎯 Scalability
- Multiple workers can run simultaneously
- Jobs processed in FIFO order
- MongoDB ensures atomic job claiming
- S3 handles unlimited concurrent downloads

### 🛡️ Reliability
- Job status tracking in MongoDB
- Failed jobs marked explicitly
- Frontend polls until completion
- Worker errors logged and reported
