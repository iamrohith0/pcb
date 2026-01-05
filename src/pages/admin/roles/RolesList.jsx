// src/pages/admin/roles/RolesList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

import { Eye, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeList(resData) {
  // Supports: {data: []} | {data:{data:[]}} | [] | {items:[]}
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.items)) return resData.items;
  return [];
}

export default function RolesList() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/admin/roles", {
        params: {
          q: q || undefined,
          status: status !== "all" ? status : undefined,
        },
      });
      setRows(normalizeList(res.data));
    } catch (err) {
      toast({
        title: "Failed to load roles",
        description: "Could not fetch roles list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filtering (keeps UI responsive even if backend doesn't support params)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows
      .filter((r) => {
        if (status === "active") return r?.is_active !== false;
        if (status === "inactive") return r?.is_active === false;
        return true;
      })
      .filter((r) => {
        if (!query) return true;
        const hay = `${r.name || ""} ${r.key || ""} ${r.description || ""}`.toLowerCase();
        return hay.includes(query);
      });
  }, [rows, q, status]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r?.is_active !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [rows]);

  const openDelete = (row) => {
    setDeleteRow(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteRow?.id) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/roles/${deleteRow.id}`);
      toast({ title: "Role deleted", description: "Role removed successfully." });
      setRows((prev) => prev.filter((r) => r.id !== deleteRow.id));
    } catch (err) {
      const statusCode = err?.response?.status;
      const data = err?.response?.data;

      let msg = "Failed to delete role. Please try again.";
      if (statusCode === 409) msg = "This role is in use by users. Reassign users before deleting.";
      if (typeof data?.message === "string") msg = data.message;

      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteRow(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoles({ silent: true });
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">Roles</h1>
          <p className="text-sm text-gray-500">
            Manage role-based access for PCBxpress (Sales, Engineering, Production, Quality, Inventory).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cx("h-4 w-4", refreshing ? "animate-spin" : "")} />
            Refresh
          </Button>

          <Button asChild className="gap-2">
            <Link to="/admin/roles/create">
              <Plus className="h-4 w-4" />
              New Role
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Roles</p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="mt-1 text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="mt-1 text-2xl font-bold">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
          <CardDescription>Quickly find roles by name/key and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles (name, key, description)..." />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "all" ? "default" : "ghost"}
                onClick={() => setStatus("all")}
                className="flex-1"
              >
                All
              </Button>
              <Button
                type="button"
                variant={status === "active" ? "default" : "ghost"}
                onClick={() => setStatus("active")}
                className="flex-1"
              >
                Active
              </Button>
              <Button
                type="button"
                variant={status === "inactive" ? "default" : "ghost"}
                onClick={() => setStatus("inactive")}
                className="flex-1"
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Roles</CardTitle>
              <CardDescription>
                {filtered.length} shown / {rows.length} total
              </CardDescription>
            </div>
            <div className="hidden items-center gap-2 text-xs text-gray-500 md:flex">
              <ShieldCheck className="h-4 w-4" />
              RBAC (Role-Based Access Control)
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">Loading roles...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
              No roles found. Try changing filters or create a new role.
              <div className="mt-3">
                <Button asChild className="gap-2">
                  <Link to="/admin/roles/create">
                    <Plus className="h-4 w-4" />
                    Create Role
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                <div className="col-span-4">Role</div>
                <div className="col-span-3">Key</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y">
                {filtered.map((r) => (
                  <div key={r.id || r.key} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                    <div className="col-span-4 min-w-0">
                      <p className="truncate font-semibold text-gray-900">{r.name}</p>
                      <p className="line-clamp-1 text-xs text-gray-500">{r.description || "—"}</p>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <p className="truncate font-mono text-xs text-gray-700">{r.key || "—"}</p>
                    </div>

                    <div className="col-span-3">
                      {r.is_active === false ? (
                        <Badge variant="destructive">Inactive</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(`/admin/roles/${r.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>

                      <Button asChild variant="ghost" size="sm" className="gap-2">
                        <Link to={`/admin/roles/${r.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => openDelete(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{deleteRow?.name || "this role"}</span>.
              If it’s assigned to users, reassign them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
