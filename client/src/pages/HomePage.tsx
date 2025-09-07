import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useRole } from '../contexts/RoleContext'
import { cn } from '../utils/cn'
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Users,
  Settings
} from 'lucide-react'

const HomePage: React.FC = () => {
  const { projects, createProject, loading } = useProject()
  const { currentRole, getRoleDisplayName, getRoleDescription } = useRole()
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    const project = await createProject(newProjectName.trim(), newProjectDescription.trim())
    if (project) {
      setNewProjectName('')
      setNewProjectDescription('')
      setShowCreateForm(false)
      navigate(`/project/${project._id}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">DesignSight</h1>
        </div>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered design feedback platform for systematic, coordinate-anchored feedback
        </p>
        
        {/* Role Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Viewing as: {getRoleDisplayName(currentRole)}
          </h3>
          <p className="text-sm text-gray-600">
            {getRoleDescription(currentRole)}
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary btn-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Project
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="label block mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input w-full"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="label block mb-2">Description (Optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="Enter project description"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newProjectName.trim()}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>
        
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started with AI-powered design feedback</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/project/${project._id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    <span>{project.images.length} image{project.images.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
            <p className="text-sm text-gray-600">Automated design feedback using advanced AI vision models</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Coordinate Anchored</h3>
            <p className="text-sm text-gray-600">Feedback precisely located on design elements</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Role-Based Views</h3>
            <p className="text-sm text-gray-600">Filtered feedback for different team roles</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Collaboration</h3>
            <p className="text-sm text-gray-600">Threaded discussions and export capabilities</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
