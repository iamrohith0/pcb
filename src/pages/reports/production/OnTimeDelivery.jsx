
// src/pages/reports/production/OnTimeDelivery.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Users,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart,
  Download,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function toISODate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatINR(n) {
