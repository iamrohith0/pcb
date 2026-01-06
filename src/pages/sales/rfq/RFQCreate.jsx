// src/pages/sales/rfq/RFQCreate.jsx
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Building2,
    Check,
    FilePlus2,
    Loader2,
    Plus,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import customersApi from "@/services/sales/customers.service";
import rfqApi from "@/services/sales/rfq.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DEFAULT_LINE = {
  id: crypto?.randomUUID?.() || String(Date.now()),
  pcbType: "FR4",
  layers: 2,
  thicknessMm: 1.6,
  copperOz: 1,
  finish: "HASL",
  solderMask: "Green",
  silkscreen: "White",
  panelization: "Customer",
  qty: 10,
  unit: "PCS",
  deliveryDays: 7,
  notes: "",
};

const PCB_TYPES = ["FR4", "Aluminum", "Rigid-Flex", "Flex", "HDI"];
const FINISHES = ["HASL", "Lead Free HASL", "ENIG", "OSP", "Immersion Silver", "Immersion Tin"];
const MASKS = ["Green", "Blue", "Red", "Black", "White", "Yellow", "Matte Black"];
const SILK = ["White", "Black", "None"];
const PANELIZATION = ["Customer", "Factory", "Not Required"];
const UNITS = ["PCS", "PANELS", "SETS"];

