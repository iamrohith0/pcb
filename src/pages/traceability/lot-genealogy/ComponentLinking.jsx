// src/pages/engineering/revisions/ComponentLinking.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Link2,
  Loader2,
  Search,
  RefreshCw,
  FileText,
  Hash,
  Layers,
  Package,
  ScanBarcode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Component as ComponentIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function pillClass(kind) {
  switch (kind) {
    case "success":
      return "border-green-200 bg-green-50 text-green-700";
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/**
 * PCBxpress ERP - Component Linking (Revision -> BOM Components)
 * Folder: src/pages/engineering/revisions/ComponentLinking.jsx
 *
 * Purpose:
 * - Link approved component items (inventory item master) to a PCB Revision BOM.
 * - Useful for PCB Assembly (PCBA) / stencil / pick&place planning.
 *
 * Recommended routes:
 * - /engineering/revisions/component-linking
 *
 * Suggested backend endpoints (adapt to your backend):
 * - GET  /engineering/revisions/:revId
 * - GET  /engineering/revisions/:revId/components
 * - POST /engineering/revisions/:revId/components   { item_id, mpn, designators, qty_per, side, placement, notes }
 * - DELETE /engineering/revisions/:revId/components/:linkId
 * - GET  /inventory/items?search=...
 */

export default function ComponentLinking() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const revIdFromQuery = sp.get("rev_id") || sp.get("revision_id") || "";
  const [revId, setRevId] = useState(revIdFromQuery);

  const [loading, setLoading] = useState(false);

  const [revision, setRevision] = useState(null);
  const [links, setLinks] = useState([]);

  // item search
  const [itemSearch, setItemSearch] = useState("");
  const [itemResults, setItemResults] = useState([]);
  const [searchingItems, setSearchingItems] = useState(false);

  // linking form
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({
    mpn: "",
    designators: "", // e.g. R1,R2,C5
    qty_per: "",
    side: "TOP", // TOP/BOTTOM
    placement: "SMT", // SMT/TH/THT
    notes: "",
  });

  const canLoad = useMemo(() => Boolean(revId?.trim()), [revId]);

  const loadRevision = async (id) => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get(`/engineering/revisions/${encodeURIComponent(id)}`),
        api.get(`/engineering/revisions/${encodeURIComponent(id)}/components`),
      ]);

      const rev = r1?.data?.data ?? r1?.data?.revision ?? r1?.data;
      const list = r2?.data?.data ?? r2?.data?.components ?? r2?.data ?? [];

      setRevision(rev || null);
      setLinks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load revision",
        description: err?.response?.data?.message || "Please check the Revision ID and try again.",
        variant: "destructive",
      });
      setRevision(null);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canLoad) loadRevision(revId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad]);

  const searchItems = async () => {
    const q = itemSearch.trim();
    if (!q) {
      setItemResults([]);
      setSelectedItem(null);
      return;
    }
    setSearchingItems(true);
    try {
      const res = await api.get(`/inventory/items`, { params: { search: q } });
      const list = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
      setItemResults(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Item search failed",
        description: err?.response?.data?.message || "Unable to search items.",
        variant: "destructive",
      });
    } finally {
      setSearchingItems(false);
    }
  };

  const resetLinkForm = () => {
    setSelectedItem(null);
    setForm({
      mpn: "",
      designators: "",
      qty_per: "",
      side: "TOP",
      placement: "SMT",
      notes: "",
    });
  };

  const setF = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const validateLink = () => {
    if (!revId?.trim()) return "Revision ID is required.";
    if (!selectedItem) return "Select a component item from search results.";
    if (!form.designators.trim()) return "Designators are required (e.g., R1,R2,C5).";
    if (!form.qty_per || Number.isNaN(Number(form.qty_per)) || Number(form.qty_per) <= 0) return "Qty/PCB must be > 0.";
    if (!form.side) return "Side is required.";
    if (!form.placement) return "Placement is required.";
    return null;
  };

  const handleAddLink = async () => {
    const err = validateLink();
    if (err) {
      toast({ title: "Validation error", description: err, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        item_id: selectedItem?.id ?? selectedItem?._id,
        mpn: form.mpn || selectedItem?.mpn || selectedItem?.manufacturer_part_no || "",
        designators: form.designators,
        qty_per: Number(form.qty_per),
        side: form.side,
        placement: form.placement,
        notes: form.notes,
      };

      const res = await api.post(`/engineering/revisions/${encodeURIComponent(revId)}/components`, payload);
      const created = res?.data?.data ?? res?.data?.link ?? res?.data;

      toast({ title: "Linked", description: "Component linked to revision successfully." });

      // refresh list
      const listRes = await api.get(`/engineering/revisions/${encodeURIComponent(revId)}/components`);
      const list = listRes?.data?.data ?? listRes?.data?.components ?? listRes?.data ?? [];
      setLinks(Array.isArray(list) ? list : []);

      // keep selection but clear designators/qty for faster linking
      setForm((s) => ({ ...s, designators: "", qty_per: "", notes: "" }));
      // if backend returns created record, you could also append instead of reload:
      // if (created) setLinks((prev) => [created, ...prev]);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to link component",
        description: e?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (row) => {
    const linkId = row?.id ?? row?._id ?? row?.link_id;
    if (!linkId) {
      toast({ title: "Cannot remove", description: "Missing link id.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/engineering/revisions/${encodeURIComponent(revId)}/components/${encodeURIComponent(linkId)}`);
      toast({ title: "Removed", description: "Link removed successfully." });
      setLinks((prev) => prev.filter((x) => (x?.id ?? x?._id ?? x?.link_id) !== linkId));
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to remove link",
        description: e?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const derived = useMemo(() => {
    const partNo = revision?.part_no ?? revision?.partNo ?? revision?.pcb_part_no;
    const rev = revision?.rev ?? revision?.revision ?? revision?.panel_rev;
    const layers = revision?.layer_count ?? revision?.layers;
    const stack = revision?.stackup_name ?? revision?.stackup;
    const status = revision?.status ?? revision?.state ?? "—";
    return { partNo, rev, layers, stack, status };
  }, [revision]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="border bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#dc2551]/10 p-3">
                  <Link2 className="h-6 w-6 text-[#dc2551]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Component Linking</CardTitle>
                  <CardDescription>
                    Link inventory components to an Engineering Revision (PCBA BOM + designators).
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="ghost" className="gap-2">
                  <Link to="/engineering/revisions">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => revId && loadRevision(revId)}
                  disabled={!revId || loading}
                >
                  <RefreshCw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Revision selector / header */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rev_id">Revision ID</Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="rev_id"
                    value={revId}
                    onChange={(e) => setRevId(e.target.value)}
                    placeholder="REV-ID (from revisions list)"
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                    onClick={() => revId && loadRevision(revId)}
                    disabled={!revId || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Load
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetLinkForm} disabled={loading}>
                    Reset Form
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cx("border", pillClass("success"))}>PCB Revision</Badge>
                    <Badge className={cx("border", pillClass("default"))}>ID: {safe(revId)}</Badge>
                    <Badge className={cx("border", pillClass("default"))}>Status: {safe(derived.status)}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <FileText className="h-4 w-4 text-[#dc2551]" />
                        Part No
                      </div>
                      <div className="mt-1 text-sm font-semibold">{safe(derived.partNo)}</div>
                    </div>

                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Hash className="h-4 w-4 text-[#dc2551]" />
                        Rev
                      </div>
                      <div className="mt-1 text-sm font-semibold">{safe(derived.rev)}</div>
                    </div>

                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Layers className="h-4 w-4 text-[#dc2551]" />
                        Layers
                      </div>
                      <div className="mt-1 text-sm font-semibold">{safe(derived.layers)}</div>
                    </div>

                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Package className="h-4 w-4 text-[#dc2551]" />
                        Stackup
                      </div>
                      <div className="mt-1 text-sm font-semibold">{safe(derived.stack)}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Tip: This screen is useful for **PCBA BOM linking** (inventory item master ↔ designators) and shop-floor
                    traceability.
                  </div>
                </div>
              </div>
            </div>

            {/* Item search + link form */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Item Search */}
              <div className="lg:col-span-1">
                <Card className="border bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">Find Component</CardTitle>
                        <CardDescription className="text-xs">Search Inventory Items by name, MPN, or code.</CardDescription>
                      </div>
                      <div className="rounded-lg bg-[#dc2551]/10 p-2">
                        <ComponentIcon className="h-4 w-4 text-[#dc2551]" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="item_search">Search</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="item_search"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          placeholder="e.g., 10K 0603 / STM32 / MPN"
                          className="pl-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={searchItems}
                        disabled={searchingItems || loading}
                      >
                        {searchingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Search Items
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-600">Results</div>
                      <div className="max-h-64 overflow-auto rounded-xl border">
                        {itemResults.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500">
                            No items yet. Search to show matching components.
                          </div>
                        ) : (
                          <ul className="divide-y">
                            {itemResults.map((it) => {
                              const id = it?.id ?? it?._id ?? it?.item_id ?? JSON.stringify(it);
                              const code = it?.code ?? it?.item_code ?? it?.sku ?? "ITEM";
                              const name = it?.name ?? it?.description ?? it?.title ?? "Component";
                              const mpn = it?.mpn ?? it?.manufacturer_part_no ?? "";
                              const uom = it?.uom ?? it?.unit ?? "EA";
                              const isSel = (selectedItem?.id ?? selectedItem?._id) === (it?.id ?? it?._id);

                              return (
                                <li key={id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItem(it);
                                      setForm((s) => ({
                                        ...s,
                                        mpn: s.mpn || mpn || "",
                                      }));
                                    }}
                                    className={cx(
                                      "w-full px-3 py-3 text-left hover:bg-gray-50",
                                      isSel ? "bg-[#dc2551]/5" : ""
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-gray-800">{name}</div>
                                        <div className="mt-0.5 truncate text-xs text-gray-500">
                                          {code} {mpn ? `• ${mpn}` : ""} • UOM: {uom}
                                        </div>
                                      </div>
                                      {isSel ? (
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                                      ) : (
                                        <ScanBarcode className="mt-0.5 h-4 w-4 flex-none text-gray-400" />
                                      )}
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {selectedItem && (
                        <div className="rounded-xl border bg-gray-50 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-700">Selected</span>
                            <Badge className={cx("border", pillClass("success"))}>Ready</Badge>
                          </div>
                          <div className="mt-2 text-gray-700">
                            <div className="truncate font-semibold">{safe(selectedItem?.name ?? selectedItem?.description)}</div>
                            <div className="truncate text-gray-500">
                              {safe(selectedItem?.code ?? selectedItem?.item_code ?? selectedItem?.sku)}{" "}
                              {selectedItem?.mpn ? `• ${selectedItem.mpn}` : ""}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Link Form */}
              <div className="lg:col-span-2">
                <Card className="border bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">Link to Revision</CardTitle>
                        <CardDescription className="text-xs">
                          Set designators + qty per PCB to build the PCBA BOM for this revision.
                        </CardDescription>
                      </div>
                      <div className="rounded-lg bg-[#dc2551]/10 p-2">
                        <Link2 className="h-4 w-4 text-[#dc2551]" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {!revision ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4" />
                          <div>
                            <div className="font-semibold">Load a revision first</div>
                            <div className="text-xs text-amber-700">
                              Enter a valid Revision ID and click <b>Load</b> to start linking components.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="mpn">MPN (optional)</Label>
                        <Input id="mpn" value={form.mpn} onChange={setF("mpn")} placeholder="Manufacturer Part No" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qty_per">Qty / PCB *</Label>
                        <Input
                          id="qty_per"
                          value={form.qty_per}
                          onChange={setF("qty_per")}
                          placeholder="e.g., 1, 2, 0.5"
                          inputMode="decimal"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="designators">Designators *</Label>
                      <Input
                        id="designators"
                        value={form.designators}
                        onChange={setF("designators")}
                        placeholder="R1,R2,R5 or C1-C10"
                      />
                      <div className="text-xs text-gray-500">
                        Use commas for multiple references. Ranges like C1-C10 can be stored as text (backend can expand later).
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="side">Side</Label>
                        <Input id="side" value={form.side} onChange={setF("side")} placeholder="TOP / BOTTOM" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="placement">Placement</Label>
                        <Input id="placement" value={form.placement} onChange={setF("placement")} placeholder="SMT / TH" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" value={form.notes} onChange={setF("notes")} placeholder="Feeder, alt part, polarity note…" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        className="gap-2 bg-[#dc2551] hover:bg-[#b02045]"
                        onClick={handleAddLink}
                        disabled={loading || !revision}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        Link Component
                      </Button>

                      <Button type="button" variant="outline" className="gap-2" onClick={resetLinkForm} disabled={loading}>
                        <XCircle className="h-4 w-4" />
                        Clear
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        onClick={() => navigate(`/engineering/revisions/details?rev_id=${encodeURIComponent(revId)}`)}
                        disabled={!revId}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Revision
                      </Button>
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-semibold text-gray-700">Best practice</div>
                          Link components only after the revision is frozen/approved (to avoid BOM mismatch across revs).
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Linked table */}
                <Card className="mt-4 border bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">Linked Components</CardTitle>
                        <CardDescription className="text-xs">Current BOM links for this revision.</CardDescription>
                      </div>
                      <Badge className={cx("border", pillClass("default"))}>{links.length} items</Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="min-w-full divide-y">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-xs font-semibold text-gray-600">
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">MPN</th>
                            <th className="px-3 py-2">Designators</th>
                            <th className="px-3 py-2">Qty/PCB</th>
                            <th className="px-3 py-2">Side</th>
                            <th className="px-3 py-2">Placement</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {links.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                                No components linked yet.
                              </td>
                            </tr>
                          ) : (
                            links.map((row) => {
                              const id = row?.id ?? row?._id ?? row?.link_id ?? JSON.stringify(row);
                              const itemName = row?.item_name ?? row?.item?.name ?? row?.name ?? "Component";
                              const itemCode = row?.item_code ?? row?.item?.code ?? row?.code ?? "";
                              const mpn = row?.mpn ?? "";
                              const designators = row?.designators ?? row?.refs ?? "";
                              const qty = row?.qty_per ?? row?.qty ?? row?.quantity ?? "";
                              const side = row?.side ?? "—";
                              const placement = row?.placement ?? row?.type ?? "—";

                              return (
                                <tr key={id} className="text-sm">
                                  <td className="px-3 py-3">
                                    <div className="min-w-0">
                                      <div className="truncate font-semibold text-gray-800">{itemName}</div>
                                      <div className="truncate text-xs text-gray-500">{itemCode ? itemCode : "—"}</div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 font-mono text-xs text-gray-700">{safe(mpn)}</td>
                                  <td className="px-3 py-3">{safe(designators)}</td>
                                  <td className="px-3 py-3">{safe(qty)}</td>
                                  <td className="px-3 py-3">{safe(side)}</td>
                                  <td className="px-3 py-3">{safe(placement)}</td>
                                  <td className="px-3 py-3 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => handleRemove(row)}
                                      disabled={loading}
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Export BOM for SMT programming later (Pick & Place) — typically by combining linked components + placements.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
