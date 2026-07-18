import { Outlet } from "react-router-dom"
import { Sidebar } from "@/shared/components/layout/sidebar"
import { cn } from "@/lib/utils"

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          "lg:ml-64"
        )}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}