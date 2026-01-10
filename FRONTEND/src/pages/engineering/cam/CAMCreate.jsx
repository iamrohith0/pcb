// src/pages/engineering/cam/CAMCreate.jsx
import {
    ArrowLeft,
    FileText,
    Loader2,
    Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import camJobsApi from "@/services/camJobs.service";
import customersApi from "@/services/sales/customers.service";
import rfqApi from "@/services/sales/rfq.service";
import salesOrdersApi from "@/services/sales/salesOrders.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function CAMCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [rfqLoading, setRfqLoading] = useState(false);
  const [salesOrderLoading, setSalesOrderLoading] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  
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

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch RFQs and Sales Orders when customer changes
  useEffect(() => {
    if (formData.customer_name) {
      fetchRfqsByCustomer(formData.customer_name);
      fetchSalesOrdersByCustomer(formData.customer_name);
    } else {
      setRfqs([]);
      setSalesOrders([]);
      setFormData((prev) => ({
        ...prev,
        rfq_no: "",
        sales_order_no: ""
      }));
    }
  }, [formData.customer_name]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await customersApi.list({ page: 1, size: 1000 });
      const customerList = response?.data?.items || response?.data || [];
      setCustomers(customerList);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchRfqsByCustomer = async (customerId) => {
    setRfqLoading(true);
    try {
      const response = await rfqApi.list({
        customerId: customerId,
        status: "approved" // Only fetch approved RFQs
      });
      const rfqList = response?.data?.items || response?.data || [];
      setRfqs(rfqList);
      
      // Auto-select the first RFQ if available
      if (rfqList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          rfq_no: rfqList[0].rfqNo
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          rfq_no: ""
        }));
      }
    } catch (err) {
      console.error("Failed to fetch RFQs:", err);
      setRfqs([]);
      setFormData((prev) => ({
        ...prev,
        rfq_no: ""
      }));
    } finally {
      setRfqLoading(false);
    }
  };

  const fetchSalesOrdersByCustomer = async (customerId) => {
    setSalesOrderLoading(true);
    try {
      const response = await salesOrdersApi.list({
        customerId: customerId,
        status: "active" // Only fetch active sales orders
      });
      const salesOrderList = response?.data?.items || response?.data || [];
      setSalesOrders(salesOrderList);
      
      // Auto-select the first sales order if available
      if (salesOrderList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          sales_order_no: salesOrderList[0].orderNo
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          sales_order_no: ""
        }));
      }
    } catch (err) {
      console.error("Failed to fetch sales orders:", err);
      setSalesOrders([]);
      setFormData((prev) => ({
        ...prev,
        sales_order_no: ""
      }));
    } finally {
      setSalesOrderLoading(false);
    }
  };

  const handleCustomerChange = (customerId) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: customerId,
      rfq_no: "", // Reset RFQ when customer changes
      sales_order_no: "" // Reset Sales Order when customer changes
    }));
    // Clear the dropdown selections
    setRfqs([]);
    setSalesOrders([]);
  };

  const handleRfqChange = (rfqNo) => {
    setFormData((prev) => ({ ...prev, rfq_no: rfqNo }));
  };

  const handleSalesOrderChange = (salesOrderNo) => {
    setFormData((prev) => ({ ...prev, sales_order_no: salesOrderNo }));
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
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Select
                    value={formData.customer_name}
                    onValueChange={handleCustomerChange}
                    disabled={customersLoading || customers.length === 0}
                    placeholder={customersLoading ? "Loading customers..." : customers.length === 0 ? "No customers available" : "Select customer"}
                  >
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.customerCode ? `(${customer.customerCode})` : ""}
                      </SelectItem>
                    ))}
                  </Select>
                  {customers.length === 0 && !customersLoading && (
                    <p className="text-xs text-gray-500">No customers found. Please create customers first.</p>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rfq_no">RFQ Number</Label>
                  <Select
                    value={formData.rfq_no}
                    onValueChange={handleRfqChange}
                    disabled={!formData.customer_name || rfqLoading}
                    placeholder={rfqLoading ? "Loading RFQs..." : "Select RFQ"}
                  >
                    {rfqs.map((rfq) => (
                      <SelectItem key={rfq.id} value={rfq.rfqNo}>
                        {rfq.rfqNo} - {rfq.specialInstructions || "Project"}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales_order_no">Sales Order Number</Label>
                  <Select
                    value={formData.sales_order_no}
                    onValueChange={handleSalesOrderChange}
                    disabled={!formData.customer_name || salesOrderLoading}
                    placeholder={salesOrderLoading ? "Loading sales orders..." : "Select sales order"}
                  >
                    {salesOrders.map((order) => (
                      <SelectItem key={order.id} value={order.orderNo}>
                        {order.orderNo} - {order.notes || "Project"}
                      </SelectItem>
                    ))}
                  </Select>
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
              <Button
                type="submit"
                className="gap-2 bg-cyan-600 hover:bg-cyan-500"
                disabled={loading || !formData.customer_name}
              >
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