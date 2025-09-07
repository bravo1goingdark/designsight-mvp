import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useRole } from '../contexts/RoleContext'
import { feedbackApi, aiApi, commentApi, exportApi, Feedback, Comment, fileUrl, projectApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { cn } from '../utils/cn'
import { 
  ArrowLeft, 
  Sparkles, 
  MessageSquare, 
  Filter, 
  Download,
  Eye,
  EyeOff,
  Plus,
  Send,
  MoreVertical,
  Trash2,
  Edit3,
  FileText,
  FileJson
} from 'lucide-react'
import toast from 'react-hot-toast'

const ImageAnalysisPage: React.FC = () => {
  const { projectId, imageId } = useParams<{ projectId: string; imageId: string }>()
  const navigate = useNavigate()
  const { projects } = useProject()
  const { currentRole } = useRole()
  
  const [project, setProject] = useState(projects.find(p => p._id === projectId) || null)
  const [image, setImage] = useState(project?.images.find(img => img.id === imageId) || null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState<null | 'pdf' | 'json'>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    status: ''
  })
  const [showOverlay, setShowOverlay] = useState(true)
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    category: 'ui_ux_patterns' as const,
    severity: 'medium' as const
  })
  const [showAddFeedback, setShowAddFeedback] = useState(false)
  const [selectedArea, setSelectedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const foundProject = projects.find(p => p._id === projectId)
    if (foundProject) {
      setProject(foundProject)
      const foundImage = foundProject.images.find(img => img.id === imageId)
      if (foundImage) {
        setImage(foundImage)
      }
    }
  }, [projects, projectId, imageId])

  // Fallback: if image not found in context (e.g., immediately after upload), fetch latest project by ID
  useEffect(() => {
    const ensureLatestProject = async () => {
      if (!project || !image) {
        try {
          const resp = await projectApi.getById(projectId!)
          const proj = resp.data.data
          setProject(proj)
          const foundImage = proj.images?.find((img: any) => img.id === imageId) || null
          if (foundImage) setImage(foundImage)
        } catch (e) {
          // no-op; UI already shows a friendly state if not found
        }
      }
    }
    ensureLatestProject()
  }, [project, image, projectId, imageId])

  useEffect(() => {
    if (project && image) {
      fetchFeedback()
    }
  }, [project, image])

  useEffect(() => {
    applyFilters()
  }, [feedback, filters, currentRole])

  useEffect(() => {
    if (showOverlay && imageRef.current && canvasRef.current && filteredFeedback.length > 0) {
      drawFeedbackOverlays()
    }
  }, [showOverlay, filteredFeedback, image])

  const fetchFeedback = async () => {
    if (!project || !image) return

    try {
      setLoading(true)
      const response = await feedbackApi.getByProject(project._id, { imageId: image.id })
      setFeedback(response.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch feedback')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = feedback.filter(f => f.roles.includes(currentRole))

    if (filters.category) {
      filtered = filtered.filter(f => f.category === filters.category)
    }
    if (filters.severity) {
      filtered = filtered.filter(f => f.severity === filters.severity)
    }
    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status)
    }

    setFilteredFeedback(filtered)
  }


  const drawFeedbackOverlays = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match image display size
    const rect = image.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scale factors
    const scaleX = canvas.width / image.naturalWidth
    const scaleY = canvas.height / image.naturalHeight

    // Draw feedback overlays
    filteredFeedback.forEach((item, index) => {
      const { x, y, width, height } = item.coordinates
      
      // Scale coordinates to match displayed image size
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY
      
      // Set color based on severity
      let color = '#3b82f6' // default blue
      switch (item.severity) {
        case 'high':
          color = '#ef4444' // red
          break
        case 'medium':
          color = '#f59e0b' // yellow
          break
        case 'low':
          color = '#10b981' // green
          break
      }

      const isSelected = selectedFeedback && selectedFeedback._id === item._id
      
      // Draw rectangle
      ctx.strokeStyle = color
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.setLineDash([5, 5])
      if (isSelected) {
        ctx.shadowColor = color
        ctx.shadowBlur = 8
      } else {
        ctx.shadowBlur = 0
      }
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)
      
      // Draw semi-transparent fill
      ctx.fillStyle = color + '20' // 20% opacity
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)
      
      // Draw number indicator
      ctx.fillStyle = color
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText((index + 1).toString(), scaledX + 2, scaledY + 14)
    })
  }

  const handleAnalyzeImage = async () => {
    if (!project || !image) return

    setAnalyzing(true)
    try {
      await aiApi.analyzeDesign(project._id, image.id)
      await fetchFeedback()
      toast.success('AI analysis completed')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Convert to image coordinates
    const scaleX = imageRef.current.naturalWidth / rect.width
    const scaleY = imageRef.current.naturalHeight / rect.height
    
    const imageX = x * scaleX
    const imageY = y * scaleY
    
    setSelectedArea({
      x: imageX - 50,
      y: imageY - 25,
      width: 100,
      height: 50
    })
    setShowAddFeedback(true)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate scale factors
    const scaleX = canvas.width / imageRef.current.naturalWidth
    const scaleY = canvas.height / imageRef.current.naturalHeight

    // Find clicked feedback item
    const clickedFeedback = filteredFeedback.find((item, index) => {
      const { x: fx, y: fy, width, height } = item.coordinates
      const scaledX = fx * scaleX
      const scaledY = fy * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      return x >= scaledX && x <= scaledX + scaledWidth && 
             y >= scaledY && y <= scaledY + scaledHeight
    })

    if (clickedFeedback) {
      setSelectedFeedback(clickedFeedback)
    }
  }

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !image || !selectedArea || !newFeedback.title || !newFeedback.description) return

    try {
      await feedbackApi.create({
        projectId: project._id,
        imageId: image.id,
        title: newFeedback.title,
        description: newFeedback.description,
        category: newFeedback.category,
        severity: newFeedback.severity,
        roles: [currentRole],
        coordinates: selectedArea
      })
      
      setNewFeedback({ title: '', description: '', category: 'ui_ux_patterns', severity: 'medium' })
      setSelectedArea(null)
      setShowAddFeedback(false)
      await fetchFeedback()
      toast.success('Feedback added successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add feedback')
    }
  }

  const handleSelectFeedback = async (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    try {
      const response = await commentApi.getByFeedback(feedback._id)
      setComments(response.data.data)
    } catch (error: any) {
      toast.error('Failed to fetch comments')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeedback || !newComment.trim()) return

    try {
      await commentApi.create({
        feedbackId: selectedFeedback._id,
        author: `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} User`,
        content: newComment.trim(),
        role: currentRole
      })
      
      setNewComment('')
      const response = await commentApi.getByFeedback(selectedFeedback._id)
      setComments(response.data.data)
      toast.success('Comment added successfully')
    } catch (error: any) {
      toast.error('Failed to add comment')
    }
  }

  const handleExportPDF = async () => {
    if (!project || !image) return

    setExporting('pdf')
    const t = toast.loading('Generating PDF...')
    try {
      const response = await exportApi.generatePDF({
        projectId: project._id,
        imageId: image.id,
        role: currentRole,
        includeComments: true
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `designsight-report-${project.name}-${image.originalName}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF report downloaded successfully', { id: t })
    } catch (error: any) {
      toast.error('Failed to generate PDF report', { id: t })
    } finally {
      setExporting(null)
    }
  }

  const handleExportJSON = async () => {
    if (!project || !image) return

    setExporting('json')
    const t = toast.loading('Preparing JSON export...')
    try {
      const response = await exportApi.generateJSON({
        projectId: project._id,
        imageId: image.id,
        role: currentRole,
        includeComments: true
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `designsight-data-${project.name}-${image.originalName}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('JSON data downloaded successfully', { id: t })
    } catch (error: any) {
      toast.error('Failed to generate JSON export', { id: t })
    } finally {
      setExporting(null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'accessibility': return 'bg-blue-100 text-blue-800'
      case 'visual_hierarchy': return 'bg-purple-100 text-purple-800'
      case 'content_copy': return 'bg-green-100 text-green-800'
      case 'ui_ux_patterns': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!project || !image) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Image not found</h2>
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="btn btn-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{image.originalName}</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className="btn btn-outline btn-sm"
          >
            {showOverlay ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showOverlay ? 'Hide' : 'Show'} Overlay
          </button>
          {/* Export controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting === 'pdf'}
              className="btn btn-outline btn-sm"
              title="Export PDF Report"
            >
            {exporting === 'pdf' ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {exporting === 'pdf' ? 'Generating…' : 'PDF'}
          </button>
            <button
              onClick={handleExportJSON}
              disabled={exporting === 'json'}
              className="btn btn-outline btn-sm"
              title="Export JSON Data"
            >
            {exporting === 'json' ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FileJson className="w-4 h-4 mr-2" />
            )}
            {exporting === 'json' ? 'Preparing…' : 'JSON'}
            </button>
          </div>
          <button
            onClick={handleAnalyzeImage}
            disabled={analyzing}
            className="btn btn-primary btn-sm"
          >
            {analyzing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {analyzing ? 'Analyzing...' : 'AI Analyze'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Section */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <div className="relative">
<img
                ref={imageRef}
                src={fileUrl(image.id)}
                alt={image.originalName}
                className="w-full h-auto rounded-lg cursor-crosshair"
                onClick={handleImageClick}
              />
              
              {/* Feedback Overlays */}
              {showOverlay && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 cursor-pointer"
                  style={{ width: '100%', height: '100%' }}
                  onClick={handleCanvasClick}
                />
              )}
            </div>
          </div>
        </div>

        {/* Feedback Panel */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Feedback</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>

            {showFilters && (
              <div className="space-y-3 mb-4">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">All Categories</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="visual_hierarchy">Visual Hierarchy</option>
                  <option value="content_copy">Content & Copy</option>
                  <option value="ui_ux_patterns">UI/UX Patterns</option>
                </select>
                
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Loading feedback…</span>
                </div>
              ) : (
                <>
                  {filteredFeedback.map((item) => (
                    <div
                      key={item._id}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedFeedback?._id === item._id
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => handleSelectFeedback(item)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                        <div className="flex space-x-1">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getSeverityColor(item.severity))}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getCategoryColor(item.category))}>
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredFeedback.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No feedback found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Comments Section */}
          {selectedFeedback && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Discussion</h3>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="btn btn-primary btn-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add Feedback Modal */}
      {showAddFeedback && selectedArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Feedback</h2>
            <form onSubmit={handleAddFeedback}>
              <div className="mb-4">
                <label className="label block mb-2">Title</label>
                <input
                  type="text"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                  className="input w-full"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="label block mb-2">Description</label>
                <textarea
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full h-20 resize-none"
                  placeholder="Detailed description and recommendations"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="label block mb-2">Category</label>
                  <select
                    value={newFeedback.category}
                    onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="accessibility">Accessibility</option>
                    <option value="visual_hierarchy">Visual Hierarchy</option>
                    <option value="content_copy">Content & Copy</option>
                    <option value="ui_ux_patterns">UI/UX Patterns</option>
                  </select>
                </div>
                
                <div>
                  <label className="label block mb-2">Severity</label>
                  <select
                    value={newFeedback.severity}
                    onChange={(e) => setNewFeedback(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFeedback(false)
                    setSelectedArea(null)
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Add Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageAnalysisPage
