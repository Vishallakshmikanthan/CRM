# Implementation Plan - CRM Features & Auth Rectification

This plan addresses the authentication issues, hooks up all frontend CRM pages (replacing the current empty placeholders), and provides a clear strategy for connecting the application to a Supabase PostgreSQL database.

## Proposed Changes

### Frontend Configuration

#### [MODIFY] [client.ts](file:///c:/Users/Lenovo/Downloads/CRM/frontend/src/shared/api/client.ts)
- Change default `API_URL` fallback from `http://localhost:8000/api/v1` to `/api/v1` to utilize the Vite proxy and resolve CORS issues in the browser.
- Update the response error interceptor to bypass token refresh attempts for auth endpoints (`/auth/login`, `/auth/register`). This prevents the application from entering a broken reload/refresh loop when incorrect credentials are submitted or when registering a new account.

#### [MODIFY] [useAuth.tsx](file:///c:/Users/Lenovo/Downloads/CRM/frontend/src/features/auth/hooks/useAuth.tsx)
- Add a `register` function to the `AuthContextType` and the `AuthProvider` component to allow users to sign up from the UI.
- Wire the `register` function to request the `/auth/register` API.

#### [MODIFY] [RegisterPage.tsx](file:///c:/Users/Lenovo/Downloads/CRM/frontend/src/features/auth/pages/RegisterPage.tsx)
- Destructure the `register` method as `signup` from `useAuth()`.
- Update `onSubmit` to call `signup(data.email, data.password, data.fullName)` instead of calling the login method directly.

#### [MODIFY] [App.tsx](file:///c:/Users/Lenovo/Downloads/CRM/frontend/src/App.tsx)
- Replace all dummy `<div>` placeholder pages (e.g. `<div>Customers Page</div>`, etc.) with their actual implemented page components under `features/*` (e.g., `CustomersPage`, `LeadsPage`, `OpportunitiesPage`, `TasksPage`, `EmailsPage`, `ReportsPage`, `SettingsPage`, `ProfilePage`, and settings sub-pages).
- Map detail routes like `/customers/:id`, `/leads/:id`, and `/opportunities/:id` to their respective detail page components.
- Wrap the settings sub-routes in role-based protection layers (`ManagerRoute` and `AdminRoute`) consistent with the backend permissions.

### Backend Configuration

#### [MODIFY] [database.py](file:///c:/Users/Lenovo/Downloads/CRM/backend/app/core/database.py)
- Import `Base` from `app.models.base` instead of defining a duplicate empty `Base(DeclarativeBase)`. This registers the metadata of all app models (users, customers, leads, opportunities, etc.) with the database initialization function `init_db()`. When the app starts up, SQLAlchemy will automatically create all missing database tables on any target database (including Supabase/PostgreSQL).

---

## Supabase Database Integration Strategy

To connect the application to a Supabase database:

1. **Get the Connection String**:
   - In Supabase, navigate to **Project Settings** > **Database** > **Connection string** > **URI**.
   - Choose the **Transaction** mode or **Session** mode connection string.
   - Use the `postgresql+asyncpg://` driver prefix. For example:
     `DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-HOST]:5432/postgres`

2. **Configure Environment Variable**:
   - Edit [backend/.env](file:///c:/Users/Lenovo/Downloads/CRM/backend/.env).
   - Set the `DATABASE_URL` variable to your Supabase connection URI.

3. **Auto-Generation & Migrations**:
   - When the backend starts up, `init_db()` will execute `Base.metadata.create_all` using the Supabase connection, automatically generating all necessary tables.
   - Alternatively, you can run Alembic migrations against the database by executing:
     ```powershell
     cd backend
     ..\.venv\Scripts\alembic upgrade head
     ```

---

## Verification Plan

### Automated Verification
- We will run the frontend build (`npm run build`) to ensure that all page components load and compile cleanly without type errors.

### Manual Verification
- **Login/Register**: Test registration with a new email and verify it successfully creates the user in the database, logins, and redirects to the dashboard.
- **Route Mapping**: Verify navigating to Customers, Leads, Opportunities, Tasks, Emails, Reports, and Settings displays the actual data-driven UI instead of placeholder divs.
