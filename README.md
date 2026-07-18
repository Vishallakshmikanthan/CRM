<div align="center">

# 🚀 Enterprise CRM System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A modern, full-featured Customer Relationship Management platform built with enterprise-grade technologies**

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🚀 Quick Start](#-quick-start)
- [📊 API Documentation](#-api-documentation)
- [🔐 Authentication](#-authentication)
- [📁 Project Structure](#-project-structure)
- [🔄 Development Workflow](#-development-workflow)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### Core CRM Capabilities

- **🔐 Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin, Manager, Sales Rep)
  - Secure password hashing with bcrypt
  - Session management

- **📊 Dashboard & Analytics**
  - Real-time KPIs and metrics
  - Revenue tracking and visualization
  - Monthly sales analytics
  - Active customer monitoring
  - Lead conversion rate tracking
  - Interactive charts with Recharts

- **👥 Customer Management**
  - Complete customer CRUD operations
  - Customer profiles with detailed information
  - Contact management (multiple contacts per customer)
  - Notes and activity timeline
  - Advanced search, filter, and pagination
  - Customer segmentation

- **🎯 Lead Management**
  - Lead capture and tracking
  - Kanban-style pipeline view
  - Lead source tracking
  - Status management and transitions
  - Lead assignment to team members
  - Drag-and-drop pipeline management
  - Activity timeline

- **💼 Opportunity Management**
  - Sales pipeline tracking
  - Deal value and probability management
  - Expected vs actual close dates
  - Forecasting capabilities
  - Stage-based pipeline visualization
  - Opportunity assignment

- **✅ Task Management**
  - Task creation and assignment
  - Priority levels and due dates
  - Calendar view integration
  - Task completion tracking
  - Related entity linking (customers, leads, opportunities)
  - Filter and search capabilities

- **📧 Email Activity Tracking**
  - Email logging and threading
  - Communication history
  - Email composition and tracking
  - Direction tracking (inbound/outbound)
  - Related entity association
  - Thread view for conversations

- **📈 Reports & Export**
  - Revenue reports with date ranges
  - Sales performance analytics
  - Lead generation reports
  - CSV export functionality
  - PDF report generation
  - Custom date range filtering

- **⚙️ Settings & Configuration**
  - Company profile management
  - Team management and organization
  - User management (Admin only)
  - Permission and role configuration
  - System-wide settings
  - Appearance and theme options

### Technical Features

- **🏗️ Clean Architecture**
  - Backend: Layered architecture (API → Services → Repositories → Models)
  - Frontend: Feature-based modular structure
  - Separation of concerns
  - SOLID principles

- **🔒 Security**
  - CORS configuration
  - SQL injection prevention
  - XSS protection
  - Input validation with Pydantic/Zod
  - Environment variable management

- **⚡ Performance**
  - Async/await for database operations
  - Optimized database queries
  - Client-side caching with TanStack Query
  - Lazy loading and code splitting

- **🎨 User Experience**
  - Responsive design (mobile, tablet, desktop)
  - Dark mode support
  - Loading and empty states
  - Toast notifications
  - Form validation with real-time feedback
  - Accessible UI components (shadcn/ui)

---

## 🏗️ Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend]
        A1[TypeScript]
        A2[Tailwind CSS]
        A3[shadcn/ui]
        A4[TanStack Query]
    end
    
    subgraph "API Layer"
        B[FastAPI Backend]
        B1[API Routes]
        B2[Pydantic Schemas]
        B3[JWT Auth]
        B4[CORS Middleware]
    end
    
    subgraph "Business Logic Layer"
        C[Services]
        C1[Auth Service]
        C2[Customer Service]
        C3[Lead Service]
        C4[Opportunity Service]
        C5[Task Service]
        C6[Email Service]
        C7[Report Service]
    end
    
    subgraph "Data Access Layer"
        D[Repositories]
        D1[User Repository]
        D2[Customer Repository]
        D3[Lead Repository]
        D4[Opportunity Repository]
        D5[Task Repository]
        D6[Email Repository]
    end
    
    subgraph "Database Layer"
        E[(PostgreSQL)]
        E1[Users]
        E2[Customers]
        E3[Leads]
        E4[Opportunities]
        E5[Tasks]
        E6[Email Activities]
        E7[Company Settings]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
```

### Backend Architecture (Clean Architecture)

```mermaid
graph LR
    subgraph "API Layer"
        A[API Routes] --> B[Pydantic Schemas]
    end
    
    subgraph "Service Layer"
        C[Business Logic] --> D[Validation]
    end
    
    subgraph "Repository Layer"
        E[Data Access] --> F[SQLAlchemy Models]
    end
    
    subgraph "Core Layer"
        G[Config]
        H[Security]
        I[Database]
        J[Exceptions]
    end
    
    A --> C
    B --> C
    C --> E
    F --> E
    G -.-> A
    H -.-> A
    I -.-> E
    J -.-> A
```

### Frontend Architecture (Feature-based)

```mermaid
graph TB
    subgraph "App Level"
        A[Providers]
        B[Routes]
        C[Layout]
    end
    
    subgraph "Features"
        D[Auth]
        E[Dashboard]
        F[Customers]
        G[Leads]
        H[Opportunities]
        I[Tasks]
        J[Emails]
        K[Reports]
        L[Settings]
    end
    
    subgraph "Shared"
        M[UI Components]
        N[Hooks]
        O[Utils]
        P[Types]
        Q[API Client]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
    A --> L
    
    D --> M
    E --> M
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    D --> Q
    E --> Q
    F --> Q
    G --> Q
    H --> Q
    I --> Q
    J --> Q
    K --> Q
    L --> Q
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>Backend: POST /api/v1/auth/login
    Backend->>Database: Verify user
    Database-->>Backend: User data
    Backend->>Backend: Generate JWT tokens
    Backend-->>Frontend: Access + Refresh tokens
    Frontend->>Frontend: Store tokens securely
    Frontend->>Backend: API request with token
    Backend->>Backend: Validate JWT
    Backend-->>Frontend: Response data
    
    Note over Frontend,Backend: Token refresh flow
    Frontend->>Backend: POST /api/v1/auth/refresh
    Backend->>Backend: Validate refresh token
    Backend-->>Frontend: New access token
```

### Data Flow - Customer Management

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant Service
    participant Repository
    participant DB
    
    UI->>API: GET /api/v1/customers
    API->>Service: get_customers()
    Service->>Repository: find_all()
    Repository->>DB: SELECT query
    DB-->>Repository: Customer data
    Repository-->>Service: Customer models
    Service-->>API: Customer schemas
    API-->>UI: JSON response
    
    UI->>API: POST /api/v1/customers
    API->>Service: create_customer()
    Service->>Repository: validate & create
    Repository->>DB: INSERT query
    DB-->>Repository: Created record
    Repository-->>Service: Customer model
    Service-->>API: Customer schema
    API-->>UI: Created customer
```

### Lead Pipeline Flow

```mermaid
graph LR
    A[New Lead] --> B[Contacted]
    B --> C[Qualified]
    C --> D[Proposal Sent]
    D --> E[Negotiation]
    E --> F[Won]
    E --> G[Lost]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#e8f5e9
    style D fill:#f3e5f5
    style E fill:#fff3e0
    style F fill:#c8e6c9
    style G fill:#ffcdd2
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115.0 | High-performance web framework |
| **SQLAlchemy** | 2.0.35 | Async ORM for database operations |
| **Pydantic** | 2.9.0 | Data validation and serialization |
| **PostgreSQL** | 16 | Relational database |
| **Alembic** | 1.14.0 | Database migration tool |
| **python-jose** | 3.3.0 | JWT token handling |
| **passlib** | 1.7.4 | Password hashing |
| **Uvicorn** | 0.32.0 | ASGI server |
| **pytest** | 8.3.4 | Testing framework |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.2.2 | Type-safe JavaScript |
| **Vite** | 5.1.4 | Build tool and dev server |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Accessible component library |
| **TanStack Query** | 5.24.1 | Server state management |
| **React Router** | 6.22.3 | Client-side routing |
| **React Hook Form** | 7.51.0 | Form management |
| **Zod** | 3.22.4 | Schema validation |
| **Recharts** | 2.12.2 | Data visualization |
| **Axios** | 1.6.7 | HTTP client |

### DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Git** | Version control |
| **GitHub Actions** | CI/CD (to be implemented) |

---

## 📦 Installation

### Prerequisites

- **Docker** & **Docker Compose** installed
- **Git** for cloning the repository
- **Node.js** 18+ (for local frontend development)
- **Python** 3.11+ (for local backend development)

### Clone the Repository

```bash
git clone https://github.com/Vishallakshmikanthan/CRM.git
cd CRM
```

### Environment Setup

1. **Copy environment examples:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. **Configure environment variables:**

Edit `backend/.env` with your configuration:

```env
# Database
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=crm_db
DATABASE_URL=postgresql+asyncpg://crm_user:your_secure_password@localhost:5432/crm_db

# Security
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Start all services:**

```bash
docker-compose up -d
```

2. **Run database migrations:**

```bash
docker-compose exec backend alembic upgrade head
```

3. **Create admin user:**

```bash
docker-compose exec backend python create_admin.py
```

4. **Access the application:**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/api/v1/docs
- **Database:** localhost:5432

### Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Create admin user
python create_admin.py

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## ⚙️ Configuration

### Backend Configuration

Located in `backend/app/core/config.py`:

- **Database:** PostgreSQL connection settings
- **Security:** JWT token configuration
- **CORS:** Allowed origins for cross-origin requests
- **API:** API versioning and prefix
- **Environment:** Development/Production mode

### Frontend Configuration

Located in `frontend/vite.config.ts` and environment variables:

- **API URL:** Backend API endpoint
- **Build:** Production build configuration
- **Plugins:** React plugin, TypeScript configuration

---

## 📊 API Documentation

### Interactive Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **OpenAPI Schema:** http://localhost:8000/api/v1/openapi.json

### Key API Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/register` | Register new user (admin only) |
| GET | `/api/v1/auth/me` | Get current user |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Create new user |
| GET | `/api/v1/users/{id}` | Get user by ID |
| PATCH | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Delete user |
| PATCH | `/api/v1/users/{id}/role` | Change user role |

#### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers` | List customers (paginated) |
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers/{id}` | Get customer details |
| PATCH | `/api/v1/customers/{id}` | Update customer |
| DELETE | `/api/v1/customers/{id}` | Delete customer |
| GET | `/api/v1/customers/{id}/timeline` | Get customer timeline |
| POST | `/api/v1/customers/{id}/notes` | Add customer note |

#### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/leads` | List leads |
| POST | `/api/v1/leads` | Create lead |
| GET | `/api/v1/leads/{id}` | Get lead details |
| PATCH | `/api/v1/leads/{id}` | Update lead |
| PATCH | `/api/v1/leads/{id}/status` | Change lead status |
| PATCH | `/api/v1/leads/{id}/assign` | Assign lead |
| GET | `/api/v1/leads/pipeline` | Get pipeline view |

#### Opportunities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/opportunities` | List opportunities |
| POST | `/api/v1/opportunities` | Create opportunity |
| GET | `/api/v1/opportunities/{id}` | Get opportunity details |
| PATCH | `/api/v1/opportunities/{id}` | Update opportunity |
| PATCH | `/api/v1/opportunities/{id}/stage` | Change stage |
| GET | `/api/v1/opportunities/forecast` | Get sales forecast |

#### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/{id}` | Get task details |
| PATCH | `/api/v1/tasks/{id}` | Update task |
| PATCH | `/api/v1/tasks/{id}/complete` | Mark task complete |
| GET | `/api/v1/tasks/calendar` | Get calendar events |

#### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/revenue` | Revenue report |
| GET | `/api/v1/reports/sales` | Sales report |
| GET | `/api/v1/reports/leads` | Lead report |
| GET | `/api/v1/reports/export/csv` | Export CSV |
| GET | `/api/v1/reports/export/pdf` | Export PDF |

#### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/settings/company` | Get company profile |
| PATCH | `/api/v1/settings/company` | Update company profile |
| GET | `/api/v1/settings/teams` | List teams |
| POST | `/api/v1/settings/teams` | Create team |

---

## 🔐 Authentication

### User Roles

The system implements role-based access control (RBAC) with three roles:

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, settings configuration |
| **Manager** | Team management, reports access, customer/opportunity oversight |
| **Sales Rep** | Customer/lead/opportunity management, task management |

### JWT Token Structure

Access tokens are valid for 30 minutes (configurable) and include:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Authentication Flow

1. User submits credentials to `/api/v1/auth/login`
2. Backend validates credentials and returns access + refresh tokens
3. Frontend stores tokens securely (httpOnly cookies recommended)
4. Include access token in Authorization header: `Bearer <token>`
5. When access token expires, use refresh token to get new access token

---

## 📁 Project Structure

```
CRM/
├── backend/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── v1/             # API v1 endpoints
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── customers.py
│   │   │   │   ├── leads.py
│   │   │   │   ├── opportunities.py
│   │   │   │   ├── tasks.py
│   │   │   │   ├── emails.py
│   │   │   │   ├── reports.py
│   │   │   │   └── settings.py
│   │   │   └── deps.py         # Dependencies
│   │   ├── core/               # Core configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── exceptions.py
│   │   ├── models/             # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── customer.py
│   │   │   ├── lead.py
│   │   │   ├── opportunity.py
│   │   │   ├── task.py
│   │   │   ├── email_activity.py
│   │   │   └── company_settings.py
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access
│   │   └── main.py             # FastAPI app
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Test files
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                # App-level config
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── customers/
│   │   │   ├── leads/
│   │   │   ├── opportunities/
│   │   │   ├── tasks/
│   │   │   ├── emails/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── shared/             # Shared code
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── styles/
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔄 Development Workflow

### Database Migrations

```bash
# Create new migration
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

### Code Style

**Backend:**
```bash
# Format code
ruff format .

# Lint code
ruff check .

# Type checking
mypy app/
```

**Frontend:**
```bash
# Lint code
npm run lint

# Type checking (built into build)
npm run build
```

### Testing

**Backend:**
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py
```

**Frontend:**
```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

---

## 🧪 Testing

### Backend Testing

The backend uses pytest for testing:

```bash
cd backend
pytest -v
```

Test coverage includes:
- Unit tests for services
- Integration tests for API endpoints
- Authentication and authorization tests
- Database operation tests

### Frontend Testing

The frontend uses Vitest for testing:

```bash
cd frontend
npm run test
```

Test coverage includes:
- Component unit tests
- Hook tests
- Utility function tests
- Integration tests

### E2E Testing (To Be Implemented)

Playwright will be used for end-to-end testing:

```bash
npm run test:e2e
```

---

## 🚢 Deployment

### Docker Production Build

1. **Build production images:**

```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Run production containers:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Ensure these are set in production:

```env
# Use strong, randomly generated secrets
SECRET_KEY=<random-32-char-string>
POSTGRES_PASSWORD=<strong-password>

# Set environment
ENVIRONMENT=production

# Configure CORS for production domain
BACKEND_CORS_ORIGINS=["https://your-domain.com"]

# Use production database
DATABASE_URL=postgresql+asyncpg://user:pass@prod-db:5432/crm_db
```

### Deployment Platforms

The application can be deployed to:

- **AWS** (ECS, RDS, ALB)
- **Google Cloud** (Cloud Run, Cloud SQL)
- **Azure** (Container Instances, Azure SQL)
- **DigitalOcean** (App Platform, Managed Databases)
- **Heroku** (with Docker deployment)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Use descriptive commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FastAPI** for the amazing web framework
- **shadcn/ui** for the beautiful component library
- **TanStack Query** for excellent server state management
- **PostgreSQL** for the reliable database
- All open-source contributors

---

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

<div align="center">

**Built with ❤️ for modern sales teams**

[⬆ Back to Top](#-enterprise-crm-system)

</div>
