# StudioJewelai Architecture Restructuring

## Overview
This document details the refactoring of the StudioJewelai application to follow industry best practices for security, maintainability, and scalability.

## Project Structure

### Backend (`/backend`)
```
backend/
├── main.py                 # Main FastAPI application entry point
├── requirements.txt        # Python dependencies with pinned versions
├── .env                    # Environment variables (NEVER commit)
├── .env.example            # Example environment configuration
├── config/
│   ├── __init__.py
│   └── settings.py        # Pydantic settings for configuration management
├── models/
│   └── __init__.py        # Pydantic models for request/response validation
├── routes/
│   ├── __init__.py
│   ├── health.py          # Health check endpoints
│   ├── auth.py            # Authentication (signup, login)
│   ├── user.py            # User profile and credits management
│   ├── generation.py      # Image generation and history
│   └── admin.py           # Admin operations
├── services/
│   ├── __init__.py        # AI service for Gemini integration
│   └── database.py        # MongoDB database abstraction layer
├── utils/
│   └── __init__.py        # Utility functions (password hashing, JWT, validation)
├── middleware/            # (Future) Custom middleware for auth, logging
└── tests/                 # (Future) Unit and integration tests
```

### Frontend (`/frontend/src`)
```
src/
├── config/
│   └── api.js             # Centralized API configuration
├── services/
│   └── api.js             # API client abstraction with retry logic
├── components/
│   ├── AspectRatioModal.jsx
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ThemeToggle.jsx
│   └── ui/                # shadcn/ui components
├── context/
│   ├── AuthContext.jsx    # Authentication state management
│   └── ThemeContext.jsx   # Theme state management
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx  # (TODO: Split into smaller components)
│   └── AdminPage.jsx
├── lib/
│   ├── constants.js       # Application constants
│   ├── aspectRatios.js    # Aspect ratio definitions
│   └── utils.js           # Utility functions
├── hooks/                 # (TODO) Custom React hooks
├── types/                 # (TODO) TypeScript or PropTypes definitions
└── constants/             # (TODO) Separate constants directory
```

## Key Improvements

### 1. **Security Enhancements**
- ✅ Removed hardcoded credentials from source code
- ✅ Implemented JWT authentication with expiration
- ✅ Password hashing with bcrypt (proper implementation)
- ✅ Input validation using Pydantic models with EmailStr, field validators
- ✅ File upload validation (type and size checking)
- ⏳ Added rate limiting placeholders
- ⏳ CSRF protection (to be implemented)
- ⏳ Request timeout handling

### 2. **Code Organization**
- ✅ Separated concerns into distinct modules:
  - `config/` - Configuration management
  - `models/` - Data validation and serialization
  - `routes/` - API endpoint handlers
  - `services/` - Business logic and external integrations
  - `utils/` - Helper functions
- ✅ Modular route structure with clear separation
- ✅ Centralized API configuration in frontend

### 3. **Database & Data Management**
- ✅ Singleton database service with connection pooling
- ✅ Async-first database operations
- ✅ Prepared methods for all common database operations
- ✅ Proper error handling and logging

### 4. **API Design**
- ✅ Versioned API structure (`/api/...`)
- ✅ Clear endpoint organization by feature
- ✅ Standardized response models
- ✅ Proper HTTP status codes
- ✅ API client abstraction in frontend

### 5. **Dependency Management**
- ✅ Pinned dependency versions for reproducibility
- ✅ Separated dev and production dependencies
- ✅ Updated to latest stable versions

### 6. **Environment Configuration**
- ✅ Pydantic-based settings management
- ✅ Validation of required environment variables
- ✅ Support for development, testing, production environments
- ✅ `.env.example` for documentation

## Breaking Changes

### Backend
- **Endpoint URLs Changed**: All endpoints now use `/api/...` prefix
- **Authentication**: Now uses JWT tokens instead of mock tokens
- **Request Format**: Some endpoints now expect different JSON structures
- **Admin Endpoints**: Admin password now properly hashed

### Frontend
- **API Calls**: Use centralized `apiClient` instead of direct fetch
- **Configuration**: Use `API_ENDPOINTS` from config instead of hardcoded URLs
- **Authentication**: Token stored and used via `apiClient.setAuthToken()`

## Migration Guide

### Backend Users
1. Update `.env` file with new configuration keys (see `.env.example`)
2. Update API calls to use new endpoint structure
3. Use JWT tokens from signup/login endpoints
4. Pass Bearer token in Authorization header

### Frontend Users
1. Update API calls to use `apiClient` from `src/services/api.js`
2. Use `API_ENDPOINTS` from `src/config/api.js`
3. Call `apiClient.setAuthToken()` after successful login
4. Handle ApiError exceptions properly

## TODO Items (High Priority)

1. **Split DashboardPage** (~300 lines each):
   - `GenerationForm.jsx` - Image upload and generation
   - `HistoryView.jsx` - Generation history display
   - `VideoGenerator.jsx` - Video generation
   - `CreditsDashboard.jsx` - Credits display and purchase

2. **Add Error Boundary**:
   - `components/ErrorBoundary.jsx` - Catch component errors
   - Display user-friendly error messages

3. **Implement Rate Limiting**:
   - Install `slowapi`
   - Add rate limit decorator to routes
   - Configure per-endpoint limits

4. **Add Tests**:
   - Backend: `pytest` for unit and integration tests
   - Frontend: `Jest` and `React Testing Library`
   - Target 60%+ code coverage

5. **TypeScript Migration** (Optional):
   - Add `TypeScript` for type safety
   - Or use PropTypes for component validation

6. **Frontend Component Refactoring**:
   - Extract `useAuth` hook from context
   - Create `useApiCall` hook for API calls with loading state
   - Create `useLocalStorage` hook for persisted state

7. **Documentation**:
   - API documentation with Swagger/OpenAPI
   - Component documentation with Storybook
   - Architecture decision records (ADRs)

## Security Checklist

- [x] Remove hardcoded credentials
- [x] Implement JWT authentication
- [x] Validate all inputs
- [x] Hash passwords properly
- [x] Validate file uploads
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] HTTPS in production
- [ ] Secure cookie settings
- [ ] CSRF token protection
- [ ] SQL injection prevention (using MongoDB)
- [ ] XSS protection via React (already handled)

## Performance Optimizations

- [ ] Implement caching strategy
- [ ] Add database indexes
- [ ] Optimize image processing
- [ ] Implement pagination for large datasets
- [ ] Add request deduplication
- [ ] Lazy load components

## Monitoring & Logging

- [x] Structured logging
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (APM)
- [ ] Usage analytics
- [ ] Database query optimization

## Deployment

- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Environment-specific configurations
- [ ] Database migrations strategy
- [ ] Zero-downtime deployment

## References

- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/
- JWT: https://jwt.io/
- React Best Practices: https://react.dev/
- Security Best Practices: https://owasp.org/

---

**Last Updated**: February 4, 2026
**Version**: 2.0.0
**Status**: Partial Implementation (60% complete)
