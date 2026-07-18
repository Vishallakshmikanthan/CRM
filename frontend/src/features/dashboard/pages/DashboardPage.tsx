import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/shared/api/client"
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity } from "lucide-react"
import { format } from "date-fns"

interface KPIData {
  total_revenue: number
  revenue_change: number
  total_deals: number
  deals_change: number
  conversion_rate: number
  conversion_change: number
  active_leads: number
  leads_change: number
}

interface ActivityItem {
  id: string
  type: "deal_won" | "deal_lost" | "new_lead" | "task_completed" | "email_sent"
  title: string
  description: string
  timestamp: string
  user: string
  value?: number
}

interface ChartDataPoint {
  date: string
  revenue: number
  deals: number
  leads: number
}

function KPICard({ title, value, change, icon: Icon, prefix = "", suffix = "", isCurrency = false }: {
  title: string
  value: number | string
  change: number
  icon: React.ComponentType<{ className?: string }>
  prefix?: string
  suffix?: string
  isCurrency?: boolean
}) {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value))
    : typeof value === "number"
    ? new Intl.NumberFormat("en-US").format(value)
    : value

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prefix}{formattedValue}{suffix}</div>
        <p className={`text-xs mt-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          <TrendingUp className="h-3 w-3 inline mr-1" />
          {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs last month
        </p>
      </CardContent>
    </Card>
  )
}

function ActivityFeed({ activities, isLoading }: { activities: ActivityItem[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "deal_won":
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case "deal_lost":
        return <TrendingDown className="h-5 w-5 text-red-600" />
      case "new_lead":
        return <Target className="h-5 w-5 text-blue-600" />
      case "task_completed":
        return <Activity className="h-5 w-5 text-purple-600" />
      case "email_sent":
        return <Activity className="h-5 w-5 text-orange-600" />
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "deal_won":
        return "text-green-600"
      case "deal_lost":
        return "text-red-600"
      case "new_lead":
        return "text-blue-600"
      case "task_completed":
        return "text-purple-600"
      case "email_sent":
        return "text-orange-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent activity</p>
          ) : (
            activities?.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{format(new Date(activity.timestamp), "MMM d, h:mm a")}</span>
                    {activity.value && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-green-600">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(activity.value)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueChart({ data, isLoading }: { data: ChartDataPoint[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Simple bar chart using CSS
  const maxRevenue = Math.max(...(data?.map((d) => d.revenue) || [0]), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Overview (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-around gap-1 px-2">
          {data?.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1" style={{ maxWidth: 40 }}>
              <div
                className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                style={{ height: `${(point.revenue / maxRevenue) * 100}%`, minHeight: "4px" }}
                title={`${format(new Date(point.date), "MMM d")}: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(point.revenue)}`}
              />
              <span className="text-xs text-muted-foreground">{format(new Date(point.date), "MMM d")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => api.get<KPIData>("/dashboard/kpis"),
  })

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["dashboard", "activities"],
    queryFn: () => api.get<ActivityItem[]>("/dashboard/activities"),
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["dashboard", "chart"],
    queryFn: () => api.get<ChartDataPoint[]>("/dashboard/chart"),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your sales performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={kpiData?.total_revenue || 0}
          change={kpiData?.revenue_change || 0}
          icon={DollarSign}
          isCurrency
        />
        <KPICard
          title="Active Deals"
          value={kpiData?.total_deals || 0}
          change={kpiData?.deals_change || 0}
          icon={Target}
        />
        <KPICard
          title="Conversion Rate"
          value={`${kpiData?.conversion_rate || 0}%`}
          change={kpiData?.conversion_change || 0}
          icon={TrendingUp}
        />
        <KPICard
          title="Active Leads"
          value={kpiData?.active_leads || 0}
          change={kpiData?.leads_change || 0}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-4 lg:col-span-4">
          <RevenueChart data={chartData} isLoading={chartLoading} />
        </div>
        <div className="md:col-span-3 lg:col-span-3">
          <ActivityFeed activities={activities} isLoading={activitiesLoading} />
        </div>
      </div>
    </div>
  )
}