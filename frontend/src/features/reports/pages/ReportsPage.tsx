import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Users, Target, BarChart3 } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { api } from "@/shared/api/client"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface RevenueData {
  month: string
  revenue: number
  target: number
}

interface SalesData {
  month: string
  deals_won: number
  deals_lost: number
  pipeline_value: number
}

interface LeadData {
  month: string
  new_leads: number
  qualified_leads: number
  converted_leads: number
}

interface ReportsResponse {
  revenue: RevenueData[]
  sales: SalesData[]
  leads: LeadData[]
  kpis: {
    total_revenue: number
    revenue_change: number
    deals_won: number
    deals_won_change: number
    conversion_rate: number
    conversion_change: number
    avg_deal_size: number
    avg_deal_change: number
  }
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  })
  const [reportType, setReportType] = useState<"revenue" | "sales" | "leads">("revenue")

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", dateRange.from, dateRange.to],
    queryFn: () =>
      api.get<ReportsResponse>("/reports", {
        params: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
      }),
  })

  const kpis = data?.kpis || {
    total_revenue: 0,
    revenue_change: 0,
    deals_won: 0,
    deals_won_change: 0,
    conversion_rate: 0,
    conversion_change: 0,
    avg_deal_size: 0,
    avg_deal_change: 0,
  }

  const revenueData = data?.revenue || []
  const salesData = data?.sales || []
  const leadsData = data?.leads || []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value)
  }

  const KPICard = ({ title, value, change, icon: Icon, color }: { title: string; value: string | number; change: number; icon: React.ComponentType<{ className?: string }>; color: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
          {Math.abs(change)}% vs last period
        </p>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">Track your sales performance and business metrics</p>
          </div>
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-80 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Failed to load reports</h2>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your sales performance and business metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue Report</SelectItem>
              <SelectItem value="sales">Sales Performance</SelectItem>
              <SelectItem value="leads">Lead Analytics</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(kpis.total_revenue)}
          change={kpis.revenue_change}
          icon={DollarSign}
          color="text-blue-600"
        />
        <KPICard
          title="Deals Won"
          value={formatNumber(kpis.deals_won)}
          change={kpis.deals_won_change}
          icon={Target}
          color="text-green-600"
        />
        <KPICard
          title="Conversion Rate"
          value={`${kpis.conversion_rate.toFixed(1)}%`}
          change={kpis.conversion_change}
          icon={TrendingUp}
          color="text-purple-600"
        />
        <KPICard
          title="Avg Deal Size"
          value={formatCurrency(kpis.avg_deal_size)}
          change={kpis.avg_deal_change}
          icon={BarChart3}
          color="text-orange-600"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                {reportType === "revenue" && "Revenue Overview"}
                {reportType === "sales" && "Sales Performance"}
                {reportType === "leads" && "Lead Analytics"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Button variant="outline" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 5)), to: endOfMonth(new Date()) })}>
                Last 6 Months
              </Button>
              <Button variant="outline" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 11)), to: endOfMonth(new Date()) })}>
                Last 12 Months
              </Button>
              <Button variant="outline" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
                This Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportType === "revenue" && (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatCurrency} />
                  <YAxis dataKey="month" type="category" width={80} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Actual Revenue" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportType === "sales" && (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorDealsWon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [formatNumber(value), name]} />
                  <Legend />
                  <Area type="monotone" dataKey="deals_won" name="Deals Won" stroke="#22c55e" fillOpacity={1} fill="url(#colorDealsWon)" />
                  <Area type="monotone" dataKey="deals_lost" name="Deals Lost" stroke="#ef4444" fillOpacity={1} fill="url(#colorPipeline)" />
                  <Area type="monotone" dataKey="pipeline_value" name="Pipeline Value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPipeline)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportType === "leads" && (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="month" type="category" width={80} />
                  <Tooltip formatter={(value: number) => [formatNumber(value), "Leads"]} />
                  <Legend />
                  <Bar dataKey="new_leads" fill="#3b82f6" name="New Leads" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="qualified_leads" fill="#f59e0b" name="Qualified" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="converted_leads" fill="#22c55e" name="Converted" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {revenueData.length === 0 && salesData.length === 0 && leadsData.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No data available</h3>
              <p className="text-muted-foreground mt-2">Data will appear here once you have records in the selected date range.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                  <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Won", value: kpis.deals_won },
                      { name: "Lost", value: Math.max(0, salesData.reduce((a, b) => a + b.deals_lost, 0)) },
                      { name: "Pipeline", value: Math.max(0, salesData.reduce((a, b) => a + b.pipeline_value, 0) / 1000) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), "Deals"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="month" type="category" width={80} />
                  <Tooltip formatter={(value: number) => [formatNumber(value), "Leads"]} />
                  <Legend />
                  <Bar dataKey="new_leads" fill="#3b82f6" name="New" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="qualified_leads" fill="#f59e0b" name="Qualified" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="converted_leads" fill="#22c55e" name="Converted" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}