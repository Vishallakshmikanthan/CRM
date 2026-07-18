import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Edit, Trash2, Save, Loader2, Building2, Users, Shield, Key, Mail, Phone, Globe, MapPin } from "lucide-react"
import { api } from "@/shared/api/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

interface CompanySettings {
  id: string
  company_name: string
  logo_url: string | null
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  phone: string
  email: string
  website: string
  timezone: string
  currency: string
  date_format: string
  fiscal_year_start: number
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

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

const companySchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
  date_format: z.string().default("MM/DD/YYYY"),
  fiscal_year_start: z.number().min(1).max(12).default(1),
})

type CompanyFormData = z.infer<typeof companySchema>

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  full_name: z.string().min(1, "Full name is required"),
  role: z.string().default("sales_rep"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
})

type UserFormData = z.infer<typeof userSchema>

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
})

type TeamFormData = z.infer<typeof teamSchema>

const timezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland"
]

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"]

const dateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]

const roles = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "sales_rep", label: "Sales Representative" },
]

const teamRoles = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
]

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("company")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/settings/company"),
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<{ items: User[] }>("/users"),
  })

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.get<{ items: Team[] }>("/settings/teams"),
  })

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      phone: "",
      email: "",
      website: "",
      timezone: "UTC",
      currency: "USD",
      date_format: "MM/DD/YYYY",
      fiscal_year_start: 1,
    },
  })

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "sales_rep",
      password: "",
    },
  })

  const teamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const companyMutation = useMutation({
    mutationFn: (data: CompanyFormData) => api.patch<CompanySettings>("/settings/company", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] })
      toast.success("Company settings updated successfully")
    },
    onError: () => toast.error("Failed to update company settings"),
  })

  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post<User>("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User created successfully")
      userForm.reset()
    },
    onError: () => toast.error("Failed to create user"),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) => api.patch<User>(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User updated successfully")
      setEditingUser(null)
    },
    onError: () => toast.error("Failed to update user"),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted successfully")
    },
    onError: () => toast.error("Failed to delete user"),
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

  const handleCompanySubmit = (data: CompanyFormData) => {
    companyMutation.mutate(data)
  }

  const handleUserSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data })
    } else {
      createUserMutation.mutate(data)
    }
  }

  const handleTeamSubmit = (data: TeamFormData) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data })
    } else {
      createTeamMutation.mutate(data)
    }
  }

  const handleEditUser = (user: User) => {
    userForm.reset({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password: "",
    })
    setEditingUser(user)
  }

  const handleEditTeam = (team: Team) => {
    teamForm.reset({
      name: team.name,
      description: team.description || "",
    })
    setEditingTeam(team)
  }

  const handleViewTeam = async (team: Team) => {
    setViewingTeam(team)
    const members = await fetchTeamMembers(team.id)
    setTeamMembers(members)
  }

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(id)
    }
  }

  const handleDeleteTeam = (id: string) => {
    if (confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      deleteTeamMutation.mutate(id)
    }
  }

  const onAddMember = (data: { email: string; role: string }) => {
    if (viewingTeam) {
      addTeamMemberMutation.mutate({ teamId: viewingTeam.id, userId: data.email, role: data.role })
    }
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800",
    manager: "bg-blue-100 text-blue-800",
    sales_rep: "bg-green-100 text-green-800",
  }

  const teamRoleColors: Record<string, string> = {
    owner: "bg-yellow-100 text-yellow-800",
    admin: "bg-purple-100 text-purple-800",
    member: "bg-gray-100 text-gray-800",
  }

  if (companyLoading || usersLoading || teamsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your company settings, users, and teams</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your company settings, users, and teams</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="mr-2 h-4 w-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Update your company information and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://acme.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@acme.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="94105" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={companyForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((curr) => (
                                <SelectItem key={curr} value={curr}>
                                  {curr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="date_format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dateFormats.map((fmt) => (
                                <SelectItem key={fmt} value={fmt}>
                                  {fmt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                <FormField
                  control={companyForm.control}
                  name="fiscal_year_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiscal Year Start Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((month) => (
                            <SelectItem key={month} value={month}>
                              {new Date(2000, parseInt(month) - 1).toLocaleString("default", { month: "long" })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={companyMutation.isPending}>
                      {companyMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-muted-foreground">Manage user accounts and roles</p>
            </div>
            <Dialog open={!!editingUser || false} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                </DialogHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="user@company.com" {...field} disabled={!!editingUser} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{editingUser ? "New Password (leave blank to keep current)" : "Password *"}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                        {createUserMutation.isPending || updateUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          editingUser ? "Update User" : "Create User"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.items?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No users found</h3>
                          <p className="text-muted-foreground mt-2">Add your first user to get started.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users?.items?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={roleColors[user.role] || "bg-gray-100 text-gray-800"}>
                              {roles.find(r => r.value === user.role)?.label || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
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
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Team Management</h2>
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
                  <form onSubmit={teamForm.handleSubmit(handleTeamSubmit)} className="space-y-4">
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
            <CardContent className="p-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
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
                              <Button variant="ghost" size="icon" onClick={() => handleViewTeam(team)}>
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)}>
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
                          <Plus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                        </DialogHeader>
                        <Form {...userForm}>
                          <form onSubmit={userForm.handleSubmit(onAddMember)} className="space-y-4">
                            <FormField
                              control={userForm.control}
                              name="email"
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
                              control={userForm.control}
                              name="role"
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
                                  const userId = userForm.getValues("email")
                                  const role = userForm.getValues("role")
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
                              {teamRoles.find(r => r.value === member.role)?.label || member.role}
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
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Permissions</CardTitle>
              <CardDescription>Configure what each role can access and modify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Permission</TableHead>
                      <TableHead>Administrator</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Sales Representative</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { permission: "View Dashboard", admin: true, manager: true, sales: true },
                      { permission: "Manage Company Settings", admin: true, manager: false, sales: false },
                      { permission: "Manage Users", admin: true, manager: false, sales: false },
                      { permission: "Manage Teams", admin: true, manager: true, sales: false },
                      { permission: "View All Customers", admin: true, manager: true, sales: false },
                      { permission: "Create/Edit Customers", admin: true, manager: true, sales: true },
                      { permission: "Delete Customers", admin: true, manager: false, sales: false },
                      { permission: "View All Leads", admin: true, manager: true, sales: false },
                      { permission: "Create/Edit Leads", admin: true, manager: true, sales: true },
                      { permission: "Delete Leads", admin: true, manager: true, sales: false },
                      { permission: "View All Opportunities", admin: true, manager: true, sales: false },
                      { permission: "Create/Edit Opportunities", admin: true, manager: true, sales: true },
                      { permission: "Delete Opportunities", admin: true, manager: false, sales: false },
                      { permission: "Manage Tasks", admin: true, manager: true, sales: true },
                      { permission: "View Email Activity", admin: true, manager: true, sales: true },
                      { permission: "Send Emails", admin: true, manager: true, sales: true },
                      { permission: "View Reports", admin: true, manager: true, sales: false },
                      { permission: "Export Reports", admin: true, manager: true, sales: false },
                    ].map((item) => (
                      <TableRow key={item.permission}>
                        <TableCell className="font-medium">{item.permission}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.admin ? "default" : "secondary"}>
                            {item.admin ? "Full" : "None"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.manager ? "default" : "secondary"}>
                            {item.manager ? "Full" : "None"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.sales ? "default" : "secondary"}>
                            {item.sales ? "Full" : "None"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Note: Permission management UI is read-only in this version. Permissions are enforced by the backend API.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}