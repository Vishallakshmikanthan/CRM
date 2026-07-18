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
import { Plus, Search, Filter, ChevronDown, ChevronUp, MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"
import { api } from "@/shared/api/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { LeadForm } from "../components/LeadForm"

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  source: string
  status: string
  estimated_value: number
  assigned_to: string
  created_at: string
  updated_at: string
}

interface LeadsResponse {
  items: Lead[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.string().default("new"),
  estimated_value: z.number().optional(),
  assigned_to: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  proposal: "bg-purple-100 text-purple-800",
  negotiation: "bg-orange-100 text-orange-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
}

const sources = [
  "website",
  "referral",
  "cold_call",
  "email",
  "social_media",
  "event",
  "partner",
  "other",
]

const statuses = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]

export function LeadsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [sortBy, setSortBy] = useState<keyof Lead>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads", page, pageSize, search, statusFilter, sourceFilter, sortBy, sortOrder],
    queryFn: () =>
      api.get<LeadsResponse>("/leads", {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: LeadFormData) => api.post<Lead>("/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead created successfully")
      setIsCreateDialogOpen(false)
    },
    onError: () => toast.error("Failed to create lead"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadFormData> }) => api.patch<Lead>(`/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead updated successfully")
      setEditingLead(null)
    },
    onError: () => toast.error("Failed to update lead"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead deleted successfully")
    },
    onError: () => toast.error("Failed to delete lead"),
  })

  const handleSort = (key: keyof Lead) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ column }: { column: keyof Lead }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
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
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Value</TableHead>
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
                  <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
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
        <h2 className="text-2xl font-bold text-destructive">Failed to load leads</h2>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["leads"] })} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const leads = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales leads</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <LeadForm
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
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("first_name")}>
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon column="first_name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("company")}>
                    <div className="flex items-center gap-1">
                      Company
                      <SortIcon column="company" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("email")}>
                    <div className="flex items-center gap-1">
                      Email
                      <SortIcon column="email" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon column="status" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("source")}>
                    <div className="flex items-center gap-1">
                      Source
                      <SortIcon column="source" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("estimated_value")}>
                    <div className="flex items-center gap-1">
                      Est. Value
                      <SortIcon column="estimated_value" />
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
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="space-y-2">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No leads found</h3>
                        <p className="text-muted-foreground">Get started by creating your first lead.</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="mx-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Lead
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.first_name} {lead.last_name}
                      </TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[lead.status] || "bg-gray-100 text-gray-800"}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.source
                          ? lead.source.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {lead.estimated_value > 0
                          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(lead.estimated_value)
                          : "-"}
                      </TableCell>
                      <TableCell>{lead.assigned_to || "-"}</TableCell>
                      <TableCell>{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingLead(lead)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingLead(lead)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
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

      {editingLead && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingLead(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
            </DialogHeader>
            <LeadForm
              initialData={editingLead}
              onSubmit={(data) => updateMutation.mutate({ id: editingLead.id, data })}
              isLoading={updateMutation.isPending}
              onClose={() => setEditingLead(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}