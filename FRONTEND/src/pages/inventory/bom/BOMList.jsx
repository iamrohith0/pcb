// src/pages/inventory/bom/BOMList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    ArrowUpDown,
    ClipboardList,
    Eye,
    Filter,
    Layers,
    Loader2,
    Package,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Split,
    Trash2,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("active") || s.includes("released")) return "bg-emerald-50 text-emerald-700 border";
  if (s.includes("draft")) return "bg-amber-50 text-amber-700 border";
  if (s.includes("obsolete") || s.includes("inactive")) return "bg-gray-50 text-gray-700 border";
  return "bg-white text-gray-700 border";
}

function typeTone(type) {
  const s = String(type || "").toLowerCase();
  if (s.includes("fab")) return "bg-indigo-50 text-indigo-700 border";
  if (s.includes("assy") || s.includes("assembly")) return "bg-cyan-50 text-cyan-700 border";
  if (s.includes("sub")) return "bg-violet-50 text-violet-700 border";
  return "bg-white text-gray-700 border";
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

/**
 * Expected API:
 *  - GET /inventory/bom?search=&status=&type=&page=&limit=
 *    returns { data: { rows: [], meta: { page, limit, total } } } OR { rows, meta }
 *  - DELETE /inventory/bom/:id
 *
 * Row fields (flexible):
 *  - id
 *  - code, name
 *  - revision / rev
 *  - status
 *  - type (FAB/ASSY/...)
 *  - product_code/product_name or product {code,name}
 *  - board_layers/layers
 *  - updated_at/updatedAt/modified_at
 */

export default function BOMList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  // Sorting (client-side; can be swapped to server sort easily)
  const [sortKey, setSortKey] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        page: meta.page || 1,
        limit: meta.limit || 20,
      };
      if (search) params.search = search;
      if (status) params.status = status;
      if (type) params.type = type;

      const res = await api.get("/inventory/bom", { params });
      const payload = res?.data?.data ?? res?.data ?? {};
      const list = Array.isArray(payload.rows) ? payload.rows : Array.isArray(payload.items) ? payload.items : [];
      setRows(list);

      const m = payload.meta || payload.pagination || {};
      setMeta((prev) => ({
        page: safeNum(m.page, prev.page || 1),
        limit: safeNum(m.limit, prev.limit || 20),
        total: safeNum(m.total, safeNum(payload.total, prev.total || 0)),
      }));
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load BOMs",
        description: e?.response?.data?.message || "Server error while fetching BOM list.",
        variant: "destructive",
      });
      setRows([]);
      setMeta({ page: 1, limit: 20, total: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.page, meta.limit]);

  const normalized = useMemo(() => {
    return (rows || []).map((r, idx) => {
      const product = r.product || r.item || null;
      const updated = pick(r, ["updated_at", "updatedAt", "modified_at", "modifiedAt", "last_updated", "lastUpdated"], null);

      return {
        _i: idx,
        id: String(r.id ?? r.bom_id ?? r.bomId ?? idx),
        code: pick(r, ["code", "bom_code", "bomCode"], ""),
        name: pick(r, ["name", "bom_name", "bomName"], "—"),
        revision: pick(r, ["revision", "rev"], "A"),
        status: pick(r, ["status"], "Active"),
        type: pick(r, ["type", "bom_type", "bomType"], "FAB"),
        productCode: pick(product, ["code", "sku"], "") || pick(r, ["product_code", "productCode"], ""),
        productName: pick(product, ["name", "title"], "") || pick(r, ["product_name", "productName"], ""),
        layers: safeNum(pick(r, ["board_layers", "layers"], 0), 0),
        updatedAt: updated,
      };
    });
  }, [rows]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const get = (r) => {
      if (sortKey === "code") return r.code || "";
      if (sortKey === "name") return r.name || "";
      if (sortKey === "type") return r.type || "";
      if (sortKey === "status") return r.status || "";
      if (sortKey === "layers") return r.layers || 0;
      // updated_at default
      const d = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      return Number.isFinite(d) ? d : 0;
    };

    return [...normalized].sort((a, b) => {
      const A = get(a);
      const B = get(b);
      if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
      return String(A).localeCompare(String(B)) * dir;
    });
  }, [normalized, sortKey, sortDir]);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => {
      const blob = `${r.code} ${r.name} ${r.productCode} ${r.productName} ${r.type} ${r.status}`.toLowerCase();
      return blob.includes(q);
    });
  }, [sorted, search]);

  const pageCount = useMemo(() => {
    const total = safeNum(meta.total, filtered.length);
    const limit = safeNum(meta.limit, 20);
    return Math.max(1, Math.ceil(total / limit));
  }, [meta.total, meta.limit, filtered.length]);

  const toggleSort = (key) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const handleApplyFilters = () => {
    setMeta((m) => ({ ...m, page: 1 }));
    fetchList(true);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setType("");
    setMeta((m) => ({ ...m, page: 1 }));
    fetchList(true);
  };

  const requestDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/inventory/bom/${deleteId}`);
      toast({ title: "Deleted", description: "BOM removed successfully." });
      setDeleteOpen(false);
      setDeleteId(null);
      fetchList(true);
    } catch (e) {
      console.error(e);
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message || "Unable to delete BOM.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">BOM Library</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage PCB Bills of Materials (FAB / ASSY / Sub-assemblies), revisions, and explosions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => fetchList(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" asChild>
            <Link to="/inventory/bom/create">
              <Plus className="h-4 w-4" />
              New BOM
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
          <CardDescription>Search by BOM code/name, product, type, status</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="q"
                className="pl-9"
                placeholder="BOM-001, FR4, PCBX-TopBoard..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Obsolete">Obsolete</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All</option>
              <option value="FAB">FAB</option>
              <option value="ASSY">ASSY</option>
              <option value="SUB">SUB</option>
            </select>
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-2 pt-1">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              Reset
            </Button>
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={handleApplyFilters}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">BOMs</CardTitle>
          <CardDescription>
            Showing <span className="font-medium text-gray-800">{filtered.length}</span> result(s)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="grid place-items-center py-16 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading BOMs...
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-gray-50 p-8 text-center text-sm text-gray-600">
              No BOMs found. Create your first BOM.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr className="text-left">
                    <th className="px-3 py-2">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        onClick={() => toggleSort("code")}
                        type="button"
                      >
                        BOM <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        onClick={() => toggleSort("name")}
                        type="button"
                      >
                        Name <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        onClick={() => toggleSort("type")}
                        type="button"
                      >
                        Type <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-center">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        onClick={() => toggleSort("layers")}
                        type="button"
                      >
                        Layers <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2">Rev</th>
                    <th className="px-3 py-2">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        onClick={() => toggleSort("status")}
                        type="button"
                      >
                        Status <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800"
                        onClick={() => toggleSort("updated_at")}
                        type="button"
                      >
                        Updated <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className={cx("border-t", r._i % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{r.code || "—"}</div>
                        <div className="text-xs text-gray-500">ID: {r.id}</div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{r.name}</div>
                      </td>

                      <td className="px-3 py-2">
                        <Badge className={typeTone(r.type)}>{r.type}</Badge>
                      </td>

                      <td className="px-3 py-2">
                        <div className="inline-flex items-start gap-2">
                          <Package className="mt-0.5 h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900">
                              {r.productCode ? `${r.productCode} — ` : ""}
                              {r.productName || "—"}
                            </div>
                            <div className="text-xs text-gray-500">Target assembly / board</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-xs text-gray-700">
                          <Layers className="h-3.5 w-3.5" />
                          {r.layers || 0}
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        <Badge className="border bg-white text-gray-700">Rev {r.revision}</Badge>
                      </td>

                      <td className="px-3 py-2">
                        <Badge className={statusTone(r.status)}>{r.status}</Badge>
                      </td>

                      <td className="px-3 py-2 text-gray-700">{formatDate(r.updatedAt)}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <Link to={`/inventory/bom/${r.id}`}>
                              <Eye className="h-4 w-4" /> View
                            </Link>
                          </Button>

                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <Link to={`/inventory/bom/${r.id}/edit`}>
                              <Pencil className="h-4 w-4" /> Edit
                            </Link>
                          </Button>

                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <Link to={`/inventory/bom/${r.id}/explode`}>
                              <Split className="h-4 w-4" /> Explode
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                            onClick={() => requestDelete(r.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-800">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-800">{pageCount}</span> • Total{" "}
              <span className="font-medium text-gray-800">{meta.total || filtered.length}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                value={meta.limit}
                onChange={(e) => setMeta((m) => ({ ...m, limit: safeNum(e.target.value, 20), page: 1 }))}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              <Button
                variant="outline"
                disabled={meta.page <= 1}
                onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, safeNum(m.page, 1) - 1) }))}
              >
                Prev
              </Button>

              <Button
                variant="outline"
                disabled={meta.page >= pageCount}
                onClick={() => setMeta((m) => ({ ...m, page: Math.min(pageCount, safeNum(m.page, 1) + 1) }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete BOM?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the BOM and its lines. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
