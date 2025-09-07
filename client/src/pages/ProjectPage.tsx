import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useRole } from '../contexts/RoleContext'
import { uploadApi, feedbackApi, aiApi, Feedback, fileUrl } from '../services/api'
import { cn } from '../utils/cn'
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Eye, 
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit3,
  ArrowLeft
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, updateProject, deleteProject, fetchProjects, setCurrentProject } = useProject()
  const { currentRole } = useRole()
  
  const [project, setProject] = useState(projects.find(p => p._id === projectId) || null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    const foundProject = projects.find(p => p._id === projectId)
    if (foundProject) {
      setProject(foundProject)
      setEditName(foundProject.name)
      setEditDescription(foundProject.description || '')
    }
  }, [projects, projectId])

  const onDrop = async (acceptedFiles: File[]) => {
    if (!project || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setLoading(true)

    try {
      const response = await uploadApi.uploadImage(project._id, file)
      const { image, project: updatedProject } = response.data.data
      
      // Update local and global project state so other pages can see the new image immediately
      setProject(updatedProject)
      try {
        setCurrentProject(updatedProject)
      } catch {}
      try {
        await fetchProjects()
      } catch {}
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: loading
  })

  const handleAnalyzeImage = async (imageId: string) => {
    if (!project) return

    setAnalyzing(imageId)
    try {
      await aiApi.analyzeDesign(project._id, imageId)
      toast.success('AI analysis completed')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to analyze image')
    } finally {
      setAnalyzing(null)
    }
  }

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    const success = await updateProject(project._id, {
      name: editName,
      description: editDescription
    })
    
    if (success) {
      setShowEditForm(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      const success = await deleteProject(project._id)
      if (success) {
        navigate('/')
      }
    }
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="btn btn-outline btn-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeleteProject}
            className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Edit Project Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Project</h2>
            <form onSubmit={handleEditProject}>
              <div className="mb-4">
                <label className="label block mb-2">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="label block mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input w-full h-20 resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {loading ? (
            <p className="text-gray-600">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-primary-600">Drop the image here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports PNG, JPG, JPEG, GIF, WebP (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {project.images.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Images ({project.images.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.images.map((image) => (
              <div key={image.id} className="card p-4">
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
<img
                    src={fileUrl(image.id)}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">
                    {image.originalName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {image.width} × {image.height} • {(image.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/project/${project._id}/image/${image.id}`)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View & Analyze
                  </button>
                  <button
                    onClick={() => handleAnalyzeImage(image.id)}
                    disabled={analyzing === image.id}
                    className="btn btn-outline btn-sm"
                  >
                    {analyzing === image.id ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.images.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600">Upload your first design image to get started with AI analysis</p>
        </div>
      )}
    </div>
  )
}

export default ProjectPage
