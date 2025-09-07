import React, { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'designer' | 'reviewer' | 'product_manager' | 'developer'

interface RoleContextType {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  getRoleDisplayName: (role: UserRole) => string
  getRoleDescription: (role: UserRole) => string
  getRoleColor: (role: UserRole) => string
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export const useRole = () => {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

interface RoleProviderProps {
  children: ReactNode
}

const roleConfig = {
  designer: {
    displayName: 'Designer',
    description: 'Focus on visual hierarchy, typography, spacing, and brand consistency',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  reviewer: {
    displayName: 'Reviewer',
    description: 'Overall quality, design system adherence, and user experience',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  product_manager: {
    displayName: 'Product Manager',
    description: 'Usability, content strategy, and conversion optimization',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  developer: {
    displayName: 'Developer',
    description: 'Accessibility requirements and implementation complexity',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('designer')

  const getRoleDisplayName = (role: UserRole): string => {
    return roleConfig[role].displayName
  }

  const getRoleDescription = (role: UserRole): string => {
    return roleConfig[role].description
  }

  const getRoleColor = (role: UserRole): string => {
    return roleConfig[role].color
  }

  const value: RoleContextType = {
    currentRole,
    setCurrentRole,
    getRoleDisplayName,
    getRoleDescription,
    getRoleColor
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}
