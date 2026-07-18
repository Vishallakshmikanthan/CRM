# CRM System - Implementation Plan

## 1. Requirements Analysis

### Core Features
- **Authentication**: JWT-based auth with roles (Admin, Manager, Sales Rep)
- **Dashboard**: KPIs, Revenue, Monthly Sales, Active Customers, Lead Conversion Rate
- **Customer Management**: CRUD, Profile, Contact Details, Notes, Timeline
- **Lead Management**: CRUD, Status, Pipeline, Source Tracking, Assignment
- **Opportunity Management**: Sales Pipeline, Deal Value, Close Date, Probability
- **Task Management**: Assign, Due Dates, Priority, Calendar View
- **Email Activity**: Log, Notes, Communication History
- **Reports**: Revenue, Sales, Lead Reports with CSV/PDF Export
- **Settings**: User Management, Teams, Permissions, Company Profile

### Non-functional Requirements
- Clean Architecture, SOLID Principles
- Reusable Components, Modular Structure
- Error Handling, Form Validation
- Responsive UI, Loading/Empty States
- Toast Notifications

---

## 2. Proposed Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE                           │
├──────────────────────┬──────────────────────┬──────────────────┤
│      FRONTEND        │      BACKEND         │    DATABASE      │
│   (React + Vite)     │    (FastAPI)         │   (PostgreSQL)   │
│                      │                      │                  │
│  - TypeScript        │  - SQLAlchemy        │  - Alembic       │
│  - Tailwind CSS      │  - Pydantic          │  - Migrations    │
│  - shadcn/ui         │  - JWT Auth          │                  │
│  - TanStack Query    │  - Role-based Access │                  │
│  - React Router      │                      │                  │
└──────────────────────┴──────────────────────┴──────────────────┘
```

### Backend Architecture (Clean Architecture)
```
backend/
├── app/
│   ├── core/                 # Core configuration, security, database
│   │   ├── config.py         # Settings management
│   │   ├── security.py       # JWT, password hashing
│   │   ├── database.py       # DB connection, session
│   │   └── exceptions.py     # Custom exceptions
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py
│   │   ├── customer.py
│   │   ├── lead.py
│   │   ├── opportunity.py
│   │   ├── task.py
│   │   ├── email_activity.py
│   │   └── base.py
│   ├── schemas/              # Pydantic schemas (API contracts)
│   │   ├── user.py
│   │   ├── customer.py
│   │   ├── lead.py
│   │   ├── opportunity.py
│   │   ├── task.py
│   │   ├── email_activity.py
│   │   └── common.py
│   ├── api/                  # API routes
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── customers.py
│   │   │   ├── leads.py
│   │   │   ├── opportunities.py
│   │   │   ├── tasks.py
│   │   │   ├── email_activities.py
│   │   │   ├── reports.py
│   │   │   └── settings.py
│   │   └── deps.py           # Dependencies (auth, db, pagination)
│   ├── services/             # Business logic layer
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── customer_service.py
│   │   ├── lead_service.py
│   │   ├── opportunity_service.py
│   │   ├── task_service.py
│   │   ├── email_service.py
│   │   └── report_service.py
│   ├── repositories/         # Data access layer
│   │   ├── user_repository.py
│   │   ├── customer_repository.py
│   │   ├── lead_repository.py
│   │   ├── opportunity_repository.py
│   │   ├── task_repository.py
│   │   └── email_repository.py
│   └── main.py               # FastAPI app entry point
├── alembic/                  # Database migrations
├── tests/                    # Unit & integration tests
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Frontend Architecture (Feature-based)
```
frontend/
├── src/
│   ├── app/                  # App-level configuration
│   │   ├── providers.tsx     # Query, Auth, Theme providers
│   │   ├── routes.tsx        # Route definitions
│   │   └── layout.tsx        # Main layout
│   ├── features/             # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── leads/
│   │   ├── opportunities/
│   │   ├── tasks/
│   │   ├── email-activities/
│   │   ├── reports/
│   │   └── settings/
│   ├── shared/               # Shared code across features
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── forms/        # Form components
│   │   │   ├── tables/       # Data table components
│   │   │   ├── modals/       # Modal components
│   │   │   └── layout/       # Layout components
│   │   ├── hooks/            # Shared hooks
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # Shared types
│   │   ├── constants/        # Constants
│   │   └── api/              # API client, interceptors
│   ├── styles/               # Global styles
│   │   └── globals.css
│   ├── main.tsx              # Entry point
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── Dockerfile
└── .env.example
```

