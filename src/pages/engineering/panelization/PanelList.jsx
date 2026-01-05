// src/pages/engineering/panelization/PanelList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Calendar,
  FileSearch2,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  SquareStack,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import panelizationService from "@/services/engineering/panelization.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function fmtDate(v) {
  try {
    if (!v) return "—";
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

/** Mock data (used if backend not wired yet) */
function mockPanels(jobId = "") {
  return [
    {
      id: "PNL-001",
      jobId: jobId || "JOB-10021",
      panelName: "PNL-ACME-CTRL-02-REVB",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      createdBy: "Admin",
      panelSize: { wMm: 457, hMm: 610 },
      boardSize: { wMm: 120, hMm: 85 },
      array: { rows: 4, cols: 3 },
      separation: { type: "V_SCORE" },
      utilization: 72.4,
      status: "READY",
    },
    {
      id: "PNL-002",
      jobId: jobId || "JOB-10021",
      panelName: "PNL-ACME-CTRL-02-REVC",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      createdBy: "Engineer",
      panelSize: { wMm: 460, hMm: 610 },
      boardSize: { wMm: 120, hMm: 85 },
      array: { rows: 4, cols: 3 },
      separation: { type: "TAB_ROUTE" },
      utilization: 69.1,
      status: "IN_REVIEW",
    },
    {
      id: "PNL-003",
      jobId: jobId || "JOB-10088",
      panelName: "PNL-MED-IO-01-REVA",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      createdBy: "Manager",
      panelSize: { wMm: 400, hMm: 500 },
      boardSize: { wMm: 98, hMm: 64 },
      array: { rows: 4, cols: 4 },
      separation: { type: "V_SCORE" },
      utilization: 76.8,
      status: "DRAFT",
    },
  ];
}

function StatusBadge({ value }) {
  const v = safeStr(value, "—");
  const base = "gap-1.5";
  if (v === "READY") return <Badge className={cx("bg-emerald-600 hover:bg-emerald-600", base)}>{v}</Badge>;
  if (v === "IN_REVIEW") return <Badge className={cx("bg-amber-600 hover:bg-amber-600", base)}>{v}</Badge>;
  if (v === "DRAFT") return <Badge className={cx("bg-slate-600 hover:bg-slate-600", base)}>{v}</Badge>;
  return <Badge variant="secondary" className={base}>{v}</Badge>;
}

export default function PanelList() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get("jobId") || "";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sortKey, setSortKey] = useState(searchParams.get("sort") || "createdAt");
  const [sortDir, setSortDir] = useState(searchParams.get("dir") || "desc");

  const fetchPanels = async () => {
    setLoading(true);
    try {
      // When backend is ready:
      // const res = await panelizationService.listPanels({ jobId });
      // setRows(res.data ?? []);

      setRows(mockPanels(jobId));
    } catch (e) {
      toast({ title: "Failed to load panels", description: "Could not fetch panel list.", variant: "destructive" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    // keep url in sync (nice for back/forward)
    const next = new URLSearchParams(searchParams);
    if (query) next.set("q", query);
    else next.delete("q");

    if (sortKey) next.set("sort", sortKey);
    if (sortDir) next.set("dir", sortDir);

    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sortKey, sortDir]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(rows) ? rows : [];

    const result = q
      ? list.filter((r) => {
          const hay = [
            r.id,
            r.jobId,
            r.panelName,
            r.createdBy,
            r.separation?.type,
            r.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : list;

    const dir = sortDir === "asc" ? 1 : -1;

    const sorted = [...result].sort((a, b) => {
      const getVal = (x) => {
        if (sortKey === "createdAt") return new Date(x.createdAt || 0).getTime();
        if (sortKey === "panelName") return safeStr(x.panelName).toLowerCase();
        if (sortKey === "jobId") return safeStr(x.jobId).toLowerCase();
        if (sortKey === "utilization") return Number(x.utilization ?? -1);
        if (sortKey === "status") return safeStr(x.status).toLowerCase();
        return safeStr(x[sortKey]).toLowerCase();
      };

      const va = getVal(a);
      const vb = getVal(b);

      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return sorted;
  }, [rows, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const headerSubtitle = jobId ? `Showing panels for Job: ${jobId}` : "All panelization records (filter by Job ID when needed).";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Panelization</h1>
            <Badge variant="secondary" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              CAM / Panel
            </Badge>
            {jobId ? <Badge variant="outline">Job: {jobId}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-gray-600">{headerSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchPanels} disabled={loading}>
            <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Link to={jobId ? `/dashboard/engineering/panelization/create?jobId=${encodeURIComponent(jobId)}` : "/dashboard/engineering/panelization/create"}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Panel
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <FileSearch2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: panel id, job id, name, status, separation..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <SquareStack className="h-3.5 w-3.5" />
              {filtered.length} results
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Sort: {sortKey} ({sortDir})
            </Badge>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading panels...
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-700">No panels found.</p>
          <p className="mt-1 text-xs text-gray-500">Try clearing the search or create a new panel.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((p) => {
            const up = (p.array?.rows ?? 1) * (p.array?.cols ?? 1);
            const panelSize = p.panelSize ? `${p.panelSize.wMm} × ${p.panelSize.hMm} mm` : "—";
            const boardSize = p.boardSize ? `${p.boardSize.wMm} × ${p.boardSize.hMm} mm` : "—";
            const util = typeof p.utilization === "number" ? `${p.utilization.toFixed(1)}%` : "—";

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <Card className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/dashboard/engineering/panelization/${encodeURIComponent(p.id)}?jobId=${encodeURIComponent(p.jobId || "")}`}
                          className="text-base font-extrabold text-gray-900 hover:underline"
                        >
                          {p.panelName || p.id}
                        </Link>
                        <Badge variant="outline">ID: {p.id}</Badge>
                        {p.jobId ? <Badge variant="outline">Job: {p.jobId}</Badge> : null}
                        <StatusBadge value={p.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {fmtDate(p.createdAt)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-gray-700">By {p.createdBy || "—"}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Panel</p>
                          <p className="font-semibold text-gray-900">{panelSize}</p>
                        </div>
                        <div className="rounded-xl border bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Unit</p>
                          <p className="font-semibold text-gray-900">{boardSize}</p>
                        </div>
                        <div className="rounded-xl border bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Array</p>
                          <p className="font-semibold text-gray-900">
                            {p.array?.rows} × {p.array?.cols} ({up} up)
                          </p>
                        </div>
                        <div className="rounded-xl border bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Utilization</p>
                          <p className="font-semibold text-gray-900">{util}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <Badge variant="secondary" className="gap-1.5">
                          <LayoutGrid className="h-3.5 w-3.5" />
                          {p.separation?.type?.replace("_", " ") || "—"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Link
                        to={`/dashboard/engineering/panelization/${encodeURIComponent(p.id)}?jobId=${encodeURIComponent(p.jobId || "")}`}
                        className="inline-flex"
                      >
                        <Button variant="outline">Open</Button>
                      </Link>

                      <Link to={`/dashboard/engineering/panelization/${encodeURIComponent(p.id)}/edit`} className="inline-flex">
                        <Button>Edit</Button>
                      </Link>
                    </div>
                  </div>

                  {/* Sort quick actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Quick sort:
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSort("createdAt")}
                      className={cx(
                        "rounded-lg border px-2 py-1 hover:bg-gray-50",
                        sortKey === "createdAt" ? "border-gray-900 text-gray-900" : "border-gray-200"
                      )}
                    >
                      Date
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort("panelName")}
                      className={cx(
                        "rounded-lg border px-2 py-1 hover:bg-gray-50",
                        sortKey === "panelName" ? "border-gray-900 text-gray-900" : "border-gray-200"
                      )}
                    >
                      Name
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort("jobId")}
                      className={cx(
                        "rounded-lg border px-2 py-1 hover:bg-gray-50",
                        sortKey === "jobId" ? "border-gray-900 text-gray-900" : "border-gray-200"
                      )}
                    >
                      Job
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort("utilization")}
                      className={cx(
                        "rounded-lg border px-2 py-1 hover:bg-gray-50",
                        sortKey === "utilization" ? "border-gray-900 text-gray-900" : "border-gray-200"
                      )}
                    >
                      Utilization
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className={cx(
                        "rounded-lg border px-2 py-1 hover:bg-gray-50",
                        sortKey === "status" ? "border-gray-900 text-gray-900" : "border-gray-200"
                      )}
                    >
                      Status
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
