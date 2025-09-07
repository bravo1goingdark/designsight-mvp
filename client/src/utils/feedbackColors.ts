export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'accessibility': return 'bg-blue-100 text-blue-800'
    case 'visual_hierarchy': return 'bg-purple-100 text-purple-800'
    case 'content_copy': return 'bg-green-100 text-green-800'
    case 'ui_ux_patterns': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
