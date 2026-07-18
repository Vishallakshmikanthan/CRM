import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios"
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from "@/shared/utils/auth"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: Error) => void
  }> = []

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken()
        if (token && !isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => Promise.reject(error)
    )

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return this.client(originalRequest)
              })
              .catch((err) => Promise.reject(err))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = getRefreshToken()
            if (!refreshToken) {
              throw new Error("No refresh token")
            }

            const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
            const { access_token, refresh_token: newRefreshToken } = response.data

            setTokens(access_token, newRefreshToken)
            this.client.defaults.headers.common.Authorization = `Bearer ${access_token}`

            this.failedQueue.forEach(({ resolve }) => resolve(access_token))
            this.failedQueue = []

            return this.client(originalRequest)
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError as Error))
            this.failedQueue = []
            clearTokens()
            window.location.href = "/login"
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: unknown) {
    const response = await this.client.post<T>(url, data)
    return response.data
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await this.client.patch<T>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: unknown) {
    const response = await this.client.put<T>(url, data)
    return response.data
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url)
    return response.data
  }

  // File upload
  async upload<T>(url: string, formData: FormData) {
    const response = await this.client.post<T>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  }

  // Export CSV/PDF
  async download(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get(url, {
      params,
      responseType: "blob",
    })
    return response.data
  }
}

export const api = new ApiClient()
export default api