// src/pages/traceability/lot-genealogy/LotGenealogyTree.jsx
import {
    ArrowLeft,
    BadgeCheck,
    ChevronDown,
    ChevronRight,
    CircleDot,
    ExternalLink,
    GitBranch,
    Loader2,
    Package,
    RefreshCcw,
    Search,
    ShieldCheck,
    Workflow,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import api from "@/lib/axios";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function safeText(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

/**
 * Expected API (adjust to your backend):
 * GET /traceability/genealogy/:id?include=tree
 * -> {
 *   data: {
 *     root: { id, type, code, status, product_name, revision, work_order_no, created_at, last_event_at },
 *     tree: {
 *       upstream: [ Node ],
 *       downstream: [ Node ]
 *     }
 *   }
 *
 * Node shape:
 * {
 *   id: string|number,
 *   type: "lot"|"batch"|"serial"|"material_lot"|"work_order"|"process_step"|"inspection"|"shipment"|string,
 *   code: string,
 *   status?: string,
 *   title?: string,          // optional label
 *   subtitle?: string,       // optional info
 *   created_at?: string,
 *   event_at?: string,
 *   meta?: { key: value },
 *   children?: [ Node ]
 * }
 *
 * Notes:
 * - This component is UI-first and robust to missing fields.
 * - If your API returns a flat list of edges, you can convert to tree in backend or extend this file later.
 */

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    released: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    ok: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    wip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    hold: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    quarantined: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    fail: "bg-red-50 text-red-700 ring-1 ring-red-200",
    rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
    scrapped: "bg-red-50 text-red-700 ring-1 ring-red-200",
    closed: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>
      {status || "—"}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = (type || "").toLowerCase();
  const map = {
    lot: "bg-[#dc2551]/10 text-[#dc2551] ring-1 ring-[#dc2551]/20",
    batch: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    serial: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    material_lot: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    work_order: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    process_step: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    inspection: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    shipment: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  };
  const cls = map[t] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>
      {type || "unknown"}
    </span>
  );
}

function NodeIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (t === "inspection") return <BadgeCheck className="h-4 w-4" />;
  if (t === "shipment") return <Package className="h-4 w-4" />;
  if (t === "work_order") return <Workflow className="h-4 w-4" />;
  if (t === "material_lot") return <CircleDot className="h-4 w-4" />;
  return <GitBranch className="h-4 w-4" />;
}

