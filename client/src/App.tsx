import { Routes, Route, Navigate } from 'react-router-dom'
import { ProjectProvider } from './contexts/ProjectContext'
import { RoleProvider } from './contexts/RoleContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import ImageAnalysisPage from './pages/ImageAnalysisPage'

function App() {
  return (
    <ProjectProvider>
      <RoleProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/project/:projectId/image/:imageId" element={<ImageAnalysisPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </RoleProvider>
    </ProjectProvider>
  )
}

export default App