---

## 3. Architecture Decisions & Rationale

### Backend: Clean Architecture with FastAPI
| Decision | Rationale |
|----------|-----------|
| **Layered Architecture** | Separation of concerns: API → Services → Repositories → Models |
| **SQLAlchemy 2.0 + Async** | Modern ORM with async support for high performance |
| **Pydantic v2** | Fast validation, serialization, OpenAPI generation |
| **JWT with Refresh Tokens** | Secure stateless auth, token rotation for security |
| **Role-based Access (RBAC)** | Fine-grained permissions per role |
| **Alembic Migrations** | Version-controlled schema changes |
| **Dependency Injection** | Testable, decoupled components |

### Frontend: Feature-based with React
| Decision | Rationale |
|----------|-----------|
| **Feature-based Structure** | Scalable, co-located feature code, clear ownership |
| **TanStack Query** | Server state management, caching, background updates |
| **React Router v6** | Modern routing with data loading patterns |
| **shadcn/ui + Tailwind** | Accessible, customizable, consistent design system |
| **TypeScript Strict Mode** | Type safety, better DX, fewer runtime errors |
| **Zod + React Hook Form** | Schema validation, performant forms |

### DevOps
| Decision | Rationale |
|----------|-----------|
| **Docker Compose** | Consistent dev/prod environments, easy setup |
| **Multi-stage Builds** | Optimized production images |
| **Environment Variables** | Config separation, security |
| **PostgreSQL** | Production-grade, ACID compliance, JSON support |

---

## 4. Implementation Phases

### Phase 1: Foundation & Infrastructure (Week 1)
- [ ] Project structure & configuration files
- [ ] Docker Compose setup (PostgreSQL, Backend, Frontend)
- [ ] Backend: Core config, database, security, exceptions
- [ ] Backend: Base models, User model, Auth schemas
- [ ] Backend: Auth service, JWT, password hashing
- [ ] Backend: Auth API (login, logout, refresh, register)
- [ ] Frontend: Vite + React + TS + Tailwind + shadcn/ui setup
- [ ] Frontend: API client, auth context, providers
- [ ] Frontend: Login page, protected routes
- [ ] Alembic initial migration

### Phase 2: User Management & RBAC (Week 1-2)
- [ ] Backend: User CRUD, roles, permissions
- [ ] Backend: User API endpoints
- [ ] Backend: Role-based dependency injection
- [ ] Frontend: User management UI (Admin only)
- [ ] Frontend: Role-based navigation/permissions
- [ ] Frontend: Profile page

### Phase 3: Dashboard & KPIs (Week 2)
- [ ] Backend: Dashboard service with aggregations
- [ ] Backend: Dashboard API endpoints
- [ ] Frontend: Dashboard layout with KPI cards
- [ ] Frontend: Charts (Revenue, Sales, Conversion)
- [ ] Frontend: Real-time data with TanStack Query

### Phase 4: Customer Management (Week 2-3)
- [ ] Backend: Customer model, schemas, repository, service
- [ ] Backend: Customer API (CRUD, search, pagination)
- [ ] Backend: Contact details, notes, timeline models
- [ ] Frontend: Customer list with search/filter/pagination
- [ ] Frontend: Customer create/edit modal/forms
- [ ] Frontend: Customer profile page (details, contacts, notes, timeline)
- [ ] Frontend: Notes & timeline components

