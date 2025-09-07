import React from 'react'
import { Comment } from '../../services/api'
import { Send } from 'lucide-react'

interface Props {
  comments: Comment[]
  newComment: string
  onChangeNewComment: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

const CommentsPanel: React.FC<Props> = ({ comments, newComment, onChangeNewComment, onSubmit }) => {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Discussion</h3>
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment._id} className="border-l-2 border-gray-200 pl-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">{comment.author}</span>
              <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => onChangeNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="input flex-1"
        />
        <button type="submit" disabled={!newComment.trim()} className="btn btn-primary btn-sm">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

export default CommentsPanel
