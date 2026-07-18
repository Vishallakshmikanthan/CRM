import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  LayoutDashboard,
  Users,
  Target,
  DollarSign,
  CheckSquare,
  Mail,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserPlus,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Opportunities", href: "/opportunities", icon: DollarSign },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Email Activity", href: "/emails", icon: Mail },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

const adminNavigation = [
  { name: "User Management", href: "/settings/users", icon: UserPlus },
  { name: "Teams", href: "/settings/teams", icon: Building2 },
  { name: "Company Profile", href: "/settings/company", icon: Activity },
]

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

export function Sidebar() {
  const { user, isAdmin, isManager } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  const navItems = React.useMemo(() => {
    const items: NavItem[] = [...navigation]
    if (isAdmin || isManager) {
      items.push({ name: "Administration", href: "#", icon: Settings, children: adminNavigation })
    }
    return items
  }, [isAdmin, isManager])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn("flex h-16 items-center justify-between border-b px-4", collapsed && "justify-center")}>
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">CRM</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1">
                  <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider", collapsed && "text-center")}>
                    {item.name}
                  </div>
                  {item.children.map((child) => (
                    <NavLink key={child.href} item={child} collapsed={collapsed} />
                  ))}
                </div>
              )
            }
            return <NavLink key={item.href} item={item} collapsed={collapsed} />
          })}
        </nav>

        {/* User Profile */}
        <div className={cn("border-t p-4", collapsed && "items-center justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent", collapsed && "justify-center")}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.full_name} />
                  <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn("w-48", collapsed && "left-auto right-0")}>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex w-full items-center justify-start">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full items-center justify-start">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}} className="text-destructive focus:text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}

interface NavLinkProps {
  item: NavItem
  collapsed: boolean
}

function NavLink({ item, collapsed }: NavLinkProps) {
  const Icon = item.icon
  const isActive = window.location.pathname === item.href || window.location.pathname.startsWith(item.href + "/")

  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        collapsed && "justify-center"
      )}
      title={collapsed ? item.name : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  )
}
