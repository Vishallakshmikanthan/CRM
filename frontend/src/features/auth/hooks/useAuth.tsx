import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User, UserRole } from "@/shared/types/user"
import { api } from "@/shared/api/client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isManager: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const isAdmin = user?.role === UserRole.ADMIN
  const isManager = user?.role === UserRole.MANAGER || isAdmin

  const refreshUser = async () => {
    try {
      const currentUser = await api.get<User>("/auth/me")
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const authData = await api.post<{ access_token: string; refresh_token: string; user: User }>("/auth/login", {
      email,
      password,
    })
    localStorage.setItem("access_token", authData.access_token)
    localStorage.setItem("refresh_token", authData.refresh_token)
    setUser(authData.user)
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      setUser(null)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, isAdmin, isManager, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
