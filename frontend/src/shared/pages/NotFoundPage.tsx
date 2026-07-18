import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, Search, RefreshCw } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-9xl font-bold text-primary/20">404</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.history.back()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
        <div className="mt-10 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Or try searching for what you need:</p>
          <div className="flex gap-2 justify-center">
            <input
              type="search"
              placeholder="Search..."
              className="flex-1 max-w-xs px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}