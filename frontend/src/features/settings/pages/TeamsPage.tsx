import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Edit, Trash2, Save, Loader2, Users, UserPlus, Search } from "lucide-react"
import { api } from "@/shared/api/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

interface Team {
  id: string
  name: string
  description: string
  member_count: number
  created_at: string
}

interface TeamMember {
  id: string
  user_id: string
  user_name: string
  user_email: string
  role: string
  joined_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
})

type TeamFormData = z.infer<typeof teamSchema>

const teamRoles = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
]

const teamRoleColors: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-purple-100 text-purple-800",
  member: "bg-gray-100 text-gray-800",
}

export function TeamsPage() {
  const queryClient = useQueryClient()
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams", searchQuery],
    queryFn: () => api.get<{ items: Team[] }>("/settings/teams", { params: { search: searchQuery } }),
  })

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<{ items: User[] }>("/users"),
  })

  const teamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) => api.post<Team>("/settings/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      toast.success("Team created successfully")
      teamForm.reset()
    },
    onError: () => toast.error("Failed to create team"),
  })

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeamFormData> }) => api.patch<Team>(`/settings/teams/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      toast.success("Team updated successfully")
      setEditingTeam(null)
    },
    onError: () => toast.error("Failed to update team"),
  })

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      toast.success("Team deleted successfully")
    },
    onError: () => toast.error("Failed to delete team"),
  })

  const fetchTeamMembers = async (teamId: string) => {
    const response = await api.get<{ items: TeamMember[] }>(`/settings/teams/${teamId}/members`)
    return response.items
  }

  const addTeamMemberMutation = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: string; userId: string; role: string }) =>
      api.post(`/settings/teams/${teamId}/members`, { user_id: userId, role }),
    onSuccess: () => {
      if (viewingTeam) {
        fetchTeamMembers(viewingTeam.id).then(setTeamMembers)
      }
      toast.success("Member added successfully")
    },
    onError: () => toast.error("Failed to add member"),
  })

  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/settings/teams/${teamId}/members/${userId}`),
    onSuccess: () => {
      if (viewingTeam) {
        fetchTeamMembers(viewingTeam.id).then(setTeamMembers)
      }
      toast.success("Member removed successfully")
    },
    onError: () => toast.error("Failed to remove member"),
  })

  const handleSubmit = (data: TeamFormData) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data })
    } else {
      createTeamMutation.mutate(data)
    }
  }

  const handleEdit = (team: Team) => {
    teamForm.reset({
      name: team.name,
      description: team.description || "",
    })
    setEditingTeam(team)
  }

  const handleView = async (team: Team) => {
    setViewingTeam(team)
    const members = await fetchTeamMembers(team.id)
    setTeamMembers(members)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      deleteTeamMutation.mutate(id)
    }
  }

  if (teamsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">Organize users into teams</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Organize users into teams</p>
        </div>
        <Dialog open={!!editingTeam || false} onOpenChange={(open) => !open && setEditingTeam(null)}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
            </DialogHeader>
            <Form {...teamForm}>
              <form onSubmit={teamForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={teamForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Sales Team" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={teamForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingTeam(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTeamMutation.isPending || updateTeamMutation.isPending}>
                    {createTeamMutation.isPending || updateTeamMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingTeam ? "Update Team" : "Create Team"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>All teams in your organization</CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No teams found</h3>
                      <p className="text-muted-foreground mt-2">Create your first team to organize users.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  teams?.items?.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{team.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.member_count} members</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(team)} title="View Members">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(team)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} title="Delete">
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

      {viewingTeam && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setViewingTeam(null); setTeamMembers([]); } }}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{viewingTeam.name} - Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Team Members ({teamMembers.length})</h4>
                <Dialog open={true} onOpenChange={(open) => !open && setViewingTeam(viewingTeam)}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <Form>
                      <form className="space-y-4">
                        <FormField
                          control={teamForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select User</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select user" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users?.items?.filter(u => !teamMembers.find(m => m.user_id === u.id)).map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name} ({user.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={teamForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teamRoles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setViewingTeam(viewingTeam)}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              const userId = teamForm.getValues("name")
                              const role = teamForm.getValues("description")
                              if (userId && role) {
                                addTeamMemberMutation.mutate({ teamId: viewingTeam.id, userId, role })
                              }
                            }}
                          >
                            Add Member
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members in this team yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.user_name}</p>
                        <p className="text-sm text-muted-foreground">{member.user_email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={teamRoleColors[member.role] || "bg-gray-100 text-gray-800"}>
                          {teamRoles.find((r) => r.value === member.role)?.label || member.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMemberMutation.mutate({ teamId: viewingTeam.id, userId: member.user_id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}