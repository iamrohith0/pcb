// src/pages/warehouse/warehouses/WarehouseCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

import {
  Building2,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Warehouse as WarehouseIcon,
  XCircle,
} from "lucide-react";

import api from "@/lib/axios";

/**
 * PCBxpress ERP — Warehouse → Warehouses → Create
 * File: src/pages/warehouse/warehouses/WarehouseCreate.jsx
 *
 * Purpose:
 *  - Create a new warehouse (physical store)
 *  - Supports default warehouse, address fields, and operational flags
 *
 * Suggested backend endpoints:
 *  - POST /warehouse/warehouses
 *    payload: { code, name, plant_id?, is_default, is_active, address, contact_name?, contact_phone? }
 *
 *  - GET  /settings/plants (optional) to populate plant dropdown if multi-plant ERP
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeCode(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 16);
}

export default function WarehouseCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Optional plants support
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [plants, setPlants] = useState([]); // [{id, name}]
  const [plantId, setPlantId] = useState("");

  // Form
  const [code, setCode] = useState("WH-");
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const hasChanges = useMemo(() => {
    return (
      code !== "WH-" ||
      !!name ||
      isDefault !== false ||
      isActive !== true ||
      !!plantId ||
      !!address1 ||
      !!address2 ||
      !!city ||
      !!state ||
      !!pincode ||
      country !== "India" ||
      !!contactName ||
      !!contactPhone
    );
  }, [
    code,
    name,
    isDefault,
    isActive,
    plantId,
    address1,
    address2,
    city,
    state,
    pincode,
    country,
    contactName,
    contactPhone,
  ]);

  const errors = useMemo(() => {
    const e = {};
    if (!code || code.trim().length < 3) e.code = "Warehouse code is required (min 3 chars).";
    if (!name || name.trim().length < 3) e.name = "Warehouse name is required (min 3 chars).";
    if (pincode && !/^\d{6}$/.test(pincode)) e.pincode = "Pincode should be 6 digits.";
    if (contactPhone && !/^[0-9+\-\s()]{7,16}$/.test(contactPhone)) e.contactPhone = "Enter a valid phone number.";
    return e;
  }, [code, name, pincode, contactPhone]);

  const canSave = useMemo(() => Object.keys(errors).length === 0 && !saving, [errors, saving]);

  // Optional: load plants list (safe fallback if endpoint doesn't exist)
  useEffect(() => {
    const loadPlants = async () => {
      setPlantsLoading(true);
      try {
        const res = await api.get("/settings/plants");
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) setPlants(data);
        else if (Array.isArray(data?.items)) setPlants(data.items);
      } catch (e) {
        // No plants support or endpoint unavailable – that's okay
        setPlants([]);
      } finally {
        setPlantsLoading(false);
      }
    };

    loadPlants();
  }, []);

  const payload = useMemo(() => {
    return {
      code: normalizeCode(code),
      name: name.trim(),
      plant_id: plantId || null,
      is_default: !!isDefault,
      is_active: !!isActive,
      address: {
        line1: address1.trim() || null,
        line2: address2.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        country: country.trim() || null,
      },
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
    };
  }, [
    code,
    name,
    plantId,
    isDefault,
    isActive,
    address1,
    address2,
    city,
    state,
    pincode,
    country,
    contactName,
    contactPhone,
  ]);

  const submit = async () => {
    if (!canSave) {
      toast({
        title: "Fix required fields",
        description: "Please correct the highlighted inputs.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/warehouse/warehouses", payload);
      const created = res.data?.data || res.data;

      toast({
        title: "Warehouse created",
        description: `${payload.code} • ${payload.name}`,
      });

      // Navigate to details if your routes support it; otherwise to list
      if (created?.id) {
        navigate(`/warehouse/warehouses/${encodeURIComponent(created.id)}`, { replace: true });
      } else if (created?.code) {
        navigate(`/warehouse/warehouses/${encodeURIComponent(created.code)}`, { replace: true });
      } else {
        navigate("/warehouse/warehouses", { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create warehouse. Please try again.";

      toast({ title: "Create failed", description: String(msg), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const requestBack = () => {
    if (!hasChanges) {
      navigate(-1);
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#dc2551]/10 p-2 text-[#dc2551]">
            <WarehouseIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Warehouse</h1>
            <p className="text-sm text-gray-600">
              Add a physical warehouse for raw materials, laminates, chemicals, WIP, and finished PCBs.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-xl gap-1">
                <ClipboardList className="h-3.5 w-3.5" />
                Inventory control
              </Badge>
              <Badge variant="outline" className="rounded-xl gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Audit-ready
              </Badge>
              <Badge variant="outline" className="rounded-xl gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Multi-plant support
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={requestBack} disabled={saving}>
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
          <Button className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" onClick={submit} disabled={!canSave}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Warehouse"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Main */}
        <Card className="rounded-2xl border bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Warehouse Details</CardTitle>
            <CardDescription>Basic identity, plant mapping, and operational flags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Warehouse Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(normalizeCode(e.target.value))}
                  placeholder="WH-MAIN"
                  className={cx(errors.code && "border-red-300 focus-visible:ring-red-200")}
                  autoComplete="off"
                />
                {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Main Stores"
                  className={cx(errors.name && "border-red-300 focus-visible:ring-red-200")}
                  autoComplete="off"
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Plant (optional)</Label>
                <div className="relative">
                  <select
                    className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#dc2551]/20"
                    value={plantId}
                    onChange={(e) => setPlantId(e.target.value)}
                    disabled={plantsLoading || plants.length === 0}
                  >
                    <option value="">
                      {plantsLoading ? "Loading plants..." : plants.length ? "Select plant (optional)" : "No plants configured"}
                    </option>
                    {plants.map((p) => (
                      <option key={p.id ?? p._id ?? p.code ?? p.name} value={p.id ?? p._id ?? p.code ?? ""}>
                        {p.name ?? p.code ?? "Plant"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500">Use plant mapping if you run multi-plant PCB production.</p>
              </div>

              <div className="space-y-2">
                <Label>Operational Flags</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                      isActive ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-700"
                    )}
                  >
                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDefault((v) => !v)}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                      isDefault ? "border-[#dc2551]/30 bg-[#dc2551]/10 text-[#b02045]" : "border-gray-200 bg-white text-gray-700"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    Default Warehouse
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Default warehouse will be used for new items and movements unless specified.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Address/Contact */}
        <Card className="rounded-2xl border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Location & Contact</CardTitle>
            <CardDescription>Helps picking, dispatch, and audits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Address Line 1
              </Label>
              <Input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Building / Street" />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Area / Landmark" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kochi" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Kerala" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  placeholder="682001"
                  className={cx(errors.pincode && "border-red-300 focus-visible:ring-red-200")}
                />
                {errors.pincode && <p className="text-xs text-red-600">{errors.pincode}</p>}
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Stores In-charge" />
              </div>

              <div className="mt-3 space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 9XXXXXXXXX"
                  className={cx(errors.contactPhone && "border-red-300 focus-visible:ring-red-200")}
                />
                {errors.contactPhone && <p className="text-xs text-red-600">{errors.contactPhone}</p>}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Used for internal escalation during picking/receiving and stock audits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exit confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, your warehouse draft will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(-1)}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
