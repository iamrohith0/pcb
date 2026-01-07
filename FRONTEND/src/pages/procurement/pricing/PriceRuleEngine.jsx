// src/pages/procurement/pricing/PriceRuleEngine.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgePercent,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  Filter,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

// If you have your shadcn Select component wired, you can swap the native <select>.
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(d) {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function money(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 4 }).format(num);
}

function uid(prefix = "RULE") {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${t}-${r}`;
}

/**
 * In PCB Manufacturing ERP, a "Price Rule Engine" usually sets:
 * - Customer-specific price overrides
 * - Supplier-specific purchase rates
 * - Category/material/process premiums
 * - MOQ breaks, quantity slabs
 * - Validity windows and approvals
 *
 * Replace mock API with your backend:
 * GET    /procurement/pricing/rules
 * POST   /procurement/pricing/rules
 * PUT    /procurement/pricing/rules/:id
 * DELETE /procurement/pricing/rules/:id
 * POST   /procurement/pricing/rules/:id/clone
 * GET    /procurement/pricing/rules/export
 */
async function mockFetchRules() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "PR-0001",
          name: "FR4 Core Premium (High TG)",
          status: "ACTIVE",
          priority: 10,
          scope: "PURCHASE",
          appliesTo: { itemType: "Raw Material", itemCodes: ["RM-FR4-HTG-1.6"], supplier: "ALL", customer: "ALL" },
          conditions: {
            qtyMin: 1,
            qtyMax: null,
            currency: "INR",
            uom: "SHEET",
            effectiveFrom: "2026-01-01",
            effectiveTo: null,
          },
          pricing: { kind: "ADD_AMOUNT", value: 65.0 },
          audit: { updatedBy: "Admin", updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
          notes: "Add premium for HTG laminate procurement.",
        },
        {
          id: "PR-0002",
          name: "Supplier Rate Discount - ChemX",
          status: "ACTIVE",
          priority: 20,
          scope: "PURCHASE",
          appliesTo: { itemType: "Chemical", itemCodes: ["CHEM-ETCH-CL"], supplier: "ChemX", customer: "ALL" },
          conditions: {
            qtyMin: 10,
            qtyMax: null,
            currency: "INR",
            uom: "CAN",
            effectiveFrom: "2025-12-01",
            effectiveTo: "2026-03-31",
          },
          pricing: { kind: "DISCOUNT_PERCENT", value: 3.5 },
          audit: { updatedBy: "Procurement", updatedAt: new Date(Date.now() - 86400000 * 6).toISOString() },
          notes: "Volume deal for etchant.",
        },
        {
          id: "PR-0003",
          name: "Customer Special - Alpha EMS (Copper Foil)",
          status: "DRAFT",
          priority: 50,
          scope: "SALES",
          appliesTo: { itemType: "Raw Material", itemCodes: ["RM-CU-FOIL-18"], supplier: "ALL", customer: "Alpha EMS" },
          conditions: {
            qtyMin: 1,
            qtyMax: 500,
            currency: "INR",
            uom: "KG",
            effectiveFrom: "2026-01-05",
            effectiveTo: "2026-02-28",
          },
          pricing: { kind: "SET_PRICE", value: 985.0 },
          audit: { updatedBy: "Sales Engineer", updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
          notes: "Temporary lock-in for customer.",
        },
      ]);
    }, 420);
  });
}

export default function PriceRuleEngine() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);

  // filters
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("ALL"); // PURCHASE/SALES
  const [status, setStatus] = useState("ALL"); // ACTIVE/DRAFT/INACTIVE
  const [itemType, setItemType] = useState("ALL"); // Raw Material/Chemical/Consumable...
  const [supplier, setSupplier] = useState("ALL");
  const [customer, setCustomer] = useState("ALL");

  // editor
  const [expanded, setExpanded] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  // confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [confirmDeactivate, setConfirmDeactivate] = useState({ open: false, id: null });

  const scopes = useMemo(() => ["ALL", "PURCHASE", "SALES"], []);
  const statuses = useMemo(() => ["ALL", "ACTIVE", "DRAFT", "INACTIVE"], []);
  const itemTypes = useMemo(() => ["ALL", "Raw Material", "Chemical", "Consumable", "FG", "WIP"], []);
  const suppliers = useMemo(() => ["ALL", "ChemX", "CopperWorld", "LaminatePro", "ToolMart"], []);
  const customers = useMemo(() => ["ALL", "Alpha EMS", "Beta Devices", "Gamma Controls"], []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await mockFetchRules();
      setRules(data);
    } catch (e) {
      toast({ title: "Failed to load rules", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (rules || [])
      .filter((r) => {
        const applies = r.appliesTo || {};
        const matchesQ =
          !q ||
          String(r.id || "").toLowerCase().includes(q) ||
          String(r.name || "").toLowerCase().includes(q) ||
          String(applies.supplier || "").toLowerCase().includes(q) ||
          String(applies.customer || "").toLowerCase().includes(q) ||
          (applies.itemCodes || []).some((c) => String(c).toLowerCase().includes(q));

        const matchesScope = scope === "ALL" || r.scope === scope;
        const matchesStatus = status === "ALL" || r.status === status;
        const matchesType = itemType === "ALL" || (applies.itemType || "") === itemType;
        const matchesSupplier = supplier === "ALL" || (applies.supplier || "") === supplier;
        const matchesCustomer = customer === "ALL" || (applies.customer || "") === customer;

        return matchesQ && matchesScope && matchesStatus && matchesType && matchesSupplier && matchesCustomer;
      })
      .sort((a, b) => (Number(b.priority || 0) - Number(a.priority || 0)));
  }, [rules, query, scope, status, itemType, supplier, customer]);

  const ruleKindLabel = (k) => {
    switch (k) {
      case "SET_PRICE":
        return "Set Price";
      case "DISCOUNT_PERCENT":
        return "Discount %";
      case "ADD_PERCENT":
        return "Add %";
      case "ADD_AMOUNT":
        return "Add Amount";
      case "SUB_AMOUNT":
        return "Subtract Amount";
      default:
        return k || "-";
    }
  };

  const statusBadge = (s) => {
    const cls =
      s === "ACTIVE"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : s === "DRAFT"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-gray-50 text-gray-700 border-gray-200";
    return <Badge className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>{s}</Badge>;
  };

  const scopeBadge = (s) => {
    const cls =
      s === "PURCHASE"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : "bg-violet-50 text-violet-700 border-violet-200";
    return <Badge className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>{s}</Badge>;
  };

  const openEditor = (rule) => {
    setEditingId(rule?.id || null);
    setDraft(
      rule
        ? JSON.parse(JSON.stringify(rule))
        : {
            id: uid("PR"),
            name: "New Rule",
            status: "DRAFT",
            priority: 50,
            scope: "PURCHASE",
            appliesTo: { itemType: "Raw Material", itemCodes: [], supplier: "ALL", customer: "ALL" },
            conditions: {
              qtyMin: 1,
              qtyMax: null,
              currency: "INR",
              uom: "EA",
              effectiveFrom: new Date().toISOString().slice(0, 10),
              effectiveTo: null,
            },
            pricing: { kind: "DISCOUNT_PERCENT", value: 1.0 },
            audit: { updatedBy: "You", updatedAt: new Date().toISOString() },
            notes: "",
          }
    );
  };

  const closeEditor = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveRule = async () => {
    if (!draft?.name?.trim()) {
      toast({ title: "Validation", description: "Rule name is required.", variant: "destructive" });
      return;
    }

    // Basic validation
    const qtyMin = Number(draft?.conditions?.qtyMin || 0);
    const qtyMax = draft?.conditions?.qtyMax === null || draft?.conditions?.qtyMax === "" ? null : Number(draft?.conditions?.qtyMax);

    if (Number.isNaN(qtyMin) || qtyMin < 0) {
      toast({ title: "Validation", description: "Qty Min must be a valid number.", variant: "destructive" });
      return;
    }
    if (qtyMax !== null && (Number.isNaN(qtyMax) || qtyMax < qtyMin)) {
      toast({ title: "Validation", description: "Qty Max must be >= Qty Min.", variant: "destructive" });
      return;
    }

    const payload = {
      ...draft,
      conditions: { ...draft.conditions, qtyMin, qtyMax },
      audit: { ...(draft.audit || {}), updatedAt: new Date().toISOString() },
    };

    // Mock upsert
    setRules((prev) => {
      const exists = prev.find((r) => r.id === payload.id);
      if (exists) return prev.map((r) => (r.id === payload.id ? payload : r));
      return [payload, ...prev];
    });

    toast({ title: "Saved", description: `Rule ${payload.id} saved successfully.` });
    closeEditor();
  };

  const cloneRule = (id) => {
    const r = rules.find((x) => x.id === id);
    if (!r) return;

    const cloned = {
      ...JSON.parse(JSON.stringify(r)),
      id: uid("PR"),
      name: `${r.name} (Copy)`,
      status: "DRAFT",
      audit: { ...(r.audit || {}), updatedAt: new Date().toISOString(), updatedBy: "You" },
    };
    setRules((prev) => [cloned, ...prev]);
    toast({ title: "Cloned", description: `Created ${cloned.id}` });
  };

  const requestDeactivate = (id) => setConfirmDeactivate({ open: true, id });
  const requestDelete = (id) => setConfirmDelete({ open: true, id });

  const doDeactivate = () => {
    const id = confirmDeactivate.id;
    setConfirmDeactivate({ open: false, id: null });
    if (!id) return;

    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status: "INACTIVE" } : r)));
    toast({ title: "Deactivated", description: `Rule ${id} set to INACTIVE.` });
  };

  const doDelete = () => {
    const id = confirmDelete.id;
    setConfirmDelete({ open: false, id: null });
    if (!id) return;

    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", description: `Rule ${id} deleted.` });
  };

  const resetFilters = () => {
    setQuery("");
    setScope("ALL");
    setStatus("ALL");
    setItemType("ALL");
    setSupplier("ALL");
    setCustomer("ALL");
  };

  const exportRules = () => {
    toast({ title: "Export", description: "Connect this button to your /pricing/rules/export endpoint (CSV/Excel)." });
  };

  const toggleExpand = (id) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BadgePercent className="h-5 w-5 text-gray-600" />
                  Price Rule Engine
                </CardTitle>
                <CardDescription>
                  Build purchase/sales price rules for PCB materials, chemicals, tooling and services with priority & validity windows.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={load} disabled={loading}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={exportRules}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={() => openEditor(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Rule
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-3 md:grid-cols-12">
              <div className="md:col-span-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Search</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> filters
                  </span>
                </div>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rule name / ID / supplier / customer / item code..."
                    className="pl-9"
                  />
                  {query && (
                    <button
                      type="button"
                      className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Scope</div>
                <select
                  className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  {scopes.map((s) => (
                    <option key={s} value={s}>
                      {s === "ALL" ? "All" : s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Status</div>
                <select
                  className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s === "ALL" ? "All" : s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <div className="text-xs text-gray-500">Item type</div>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                  >
                    {itemTypes.map((t) => (
                      <option key={t} value={t}>
                        {t === "ALL" ? "All" : t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <div className="text-xs text-gray-500">Supplier</div>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  >
                    {suppliers.map((s) => (
                      <option key={s} value={s}>
                        {s === "ALL" ? "All" : s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <div className="text-xs text-gray-500">Customer</div>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                  >
                    {customers.map((c) => (
                      <option key={c} value={c}>
                        {c === "ALL" ? "All" : c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Filter className="h-4 w-4" />
                  Showing <span className="font-semibold text-gray-900">{filtered.length}</span> rules
                </div>

                <Button variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Table */}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Rule</th>
                    <th className="px-3 py-2 text-left">Scope</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Applies To</th>
                    <th className="px-3 py-2 text-left">Validity</th>
                    <th className="px-3 py-2 text-left">Pricing</th>
                    <th className="px-3 py-2 text-right">Priority</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-500">
                        {loading ? "Loading..." : "No rules found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const applies = r.appliesTo || {};
                      const cond = r.conditions || {};
                      const pricing = r.pricing || {};
                      const isOpen = !!expanded[r.id];

                      return (
                        <tr key={r.id} className="hover:bg-gray-50/60">
                          <td className="px-3 py-2">
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleExpand(r.id)}
                                className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                                aria-label={isOpen ? "Collapse" : "Expand"}
                              >
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                              <div>
                                <div className="font-semibold text-gray-900">{r.name}</div>
                                <div className="text-xs text-gray-500">{r.id}</div>
                                {isOpen && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className="rounded-full border bg-white text-gray-700 border-gray-200">
                                        <Tag className="mr-1 h-3.5 w-3.5" />
                                        {applies.itemType || "-"}
                                      </Badge>
                                      <Badge className="rounded-full border bg-white text-gray-700 border-gray-200">
                                        Supplier: {applies.supplier || "ALL"}
                                      </Badge>
                                      <Badge className="rounded-full border bg-white text-gray-700 border-gray-200">
                                        Customer: {applies.customer || "ALL"}
                                      </Badge>
                                    </div>

                                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                                      <div className="rounded-lg border bg-white p-2">
                                        <div className="text-[11px] text-gray-500">Item Codes</div>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {(applies.itemCodes || []).length ? (
                                            applies.itemCodes.map((c) => (
                                              <Badge key={c} className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                                {c}
                                              </Badge>
                                            ))
                                          ) : (
                                            <span className="text-xs text-gray-500">All items in type</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="rounded-lg border bg-white p-2">
                                        <div className="text-[11px] text-gray-500">Qty Range</div>
                                        <div className="mt-1 text-xs text-gray-700">
                                          Min: <span className="font-semibold">{cond.qtyMin ?? "-"}</span>{" "}
                                          {cond.qtyMax !== null && cond.qtyMax !== undefined ? (
                                            <>
                                              | Max: <span className="font-semibold">{cond.qtyMax}</span>
                                            </>
                                          ) : (
                                            <>| Max: <span className="font-semibold">∞</span></>
                                          )}
                                          {cond.uom ? <> | UoM: <span className="font-semibold">{cond.uom}</span></> : null}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-2 rounded-lg border bg-white p-2">
                                      <div className="text-[11px] text-gray-500">Notes</div>
                                      <div className="mt-1 text-xs text-gray-700">{r.notes || "-"}</div>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      Updated by <span className="font-semibold text-gray-700">{r.audit?.updatedBy || "-"}</span>{" "}
                                      on <span className="font-semibold text-gray-700">{formatDate(r.audit?.updatedAt)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2">{scopeBadge(r.scope)}</td>
                          <td className="px-3 py-2">{statusBadge(r.status)}</td>

                          <td className="px-3 py-2">
                            <div className="text-gray-700">
                              <div className="font-medium">{applies.itemType || "-"}</div>
                              <div className="text-xs text-gray-500">
                                {applies.supplier && applies.supplier !== "ALL" ? `Supplier: ${applies.supplier}` : "Supplier: All"}
                                {" · "}
                                {applies.customer && applies.customer !== "ALL" ? `Customer: ${applies.customer}` : "Customer: All"}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <div className="text-gray-700">
                              <div className="inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-xs">
                                  {formatDate(cond.effectiveFrom)} → {cond.effectiveTo ? formatDate(cond.effectiveTo) : "Open"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <div className="text-gray-700">
                              <div className="font-medium">{ruleKindLabel(pricing.kind)}</div>
                              <div className="text-xs text-gray-500">
                                {pricing.kind === "SET_PRICE" || pricing.kind === "ADD_AMOUNT" || pricing.kind === "SUB_AMOUNT"
                                  ? money(pricing.value)
                                  : `${Number(pricing.value || 0).toFixed(2)}%`}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2 text-right font-semibold text-gray-900">{Number(r.priority || 0)}</td>

                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditor(r)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => cloneRule(r.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Clone
                              </Button>
                              {r.status !== "INACTIVE" ? (
                                <Button variant="outline" size="sm" onClick={() => requestDeactivate(r.id)}>
                                  <X className="mr-2 h-4 w-4" />
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "ACTIVE" } : x)))
                                  }
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => requestDelete(r.id)} className="text-rose-700">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Tip: In PCB ERP, keep <span className="font-semibold text-gray-700">higher priority</span> for customer-specific or
              supplier-specific overrides, and lower priority for generic category rules.
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Editor drawer/card */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl"
          >
            <Card className="overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <BadgePercent className="h-5 w-5 text-gray-700" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{editingId ? "Edit Rule" : "Create Rule"}</div>
                    <div className="text-xs text-gray-500">{draft.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={closeEditor}>
                    Cancel
                  </Button>
                  <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={saveRule}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>

              <div className="max-h-[78vh] overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-8 space-y-2">
                    <Label>Rule name</Label>
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Example: Copper Foil Discount for Supplier X"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Scope</Label>
                    <select
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.scope}
                      onChange={(e) => setDraft((p) => ({ ...p, scope: e.target.value }))}
                    >
                      <option value="PURCHASE">PURCHASE</option>
                      <option value="SALES">SALES</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Status</Label>
                    <select
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.status}
                      onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Priority (higher wins)</Label>
                    <Input
                      type="number"
                      value={draft.priority}
                      onChange={(e) => setDraft((p) => ({ ...p, priority: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Item type</Label>
                    <select
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.appliesTo?.itemType || "Raw Material"}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          appliesTo: { ...(p.appliesTo || {}), itemType: e.target.value },
                        }))
                      }
                    >
                      {itemTypes.filter((x) => x !== "ALL").map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Supplier</Label>
                    <select
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.appliesTo?.supplier || "ALL"}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          appliesTo: { ...(p.appliesTo || {}), supplier: e.target.value },
                        }))
                      }
                    >
                      {suppliers.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Customer</Label>
                    <select
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.appliesTo?.customer || "ALL"}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          appliesTo: { ...(p.appliesTo || {}), customer: e.target.value },
                        }))
                      }
                    >
                      {customers.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-12 space-y-2">
                    <Label>Item codes (comma separated)</Label>
                    <Input
                      value={(draft.appliesTo?.itemCodes || []).join(", ")}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          appliesTo: {
                            ...(p.appliesTo || {}),
                            itemCodes: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                      placeholder="RM-FR4-1.6-7628, RM-CU-FOIL-18"
                    />
                    <div className="text-xs text-gray-500">
                      Leave blank to apply to <span className="font-semibold text-gray-700">all items in the type</span>.
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Qty Min</Label>
                    <Input
                      type="number"
                      value={draft.conditions?.qtyMin ?? 1}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          conditions: { ...(p.conditions || {}), qtyMin: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Qty Max (optional)</Label>
                    <Input
                      type="number"
                      value={draft.conditions?.qtyMax ?? ""}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          conditions: { ...(p.conditions || {}), qtyMax: e.target.value === "" ? null : e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>UoM</Label>
                    <Input
                      value={draft.conditions?.uom ?? "EA"}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, conditions: { ...(p.conditions || {}), uom: e.target.value } }))
                      }
                      placeholder="EA / KG / SHEET / CAN"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={draft.conditions?.currency ?? "INR"}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, conditions: { ...(p.conditions || {}), currency: e.target.value } }))
                      }
                    />
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>Effective From</Label>
                    <Input
                      type="date"
                      value={draft.conditions?.effectiveFrom ?? ""}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          conditions: { ...(p.conditions || {}), effectiveFrom: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>Effective To (optional)</Label>
                    <Input
                      type="date"
                      value={draft.conditions?.effectiveTo ?? ""}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          conditions: { ...(p.conditions || {}), effectiveTo: e.target.value || null },
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>Pricing kind</Label>
                    <select
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.pricing?.kind || "DISCOUNT_PERCENT"}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          pricing: { ...(p.pricing || {}), kind: e.target.value },
                        }))
                      }
                    >
                      <option value="SET_PRICE">SET_PRICE</option>
                      <option value="DISCOUNT_PERCENT">DISCOUNT_PERCENT</option>
                      <option value="ADD_PERCENT">ADD_PERCENT</option>
                      <option value="ADD_AMOUNT">ADD_AMOUNT</option>
                      <option value="SUB_AMOUNT">SUB_AMOUNT</option>
                    </select>
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>
                      Pricing value{" "}
                      <span className="text-xs text-gray-500">
                        ({draft.pricing?.kind === "SET_PRICE" ||
                        draft.pricing?.kind === "ADD_AMOUNT" ||
                        draft.pricing?.kind === "SUB_AMOUNT"
                          ? "amount"
                          : "percent"})
                      </span>
                    </Label>
                    <Input
                      type="number"
                      value={draft.pricing?.value ?? 0}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          pricing: { ...(p.pricing || {}), value: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-12 space-y-2">
                    <Label>Notes</Label>
                    <textarea
                      className="min-h-[90px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      value={draft.notes || ""}
                      onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Why does this rule exist? Approval reference? Commercial terms?"
                    />
                  </div>

                  <div className="md:col-span-12 rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-800">How rules should resolve</div>
                        <div className="mt-1">
                          Sort by <span className="font-semibold text-gray-800">priority (desc)</span>, then match by:
                          scope → item type → supplier/customer overrides → qty slab → validity window.
                          The first match wins.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmationDialog
        open={confirmDeactivate.open}
        title="Deactivate rule?"
        description="This will stop the rule from applying to new pricing calculations."
        confirmText="Deactivate"
        confirmVariant="destructive"
        onOpenChange={(open) => setConfirmDeactivate((p) => ({ ...p, open }))}
        onConfirm={doDeactivate}
      />

      <ConfirmationDialog
        open={confirmDelete.open}
        title="Delete rule?"
        description="This action cannot be undone. Consider deactivating if you want audit history."
        confirmText="Delete"
        confirmVariant="destructive"
        onOpenChange={(open) => setConfirmDelete((p) => ({ ...p, open }))}
        onConfirm={doDelete}
      />
    </>
  );
}
