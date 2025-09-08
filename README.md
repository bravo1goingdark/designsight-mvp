## Submission
- GitHub: https://github.com/bravo1goingdark/designsight-mvp
- Live Demo: https://designsight-mvp.vercel.app/
- Demo Video: https://drive.google.com/file/d/1fa8HTHecG4eBs9FVZmEEwQKEZhamGy-H/view?usp=sharing
- Submission Tag: v0.1-submission

# DesignSight - AI-Powered Design Feedback Platform

DesignSight is an AI-powered design feedback platform built on MERN. It analyzes uploaded screenshots with Google Cloud Vision to generate structured, coordinate-anchored feedback you can filter by role (Designer, Reviewer, PM, Developer). Discuss via threaded comments and export development-ready PDF/JSON reports. Ships with Docker Compose, MongoDB, and MinIO for easy local or cloud deployment.

## 🚀 Features

### Core Functionality
- **AI-Powered Design Analysis**: Automated feedback using Google Cloud Vision
- **Coordinate-Anchored Feedback**: Precise location-based feedback on design elements
- **Role-Based Views**: Filtered feedback for Designer, Reviewer, Product Manager, and Developer roles
- **Image Upload & Management**: Support for PNG, JPG, JPEG, GIF, WebP formats
- **Threaded Discussions**: Collaborative feedback with parent/child comments (API supports nested threads; UI simplified)

### AI Analysis Categories
- **Accessibility**: Color contrast, text readability, navigation issues
- **Visual Hierarchy**: Spacing, alignment, typography consistency
- **Content & Copy**: Tone, clarity, messaging effectiveness
- **UI/UX Patterns**: Button placement, user flow, best practices

### Role-Specific Feedback
- **Designer**: Visual hierarchy, typography, spacing, brand consistency
- **Reviewer**: Overall quality, design system adherence, user experience
- **Product Manager**: Usability, content strategy, conversion optimization
- **Developer**: Accessibility requirements, implementation complexity

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **MinIO** for object storage
- **Google Cloud Vision API** for AI analysis
- **Sharp** for image processing

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Dropzone** for file uploads
- **Framer Motion** for animations

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **MongoDB** database
- **MinIO** S3-compatible storage

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Google Cloud Vision API credentials

## ✅ Assignment Compliance (72‑hour MVP)

- Stack: MERN (MongoDB, Express, React with Vite, Node.js)
- AI Integration: Google Cloud Vision API (Text Detection, Object Localization, Image Properties, SafeSearch). No mocks.
- Local Deployment: docker-compose.yml starts MongoDB, MinIO, API, and Client.
- Demo Scope: Designed for 1–2 images; costs documented below.
- Coordinate-Anchored Feedback: Each item includes x, y, width, height; overlay shown on the image.
- Role-Based Views: Designer, Reviewer, Product Manager, Developer filters.
- Threaded Discussion: Comments with parentId (nested replies supported by API; UI renders a flat list in MVP).
- Exports & Handoff: JSON and PDF reports; role-filtered supported.

What’s intentionally out of scope for MVP:
- Real-time collaboration (no WebSocket/live updates)
- Auth/user accounts (role switcher only)
- Advanced image tools (zoom/pan/annotations)
- Extensive test coverage (includes key unit test for export summary)
## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd designsight-mvp
```

### 2. Environment Setup

#### Backend Environment
Copy the example environment file and configure:
```bash
cp api/env.example api/.env
```

Edit `api/.env` with your configuration:
```env
# Database
MONGO_URI=mongodb://localhost:27017/designsight

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=designsight
MINIO_USE_SSL=false

# Google Cloud Vision Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5174
```

#### Frontend Environment
Create `client/.env.local`:
```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd api
pnpm install

