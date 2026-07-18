export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  SALES_REP = "sales_rep",
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  avatar?: string
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  full_name: string
  password: string
  role: UserRole
}

export interface UserUpdate {
  email?: string
  full_name?: string
  role?: UserRole
  is_active?: boolean
  avatar?: string
}

export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  role?: UserRole
  is_active?: boolean
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  page_size: number
  total_pages: number
}