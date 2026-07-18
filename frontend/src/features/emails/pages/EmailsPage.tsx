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
import { Plus, Search, Filter, ChevronDown, ChevronUp, MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown, Mail, Reply, Forward, Paperclip, Star } from "lucide-react"
import { api } from "@/shared/api/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { EmailForm } from "../components/EmailForm"

interface Email {
  id: string
  subject: string
  body: string
  direction: string
  status: string
  sent_at: string | null
  from_email: string
  to_emails: string[]
  cc_emails: string[]
  bcc_emails: string[]
  related_type: string | null
  related_id: string | null
  user_id: string
  user_name: string
  created_at: string
  updated_at: string
}

interface EmailsResponse {
  items: Email[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  direction: z.string().default("outbound"),
  status: z.string().default("draft"),
  from_email: z.string().email("Valid email required"),
  to_emails: z.array(z.string().email()).min(1, "At least one recipient required"),
  cc_emails: z.array(z.string().email()).optional(),
  bcc_emails: z.array(z.string().email()).optional(),
  related_type: z.string().optional(),
  related_id: z.string().optional(),
})

type EmailFormData = z.infer<typeof emailSchema>

const directionColors: Record<string, string> = {
  inbound: "bg-blue-100 text-blue-800",
  outbound: "bg-green-100 text-green-800",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-emerald-100 text-emerald-800",
  received: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
}

export function EmailsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [directionFilter, setDirectionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState<keyof Email>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<Email | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["emails", page, pageSize, search, directionFilter, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      api.get<EmailsResponse>("/emails", {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          direction: directionFilter || undefined,
          status: statusFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: EmailFormData) => api.post<Email>("/emails", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      toast.success("Email created successfully")
      setIsCreateDialogOpen(false)
    },
    onError: () => toast.error("Failed to create email"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailFormData> }) => api.patch<Email>(`/emails/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      toast.success("Email updated successfully")
      setEditingEmail(null)
    },
    onError: () => toast.error("Failed to update email"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      toast.success("Email deleted successfully")
    },
    onError: () => toast.error("Failed to delete email"),
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post<Email>(`/emails/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      toast.success("Email sent successfully")
    },
    onError: () => toast.error("Failed to send email"),
  })

  const handleSort = (key: keyof Email) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ column }: { column: keyof Email }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this email? This action cannot be undone.")) {
      deleteMutation.mutate(id)
    }
  }

  const handleSend = (id: string) => {
    sendMutation.mutate(id)
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
                <TableHead>Subject</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Related To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
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
        <h2 className="text-2xl font-bold text-destructive">Failed to load emails</h2>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["emails"] })} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const emails = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Activities</h1>
          <p className="text-muted-foreground">View and manage email communications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Compose Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compose New Email</DialogTitle>
            </DialogHeader>
            <EmailForm
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
                placeholder="Search emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              />
            </div>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("subject")}>
                    <div className="flex items-center gap-1">
                      Subject
                      <SortIcon column="subject" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("direction")}>
                    <div className="flex items-center gap-1">
                      Direction
                      <SortIcon column="direction" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon column="status" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("from_email")}>
                    <div className="flex items-center gap-1">
                      From
                      <SortIcon column="from_email" />
                    </div>
                  </TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("sent_at")}>
                    <div className="flex items-center gap-1">
                      Sent At
                      <SortIcon column="sent_at" />
                    </div>
                  </TableHead>
                  <TableHead>Related To</TableHead>
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
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="space-y-2">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No emails found</h3>
                        <p className="text-muted-foreground">Start by composing your first email.</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="mx-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Compose Email
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium max-w-xs truncate">{email.subject}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={directionColors[email.direction] || "bg-gray-100 text-gray-800"}>
                          {email.direction.charAt(0).toUpperCase() + email.direction.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[email.status] || "bg-gray-100 text-gray-800"}>
                          {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{email.from_email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {email.to_emails.slice(0, 3).map((to, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{to}</Badge>
                          ))}
                          {email.to_emails.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{email.to_emails.length - 3} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{email.sent_at ? format(new Date(email.sent_at), "MMM d, yyyy h:mm a") : "-"}</TableCell>
                      <TableCell>
                        {email.related_type && email.related_id && (
                          <span className="text-sm text-muted-foreground">
                            {email.related_type}: {email.related_id.slice(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(email.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingEmail(email)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingEmail(email)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {email.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => handleSend(email.id)}>
                              <Mail className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(email.id)}>
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

      {editingEmail && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingEmail(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmail.status === "draft" ? "Edit Email" : "View Email"}</DialogTitle>
            </DialogHeader>
            <EmailForm
              initialData={editingEmail}
              onSubmit={(data) => updateMutation.mutate({ id: editingEmail.id, data })}
              isLoading={updateMutation.isPending}
              onClose={() => setEditingEmail(null)}
              readOnly={editingEmail.status !== "draft"}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}