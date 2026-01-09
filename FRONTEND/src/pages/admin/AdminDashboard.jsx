import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()

  // Get the current admin section from the URL
  const getCurrentSection = () => {
    const pathParts = location.pathname.split('/')
    const sectionIndex = pathParts.indexOf('admin')
    if (sectionIndex !== -1 && pathParts[sectionIndex + 1]) {
      return pathParts[sectionIndex + 1]
    }
    return 'Overview'
  }

  const sectionTitle = getCurrentSection()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, roles, permissions, and system settings
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Welcome, {user?.username || 'Admin'}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Outlet />
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard