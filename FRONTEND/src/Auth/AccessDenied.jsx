import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ShieldX } from 'lucide-react'

export default function AccessDenied() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/dashboard')
  }

  const handleLogout = () => {
    // This would typically trigger logout logic
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-red-100">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            You don't have permission to access this resource.
          </p>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              <strong>Error Code:</strong> 403 Forbidden
            </p>
            <p className="text-red-700 text-sm mt-1">
              Contact your administrator if you believe this is an error.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Go to Dashboard
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Go Back
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Sign Out
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact your system administrator or IT support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}