### Phase 5: Lead Management (Week 3)
- [ ] Backend: Lead model, status enum, pipeline, source tracking
- [ ] Backend: Lead API (CRUD, status transitions, assignment)
- [ ] Frontend: Lead list with Kanban pipeline view
- [ ] Frontend: Lead create/edit forms
- [ ] Frontend: Lead detail with activity timeline
- [ ] Frontend: Drag-and-drop pipeline (optional: @dnd-kit)

### Phase 6: Opportunity Management (Week 3-4)
- [ ] Backend: Opportunity model, pipeline stages, probability
- [ ] Backend: Opportunity API (CRUD, stage transitions)
- [ ] Frontend: Opportunity pipeline (Kanban)
- [ ] Frontend: Opportunity detail with deal value, close date
- [ ] Frontend: Probability weighting, forecasting

### Phase 7: Task Management (Week 4)
- [ ] Backend: Task model, priority, due dates, assignments
- [ ] Backend: Task API (CRUD, calendar events)
- [ ] Frontend: Task list with filters
- [ ] Frontend: Calendar view (react-big-calendar or similar)
- [ ] Frontend: Task assignment, priority badges

### Phase 8: Email Activity & Communication (Week 4)
- [ ] Backend: Email activity model, threading
- [ ] Backend: Email API (log, search, thread view)
- [ ] Frontend: Email log list
- [ ] Frontend: Communication timeline component
- [ ] Frontend: Email compose/log modal

### Phase 9: Reports & Export (Week 4-5)
- [ ] Backend: Report service (revenue, sales, leads)
- [ ] Backend: CSV export (streaming)
- [ ] Backend: PDF export (reportlab or weasyprint)
- [ ] Frontend: Reports dashboard with date ranges
- [ ] Frontend: Export buttons (CSV/PDF)
- [ ] Frontend: Report visualizations

### Phase 10: Settings & Company Profile (Week 5)
- [ ] Backend: Settings model, company profile
- [ ] Backend: Teams, permissions management
- [ ] Frontend: Settings pages (users, teams, permissions)
- [ ] Frontend: Company profile form
- [ ] Frontend: Appearance/theme settings

### Phase 11: Polish & Production Ready (Week 5-6)
- [ ] Error boundaries, loading states, empty states
- [ ] Toast notifications (sonner)
- [ ] Form validation (Zod schemas)
- [ ] Responsive design testing
- [ ] Accessibility audit
- [ ] Unit/integration tests
- [ ] E2E tests (Playwright)
- [ ] Docker production optimization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Documentation (README, API docs)

---

## 5. Database Schema Overview

### Core Tables
```sql
-- Users & Auth
users (id, email, hashed_password, full_name, role, is_active, created_at, updated_at)
roles (id, name, description, permissions)
user_sessions (id, user_id, refresh_token, expires_at, created_at)

-- Customers
customers (id, company_name, contact_person, email, phone, address, city, country, 
           industry, annual_revenue, employee_count, status, source, assigned_to, 
           created_at, updated_at)
customer_contacts (id, customer_id, name, email, phone, role, is_primary)
customer_notes (id, customer_id, user_id, content, created_at)
customer_timeline (id, customer_id, user_id, activity_type, description, metadata, created_at)

-- Leads
leads (id, first_name, last_name, email, phone, company, source, status, 
       assigned_to, estimated_value, notes, created_at, updated_at)
lead_sources (id, name, description)
lead_statuses (id, name, order, color, is_default, is_won, is_lost)

-- Opportunities
opportunities (id, name, customer_id, lead_id, stage, value, probability, 
               expected_close_date, actual_close_date, assigned_to, notes, 
               created_at, updated_at)
opportunity_stages (id, name, order, probability, color)

-- Tasks
tasks (id, title, description, type, priority, status, due_date, 
       assigned_to, related_type, related_id, created_by, created_at, updated_at)

-- Email Activities
email_activities (id, subject, body, direction, status, sent_at, 
                  from_email, to_emails, cc_emails, bcc_emails,
                  related_type, related_id, user_id, created_at)

-- Settings
company_settings (id, company_name, logo, address, phone, email, website, 
                  timezone, currency, date_format, created_at, updated_at)
teams (id, name, description, created_at, updated_at)
team_members (id, team_id, user_id, role, joined_at)
```

