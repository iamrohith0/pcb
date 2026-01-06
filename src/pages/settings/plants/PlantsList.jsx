// src/pages/settings/plants/PlantsList.jsx
import { motion } from "framer-motion";
import {
    Building2,
    Eye,
    Factory,
    Globe2,
    Hash,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    RefreshCcw,
    Search,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import plantsApi from "@/services/plants.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Badge({ variant = "neutral", children }) {
  const styles = {
    neutral: "bg-gray-100 text-gray-700 ring-gray-200",
    good: "bg-green-50 text-green-700 ring-green-200",
    bad: "bg-red-50 text-red-700 ring-red-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    brand: "bg-[#dc2551]/10 text-[#dc2551] ring-[#dc2551]/20",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", styles[variant])}>
      {children}
    </span>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

function EmptyState({ q }) {
  return (
    <div className="grid place-items-center rounded-2xl border bg-white p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dc2551]/10">
        <Factory className="h-6 w-6 text-[#dc2551]" />
      </div>
      <div className="mt-4 text-base font-semibold text-gray-900">No plants found</div>
      <div className="mt-1 text-sm text-gray-500">
        {q ? "Try a different search term." : "Create your first plant to manage PCB operations by location."}
      </div>
      <Button asChild className="mt-5 bg-cyan-600 hover:bg-cyan-500">
        <Link to="/settings/plants/new">
          <Plus className="mr-2 h-4 w-4" />
          Add Plant
        </Link>
      </Button>
    </div>
  );
}

export default function PlantsList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive

  const load = async () => {
    setLoading(true);
    try {
      const res = await plantsApi.getAll();
      const list = res?.data?.plants ?? res?.data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      toast({
        title: "Failed to load plants",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalized = useMemo(() => {
    return rows.map((p) => {
      const statusVal = (p.status ?? "active") === "inactive" ? "inactive" : "active";
      return {
        id: p.id ?? p._id ?? p.uuid,
        name: p.name ?? "",
        code: (p.code ?? "").toString(),
        status: statusVal,
        timezone: p.timezone ?? "Asia/Kolkata",
        phone: p.phone ?? "",
        email: p.email ?? "",
        website: p.website ?? "",
        city: p.city ?? p.address?.city ?? "",
        state: p.state ?? p.address?.state ?? "",
        country: p.country ?? p.address?.country ?? "",
        pincode: p.pincode ?? p.address?.pincode ?? "",
      };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return normalized
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) => {
        if (!needle) return true;
        const hay = [
          p.name,
          p.code,
          p.city,
          p.state,
          p.country,
          p.email,
          p.phone,
          p.website,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [normalized, q, status]);

  const stats = useMemo(() => {
    const total = normalized.length;
    const active = normalized.filter((x) => x.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [normalized]);

  const goView = (id) => navigate(`/settings/plants/${id}`);
  const goEdit = (id) => navigate(`/settings/plants/${id}/edit`);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10">
              <Building2 className="h-5 w-5 text-[#dc2551]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Plants</h1>
              <p className="text-sm text-gray-500">
                Manage manufacturing locations for PCB operations, capacity, routing, and traceability.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Active" value={stats.active} />
            <StatPill label="Inactive" value={stats.inactive} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCcw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-500">
            <Link to="/settings/plants/new">
              <Plus className="h-4 w-4" />
              Add Plant
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, code, city, email, phone..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={status === "all" ? "default" : "outline"}
              className={cx("w-full", status === "all" && "bg-cyan-600 hover:bg-cyan-500")}
              onClick={() => setStatus("all")}
            >
              All
            </Button>
            <Button
              type="button"
              variant={status === "active" ? "default" : "outline"}
              className={cx("w-full", status === "active" && "bg-cyan-600 hover:bg-cyan-500")}
              onClick={() => setStatus("active")}
            >
              Active
            </Button>
            <Button
              type="button"
              variant={status === "inactive" ? "default" : "outline"}
              className={cx("w-full", status === "inactive" && "bg-cyan-600 hover:bg-cyan-500")}
              onClick={() => setStatus("inactive")}
            >
              Inactive
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-3 w-32 animate-pulse rounded bg-gray-100" />
              <div className="mt-6 space-y-2">
                <div className="h-3 w-56 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="mt-5 flex gap-2">
                <div className="h-9 flex-1 animate-pulse rounded bg-gray-100" />
                <div className="h-9 flex-1 animate-pulse rounded bg-gray-100" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState q={q} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#dc2551]/10">
                        <Factory className="h-5 w-5 text-[#dc2551]" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold text-gray-900">{p.name || "—"}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <Badge variant="neutral">
                            <Hash className="mr-1.5 h-4 w-4" />
                            {p.code || "NO-CODE"}
                          </Badge>
                          <Badge variant={p.status === "active" ? "good" : "warn"}>
                            {p.status === "active" ? (
                              <>
                                <ToggleRight className="mr-1.5 h-4 w-4" /> Active
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="mr-1.5 h-4 w-4" /> Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => goView(p.id)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                      onClick={() => goEdit(p.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      {[p.city, p.state, p.country].filter(Boolean).join(", ") || "Address not set"}
                    </span>
                  </div>

                  {p.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{p.phone}</span>
                    </div>
                  ) : null}

                  {p.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  ) : null}

                  {p.website ? (
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{p.website}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 border-t pt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold uppercase tracking-wide">Timezone</span>
                    <span className="font-medium text-gray-800">{p.timezone}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Used for shift schedules, due dates, capacity planning, and dispatch timelines.
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
