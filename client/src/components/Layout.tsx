import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { cn } from '../utils/cn'
import { 
  FolderOpen, 
  Palette,
  Eye,
  Target,
  Code
} from 'lucide-react'
import { useGlobalLoading } from '../hooks/useGlobalLoading'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentRole, setCurrentRole, getRoleDisplayName, getRoleColor } = useRole()
  const location = useLocation()
  const isGlobalLoading = useGlobalLoading()

  const roles = [
    { id: 'designer' as const, icon: Palette, label: 'Designer' },
    { id: 'reviewer' as const, icon: Eye, label: 'Reviewer' },
    { id: 'product_manager' as const, icon: Target, label: 'PM' },
    { id: 'developer' as const, icon: Code, label: 'Developer' }
  ]

  const navigation = [
    { name: 'Projects', href: '/', icon: FolderOpen },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global top loading bar */}
      <div className={cn('fixed top-0 left-0 right-0 h-0.5 bg-primary-600 z-50 transition-opacity', isGlobalLoading ? 'opacity-100 animate-pulse' : 'opacity-0')} />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">DesignSight</span>
              </Link>
            </div>

            {/* Role Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">View as:</span>
                <div className="flex space-x-1">
                  {roles.map((role) => {
                    const Icon = role.icon
                    const isActive = currentRole === role.id
                    return (
                      <button
                        key={role.id}
                        onClick={() => setCurrentRole(role.id)}
                        className={cn(
                          'flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                        )}
                        title={getRoleDisplayName(role.id)}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{role.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