---

## 6. API Endpoints Summary

### Auth
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/register` - Register (admin only)
- `GET /api/v1/auth/me` - Current user

### Users (Admin/Manager)
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PATCH /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user
- `PATCH /api/v1/users/{id}/role` - Change role
- `PATCH /api/v1/users/{id}/deactivate` - Deactivate

### Customers
- `GET /api/v1/customers` - List (paginated, search, filter)
- `POST /api/v1/customers` - Create
- `GET /api/v1/customers/{id}` - Get with relations
- `PATCH /api/v1/customers/{id}` - Update
- `DELETE /api/v1/customers/{id}` - Delete
- `GET /api/v1/customers/{id}/timeline` - Timeline
- `POST /api/v1/customers/{id}/notes` - Add note
- `POST /api/v1/customers/{id}/contacts` - Add contact

### Leads
- `GET /api/v1/leads` - List (paginated, search, filter)
- `POST /api/v1/leads` - Create
- `GET /api/v1/leads/{id}` - Get
- `PATCH /api/v1/leads/{id}` - Update
- `PATCH /api/v1/leads/{id}/status` - Change status
- `PATCH /api/v1/leads/{id}/assign` - Assign
- `DELETE /api/v1/leads/{id}` - Delete
- `GET /api/v1/leads/pipeline` - Pipeline view

### Opportunities
- `GET /api/v1/opportunities` - List
- `POST /api/v1/opportunities` - Create
- `GET /api/v1/opportunities/{id}` - Get
- `PATCH /api/v1/opportunities/{id}` - Update
- `PATCH /api/v1/opportunities/{id}/stage` - Change stage
- `DELETE /api/v1/opportunities/{id}` - Delete
- `GET /api/v1/opportunities/pipeline` - Pipeline view
- `GET /api/v1/opportunities/forecast` - Forecast

### Tasks
- `GET /api/v1/tasks` - List (with calendar params)
- `POST /api/v1/tasks` - Create
- `GET /api/v1/tasks/{id}` - Get
- `PATCH /api/v1/tasks/{id}` - Update
- `PATCH /api/v1/tasks/{id}/complete` - Complete
- `DELETE /api/v1/tasks/{id}` - Delete
- `GET /api/v1/tasks/calendar` - Calendar events

### Email Activities
- `GET /api/v1/emails` - List
- `POST /api/v1/emails` - Log email
- `GET /api/v1/emails/{id}` - Get
- `GET /api/v1/emails/thread/{related_type}/{related_id}` - Thread view

### Reports
- `GET /api/v1/reports/revenue` - Revenue report
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/leads` - Lead report
- `GET /api/v1/reports/export/csv` - Export CSV
- `GET /api/v1/reports/export/pdf` - Export PDF

### Settings
- `GET /api/v1/settings/company` - Company profile
- `PATCH /api/v1/settings/company` - Update company
- `GET /api/v1/settings/teams` - List teams
- `POST /api/v1/settings/teams` - Create team
- `PATCH /api/v1/settings/teams/{id}` - Update team
- `DELETE /api/v1/settings/teams/{id}` - Delete team
- `POST /api/v1/settings/teams/{id}/members` - Add member
- `DELETE /api/v1/settings/teams/{id}/members/{user_id}` - Remove member

---

## 7. Next Steps

**Ready to begin Phase 1: Foundation & Infrastructure**

This phase will establish:
1. Complete project structure
2. Docker Compose with all services
3. Backend core (config, DB, security, auth)
4. Frontend setup with all dependencies
5. Initial database migration

Please review this plan and approve to proceed with Phase 1 implementation.