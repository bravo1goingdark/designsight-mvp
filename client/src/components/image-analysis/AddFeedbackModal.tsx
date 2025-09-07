import React from 'react'

interface Area { x: number; y: number; width: number; height: number }

interface NewFeedbackState {
  title: string
  description: string
  category: 'accessibility' | 'visual_hierarchy' | 'content_copy' | 'ui_ux_patterns'
  severity: 'low' | 'medium' | 'high'
}

interface Props {
  open: boolean
  area: Area | null
  newFeedback: NewFeedbackState
  onChange: (next: NewFeedbackState) => void
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
}

const AddFeedbackModal: React.FC<Props> = ({ open, area, newFeedback, onChange, onCancel, onSubmit }) => {
  if (!open || !area) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Feedback</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="label block mb-2">Title</label>
            <input
              type="text"
              value={newFeedback.title}
              onChange={(e) => onChange({ ...newFeedback, title: e.target.value })}
              className="input w-full"
              placeholder="Brief description of the issue"
              required
            />
          </div>
          <div className="mb-4">
            <label className="label block mb-2">Description</label>
            <textarea
              value={newFeedback.description}
              onChange={(e) => onChange({ ...newFeedback, description: e.target.value })}
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
                onChange={(e) => onChange({ ...newFeedback, category: e.target.value as any })}
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
                onChange={(e) => onChange({ ...newFeedback, severity: e.target.value as any })}
                className="input w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button type="button" onClick={onCancel} className="btn btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">Add Feedback</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddFeedbackModal
