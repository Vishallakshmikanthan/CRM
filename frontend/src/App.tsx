import { Routes, Route, Navigate } from "react-router-dom"
import { AuthLayout } from "./features/auth/layouts/AuthLayout"
import { MainLayout } from "./layouts/MainLayout"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { RegisterPage } from "./features/auth/pages/RegisterPage"
import { DashboardPage } from "./features/dashboard/pages/DashboardPage"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<div>Customers Page</div>} />
          <Route path="/leads" element={<div>Leads Page</div>} />
          <Route path="/opportunities" element={<div>Opportunities Page</div>} />
          <Route path="/tasks" element={<div>Tasks Page</div>} />
          <Route path="/reports" element={<div>Reports Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