export default function RFQCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);

  // Header fields
  const [rfqNo, setRfqNo] = useState("");
  const [rfqDate, setRfqDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [currency, setCurrency] = useState("INR");

  // Notes & attachments
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [attachments, setAttachments] = useState([]); // File[]
  const [attachmentNames, setAttachmentNames] = useState([]);

  // Lines (PCB specs)
  const [lines, setLines] = useState([{ ...DEFAULT_LINE }]);

  // Customer search list
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState([]);

  const canSubmit = useMemo(() => {
    if (!customerId && !customerName.trim()) return false;
    if (!rfqDate) return false;
    if (!lines.length) return false;
    if (lines.some((l) => !l.qty || Number(l.qty) <= 0)) return false;
    return true;
  }, [customerId, customerName, rfqDate, lines]);

  // Prefill: fetch next RFQ number + customers quick list
  useEffect(() => {
    const boot = async () => {
      setPrefillLoading(true);
      try {
        // optional endpoints: you can keep these even if backend doesn't have it yet
        const [noRes, custRes] = await Promise.allSettled([
          rfqApi.getNextNumber?.(),
          customersApi.list?.({ page: 1, limit: 50, q: "" }),
        ]);

        if (noRes.status === "fulfilled") {
          const next = noRes.value?.data?.next || noRes.value?.data?.rfq_no || "";
          if (next) setRfqNo(next);
        } else {
          // fallback
          setRfqNo(`RFQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`);
        }

        if (custRes.status === "fulfilled") {
          const data = custRes.value?.data ?? {};
          const items = data.items ?? data.data ?? data.customers ?? [];
          setCustomers(Array.isArray(items) ? items : []);
        }
      } catch (e) {
        setRfqNo(`RFQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`);
      } finally {
        setPrefillLoading(false);
      }
    };

    boot();
  }, []);

  // Customer search debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (!customersApi.list) return;
        const res = await customersApi.list({ page: 1, limit: 50, q: customerQuery || "" });
        const data = res?.data ?? {};
        const items = data.items ?? data.data ?? data.customers ?? [];
        setCustomers(Array.isArray(items) ? items : []);
      } catch {
        // ignore
      }
    }, 350);

    return () => clearTimeout(t);
  }, [customerQuery]);

  const setLine = (id, patch) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { ...DEFAULT_LINE, id: crypto?.randomUUID?.() || String(Date.now() + Math.random()) },
    ]);
  };

  const removeLine = (id) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const pickCustomer = (c) => {
    setCustomerId(String(c.id ?? ""));
    setCustomerName(c.name ?? "");
    setContactName(c.contact_name ?? c.contactName ?? "");
    setContactEmail(c.email ?? "");
    setContactPhone(c.phone ?? "");
  };

  const onFilesPicked = (files) => {
    const arr = Array.from(files || []);
    setAttachments(arr);
    setAttachmentNames(arr.map((f) => f.name));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      // If your backend supports multipart (files), send FormData.
      // Otherwise remove attachments logic and send JSON.
      const useMultipart = attachments.length > 0;

      const payload = {
        rfq_no: rfqNo,
        rfq_date: rfqDate,
        customer_id: customerId || null,
        customer_name: customerId ? undefined : customerName.trim(),
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        priority,
        currency,
        special_instructions: specialInstructions || null,
        lines: lines.map((l) => ({
          pcb_type: l.pcbType,
          layers: Number(l.layers),
          thickness_mm: Number(l.thicknessMm),
          copper_oz: Number(l.copperOz),
          finish: l.finish,
          solder_mask: l.solderMask,
          silkscreen: l.silkscreen,
          panelization: l.panelization,
          qty: Number(l.qty),
          unit: l.unit,
          delivery_days: Number(l.deliveryDays),
          notes: l.notes || null,
        })),
      };

      let res;

      if (useMultipart) {
        const fd = new FormData();
        fd.append("data", JSON.stringify(payload));
        attachments.forEach((f) => fd.append("files", f));
        res = await rfqApi.createMultipart(fd);
      } else {
        res = await rfqApi.create(payload);
      }

      const id = res?.data?.id ?? res?.data?.rfq?.id;
      toast({ title: "RFQ Created", description: "RFQ has been created successfully." });

      if (id) navigate(`/sales/rfq/${id}`, { replace: true });
      else navigate("/sales/rfq", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create RFQ.";
      toast({ title: "Create failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-3">
            <FilePlus2 className="h-6 w-6 text-[#dc2551]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Create RFQ</h1>
              <Badge className="rounded-full bg-[#dc2551]/10 text-[#dc2551]">PCB Manufacturing</Badge>
              {prefillLoading ? (
                <Badge className="rounded-full bg-gray-100 text-gray-700">Loading…</Badge>
              ) : null}
            </div>
            <p className="text-sm text-gray-500">
              Capture customer requirements and PCB specs (layers, finish, quantities) for quotation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/dashboard/sales/rfq">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={submit}
            disabled={!canSubmit || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Create RFQ
          </Button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* RFQ Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RFQ Details</CardTitle>
            <CardDescription>Basic RFQ info and customer contact.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>RFQ No</Label>
              <Input value={rfqNo} onChange={(e) => setRfqNo(e.target.value)} placeholder="RFQ-2026-0001" />
            </div>

            <div className="space-y-2">
              <Label>RFQ Date</Label>
              <Input type="date" value={rfqDate} onChange={(e) => setRfqDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
              >
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            {/* Customer */}
            <div className="space-y-2 md:col-span-2">
              <Label>Customer</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Search customer…"
                  className="pl-9"
                />
                {customerQuery ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                    onClick={() => setCustomerQuery("")}
                    aria-label="Clear customer search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Simple picker */}
              {customers?.length > 0 ? (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {customers.slice(0, 6).map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => pickCustomer(c)}
                      className={cx(
                        "rounded-xl border p-3 text-left text-sm transition-colors hover:bg-gray-50",
                        String(c.id) === String(customerId) ? "border-[#dc2551]/40 bg-[#dc2551]/5" : "border-gray-200"
                      )}
                    >
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.email || "—"} · {c.phone || "—"}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No customers found. You can still type customer name below.</p>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name (manual)</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    disabled={Boolean(customerId)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact person" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@customer.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91…" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PCB Spec Lines */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">PCB Requirements</CardTitle>
            <CardDescription>Add one or more PCB spec lines (different stackups/qty sets).</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {lines.map((l, idx) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-gray-100 text-gray-700">Line {idx + 1}</Badge>
                    <Badge className="rounded-full bg-emerald-50 text-emerald-700">
                      {l.layers}-Layer
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => removeLine(l.id)}
                    disabled={lines.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>PCB Type</Label>
                    <select
                      value={l.pcbType}
                      onChange={(e) => setLine(l.id, { pcbType: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    >
                      {PCB_TYPES.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Layers</Label>
                    <Input
                      type="number"
                      min={1}
                      value={l.layers}
                      onChange={(e) => setLine(l.id, { layers: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thickness (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.2}
                      value={l.thicknessMm}
                      onChange={(e) => setLine(l.id, { thicknessMm: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Copper (oz)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min={0.5}
                      value={l.copperOz}
                      onChange={(e) => setLine(l.id, { copperOz: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Finish</Label>
                    <select
                      value={l.finish}
                      onChange={(e) => setLine(l.id, { finish: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    >
                      {FINISHES.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Solder Mask</Label>
                    <select
                      value={l.solderMask}
                      onChange={(e) => setLine(l.id, { solderMask: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    >
                      {MASKS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Silkscreen</Label>
                    <select
                      value={l.silkscreen}
                      onChange={(e) => setLine(l.id, { silkscreen: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    >
                      {SILK.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Panelization</Label>
                    <select
                      value={l.panelization}
                      onChange={(e) => setLine(l.id, { panelization: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    >
                      {PANELIZATION.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => setLine(l.id, { qty: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <select
                      value={l.unit}
                      onChange={(e) => setLine(l.id, { unit: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/30"
                    >
                      {UNITS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={l.deliveryDays}
                      onChange={(e) => setLine(l.id, { deliveryDays: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-4">
                    <Label>Line Notes</Label>
                    <Textarea
                      value={l.notes}
                      onChange={(e) => setLine(l.id, { notes: e.target.value })}
                      placeholder="Any special notes for this line (impedance, blind vias, UL, IPC class, etc.)"
                      className="min-h-[90px]"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={addLine}>
                <Plus className="h-4 w-4" />
                Add Line
              </Button>

              <div className="text-xs text-gray-500">
                Tip: Add separate lines for different stackups / quantities / lead times.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments + Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files & Instructions</CardTitle>
            <CardDescription>Upload Gerber/ODB++, drill files, BOM, drawings, or notes.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Special Instructions</Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="IPC class, copper balance, impedance, via type, certifications, packaging, etc."
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="rounded-2xl border border-dashed border-gray-300 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" className="gap-2" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Choose Files
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => onFilesPicked(e.target.files)}
                        accept=".zip,.rar,.7z,.pdf,.txt,.png,.jpg,.jpeg,.gbr,.ger,.drl,.csv,.xlsx"
                      />
                    </label>
                  </Button>

                  {attachments.length > 0 ? (
                    <Button type="button" variant="outline" className="gap-2" onClick={() => onFilesPicked([])}>
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  ) : null}
                </div>

                {attachmentNames.length ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Selected files:</p>
                    <div className="flex flex-wrap gap-2">
                      {attachmentNames.map((n) => (
                        <Badge key={n} className="rounded-full bg-gray-100 text-gray-700">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">No files selected.</p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Recommended: upload a ZIP containing Gerber/ODB++, drill, stackup notes, and drawings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/sales/rfq">Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            disabled={!canSubmit || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Create RFQ
          </Button>
        </div>
      </form>
    </div>
  );
}
