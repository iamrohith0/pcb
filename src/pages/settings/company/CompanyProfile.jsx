// src/pages/settings/company/CompanyProfile.jsx
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
    Building2,
    Factory,
    FileText,
    Globe,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Save,
    ShieldCheck,
} from "lucide-react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeStr(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeObj(v) {
  return v && typeof v === "object" ? v : {};
}

export default function CompanyProfile() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile
  const [companyName, setCompanyName] = useState("PCB Xpress");
  const [legalName, setLegalName] = useState("");
  const [tagline, setTagline] = useState("PCB Manufacturing ERP");

  // Contacts
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");

  // Compliance (typical for PCB suppliers)
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [msme, setMsme] = useState("");
  const [iec, setIec] = useState("");
  const [cin, setCin] = useState("");

  // Plant
  const [plantCode, setPlantCode] = useState("PLT-01");
  const [plantName, setPlantName] = useState("Main Plant");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Notes (used in quotations/invoices/CoC header/footer)
  const [notes, setNotes] = useState(
    "PCB Xpress is committed to quality and traceability for all shipments."
  );

  const isDirty = useMemo(() => true, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Expected:
      // GET /settings/company-profile -> { data: { ...fields } }
      // OR GET /settings/company -> { ... }
      const res = await api.get("/settings/company-profile");
      const data = res?.data?.data ?? res?.data ?? {};

      setCompanyName(safeStr(data.company_name, safeStr(data.companyName, "PCB Xpress")));
      setLegalName(safeStr(data.legal_name, safeStr(data.legalName, "")));
      setTagline(safeStr(data.tagline, safeStr(data.company_tagline, "PCB Manufacturing ERP")));

      setPhone(safeStr(data.phone, ""));
      setEmail(safeStr(data.email, ""));
      setWebsite(safeStr(data.website, ""));

      const addr = safeObj(data.address);
      setAddressLine1(safeStr(addr.line1, safeStr(data.address_line1, "")));
      setAddressLine2(safeStr(addr.line2, safeStr(data.address_line2, "")));
      setCity(safeStr(addr.city, safeStr(data.city, "")));
      setStateName(safeStr(addr.state, safeStr(data.state, "")));
      setCountry(safeStr(addr.country, safeStr(data.country, "India")));
      setPincode(safeStr(addr.pincode, safeStr(data.pincode, "")));

      const comp = safeObj(data.compliance);
      setGstin(safeStr(comp.gstin, safeStr(data.gstin, "")));
      setPan(safeStr(comp.pan, safeStr(data.pan, "")));
      setMsme(safeStr(comp.msme, safeStr(data.msme, "")));
      setIec(safeStr(comp.iec, safeStr(data.iec, "")));
      setCin(safeStr(comp.cin, safeStr(data.cin, "")));

      const plant = safeObj(data.plant);
      setPlantCode(safeStr(plant.code, safeStr(data.plant_code, "PLT-01")));
      setPlantName(safeStr(plant.name, safeStr(data.plant_name, "Main Plant")));
      setDefaultCurrency(safeStr(data.default_currency, "INR"));
      setTimezone(safeStr(data.timezone, "Asia/Kolkata"));

      setNotes(safeStr(data.notes, ""));
    } catch (err) {
      console.warn("Company profile fetch failed:", err);
      toast({
        title: "Failed to load company profile",
        description: err?.response?.data?.message || "Using defaults for now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        company_name: companyName.trim(),
        legal_name: legalName.trim(),
        tagline: tagline.trim(),

        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),

        address: {
          line1: addressLine1.trim(),
          line2: addressLine2.trim(),
          city: city.trim(),
          state: stateName.trim(),
          country: country.trim(),
          pincode: pincode.trim(),
        },

        compliance: {
          gstin: gstin.trim(),
          pan: pan.trim(),
          msme: msme.trim(),
          iec: iec.trim(),
          cin: cin.trim(),
        },

        plant: {
          code: plantCode.trim(),
          name: plantName.trim(),
        },

        default_currency: defaultCurrency.trim(),
        timezone: timezone.trim(),

        notes: notes.trim(),
      };

      // Recommended:
      // PUT/PATCH /settings/company-profile
      await api.put("/settings/company-profile", payload);

      toast({
        title: "Company profile saved",
        description: "Company details updated successfully.",
      });
    } catch (err) {
      console.warn("Company profile save failed:", err);
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading company profile...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dc2551]/10 text-[#dc2551]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-sm text-gray-500">
              Maintain your company identity for quotations, invoices, CoC/CoA, and dispatch documents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchProfile} disabled={saving}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Basics */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-900">Basic Details</p>
          </div>
          <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
            Master data
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="PCB Xpress" />
          </div>

          <div className="space-y-2">
            <Label>Legal Name</Label>
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="PCB Xpress Pvt Ltd" />
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="PCB Manufacturing ERP" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9xxxx xxxxx" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@pcbxpress.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://pcbxpress.com" />
            </div>
          </div>
        </div>
      </Card>

      {/* Address */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">Address</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Building / Street" />
          </div>

          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Area / Landmark (optional)" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kochi" />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="Kerala" />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="6820xx" />
          </div>
        </div>
      </Card>

      {/* Compliance */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-900">Compliance & Registration</p>
          </div>
          <Badge variant="outline" className="border-gray-200 bg-white text-gray-700">
            GST / Export
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label>GSTIN</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>PAN</Label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" value={pan} onChange={(e) => setPan(e.target.value)} placeholder="AAAAA0000A" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>MSME/Udyam</Label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" value={msme} onChange={(e) => setMsme(e.target.value)} placeholder="UDYAM-XX-00-0000000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>IEC (Export)</Label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" value={iec} onChange={(e) => setIec(e.target.value)} placeholder="0000000000" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>CIN (optional)</Label>
            <Input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="U12345XX2020PTC000000" />
            <p className="text-xs text-gray-500">Only applicable for registered companies.</p>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>Notes (for documents)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shown on quotations/invoices/CoC footer..."
              className="min-h-[96px]"
            />
          </div>
        </div>
      </Card>

      {/* Plant Settings */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">Plant Defaults</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Plant Code</Label>
            <Input value={plantCode} onChange={(e) => setPlantCode(e.target.value)} placeholder="PLT-01" />
          </div>

          <div className="space-y-2">
            <Label>Plant Name</Label>
            <Input value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="Main Plant" />
          </div>

          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Input value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} placeholder="INR" />
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Kolkata" />
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-gray-50 p-4">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 text-gray-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Where this is used</p>
              <p className="mt-1 text-xs text-gray-600">
                • Quotation/Invoice headers • Dispatch labels • CoC / RoHS / REACH documents • Reports & exports
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
