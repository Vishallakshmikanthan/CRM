import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Mail, Phone, MapPin, Building2, User, Clock, FileText, MessageSquare, DollarSign, Target, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { api } from "@/shared/api/client"
import { format } from "date-fns"
import { OpportunityForm } from "../components/OpportunityForm"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Link } from "react-router-dom"

interface Opportunity {
  id: string
  name: string
  customer_id: string
  customer_name: string
  lead_id: string | null
  stage: string
  value: number
  probability: number
  expected_close_date: string
  actual_close_date: string | null
  assigned_to: string
  notes: string
  created_at: string
  updated_at: string
}

interface OpportunityDetailData {
  opportunity: Opportunity
  activities: TimelineEvent[]
}

interface TimelineEvent {
  id: string
  type: "note" | "email" | "call" | "meeting" | "task" | "deal" | "stage_change"
  title: string
  description: string
  user_id: string
  user_name: string
  created_at: string
  metadata?: Record<string, unknown>
}

const stageColors: Record<string, string> = {
  prospecting: "bg-gray-100 text-gray-800",
  qualification: "bg-blue-100 text-blue-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed_won: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-red-100 text-red-800",
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  note: FileText,
  email: Mail,
  call: Phone,
  meeting: Target,
  task: Clock,
  deal: DollarSign,
  stage_change: Building2,
}

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => api.get<OpportunityDetailData>(`/opportunities/${id}`),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Opportunity>) => api.patch<Opportunity>(`/opportunities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] })
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity updated successfully")
      setIsEditDialogOpen(false)
    },
    onError: () => toast.error("Failed to update opportunity"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/opportunities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity deleted successfully")
      window.history.back()
    },
    onError: () => toast.error("Failed to delete opportunity"),
  })

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-muted animate-pulse rounded mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Opportunity not found</h2>
        <p className="text-muted-foreground mt-2">The opportunity you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => window.history.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const { opportunity, activities } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{opportunity.name}</h1>
            <p className="text-muted-foreground">{opportunity.customer_name} • {format(new Date(opportunity.expected_close_date), "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Opportunity</DialogTitle>
              </DialogHeader>
              <OpportunityForm
                initialData={opportunity}
                onSubmit={(formData) => updateMutation.mutate(formData)}
                isLoading={updateMutation.isPending}
                onClose={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className={`${stageColors[opportunity.stage] || "bg-gray-100 text-gray-800"} text-lg px-3 py-1`}>
              {opportunity.stage.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deal Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(opportunity.value)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Probability</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {opportunity.probability}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weighted Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(opportunity.value * opportunity.probability / 100)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opportunity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{opportunity.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Close Date</p>
                  <p className="font-medium">{format(new Date(opportunity.expected_close_date), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Close Date</p>
                  <p className="font-medium">{opportunity.actual_close_date ? format(new Date(opportunity.actual_close_date), "MMM d, yyyy") : "Not closed yet"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{opportunity.assigned_to || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(opportunity.created_at), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(opportunity.updated_at), "MMM d, yyyy")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Deal Value</span>
                  <span className="font-bold text-lg">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(opportunity.value)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Probability</span>
                  <span className="font-bold text-lg">{opportunity.probability}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-primary font-medium">Weighted Value</span>
                  <span className="font-bold text-lg text-primary">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(opportunity.value * opportunity.probability / 100)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {opportunity.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{opportunity.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No activity yet</h3>
                <p className="text-muted-foreground mt-1">Activities will appear here as you interact with this opportunity.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((event) => {
                const Icon = typeIcons[event.type] || FileText
                return (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.title}</h4>
                            <span className="text-xs text-muted-foreground capitalize">{event.type.replace("_", " ")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{event.user_name}</span>
                            <span>•</span>
                            <span>{format(new Date(event.created_at), "MMM d, yyyy h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}