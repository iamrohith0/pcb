// src/pages/admin/users/UsersList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

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

import api from "@/lib/axios";

import {
    ArrowLeft,
    CheckCircle2,
    CircleSlash2,
    Filter,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    User2,
    UserCircle2,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function roleLabel(role) {
  if (!role) return "—";
  return String(role)
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function StatusPill({ active }) {
  if (active) {
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-gray-700">
      <CircleSlash2 className="h-3.5 w-3.5" />
      Inactive
    </Badge>
  );
}

function getActiveFlag(u) {
  if (!u) return true;
  if (typeof u.active === "boolean") return u.active;
  if (typeof u.is_active === "boolean") return u.is_active;
  if (typeof u.status === "string") return u.status.toLowerCase() === "active";
  return true;
}

export default function UsersList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0 });

  // UI state
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [status, setStatus] = useState(searchParams.get("status") || "all"); // all | active | inactive

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });
  const [confirmToggle, setConfirmToggle] = useState({ open: false, row: null });

  const page = Number(searchParams.get("page") || 1);

  const pushParams = (next = {}) => {
    const sp = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "" || v === "all") sp.delete(k);
      else sp.set(k, String(v));
    });
    if (!sp.get("page")) sp.set("page", "1");
    setSearchParams(sp);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /admin/users?page=&per_page=&q=&role=&status=
      // Returns: { data: [...], meta: { page, per_page, total } }
      // Or: { items: [...], total, page, per_page }
      const res = await api.get("/admin/users", {
        params: {
          page,
          per_page: 20,
          q: searchParams.get("q") || "",
          role: searchParams.get("role") || undefined,
          status: searchParams.get("status") || undefined,
        },
      });

      const data = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
      const m = res?.data?.meta ?? {
        page: res?.data?.page ?? page,
        per_page: res?.data?.per_page ?? 20,
        total: res?.data?.total ?? (Array.isArray(data) ? data.length : 0),
      };

      setRows(Array.isArray(data) ? data : []);
      setMeta({
        page: Number(m.page || page),
        per_page: Number(m.per_page || 20),
        total: Number(m.total || 0),
      });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load users.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setRows([]);
      setMeta({ page: 1, per_page: 20, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // derive roles list from rows (safe fallback)
  const roleOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r?.role) set.add(String(r.role));
    });
    return ["all", ...Array.from(set)];
  }, [rows]);

  const totalPages = useMemo(() => {
    const per = meta.per_page || 20;
    const t = meta.total || 0;
    return Math.max(1, Math.ceil(t / per));
  }, [meta]);

  const goToPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    const sp = new URLSearchParams(searchParams);
    sp.set("page", String(next));
    setSearchParams(sp);
  };

  const openToggle = (row) => setConfirmToggle({ open: true, row });
  const openDelete = (row) => setConfirmDelete({ open: true, row });

  const doToggle = async () => {
    const row = confirmToggle.row;
    if (!row?.id) return;
    const current = getActiveFlag(row);

    setActingId(row.id);
    try {
      // Expected:
      // PATCH /admin/users/:id/status { active: boolean }
      await api.patch(`/admin/users/${row.id}/status`, { active: !current });

      toast({
        title: "Updated",
        description: `User is now ${!current ? "Active" : "Inactive"}.`,
      });

      setConfirmToggle({ open: false, row: null });
      await fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update user status.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const doDelete = async () => {
    const row = confirmDelete.row;
    if (!row?.id) return;

    setActingId(row.id);
    try {
      // Expected:
      // DELETE /admin/users/:id
      await api.delete(`/admin/users/${row.id}`);
      toast({ title: "Deleted", description: "User deleted successfully." });
      setConfirmDelete({ open: false, row: null });
      await fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete user.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const applyFilters = () => {
    pushParams({ q: q.trim(), role, status, page: 1 });
  };

  const clearFilters = () => {
    setQ("");
    setRole("all");
    setStatus("all");
    setSearchParams(new URLSearchParams({ page: "1" }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="h-6 w-px bg-gray-200" />

          <div>
            <h1 className="text-xl font-bold tracking-tight">Users</h1>
            <p className="text-sm text-gray-500">
              Manage ERP users for PCBXpress (sales, CAM, production, QA, admin).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={fetchUsers}
            disabled={loading || actingId !== null}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          <Link to="/admin/users/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Search & Filters</CardTitle>
              <CardDescription>Quickly find users by name/email/employee code.</CardDescription>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-gray-500">
              <Filter className="h-4 w-4" />
              {meta.total || 0} total
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <label className="text-xs font-medium text-gray-600">Search</label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name, email, employee code…"
                  className="pl-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-medium text-gray-600">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "All Roles" : roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/25"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500" onClick={applyFilters}>
              Apply
            </Button>
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>

            <div className="ml-auto text-xs text-gray-500">
              Page <span className="font-medium text-gray-800">{meta.page}</span> of{" "}
              <span className="font-medium text-gray-800">{totalPages}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">User Directory</CardTitle>
              <CardDescription>Open a user to view details, edit, deactivate, or delete.</CardDescription>
            </div>
            <div className="text-xs text-gray-500">
              Showing <span className="font-medium text-gray-800">{rows.length}</span> of{" "}
              <span className="font-medium text-gray-800">{meta.total || rows.length}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading users…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-500">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-800">No users found</p>
              <p className="mt-1 text-xs text-gray-500">Try clearing filters or search with different keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="border-b px-3 py-2 font-semibold">User</th>
                    <th className="border-b px-3 py-2 font-semibold">Role</th>
                    <th className="border-b px-3 py-2 font-semibold">Employee Code</th>
                    <th className="border-b px-3 py-2 font-semibold">Department</th>
                    <th className="border-b px-3 py-2 font-semibold">Status</th>
                    <th className="border-b px-3 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const active = getActiveFlag(u);
                    const acting = actingId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="border-b px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dc2551]/10 text-[#dc2551]">
                              <span className="text-xs font-extrabold">{initials(u.name)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-900">{u.name || "—"}</div>
                              <div className="truncate text-xs text-gray-500">{u.email || "—"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="border-b px-3 py-3">
                          <div className="inline-flex items-center gap-2 text-sm text-gray-800">
                            <ShieldCheck className="h-4 w-4 text-gray-400" />
                            {roleLabel(u.role)}
                          </div>
                        </td>

                        <td className="border-b px-3 py-3 text-sm text-gray-800">{u.employee_code || u.code || "—"}</td>

                        <td className="border-b px-3 py-3 text-sm text-gray-800">
                          {u.department || u.dept || u.department_name || "—"}
                        </td>

                        <td className="border-b px-3 py-3">
                          <StatusPill active={active} />
                        </td>

                        <td className="border-b px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Link to={`/admin/users/${u.id}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <User2 className="h-4 w-4" />
                                View
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="sm"
                              className={cx(
                                "gap-2",
                                active ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"
                              )}
                              onClick={() => openToggle(u)}
                              disabled={acting || actingId !== null}
                            >
                              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <CircleSlash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              {active ? "Deactivate" : "Activate"}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDelete(u)}
                              disabled={acting || actingId !== null}
                            >
                              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && rows.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Tip: For PCB manufacturing, roles typically map to modules (Sales/RFQ, CAM/DFM, Production/WIP, QA/AOI, Admin).
              </p>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(meta.page - 1)}
                  disabled={meta.page <= 1}
                >
                  Prev
                </Button>
                <div className="rounded-xl border px-3 py-1.5 text-xs text-gray-600">
                  Page <span className="font-semibold text-gray-900">{meta.page}</span> /{" "}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(meta.page + 1)}
                  disabled={meta.page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle dialog */}
      <AlertDialog
        open={confirmToggle.open}
        onOpenChange={(open) => setConfirmToggle((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getActiveFlag(confirmToggle.row) ? "Deactivate user?" : "Activate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getActiveFlag(confirmToggle.row)
                ? "This will block login and access to PCBXpress ERP modules for this user."
                : "This will allow the user to log in and access assigned modules based on role & permissions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doToggle} disabled={actingId !== null}>
              {actingId !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If you might need the account later, deactivate instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={actingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {actingId !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

