import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/use-toast'
import { Mail, Key, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../lib/axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [companyName, setCompanyName] = useState('PCBxpress ERP')

  const { toast } = useToast()
  const navigate = useNavigate()

  // Fetch company name for branding
  React.useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setIsSuccess(true)
      
      toast({
        title: 'Reset Link Sent',
        description: `A password reset link has been sent to ${email}. Please check your inbox.`,
        variant: 'default'
      })
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to send reset email. Please try again.'
      
      toast({
        title: 'Reset Failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate('/login')
  }

  return (
    <div className="login-page relative min-h-screen overflow-hidden bg-white">
      {/* Soft glow decorations */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl" />

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,.55) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* LEFT: Brand section */}
              <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-700 to-emerald-700" />
                <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px)",
                      backgroundSize: "34px 34px",
                    }}
                  />
                </div>

                <div className="relative h-full p-8 text-white">
                  {/* Brand pill */}
                  <div className="inline-flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 text-sm ring-1 ring-inset ring-white/20 backdrop-blur">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow">
                      <Key className="h-4 w-4" />
                    </span>
                    <span className="font-semibold tracking-wide">{companyName}</span>
                  </div>

                  <div className="mt-10">
                    <h2 className="text-2xl font-semibold leading-tight">
                      Password Recovery
                    </h2>
                    <p className="mt-2 max-w-md text-white/85">
                      Securely reset your password to regain access to your PCBxpress account.
                    </p>

                    <div className="mt-7 space-y-4">
                      <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow-sm">
                          <Mail className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">Email Verification</div>
                          <div className="text-xs text-white/85">We'll send a secure reset link to your registered email address</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow-sm">
                          <Key className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">Secure Reset</div>
                          <div className="text-xs text-white/85">Create a new strong password with our security guidelines</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15">
                        <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow-sm">
                          <CheckCircle className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">Instant Access</div>
                          <div className="text-xs text-white/85">Regain access to your dashboard and all PCBxpress features</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Forgot Password Form */}
              <div className="p-6 sm:p-8">
                <CardHeader className="px-0 pt-0">
                  {/* Mobile brand pill */}
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
                      <Mail className="h-7 w-7 text-cyan-700" />
                    </div>
                  </div>

                  <CardTitle className="mt-3 text-center text-xl font-bold text-slate-900 md:text-left">
                    Forgot Password?
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 md:text-left">
                    Enter your email address and we'll send you a link to reset your password.
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-0">
                  {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@pcbxpress.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            className="pl-9 bg-white text-slate-900 placeholder:text-slate-400 ring-1 ring-inset ring-slate-200 focus-visible:ring-cyan-400/60"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                        disabled={isLoading || !email}
                      >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>

                      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500 md:justify-start">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Secure email verification process
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="rounded-full bg-emerald-100 p-3">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">Check Your Email</h3>
                        <p className="text-slate-600">
                          We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-slate-500">
                          Didn't receive the email? Check your spam folder or try again.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={handleGoBack}
                          variant="outline"
                          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Login
                        </Button>
                        
                        <Button
                          onClick={() => setIsSuccess(false)}
                          className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action links */}
                  <div className="mt-6 flex flex-col space-y-3 text-center md:text-left">
                    <Button
                      variant="ghost"
                      onClick={handleGoBack}
                      className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </div>

                  {/* Security note */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 text-center md:text-left">
                      For security, reset links expire in 1 hour. Contact IT support if you need assistance.
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