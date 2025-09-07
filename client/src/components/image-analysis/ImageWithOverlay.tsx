import React, { useEffect, useRef } from 'react'
import { fileUrl, Feedback, ProjectImage } from '../../services/api'

interface Props {
  image: ProjectImage
  showOverlay: boolean
  filteredFeedback: Feedback[]
  selectedFeedback: Feedback | null
  onSelectArea: (area: { x: number; y: number; width: number; height: number }) => void
  onSelectFeedback: (feedback: Feedback) => void
}

const ImageWithOverlay: React.FC<Props> = ({
  image,
  showOverlay,
  filteredFeedback,
  selectedFeedback,
  onSelectArea,
  onSelectFeedback
}) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!showOverlay) return
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match image display size
    const rect = img.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scale factors
    const scaleX = canvas.width / img.naturalWidth
    const scaleY = canvas.height / img.naturalHeight

    filteredFeedback.forEach((item, index) => {
      const { x, y, width, height } = item.coordinates
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      let color = '#3b82f6'
      switch (item.severity) {
        case 'high': color = '#ef4444'; break
        case 'medium': color = '#f59e0b'; break
        case 'low': color = '#10b981'; break
      }

      const isSelected = selectedFeedback && selectedFeedback._id === item._id

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

      ctx.fillStyle = color + '20'
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)

      ctx.fillStyle = color
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText((index + 1).toString(), scaledX + 2, scaledY + 14)
    })
  }, [showOverlay, filteredFeedback, selectedFeedback, image.id])

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

    onSelectArea({ x: imageX - 50, y: imageY - 25, width: 100, height: 50 })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const scaleX = canvas.width / img.naturalWidth
    const scaleY = canvas.height / img.naturalHeight

    const clicked = filteredFeedback.find((item) => {
      const { x: fx, y: fy, width, height } = item.coordinates
      const scaledX = fx * scaleX
      const scaledY = fy * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY
      return x >= scaledX && x <= scaledX + scaledWidth && y >= scaledY && y <= scaledY + scaledHeight
    })

    if (clicked) onSelectFeedback(clicked)
  }

  return (
    <div className="card p-4">
      <div className="relative">
        <img
          ref={imageRef}
          src={fileUrl(image.id)}
          alt={image.originalName}
          className="w-full h-auto rounded-lg cursor-crosshair"
          onClick={handleImageClick}
        />
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
  )
}

export default ImageWithOverlay
