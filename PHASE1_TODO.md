# Phase 1: Foundation & Infrastructure - TODO List

## Backend Setup
- [x] Project structure & configuration files
- [x] Docker Compose setup (PostgreSQL, Backend, Frontend)
- [x] Backend: Core config, database, security, exceptions
- [x] Backend: Base models, User model, UserSession model
- [x] Backend: Pydantic schemas (common, user, auth)
- [x] Backend: Base repository, User repository, UserSession repository
- [x] Backend: Auth service, JWT, password hashing
- [x] Backend: Auth API (login, logout, refresh, register, me)
- [x] Backend: API dependencies (auth, db, pagination)
- [x] Backend: Main FastAPI app with CORS, middleware
- [x] Alembic initial migration

## Frontend Setup
- [x] Vite + React + TypeScript + Tailwind + shadcn/ui setup
- [x] Project structure (feature-based)
- [x] UI components (button, input, label, card, form, toast, avatar, dropdown, etc.)
- [x] API client with axios interceptors (auth, refresh token)
- [x] Auth utilities (token storage, validation)
- [x] Auth context & hooks (login, logout, refresh, roles)
- [x] Providers (QueryClient, Auth, Tooltip, Toaster)
- [x] Layout components (MainLayout, AuthLayout, Sidebar)
- [x] Routing with React Router (protected, public, role-based routes)
- [x] Login page with form validation
- [x] Profile page with profile/password forms

## Frontend Pages (Placeholder - Need Implementation)
- [x] Dashboard page with KPI cards
- [x] Customers list page
- [x] Customer form component
- [x] Customer detail page
- [ ] Leads list page (with pipeline/Kanban)
- [ ] Lead detail page
- [ ] Opportunities list page
- [ ] Opportunity detail page
- [ ] Tasks page (list + calendar)
- [ ] Emails page
- [ ] Reports page
- [ ] Settings page
- [ ] Users management page (admin/manager)
- [ ] Teams management page (admin/manager)
- [ ] Company profile page (admin)
- [x] Not found page

## DevOps & Testing
- [ ] Frontend Dockerfile
- [ ] Backend Dockerfile
- [ ] Docker Compose production config
- [ ] Environment variables (.env.example)
- [ ] Git ignore
- [ ] README with setup instructions
- [ ] Run `npm install` in frontend
- [ ] Run `pip install` in backend
- [ ] Run Alembic migrations
- [ ] Test backend API
- [ ] Test frontend build
- [ ] Test Docker Compose up

## Code Quality
- [ ] ESLint + Prettier config
- [ ] TypeScript strict mode
- [ ] Backend linting (ruff/black)
- [ ] Unit tests setup (pytest, vitest)