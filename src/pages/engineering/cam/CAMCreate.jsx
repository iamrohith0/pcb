// src/pages/engineering/cam/CAMCreate.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Layers,
  Loader2,
  Plus,
  Save,
  Tag,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import camJobsApi from "@/services/camJobs.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function CAMCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    board_name: "",
    revision: "A",
    layers: 2,
    customer_name: "",
    rfq_no: "",
    sales_order_no: "",
    priority: "Normal",
    due_date: "",
    notes: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        layers: Number(formData.layers),
        priority: formData.priority,
      };

      const response = await camJobsApi.create(payload);
      const createdId = response?.data?.id || response?.data?._id;

      toast({
        title: "CAM Job Created",
        description: `CAM job ${response?.data?.cam_no || "created"} successfully.`,
      });

      // Navigate to the new CAM job details
      if (createdId) {
        navigate(`/dashboard/engineering/cam/${createdId}`);
      } else {
        navigate("/dashboard/engineering/cam");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create CAM job.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/dashboard/engineering/cam");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create CAM Job</h1>
          <p className="text-sm text-gray-500">
            Set up a new CAM job for PCB manufacturing preparation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CAM Job Details</CardTitle>
          <CardDescription>Fill in the required information to create a new CAM job</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="board_name">Board Name *</Label>
                  <Input
                    id="board_name"
                    value={formData.board_name}
                    onChange={(e) => handleInputChange("board_name", e.target.value)}
                    placeholder="e.g., Main_Controller_Board"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revision">Revision</Label>
                  <Input
                    id="revision"
                    value={formData.revision}
                    onChange={(e) => handleInputChange("revision", e.target.value)}
                    placeholder="A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layers">Layers</Label>
                  <select
                    id="layers"
                    value={formData.layers}
                    onChange={(e) => handleInputChange("layers", e.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  >
                    <option value={1}>1 Layer</option>
                    <option value={2}>2 Layers</option>
                    <option value={4}>4 Layers</option>
                    <option value={6}>6 Layers</option>
                    <option value={8}>8 Layers</option>
                    <option value={10}>10 Layers</option>
                    <option value={12}>12 Layers</option>
                    <option value={14}>14 Layers</option>
                    <option value={16}>16 Layers</option>
                    <option value={18}>18 Layers</option>
                    <option value={20}>20 Layers</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange("customer_name", e.target.value)}
                    placeholder="Customer Company Name"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rfq_no">RFQ Number</Label>
                  <Input
                    id="rfq_no"
                    value={formData.rfq_no}
                    onChange={(e) => handleInputChange("rfq_no", e.target.value)}
                    placeholder="RFQ-00001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales_order_no">Sales Order Number</Label>
                  <Input
                    id="sales_order_no"
                    value={formData.sales_order_no}
                    onChange={(e) => handleInputChange("sales_order_no", e.target.value)}
                    placeholder="SO-00001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange("priority", e.target.value)}
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any special instructions or notes for this CAM job..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={goBack}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2 bg-[#dc2551] hover:bg-[#b02045]" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create CAM Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900">CAM Job Creation</p>
              <p className="mt-1 text-sm text-gray-600">
                After creating the CAM job, you can upload Gerber files, set up panelization, 
                and configure outputs. The job will be ready for DFM review once all inputs are complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}