import React from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { cn } from '../../utils/cn'
import { getCategoryColor, getSeverityColor } from '../../utils/feedbackColors'
import { Feedback } from '../../services/api'
import { Filter } from 'lucide-react'

interface Filters { category: string; severity: string; status: string }

interface Props {
  loading: boolean
  filters: Filters
  onChangeFilters: (next: Filters) => void
  showFilters: boolean
  onToggleFilters: () => void
  items: Feedback[]
  selected: Feedback | null
  onSelect: (f: Feedback) => void
}

const FeedbackPanel: React.FC<Props> = ({
  loading,
  filters,
  onChangeFilters,
  showFilters,
  onToggleFilters,
  items,
  selected,
  onSelect
}) => {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Feedback</h3>
        <button onClick={onToggleFilters} className="btn btn-outline btn-sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      {showFilters && (
        <div className="space-y-3 mb-4">
          <select
            value={filters.category}
            onChange={(e) => onChangeFilters({ ...filters, category: e.target.value })}
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
            onChange={(e) => onChangeFilters({ ...filters, severity: e.target.value })}
            className="input w-full"
          >
            <option value="">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}
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
            {items.map((item) => (
              <div
                key={item._id}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-colors',
                  selected?._id === item._id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => onSelect(item)}
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

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg viewBox="0 0 24 24" className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10"/></svg>
                <p className="text-sm">No feedback found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FeedbackPanel