function matchesQuery(node, q) {
  if (!q) return true;
  const hay = [
    node?.code,
    node?.type,
    node?.title,
    node?.subtitle,
    node?.status,
    ...(node?.meta ? Object.values(node.meta).map((v) => String(v)) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hay.includes(q.toLowerCase());
}

function filterTree(nodes, q) {
  if (!Array.isArray(nodes)) return [];
  if (!q) return nodes;

  const walk = (n) => {
    const kids = Array.isArray(n.children) ? n.children.map(walk).filter(Boolean) : [];
    const selfMatch = matchesQuery(n, q);
    if (selfMatch || kids.length) {
      return { ...n, children: kids };
    }
    return null;
  };

  return nodes.map(walk).filter(Boolean);
}

function countNodes(nodes) {
  if (!Array.isArray(nodes)) return 0;
  let total = 0;
  const walk = (n) => {
    total += 1;
    (n.children || []).forEach(walk);
  };
  nodes.forEach(walk);
  return total;
}

function TreeNode({
  node,
  depth = 0,
  defaultOpen = depth < 2,
  onOpenRecord,
  highlightQuery,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const hasChildren = Array.isArray(node?.children) && node.children.length > 0;

  const indent = Math.min(depth, 8); // clamp
  const leftPad = 12 + indent * 18;

  // simple highlight for code field
  const code = safeText(node?.code);
  const q = (highlightQuery || "").trim();
  const codeParts = useMemo(() => {
    if (!q) return [code];
    const idx = code.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return [code];
    return [code.slice(0, idx), code.slice(idx, idx + q.length), code.slice(idx + q.length)];
  }, [code, q]);

  return (
    <div className="relative">
      {/* connector line */}
      {depth > 0 && (
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-200"
          style={{ left: leftPad - 10 }}
          aria-hidden="true"
        />
      )}

      <div
        className={cx(
          "group flex items-start gap-3 rounded-xl border bg-white px-3 py-3 transition",
          "hover:bg-gray-50"
        )}
        style={{ marginLeft: depth ? leftPad - 12 : 0 }}
      >
        <div className="mt-0.5 flex items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label={open ? "Collapse node" : "Expand node"}
            >
              {open ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
            </button>
          ) : (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400">
              <ChevronRight className="h-4 w-4 opacity-30" />
            </span>
          )}

          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
            <NodeIcon type={node?.type} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={node?.type} />
            <StatusPill status={node?.status} />

            <div className="text-sm font-semibold text-gray-900 min-w-0">
              {q && codeParts.length === 3 ? (
                <span className="break-all">
                  {codeParts[0]}
                  <span className="rounded bg-yellow-100 px-1 py-0.5">{codeParts[1]}</span>
                  {codeParts[2]}
                </span>
              ) : (
                <span className="break-all">{code}</span>
              )}
            </div>
          </div>

          {(node?.title || node?.subtitle) && (
            <div className="mt-1 text-xs text-gray-600">
              <span className="font-semibold text-gray-700">{node?.title ? safeText(node.title) : ""}</span>
              {node?.title && node?.subtitle ? <span className="text-gray-400"> • </span> : null}
              {node?.subtitle ? <span>{safeText(node.subtitle)}</span> : null}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            {node?.event_at && (
              <Badge variant="secondary">Event: {fmtDate(node.event_at)}</Badge>
            )}
            {node?.created_at && (
              <Badge variant="secondary">Created: {fmtDate(node.created_at)}</Badge>
            )}
            {node?.meta?.machine && <Badge variant="secondary">Machine: {safeText(node.meta.machine)}</Badge>}
            {node?.meta?.operator && <Badge variant="secondary">Operator: {safeText(node.meta.operator)}</Badge>}
            {node?.meta?.step && <Badge variant="secondary">Step: {safeText(node.meta.step)}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onOpenRecord?.(node)}
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        </div>
      </div>

      {hasChildren && open && (
        <div className="mt-2 space-y-2">
          {node.children.map((child, idx) => (
            <TreeNode
              key={child?.id ?? `${node?.id}-c-${idx}`}
              node={child}
              depth={depth + 1}
              defaultOpen={defaultOpen}
              onOpenRecord={onOpenRecord}
              highlightQuery={highlightQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LotGenealogyTree() {
  const { id } = useParams(); // expects route: /traceability/lot-genealogy/:id
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [root, setRoot] = useState(null);
  const [upstream, setUpstream] = useState([]);
  const [downstream, setDownstream] = useState([]);

  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("both"); // upstream | downstream | both
  const [expandAll, setExpandAll] = useState(false);

  const fetchTree = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/traceability/genealogy/${id}`, {
        params: { include: "tree" },
      });

      const data = res?.data?.data ?? res?.data;

      setRoot(data?.root ?? data?.record ?? null);
      setUpstream(Array.isArray(data?.tree?.upstream) ? data.tree.upstream : Array.isArray(data?.upstream) ? data.upstream : []);
      setDownstream(Array.isArray(data?.tree?.downstream) ? data.tree.downstream : Array.isArray(data?.downstream) ? data.downstream : []);

      toast({
        title: "Genealogy loaded",
        description: "Upstream and downstream tree data is ready.",
      });
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load genealogy.";
      setError(msg);
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredUpstream = useMemo(() => filterTree(upstream, q), [upstream, q]);
  const filteredDownstream = useMemo(() => filterTree(downstream, q), [downstream, q]);

  const counts = useMemo(() => {
    return {
      upstream: countNodes(filteredUpstream),
      downstream: countNodes(filteredDownstream),
      total: countNodes(filteredUpstream) + countNodes(filteredDownstream),
    };
  }, [filteredUpstream, filteredDownstream]);

  const openRecord = (node) => {
    // Route mapping suggestions (adjust to your app):
    // - Lot/Batch/Serial detail pages in traceability module
    const type = (node?.type || "").toLowerCase();
    const code = node?.code;

    // If you already have concrete routes:
    // navigate(`/traceability/${type}/${node.id}`)
    // For now, prefer opening search with prefilled query so it always works:
    if (code) navigate(`/traceability/lot-genealogy/search?q=${encodeURIComponent(code)}`);
    else toast({ title: "No code", description: "This node has no code to open.", variant: "destructive" });
  };

  const Header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lot Genealogy Tree</h1>
            <p className="text-sm text-gray-600">
              Full trace for materials → process → inspections → shipment (PCBxpress).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Audit-ready genealogy
          </span>
          <span className="text-gray-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Workflow className="h-3.5 w-3.5" />
            Upstream & downstream view
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/traceability/lot-genealogy/search">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </Link>

        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            setExpandAll((s) => !s);
          }}
        >
          <GitBranch className="h-4 w-4" />
          {expandAll ? "Collapse default" : "Expand more"}
        </Button>

        <Button variant="outline" className="gap-2" onClick={fetchTree} disabled={loading}>
          <RefreshCcw className={cx("h-4 w-4", loading ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {Header}

      {/* Root summary */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading genealogy tree…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Unable to load tree</p>
                <p className="mt-1 text-xs text-red-700/90">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-gray-900 break-all">{safeText(root?.code)}</span>
                  <TypeBadge type={root?.type} />
                  <StatusPill status={root?.status} />
                </div>
                <p className="text-sm text-gray-600">
                  {safeText(root?.product_name || root?.product?.name)} {root?.revision ? `(Rev ${root.revision})` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <Badge variant="secondary">WO: {safeText(root?.work_order_no || root?.workOrder?.number)}</Badge>
                  <Badge variant="secondary">Created: {fmtDate(root?.created_at || root?.createdAt)}</Badge>
                  <Badge variant="secondary">Last event: {fmtDate(root?.last_event_at || root?.lastEventAt)}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <div className="font-semibold">Nodes</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span>Up: {counts.upstream}</span>
                    <span className="text-gray-300">•</span>
                    <span>Down: {counts.downstream}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold">Total: {counts.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search inside tree */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter nodes (code, type, status, meta like machine/operator/step)…"
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "both", label: "Both" },
                  { key: "upstream", label: `Upstream (${counts.upstream})` },
                  { key: "downstream", label: `Downstream (${counts.downstream})` },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={cx(
                      "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                      activeTab === t.key ? "border-[#dc2551] bg-[#dc2551]/10 text-[#dc2551]" : "hover:bg-gray-50"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-emerald-50 p-3 text-xs text-emerald-800">
              <span className="font-semibold">PCB traceability:</span> ensure laminate/copper/prepreg lots, process steps
              (drill, PTH, etch, soldermask, silkscreen, finish), AOI/eTest, and dispatch are linked under one genealogy.
            </div>
          </div>
        )}
      </Card>

      {/* Trees */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {(activeTab === "both" || activeTab === "upstream") && (
            <Card className="p-4 lg:col-span-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upstream</p>
                  <p className="text-xs text-gray-500">Materials, suppliers, and inputs leading to this record.</p>
                </div>
                <Badge className="bg-gray-100 text-gray-700">Nodes: {counts.upstream}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {filteredUpstream.length === 0 ? (
                  <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
                    No upstream links found (or filtered out).
                  </div>
                ) : (
                  filteredUpstream.map((n, idx) => (
                    <TreeNode
                      key={n?.id ?? `up-${idx}`}
                      node={n}
                      defaultOpen={expandAll}
                      onOpenRecord={openRecord}
                      highlightQuery={q}
                    />
                  ))
                )}
              </div>
            </Card>
          )}

          {(activeTab === "both" || activeTab === "downstream") && (
            <Card className="p-4 lg:col-span-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Downstream</p>
                  <p className="text-xs text-gray-500">Where this lot/batch/serial was used and shipped.</p>
                </div>
                <Badge className="bg-gray-100 text-gray-700">Nodes: {counts.downstream}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {filteredDownstream.length === 0 ? (
                  <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
                    No downstream links found (or filtered out).
                  </div>
                ) : (
                  filteredDownstream.map((n, idx) => (
                    <TreeNode
                      key={n?.id ?? `down-${idx}`}
                      node={n}
                      defaultOpen={expandAll}
                      onOpenRecord={openRecord}
                      highlightQuery={q}
                    />
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Footer quick actions */}
      {!loading && !error && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-500" />
                Export-ready genealogy for audits, complaints, and recalls.
              </div>
              <div className="mt-1 flex items-center gap-2 text-gray-500">
                <Package className="h-4 w-4 text-gray-400" />
                Tip: Ensure shipment IDs link back to eTest/AOI pass results.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/traceability/recall">
                <Button variant="outline" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Recall
                </Button>
              </Link>

              <Link to="/traceability/lot-genealogy/search">
                <Button className="gap-2 bg-cyan-600 hover:bg-cyan-500">
                  <Search className="h-4 w-4" />
                  New Search
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
