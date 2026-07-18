import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Search, Filter, ChevronDown, ChevronUp, MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown, DollarSign } from "lucide-react"
import { api } from "@/shared/api/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { OpportunityForm } from "../components/OpportunityForm"

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

interface OpportunitiesResponse {
  items: Opportunity[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const opportunitySchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  customer_id: z.string().min(1, "Customer is required"),
  lead_id: z.string().optional(),
  stage: z.string().default("prospecting"),
  value: z.number().min(0, "Value must be positive"),
  probability: z.number().min(0).max(100, "Probability must be between 0 and 100"),
  expected_close_date: z.string().min(1, "Expected close date is required"),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

const stageColors: Record<string, string> = {
  prospecting: "bg-gray-100 text-gray-800",
  qualification: "bg-blue-100 text-blue-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed_won: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-red-100 text-red-800",
}

const stages = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]

export function OpportunitiesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [sortBy, setSortBy] = useState<keyof Opportunity>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["opportunities", page, pageSize, search, stageFilter, sortBy, sortOrder],
    queryFn: () =>
      api.get<OpportunitiesResponse>("/opportunities", {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          stage: stageFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: OpportunityFormData) => api.post<Opportunity>("/opportunities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity created successfully")
      setIsCreateDialogOpen(false)
    },
    onError: () => toast.error("Failed to create opportunity"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpportunityFormData> }) => api.patch<Opportunity>(`/opportunities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity updated successfully")
      setEditingOpportunity(null)
    },
    onError: () => toast.error("Failed to update opportunity"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/opportunities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity deleted successfully")
    },
    onError: () => toast.error("Failed to delete opportunity"),
  })

  const handleSort = (key: keyof Opportunity) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ column }: { column: keyof Opportunity }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Failed to load opportunities</h2>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["opportunities"] })} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const opportunities = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">Manage and track your sales opportunities</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Opportunity</DialogTitle>
            </DialogHeader>
            <OpportunityForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
              onClose={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon column="name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("customer_name")}>
                    <div className="flex items-center gap-1">
                      Customer
                      <SortIcon column="customer_name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("stage")}>
                    <div className="flex items-center gap-1">
                      Stage
                      <SortIcon column="stage" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("value")}>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Value
                      <SortIcon column="value" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("probability")}>
                    <div className="flex items-center gap-1">
                      Probability
                      <SortIcon column="probability" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("expected_close_date")}>
                    <div className="flex items-center gap-1">
                      Expected Close
                      <SortIcon column="expected_close_date" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("assigned_to")}>
                    <div className="flex items-center gap-1">
                      Assigned To
                      <SortIcon column="assigned_to" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center gap-1">
                      Created
                      <SortIcon column="created_at" />
                    </div>
                  </TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="space-y-2">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No opportunities found</h3>
                        <p className="text-muted-foreground">Get started by creating your first opportunity.</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="mx-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Opportunity
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell className="font-medium">{opportunity.name}</TableCell>
                      <TableCell>{opportunity.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={stageColors[opportunity.stage] || "bg-gray-100 text-gray-800"}>
                          {opportunity.stage.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(opportunity.value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${opportunity.probability}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{opportunity.probability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(opportunity.expected_close_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{opportunity.assigned_to || "-"}</TableCell>
                      <TableCell>{format(new Date(opportunity.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingOpportunity(opportunity)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingOpportunity(opportunity)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(opportunity.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <Select value={pageSize} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {editingOpportunity && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingOpportunity(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Opportunity</DialogTitle>
            </DialogHeader>
            <OpportunityForm
              initialData={editingOpportunity}
              onSubmit={(data) => updateMutation.mutate({ id: editingOpportunity.id, data })}
              isLoading={updateMutation.isPending}
              onClose={() => setEditingOpportunity(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}