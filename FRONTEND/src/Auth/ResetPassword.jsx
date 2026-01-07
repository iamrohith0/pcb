import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/use-toast'
import { Key, ShieldCheck, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/axios'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [companyName, setCompanyName] = useState('PCBxpress ERP')

  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')

  // Fetch company name for branding
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get('/public/company-name')
        if (res.data?.name) setCompanyName(res.data.name)
      } catch (error) {
        console.warn('Company metadata fetch failed, using defaults:', error)
      }
    }
    fetchCompany()
  }, [])

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Invalid or missing reset token')
        setIsValidating(false)
        return
      }

      try {
        const res = await api.post('/auth/validate-reset-token', { token })
        if (res.data.valid) {
          setTokenValid(true)
        } else {
          setTokenError('Reset token has expired or is invalid')
        }
      } catch (error) {
        setTokenError('Unable to validate reset token')
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const validatePassword = (password) => {
    const errors = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)')
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields match.',
        variant: 'destructive'
      })
      setIsLoading(false)
      return
    }

    // Validate password strength
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      toast({
        title: 'Password does not meet requirements',
        description: passwordErrors.join('. '),
        variant: 'destructive'
      })
      setIsLoading(false)
      return
    }

    try {
      await api.post('/auth/reset-password', { 
        token, 
        password, 
        confirmPassword 
      })
      
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been successfully reset. You can now log in with your new password.',
        variant: 'default'
      })
      
      navigate('/login', { replace: true })
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to reset password. Please try again.'
      
      toast({
        title: 'Reset Failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { score: 0, label: '', color: '' }
    
    let score = 0
    const checks = [
      password.length >= 8,
      /(?=.*[a-z])/.test(password),
      /(?=.*[A-Z])/.test(password),
      /(?=.*\d)/.test(password),
      /(?=.*[!@#$%^&*])/.test(password)
    ]
    
    score = checks.filter(Boolean).length
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' }
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' }
    return { score, label: 'Strong', color: 'bg-green-500' }
  }

  const strength = getPasswordStrength(password)
  const passwordErrors = validatePassword(password)

  if (isValidating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Validating reset token...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="login-page relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-red-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-red-400/15 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full"
          >
            <Card className="overflow-hidden border-slate-200 bg-white shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800" />
                  <div className="relative h-full p-8 text-white">
                    <div className="inline-flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 text-sm ring-1 ring-inset ring-white/20 backdrop-blur">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-red-700 shadow">
                        <AlertCircle className="h-4 w-4" />
                      </span>
                      <span className="font-semibold tracking-wide">{companyName}</span>
                    </div>

                    <div className="mt-10">
                      <h2 className="text-2xl font-semibold leading-tight">
                        Security Notice
                      </h2>
                      <p className="mt-2 max-w-md text-white/85">
                        For your security, password reset links expire after 1 hour.
                      </p>

                      <div className="mt-7 space-y-4">
                        <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                          <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-red-700 shadow-sm">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold">Token Expired</div>
                            <div className="text-xs text-white/85">Reset links are valid for 1 hour for security</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                          <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-red-700 shadow-sm">
                            <Key className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold">Try Again</div>
                            <div className="text-xs text-white/85">Request a new reset link from the login page</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <CardHeader className="px-0 pt-0">
                    <div className="flex justify-center md:justify-start">
                      <div className="rounded-full bg-red-500/10 p-3 ring-1 ring-inset ring-red-400/20">
                        <AlertCircle className="h-7 w-7 text-red-700" />
                      </div>
                    </div>

                    <CardTitle className="mt-3 text-center text-xl font-bold text-slate-900 md:text-left">
                      Reset Link Expired
                    </CardTitle>
                    <CardDescription className="text-center text-slate-600 md:text-left">
                      {tokenError}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="rounded-full bg-red-100 p-3">
                          <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">Request a New Link</h3>
                        <p className="text-slate-600">
                          Visit the login page to request a new password reset link.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={() => navigate('/login')}
                          className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          Go to Login
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center md:text-left">
                        For security, each reset link is valid for 1 hour only.
                      </p>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-700 to-emerald-700" />
                <div className="relative h-full p-8 text-white">
                  <div className="inline-flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 text-sm ring-1 ring-inset ring-white/20 backdrop-blur">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow">
                      <Key className="h-4 w-4" />
                    </span>
                    <span className="font-semibold tracking-wide">{companyName}</span>
                  </div>

                  <div className="mt-10">
                    <h2 className="text-2xl font-semibold leading-tight">
                      Create New Password
                    </h2>
                    <p className="mt-2 max-w-md text-white/85">
                      Choose a strong password to secure your PCBxpress account.
                    </p>

                    <div className="mt-7 space-y-4">
                      <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow-sm">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">Password Security</div>
                          <div className="text-xs text-white/85">Use a unique password with uppercase, lowercase, numbers, and symbols</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow-sm">
                          <CheckCircle className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">Instant Access</div>
                          <div className="text-xs text-white/85">After reset, you'll be redirected to login with your new password</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <CardHeader className="px-0 pt-0">
                  <div className="mb-4 flex items-center gap-2 md:hidden">
                    <div className="inline-flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-200">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-600 text-white shadow-sm">
                        <Key className="h-4 w-4" />
                      </span>
                      <span className="font-semibold tracking-wide">{companyName}</span>
                    </div>
                  </div>

                  <div className="flex justify-center md:justify-start">
                    <div className="rounded-full bg-cyan-500/10 p-3 ring-1 ring-inset ring-cyan-400/20">
                      <Key className="h-7 w-7 text-cyan-700" />
                    </div>
                  </div>

                  <CardTitle className="mt-3 text-center text-xl font-bold text-slate-900 md:text-left">
                    Reset Your Password
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 md:text-left">
                    Create a new strong password for your account.
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Key className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-9 pr-10 bg-white text-slate-900 placeholder:text-slate-400 ring-1 ring-inset ring-slate-200 focus-visible:ring-cyan-400/60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {password.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>Password Strength:</span>
                            <span className={`font-medium ${strength.score <= 2 ? 'text-red-600' : strength.score <= 3 ? 'text-yellow-600' : strength.score <= 4 ? 'text-blue-600' : 'text-green-600'}`}>
                              {strength.label}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                              style={{ width: `${(strength.score / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-700">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Key className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-9 pr-10 bg-white text-slate-900 placeholder:text-slate-400 ring-1 ring-inset ring-slate-200 focus-visible:ring-cyan-400/60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-700">Password Requirements:</div>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {[
                            { test: password.length >= 8, text: 'At least 8 characters' },
                            { test: /(?=.*[a-z])/.test(password), text: 'One lowercase letter' },
                            { test: /(?=.*[A-Z])/.test(password), text: 'One uppercase letter' },
                            { test: /(?=.*\d)/.test(password), text: 'One number' },
                            { test: /(?=.*[!@#$%^&*])/.test(password), text: 'One special character' }
                          ].map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${req.test ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                              <span className={req.test ? 'text-green-600' : 'text-slate-500'}>{req.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                      disabled={isLoading || password !== confirmPassword || passwordErrors.length > 0}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>

                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500 md:justify-start">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Secure password reset process
                    </div>
                  </form>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 text-center md:text-left">
                      After resetting, you'll be redirected to the login page to access your account.
                    </p>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}