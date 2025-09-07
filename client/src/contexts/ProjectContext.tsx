import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Project, projectApi } from '../services/api'
import toast from 'react-hot-toast'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project | null>
  updateProject: (id: string, data: { name?: string; description?: string }) => Promise<boolean>
  deleteProject: (id: string) => Promise<boolean>
  setCurrentProject: (project: Project | null) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: ReactNode
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectApi.getAll()
      setProjects(response.data.data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch projects'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectApi.create({ name, description })
      const newProject = response.data.data
      setProjects(prev => [newProject, ...prev])
      toast.success('Project created successfully')
      return newProject
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create project'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: string, data: { name?: string; description?: string }): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectApi.update(id, data)
      const updatedProject = response.data.data
      setProjects(prev => prev.map(p => p._id === id ? updatedProject : p))
      if (currentProject?._id === id) {
        setCurrentProject(updatedProject)
      }
      toast.success('Project updated successfully')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update project'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await projectApi.delete(id)
      setProjects(prev => prev.filter(p => p._id !== id))
      if (currentProject?._id === id) {
        setCurrentProject(null)
      }
      toast.success('Project deleted successfully')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete project'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const value: ProjectContextType = {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}
