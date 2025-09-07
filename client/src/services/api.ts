import axios from 'axios'
import { globalLoading } from '../utils/globalLoading'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const fileUrl = (imageId: string) => `${API_BASE_URL}/upload/image/${imageId}/file`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    globalLoading.inc()
    return config
  },
  (error) => {
    globalLoading.dec()
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    globalLoading.dec()
    return response
  },
  (error) => {
    globalLoading.dec()
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Types
export interface Project {
  _id: string
  name: string
  description?: string
  images: ProjectImage[]
  createdAt: string
  updatedAt: string
}

export interface ProjectImage {
  id: string
  filename: string
  originalName: string
  url: string
  size: number
  mimeType: string
  width: number
  height: number
  uploadedAt: string
}

export interface Feedback {
  _id: string
  projectId: string | { _id: string; name: string }
  imageId: string
  title: string
  description: string
  category: 'accessibility' | 'visual_hierarchy' | 'content_copy' | 'ui_ux_patterns'
  severity: 'high' | 'medium' | 'low'
  roles: ('designer' | 'reviewer' | 'product_manager' | 'developer')[]
  coordinates: {
    x: number
    y: number
    width: number
    height: number
  }
  aiGenerated: boolean
  status: 'open' | 'resolved' | 'dismissed'
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  feedbackId: string
  parentId?: string
  author: string
  content: string
  role: 'designer' | 'reviewer' | 'product_manager' | 'developer'
  createdAt: string
  updatedAt: string
  replies?: Comment[]
}

// API functions
export const projectApi = {
  getAll: () => api.get<{ success: boolean; data: Project[] }>('/projects'),
  getById: (id: string) => api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => 
    api.post<{ success: boolean; data: Project }>('/projects', data),
  update: (id: string, data: { name?: string; description?: string }) => 
    api.put<{ success: boolean; data: Project }>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/projects/${id}`),
}

export const uploadApi = {
  uploadImage: (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<{ success: boolean; data: { image: ProjectImage; project: Project } }>(
      `/upload/${projectId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
  },
  getImageUrl: (imageId: string) => 
    api.get<{ success: boolean; data: { imageUrl: string; image: ProjectImage } }>(`/upload/image/${imageId}`),
}

export const aiApi = {
  analyzeDesign: (projectId: string, imageId: string) => 
    api.post<{ success: boolean; data: { feedback: Feedback[]; summary: string } }>(
      `/ai/analyze/${projectId}/${imageId}`
    ),
  getAnalysis: (projectId: string, imageId: string) => 
    api.get<{ success: boolean; data: Feedback[] }>(`/ai/analysis/${projectId}/${imageId}`),
}

export const feedbackApi = {
  getByProject: (projectId: string, filters?: {
    imageId?: string
    category?: string
    severity?: string
    role?: string
    status?: string
  }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    return api.get<{ success: boolean; data: Feedback[] }>(`/feedback/project/${projectId}?${params}`)
  },
  getById: (id: string) => 
    api.get<{ success: boolean; data: Feedback }>(`/feedback/${id}`),
  create: (data: {
    projectId: string
    imageId: string
    title: string
    description: string
    category: string
    severity: string
    roles: string[]
    coordinates: { x: number; y: number; width: number; height: number }
  }) => api.post<{ success: boolean; data: Feedback }>('/feedback', data),
  update: (id: string, data: Partial<Feedback>) => 
    api.put<{ success: boolean; data: Feedback }>(`/feedback/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/feedback/${id}`),
  getByRole: (role: string, filters?: { projectId?: string; imageId?: string }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    return api.get<{ success: boolean; data: Feedback[] }>(`/feedback/roles/${role}?${params}`)
  },
}

export const commentApi = {
  getByFeedback: (feedbackId: string, role?: string) => {
    const params = role ? `?role=${role}` : ''
    return api.get<{ success: boolean; data: Comment[] }>(`/comments/feedback/${feedbackId}${params}`)
  },
  create: (data: {
    feedbackId: string
    parentId?: string
    author: string
    content: string
    role: string
  }) => api.post<{ success: boolean; data: Comment }>('/comments', data),
  update: (id: string, content: string) => 
    api.put<{ success: boolean; data: Comment }>(`/comments/${id}`, { content }),
  delete: (id: string) => api.delete<{ success: boolean }>(`/comments/${id}`),
}

export const exportApi = {
  getPreview: (projectId: string, imageId?: string, role?: string) => {
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    const queryString = params.toString()
    const url = imageId 
      ? `/export/preview/${projectId}/${imageId}${queryString ? `?${queryString}` : ''}`
      : `/export/preview/${projectId}${queryString ? `?${queryString}` : ''}`
    return api.get<{ success: boolean; data: any }>(url)
  },
  generatePDF: (data: {
    projectId: string
    imageId?: string
    role?: string
    includeComments?: boolean
  }) => api.post('/export/pdf', data, { responseType: 'blob' }),
  generateJSON: (data: {
    projectId: string
    imageId?: string
    role?: string
    includeComments?: boolean
  }) => api.post('/export/json', data, { responseType: 'blob' }),
}

export default api
