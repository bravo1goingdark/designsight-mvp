import 'dotenv/config'
import { connectDB } from '../src/config/database'
import { initializeMinIO, uploadFile, getFileUrl } from '../src/config/minio'
import Project from '../src/models/Project'
import Feedback from '../src/models/Feedback'
import { AIService } from '../src/services/aiService'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

async function main() {
  try {
    const mongo = process.env.MONGO_URI || 'mongodb://localhost:27017/designsight'

    console.log(`Connecting to MongoDB: ${mongo}`)
    await connectDB()
    await initializeMinIO()

    const projectName = process.env.SEED_PROJECT_NAME || 'DesignSight Demo Project'
    const description = process.env.SEED_PROJECT_DESCRIPTION || 'Preloaded demo project with one image'
    const imageUrl = process.env.SEED_IMAGE_URL

    const project = await Project.create({ name: projectName, description, images: [] })
    console.log(`Created project: ${project.name} (${project._id})`)

    if (!imageUrl) {
      console.log('No SEED_IMAGE_URL provided. Skipping image upload. Set SEED_IMAGE_URL to preload an image.')
      process.exit(0)
      return
    }

    console.log(`Downloading image from ${imageUrl}`)
    const resp = await fetch(imageUrl)
    if (!resp.ok) {
      throw new Error(`Failed to download image: ${resp.status} ${resp.statusText}`)
    }
    const buf = Buffer.from(await resp.arrayBuffer())

    // Process image
    const processed = await sharp(buf)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer()
    const meta = await sharp(processed).metadata()

    const fileId = uuidv4()
    const filename = `${fileId}.jpg`
    const bucket = process.env.MINIO_BUCKET || 'designsight'

    await uploadFile(bucket, filename, processed, processed.length, {
      'Content-Type': 'image/jpeg',
      'original-name': imageUrl
    })

    const presignedUrl = await getFileUrl(bucket, filename)

    const imageData = {
      id: fileId,
      filename,
      originalName: imageUrl.split('/').pop() || 'seed.jpg',
      url: presignedUrl,
      size: processed.length,
      mimeType: 'image/jpeg',
      width: meta.width || 0,
      height: meta.height || 0,
      uploadedAt: new Date()
    }

    project.images.push(imageData as any)
    await project.save()

    console.log(`Uploaded image ${imageData.originalName} (${imageData.width}x${imageData.height}) -> imageId=${imageData.id}`)

    if ((process.env.SEED_RUN_AI || '').toLowerCase() === 'true') {
      console.log('Running AI analysis (Google Vision)...')
      const result = await AIService.analyzeDesign(imageData.url, imageData.width, imageData.height)
      const feedbackDocs = await Promise.all(result.feedback.map(f => Feedback.create({
        projectId: project._id,
        imageId: imageData.id,
        ...f,
      })))
      console.log(`Saved ${feedbackDocs.length} feedback items`)
    }

    console.log('Seed completed successfully.')
    console.log({ projectId: project._id.toString(), imageId: project.images[0]?.id })
    process.exit(0)
  } catch (err: any) {
    console.error('Seed failed:', err?.message || err)
    process.exit(1)
  }
}

main()