# Install frontend dependencies
cd ../client
pnpm install
```

### 4. Start with Docker Compose

Important: Place your Google Cloud Vision service account JSON at api/desginsight-f1f6c483f456.json (or edit docker-compose.yml to point to your own filename and path in both GOOGLE_APPLICATION_CREDENTIALS and the volume mapping).

```bash
# From project root
docker-compose up --build
```

This will start:
- **MongoDB** on port 27017
- **MinIO** on ports 9000 (API) and 9001 (Console)
- **API Server** on port 4000
- **Frontend** on port 5174

### 5. Access the Application
- **Frontend**: http://localhost:5174
- **API**: http://localhost:4000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## 🔧 Development Setup

### Backend Development
```bash
cd api
pnpm dev
```

### Frontend Development
```bash
cd client
pnpm dev
```

## 📊 API Documentation

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Image Upload
- `POST /api/upload/:projectId` - Upload image to project
- `GET /api/upload/image/:imageId` - Get image URL

### AI Analysis
- `POST /api/ai/analyze/:projectId/:imageId` - Analyze design with AI
- `GET /api/ai/analysis/:projectId/:imageId` - Get AI analysis results

### Feedback
- `GET /api/feedback/project/:projectId` - Get all feedback for project
- `GET /api/feedback/:id` - Get single feedback item
- `POST /api/feedback` - Create new feedback
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback
- `GET /api/feedback/roles/:role` - Get feedback filtered by role

### Comments
- `GET /api/comments/feedback/:feedbackId` - Get comments for feedback
- `POST /api/comments` - Create new comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## 💰 Cost Considerations

### Google Cloud Vision API Costs
- **Text Detection**: ~$1.50 per 1,000 images
- **Object Detection**: ~$1.50 per 1,000 images  
- **Image Properties**: ~$1.50 per 1,000 images
- **Demo Scope**: 1-2 test images = ~$0.01 total
- **Production**: Monitor usage and implement rate limiting

### Storage Costs
- **MinIO**: Free for self-hosted
- **Image Storage**: ~1-5MB per image
- **Database**: Minimal for metadata

## 🔒 Security Considerations

- API keys stored in environment variables
- CORS configured for specific origins
- Rate limiting implemented
- Input validation with Joi
- File type validation for uploads
- Secure image processing with Sharp

## 🧪 Testing

### Backend Tests
```bash
cd api
pnpm test
```

### Frontend Tests
```bash
cd client
pnpm test
```

## 📁 Project Structure

```
designsight-mvp/
├── api/                    # Backend Express.js application
│   ├── src/
│   │   ├── config/        # Database and MinIO configuration
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (AI service)
│   │   └── index.ts       # Main server file
│   ├── Dockerfile
│   └── package.json
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── utils/         # Utility functions
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## 🚧 Known Limitations

1. **Real-time Updates**: No WebSocket implementation for live collaboration (refresh to see others’ changes)
2. **User Authentication**: Role switcher only; no accounts/sessions in MVP
3. **Nested Threads UI**: API supports nested replies via parentId; UI renders a flat list for simplicity
4. **Image Tools**: No zoom/pan or advanced annotation tools in MVP
5. **AI Accuracy**: Coordinate mapping may not be 100% accurate; depends on image clarity and model limits

## 🔮 Future Enhancements

- User authentication and authorization
- Real-time collaboration with WebSockets
- Advanced export features (PDF, JSON)
- Image annotation tools
- Design system integration
- Slack/Teams integration
- Advanced AI models and custom prompts
- Performance analytics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎯 Demo Instructions

1. Start the application with `docker-compose up --build`
2. Navigate to http://localhost:5174
3. Create a new project
4. Upload a design image (PNG/JPG recommended)
5. Click "AI Analyze" to generate feedback
6. Switch between different roles to see filtered feedback
7. Click on feedback items to view discussions
8. Add comments and collaborate on feedback

### Sample Test Images
- See samples/README.md for two suggested scenarios and filenames to test the pipeline end-to-end.
- Use actual UI/UX design screenshots (or your own designs) for best results.
- Recommended size: 1920x1080 or similar; formats: PNG, JPG, JPEG work best with AI analysis.
- Avoid proprietary or sensitive content; keep each image under ~10MB.

---

**Built with ❤️ for better design collaboration**
