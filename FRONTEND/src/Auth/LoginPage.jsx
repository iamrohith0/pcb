// src/auth/LoginPage.jsx
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Mail,
  Microscope,
  PackageSearch,
  Shield,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import authService from "../services/auth.service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Brand defaults for PCBxpress
  const [companyName, setCompanyName] = useState("PCBxpress ERP");
  const [companyTagline, setCompanyTagline] = useState(
    "PCB Manufacturing ERP • Traceability • Quality • On-Time Delivery"
  );

  const { login: setSessionUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Optional: fetch dynamic company name / tagline
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        // Expecting: { name, tagline } (tagline optional)
        const res = await api.get("/public/company-name");
        if (res.data?.name) setCompanyName(res.data.name);
        if (res.data?.tagline) setCompanyTagline(res.data.tagline);
      } catch (error) {
        // Keep PCBxpress defaults if endpoint not available
        console.warn("Company metadata fetch failed, using defaults:", error);
      }
    };
    fetchCompany();
  }, []);

  const featurePoints = useMemo(
    () => [
      {
        icon: Layers,
        title: "Production & Routing",
        desc: "Work orders, process steps, and capacity-aware scheduling for single & multilayer boards.",
      },
      {
        icon: Microscope,
        title: "Quality Control",
        desc: "In-process checks, test results, NCR/CAPA, and full audit trails for compliance.",
      },
      {
        icon: PackageSearch,
        title: "Inventory & Lot Traceability",
        desc: "Raw materials to finished boards—track lots/serials across WIP and warehouses.",
      },
      {
        icon: Wrench,
        title: "Maintenance",
        desc: "Preventive schedules and maintenance work orders to reduce downtime on critical equipment.",
      },
    ],
    []
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await authService.login({ identifier: email, password });
      setSessionUser(user);

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user?.name || "User"}!`,
      });

      const from = (location.state && location.state.from) || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      let message = "Something went wrong. Please try again.";
      if (status === 401 || status === 422) {
        message = "Invalid email or password.";
      } else if (status === 403) {
        message =
          typeof data?.message === "string"
            ? data.message
            : "Access denied. Your network may not be authorized (IP whitelist).";
      } else if (typeof data?.message === "string") {
        message = data.message;
      }

      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page relative min-h-screen overflow-hidden bg-white">
      {/* Soft glow decorations (light mode) */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl" />

      {/* Subtle grid pattern (visible on white) */}
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
              {/* LEFT: PCBxpress brand / value props */}
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
                      <Cpu className="h-4 w-4" />
                    </span>
                    <span className="font-semibold tracking-wide">{companyName}</span>
                  </div>

                  <div className="mt-10">
                    <h2 className="text-2xl font-semibold leading-tight">
                      PCB Manufacturing Control Center
                    </h2>
                    <p className="mt-2 max-w-md text-white/85">{companyTagline}</p>

                    <div className="mt-7 space-y-4">
                      {featurePoints.map((f) => {
                        const Icon = f.icon;
                        return (
                          <div
                            key={f.title}
                            className="flex items-start gap-3 rounded-xl bg-white/15 p-3 ring-1 ring-inset ring-white/15"
                          >
                            <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-cyan-700 shadow-sm">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-sm font-semibold">{f.title}</div>
                              <div className="text-xs text-white/85">{f.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Login form */}
              <div className="p-6 sm:p-8">
                <CardHeader className="px-0 pt-0">
                  {/* Mobile brand pill */}
                  <div className="mb-4 flex items-center gap-2 md:hidden">
                    <div className="inline-flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-200">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-600 text-white shadow-sm">
                        <Cpu className="h-4 w-4" />
                      </span>
                      <span className="font-semibold tracking-wide">{companyName}</span>
                    </div>
                  </div>

                  <div className="flex justify-center md:justify-start">
                    <div className="rounded-full bg-cyan-500/10 p-3 ring-1 ring-inset ring-cyan-400/20">
                      <Activity className="h-7 w-7 text-cyan-700" />
                    </div>
                  </div>

                  <CardTitle className="mt-3 text-center text-xl font-bold text-slate-900 md:text-left">
                    Sign in to PCBxpress
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600 md:text-left">
                    Access dashboards for inventory, work orders, QC, procurement, and dispatch.
                  </CardDescription>

                </CardHeader>

                <CardContent className="px-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700">
                        Email
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

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPw ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                          className="pl-9 pr-10 bg-white text-slate-900 placeholder:text-slate-400 ring-1 ring-inset ring-slate-200 focus-visible:ring-cyan-400/60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-2.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>

                    {/* ✅ Correct position: Links directly below Sign In */}
                    <div className="flex flex-col items-center gap-1 pt-1 md:items-start">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => navigate("/forgot-password")}
                        className="h-auto p-0 text-cyan-600 hover:text-cyan-700 font-normal"
                      >
                        Forgot Password?
                      </Button>

                      <Button
                        type="button"
                        variant="link"
                        onClick={() => navigate("/reset-password")}
                        className="h-auto p-0 text-cyan-600 hover:text-cyan-700 font-normal text-xs"
                      >
                        Reset Password (with token)
                      </Button>
                    </div>

                    {/* Trust footer (mobile) */}
                    <div className="pt-2 md:hidden">
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Shield className="h-4 w-4" />
                        Secured Access • RBAC Enabled
                      </div>
                    </div>

                    {/* Tiny reassurance row */}
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500 md:justify-start">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Traceability-ready workflows for manufacturing teams
                    </div>
                  </form>

                  {/* Optional “quick context” mini chips */}
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-cyan-700" />
                        <span>Work Orders</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                      <div className="flex items-center gap-2">
                        <Microscope className="h-4 w-4 text-cyan-700" />
                        <span>QC & NCR</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                      <div className="flex items-center gap-2">
                        <PackageSearch className="h-4 w-4 text-cyan-700" />
                        <span>Inventory</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-cyan-700" />
                        <span>Maintenance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
