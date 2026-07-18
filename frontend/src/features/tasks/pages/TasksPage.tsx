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
import { Plus, Search, Filter, ChevronDown, ChevronUp, MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown, Calendar, Clock, CheckCircle, XCircle, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { api } from "@/shared/api/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { TaskForm } from "../components/TaskForm"

interface Task {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  due_date: string
  assigned_to: string
  related_type: string | null
  related_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface TasksResponse {
  items: Task[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  type: z.string().default("call"),
  priority: z.string().default("medium"),
  status: z.string().default("pending"),
  due_date: z.string().min(1, "Due date is required"),
  assigned_to: z.string().optional(),
  related_type: z.string().nullable().optional(),
  related_id: z.string().nullable().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  meeting: Calendar,
  email: Mail,
  task: CheckCircle,
  follow_up: Clock,
}

const types = ["call", "meeting", "email", "task", "follow_up"]
const priorities = ["low", "medium", "high", "urgent"]
const statuses = ["pending", "in_progress", "completed", "cancelled"]

export function TasksPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [sortBy, setSortBy] = useState<keyof Task>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", page, pageSize, search, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder],
    queryFn: () =>
      api.get<TasksResponse>("/tasks", {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          type: typeFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: TaskFormData) => api.post<Task>("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task created successfully")
      setIsCreateDialogOpen(false)
    },
    onError: () => toast.error("Failed to create task"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) => api.patch<Task>(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task updated successfully")
      setEditingTask(null)
    },
    onError: () => toast.error("Failed to update task"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task deleted successfully")
    },
    onError: () => toast.error("Failed to delete task"),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch<Task>(`/tasks/${id}`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task marked as completed")
    },
    onError: () => toast.error("Failed to complete task"),
  })

  const handleSort = (key: keyof Task) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ column }: { column: keyof Task }) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteMutation.mutate(id)
    }
  }

  const handleComplete = (id: string) => {
    completeMutation.mutate(id)
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
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
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
                  <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
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
        <h2 className="text-2xl font-bold text-destructive">Failed to load tasks</h2>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const tasks = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your tasks and activities</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm
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
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("title")}>
                    <div className="flex items-center gap-1">
                      Title
                      <SortIcon column="title" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("type")}>
                    <div className="flex items-center gap-1">
                      Type
                      <SortIcon column="type" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("priority")}>
                    <div className="flex items-center gap-1">
                      Priority
                      <SortIcon column="priority" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon column="status" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("due_date")}>
                    <div className="flex items-center gap-1">
                      Due Date
                      <SortIcon column="due_date" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort("assigned_to")}>
                    <div className="flex items-center gap-1">
                      Assigned To
                      <SortIcon column="assigned_to" />
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
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="space-y-2">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No tasks found</h3>
                        <p className="text-muted-foreground">Get started by creating your first task.</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="mx-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Task
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {(() => {
                              const Icon = typeIcons[task.type] || CheckCircle;
                              return <Icon className="h-3 w-3" />;
                            })()}
                            {task.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={priorityColors[task.priority] || "bg-gray-100 text-gray-800"}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[task.status] || "bg-gray-100 text-gray-800"}>
                          {task.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(task.due_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>{task.assigned_to || "-"}</TableCell>
                      <TableCell>
                        {task.related_type && task.related_id && (
                          <span className="text-sm text-muted-foreground">
                            {task.related_type}: {task.related_id.slice(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(task.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingTask(task)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingTask(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {task.status !== "completed" && (
                            <Button variant="ghost" size="icon" onClick={() => handleComplete(task.id)}>
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
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
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
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

      {editingTask && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              initialData={editingTask}
              onSubmit={(data) => updateMutation.mutate({ id: editingTask.id, data })}
              isLoading={updateMutation.isPending}
              onClose={() => setEditingTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}