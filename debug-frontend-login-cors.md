# Debug Session: frontend-login-cors

## Status
- [OPEN] Investigating frontend login failure from `http://localhost:3000` to `http://localhost:8000`.

## Symptoms
- Frontend initially rendered a blank screen.
- After initial UI fixes, the login page renders, but browser login from the frontend fails with `net::ERR_FAILED`.
- Direct backend login with the same credentials succeeds.

## Hypotheses
1. Backend CORS settings do not allow the frontend origin at runtime.
2. The browser preflight or request headers are rejected before the FastAPI login handler runs.
3. The frontend Axios request shape differs from the successful direct API call.
4. The backend response reaches the browser but is blocked by malformed or missing CORS headers.

## Evidence Collected
- Backend server starts successfully on `http://localhost:8000`.
- Frontend server starts successfully on `http://localhost:3000`.
- Direct POST to `/api/v1/auth/login` succeeds with `admin@example.com / admin123`.
- Browser-based login from the frontend fails and needs deeper runtime inspection.

## Next Step
- Add targeted non-business instrumentation around backend login/CORS handling, reproduce once, and compare observed request/response details against the hypotheses.
