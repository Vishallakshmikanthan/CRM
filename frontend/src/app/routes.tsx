import { Suspense, lazy } from "react"
import { createBrowserRouter } from "react-router-dom"
import { MainLayout as Layout } from "./layout"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/shared/api/queryClient"
import { Toaster } from "sonner"
import { Toaster as SonnerToaster } from "@/components/ui/toaster"

// Lazy load pages for code splitting
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })))
const CustomersPage = lazy(() => import("@/features/customers/pages/CustomersPage").then((m) => ({ default: m.CustomersPage })))
const CustomerDetailPage = lazy(() => import("@/features/customers/pages/CustomerDetailPage").then((m) => ({ default: m.CustomerDetailPage })))
const LeadsPage = lazy(() => import("@/features/leads/pages/LeadsPage").then((m) => ({ default: m.LeadsPage })))
const LeadDetailPage = lazy(() => import("@/features/leads/pages/LeadDetailPage").then((m) => ({ default: m.LeadDetailPage })))
const OpportunitiesPage = lazy(() => import("@/features/opportunities/pages/OpportunitiesPage").then((m) => ({ default: m.OpportunitiesPage })))
const OpportunityDetailPage = lazy(() => import("@/features/opportunities/pages/OpportunityDetailPage").then((m) => ({ default: m.OpportunityDetailPage })))
const TasksPage = lazy(() => import("@/features/tasks/pages/TasksPage").then((m) => ({ default: m.TasksPage })))
const EmailsPage = lazy(() => import("@/features/emails/pages/EmailsPage").then((m) => ({ default: m.EmailsPage })))
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })))
const ProfilePage = lazy(() => import("@/features/auth/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import("@/shared/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })))

// Placeholder pages for settings sub-routes (to be implemented)
const UsersPage = lazy(() => import("@/features/settings/pages/UsersPage").then((m) => ({ default: m.UsersPage })))
const TeamsPage = lazy(() => import("@/features/settings/pages/TeamsPage").then((m) => ({ default: m.TeamsPage })))
const CompanyProfilePage = lazy(() => import("@/features/settings/pages/CompanyProfilePage").then((m) => ({ default: m.CompanyProfilePage })))

function WithSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
      {children}
    </Suspense>
  )
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  // This will be handled by the backend, but we can add client-side checks too
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
        <Toaster position="top-right" />
      </QueryClientProvider>
    ),
  },
  {
    path: "/",
    element: (
      <QueryClientProvider client={queryClient}>
        <Layout />
        <SonnerToaster />
      </QueryClientProvider>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: (
          <WithSuspense>
            <DashboardPage />
          </WithSuspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <WithSuspense>
            <DashboardPage />
          </WithSuspense>
        ),
      },
      {
        path: "customers",
        children: [
          {
            index: true,
            element: (
              <WithSuspense>
                <CustomersPage />
              </WithSuspense>
            ),
          },
          {
            path: ":id",
            element: (
              <WithSuspense>
                <CustomerDetailPage />
              </WithSuspense>
            ),
          },
        ],
      },
      {
        path: "leads",
        children: [
          {
            index: true,
            element: (
              <WithSuspense>
                <LeadsPage />
              </WithSuspense>
            ),
          },
          {
            path: ":id",
            element: (
              <WithSuspense>
                <LeadDetailPage />
              </WithSuspense>
            ),
          },
        ],
      },
      {
        path: "opportunities",
        children: [
          {
            index: true,
            element: (
              <WithSuspense>
                <OpportunitiesPage />
              </WithSuspense>
            ),
          },
          {
            path: ":id",
            element: (
              <WithSuspense>
                <OpportunityDetailPage />
              </WithSuspense>
            ),
          },
        ],
      },
      {
        path: "tasks",
        element: (
          <WithSuspense>
            <TasksPage />
          </WithSuspense>
        ),
      },
      {
        path: "emails",
        element: (
          <WithSuspense>
            <EmailsPage />
          </WithSuspense>
        ),
      },
      {
        path: "reports",
        element: (
          <WithSuspense>
            <ReportsPage />
          </WithSuspense>
        ),
      },
      {
        path: "settings",
        children: [
          {
            index: true,
            element: (
              <WithSuspense>
                <SettingsPage />
              </WithSuspense>
            ),
          },
          {
            path: "users",
            element: (
              <RoleRoute allowedRoles={["admin", "manager"]}>
                <WithSuspense>
                  <UsersPage />
                </WithSuspense>
              </RoleRoute>
            ),
          },
          {
            path: "teams",
            element: (
              <RoleRoute allowedRoles={["admin", "manager"]}>
                <WithSuspense>
                  <TeamsPage />
                </WithSuspense>
              </RoleRoute>
            ),
          },
          {
            path: "company",
            element: (
              <RoleRoute allowedRoles={["admin"]}>
                <WithSuspense>
                  <CompanyProfilePage />
                </WithSuspense>
              </RoleRoute>
            ),
          },
        ],
      },
      {
        path: "profile",
        element: (
          <WithSuspense>
            <ProfilePage />
          </WithSuspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <WithSuspense>
        <NotFoundPage />
      </WithSuspense>
    ),
  },
])