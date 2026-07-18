import { Outlet } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <Outlet />
        </CardContent>
      </Card>
    </div>
  )
}