import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Search, Plus, RefreshCw, Download, Filter, Eye, Edit, Trash2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function PermissionsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    module: searchParams.get("module") || "",
    permissionType: searchParams.get("permissionType") || "",
    isSystem: searchParams.get("isSystem") || "",
    isActive: searchParams.get("isActive") || ""
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page") || "1", 10),
    size: parseInt(searchParams.get("size") || "20", 10),
    total: 0,
    totalPages: 1
  });

  // Bulk selection
  const [selected, setSelected] = useState(new Set());

  const permissionTypes = [
    { value: "READ", label: "Read" },
    { value: "WRITE", label: "Write" },
    { value: "DELETE", label: "Delete" },
    { value: "ADMIN", label: "Admin" },
    { value: "CUSTOM", label: "Custom" }
  ];

  const modules = useMemo(() => {
    if (!stats?.byModule) return [];
    return Object.keys(stats.byModule).map(key => ({ value: key, label: key }));
  }, [stats]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const params = {
        q: filters.q,
        module: filters.module,
        permissionType: filters.permissionType,
        isSystem: filters.isSystem,
        isActive: filters.isActive,
        page: pagination.page,
        size: pagination.size
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get("/api/admin/permissions", { params });
      
      setPermissions(response.data.items || []);
      setPagination(prev => ({
        ...prev,
        page: response.data.page,
        size: response.data.size,
        total: response.data.total,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast({
        title: "Error",
        description: "Failed to load permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/permissions/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchStats();
  }, [filters, pagination.page, pagination.size]);

  useEffect(() => {
    // Update URL params when filters change
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    if (pagination.page > 1) newParams.set("page", pagination.page.toString());
    if (pagination.size !== 20) newParams.set("size", pagination.size.toString());
    setSearchParams(newParams);
  }, [filters, pagination, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (permissionId, currentStatus) => {
    try {
      await api.put(`/api/admin/permissions/${permissionId}/toggle`);
      toast({
        title: "Success",
        description: `Permission ${currentStatus ? 'deactivated' : 'activated'} successfully`
      });
      fetchPermissions();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permission status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (permissionId) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;
    
    try {
      await api.delete(`/api/admin/permissions/${permissionId}`);
      toast({
        title: "Success",
        description: "Permission deleted successfully"
      });
      fetchPermissions();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete permission",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} permissions?`)) return;
    
    try {
      await api.delete("/api/admin/permissions/bulk", {
        data: { ids: Array.from(selected) }
      });
      toast({
        title: "Success",
        description: `${selected.size} permissions deleted successfully`
      });
      setSelected(new Set());
      fetchPermissions();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete permissions",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/api/admin/permissions/export/csv", {
        params: filters,
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'permissions.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export permissions",
        variant: "destructive"
      });
    }
  };

  const canManagePermissions = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
          <p className="text-sm text-gray-600">
            Manage system permissions for role-based access control
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => { fetchPermissions(); fetchStats(); }}
            disabled={loading}
          >
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          {canManagePermissions && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/permissions/create")}
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Create Permission
              </Button>
              {selected.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selected.size})
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.system}</p>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">System</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Custom</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.custom}</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">Custom</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
          <CardDescription>Filter permissions by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search by name, code, or description..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange("q", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={filters.module}
                onValueChange={(value) => handleFilterChange("module", value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="All modules" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">All modules</Select.Item>
                  {modules.map(module => (
                    <Select.Item key={module.value} value={module.value}>
                      {module.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permission Type</Label>
              <Select
                value={filters.permissionType}
                onValueChange={(value) => handleFilterChange("permissionType", value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="All types" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">All types</Select.Item>
                  {permissionTypes.map(type => (
                    <Select.Item key={type.value} value={type.value}>
                      {type.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>System</Label>
              <Select
                value={filters.isSystem}
                onValueChange={(value) => handleFilterChange("isSystem", value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="All" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">All</Select.Item>
                  <Select.Item value="true">System</Select.Item>
                  <Select.Item value="false">Custom</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.isActive}
                onValueChange={(value) => handleFilterChange("isActive", value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="All" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">All</Select.Item>
                  <Select.Item value="true">Active</Select.Item>
                  <Select.Item value="false">Inactive</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permission List</CardTitle>
              <CardDescription>
                {pagination.total} permissions found
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <span>Showing {Math.min((pagination.page - 1) * pagination.size + 1, pagination.total)} - {Math.min(pagination.page * pagination.size, pagination.total)} of {pagination.total}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No permissions found. Create your first permission to get started.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          checked={selected.size > 0 && selected.size === permissions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelected(new Set(permissions.map(p => p.id)));
                            } else {
                              setSelected(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(permission.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selected);
                              if (e.target.checked) {
                                newSelected.add(permission.id);
                              } else {
                                newSelected.delete(permission.id);
                              }
                              setSelected(newSelected);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {permission.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            {permission.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.module}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{permission.permissionType}</Badge>
                        </TableCell>
                        <TableCell>
                          {permission.isSystem ? (
                            <Badge variant="default">System</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={permission.isActive}
                            onCheckedChange={(checked) => handleToggleStatus(permission.id, permission.isActive)}
                            disabled={permission.isSystem || !canManagePermissions}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-500">
                            {new Date(permission.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/permissions/${permission.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManagePermissions && !permission.isSystem && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/permissions/${permission.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(permission.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="pageSize">Items per page:</Label>
                  <Select
                    value={pagination.size.toString()}
                    onValueChange={(value) => setPagination(prev => ({ ...prev, size: parseInt(value), page: 1 }))}
                  >
                    <Select.Trigger id="pageSize" className="w-[120px]">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {[10, 20, 50, 100].map(size => (
                        <Select.Item key={size} value={size.toString()}>
                          {size} per page
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}