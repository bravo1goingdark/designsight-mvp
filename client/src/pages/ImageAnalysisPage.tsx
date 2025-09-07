import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useRole } from '../contexts/RoleContext'
import { feedbackApi, aiApi, commentApi, exportApi, Feedback, Comment, projectApi, ProjectImage } from '../services/api'
import FeedbackPanel from '../components/image-analysis/FeedbackPanel'
import CommentsPanel from '../components/image-analysis/CommentsPanel'
import ImageWithOverlay from '../components/image-analysis/ImageWithOverlay'
import { 
  ArrowLeft, 
  Sparkles, 
  Eye,
  EyeOff,
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
  const [image, setImage] = useState<ProjectImage | null>(project?.images.find(img => img.id === imageId) || null)
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

  useEffect(() => {
    const foundProject = projects.find(p => p._id === projectId)
    if (foundProject) {
      setProject(foundProject)
      const foundImage = foundProject.images.find(img => img.id === imageId)
      if (foundImage) setImage(foundImage)
    }
  }, [projects, projectId, imageId])

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
          // no-op
        }
      }
    }
    ensureLatestProject()
  }, [project, image, projectId, imageId])

  useEffect(() => {
    if (project && image) fetchFeedback()
  }, [project, image])

  useEffect(() => {
    applyFilters()
  }, [feedback, filters, currentRole])

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
    if (filters.category) filtered = filtered.filter(f => f.category === filters.category)
    if (filters.severity) filtered = filtered.filter(f => f.severity === filters.severity)
    if (filters.status) filtered = filtered.filter(f => f.status === filters.status)
    setFilteredFeedback(filtered)
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

  const handleSelectFeedback = async (fb: Feedback) => {
    setSelectedFeedback(fb)
    try {
      const response = await commentApi.getByFeedback(fb._id)
      setComments(response.data.data)
    } catch {
      toast.error('Failed to fetch comments')
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
    } catch {
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
    } catch {
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
    } catch {
      toast.error('Failed to generate JSON export', { id: t })
    } finally {
      setExporting(null)
    }
  }

  if (!project || !image) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Image not found</h2>
        <button onClick={() => navigate(`/project/${projectId}`)} className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/project/${projectId}`)} className="btn btn-outline btn-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{image.originalName}</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowOverlay(!showOverlay)} className="btn btn-outline btn-sm">
            {showOverlay ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showOverlay ? 'Hide' : 'Show'} Overlay
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={handleExportPDF} disabled={exporting === 'pdf'} className="btn btn-outline btn-sm" title="Export PDF Report">
              {exporting === 'pdf' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {exporting === 'pdf' ? 'Generating…' : 'PDF'}
            </button>
            <button onClick={handleExportJSON} disabled={exporting === 'json'} className="btn btn-outline btn-sm" title="Export JSON Data">
              {exporting === 'json' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              {exporting === 'json' ? 'Preparing…' : 'JSON'}
            </button>
          </div>
          <button onClick={handleAnalyzeImage} disabled={analyzing} className="btn btn-primary btn-sm">
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
        <div className="lg:col-span-2">
          <ImageWithOverlay
            image={image}
            showOverlay={showOverlay}
            filteredFeedback={filteredFeedback}
            selectedFeedback={selectedFeedback}
            onSelectArea={(area) => { setSelectedArea(area); setShowAddFeedback(true) }}
            onSelectFeedback={(fb) => handleSelectFeedback(fb)}
          />
        </div>

        <div className="space-y-6">
          <FeedbackPanel
            loading={loading}
            filters={filters}
            onChangeFilters={setFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(v => !v)}
            items={filteredFeedback}
            selected={selectedFeedback}
            onSelect={handleSelectFeedback}
          />

{selectedFeedback && (
            <CommentsPanel
              comments={comments}
              newComment={newComment}
              onChangeNewComment={setNewComment}
              onSubmit={handleAddComment}
            />
          )}
        </div>
      </div>

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
                <button type="button" onClick={() => { setShowAddFeedback(false); setSelectedArea(null) }} className="btn btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Add Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageAnalysisPage
