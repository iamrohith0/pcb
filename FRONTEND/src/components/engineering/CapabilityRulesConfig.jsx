// src/components/engineering/CapabilityRulesConfig.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Settings,
  Shield,
  Ruler,
  Target,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import dfmApi from "@/services/engineering/dfm.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function CapabilityRulesConfig({ initialRules = {}, onUpdate }) {
  const { toast } = useToast();
  
  const [rules, setRules] = useState({
    minTraceWidth: initialRules.minTraceWidth || 0.1,
    minSpace: initialRules.minSpace || 0.1,
    minAnnularRing: initialRules.minAnnularRing || 0.15,
    maxDrillAspectRatio: initialRules.maxDrillAspectRatio || 10,
    minDrillSize: initialRules.minDrillSize || 0.2,
    maxBoardSize: {
      width: initialRules.maxBoardSize?.width || 600,
      height: initialRules.maxBoardSize?.height || 600,
    },
    minBoardSize: {
      width: initialRules.minBoardSize?.width || 10,
      height: initialRules.minBoardSize?.height || 10,
    },
    ...initialRules,
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateRule = (path, value) => {
    const newRules = { ...rules };
    const keys = path.split('.');
    let current = newRules;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = parseFloat(value) || 0;
    setRules(newRules);
  };

  const saveRules = async () => {
    setIsSaving(true);
    try {
      await dfmApi.updateCapabilityRules(rules);
      toast({
        title: "Rules updated",
        description: "Capability rules saved successfully.",
      });
      onUpdate?.(rules);
    } catch (error) {
      toast({
        title: "Save failed",
        description: error?.response?.data?.message || "Could not save capability rules.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaults = {
      minTraceWidth: 0.1,
      minSpace: 0.1,
      minAnnularRing: 0.15,
      maxDrillAspectRatio: 10,
      minDrillSize: 0.2,
      maxBoardSize: { width: 600, height: 600 },
      minBoardSize: { width: 10, height: 10 },
    };
    setRules(defaults);
    toast({ title: "Reset to defaults", description: "Capability rules reset to factory defaults." });
  };

  const rulesets = [
    {
      name: "Standard",
      description: "Standard PCB manufacturing capabilities",
      rules: {
        minTraceWidth: 0.1,
        minSpace: 0.1,
        minAnnularRing: 0.15,
        maxDrillAspectRatio: 10,
        minDrillSize: 0.2,
        maxBoardSize: { width: 600, height: 600 },
        minBoardSize: { width: 10, height: 10 },
      },
    },
    {
      name: "High-Density",
      description: "Advanced HDI manufacturing capabilities",
      rules: {
        minTraceWidth: 0.075,
        minSpace: 0.075,
        minAnnularRing: 0.1,
        maxDrillAspectRatio: 12,
        minDrillSize: 0.15,
        maxBoardSize: { width: 400, height: 400 },
        minBoardSize: { width: 5, height: 5 },
      },
    },
    {
      name: "Budget",
      description: "Cost-effective manufacturing with relaxed tolerances",
      rules: {
        minTraceWidth: 0.2,
        minSpace: 0.2,
        minAnnularRing: 0.25,
        maxDrillAspectRatio: 8,
        minDrillSize: 0.3,
        maxBoardSize: { width: 800, height: 800 },
        minBoardSize: { width: 20, height: 20 },
      },
    },
  ];

  const applyRuleset = (rulesetRules) => {
    setRules(rulesetRules);
    toast({ title: "Ruleset applied", description: `${rulesetRules.name} ruleset applied.` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#dc2551]" />
          Capability Rules Configuration
        </CardTitle>
        <CardDescription>
          Configure manufacturing capability limits for DFM validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Rulesets */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Presets</Label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {rulesets.map((ruleset) => (
              <motion.div
                key={ruleset.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-3 hover:border-[#dc2551]/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{ruleset.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{ruleset.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyRuleset(ruleset.rules)}
                  >
                    Apply
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Manual Configuration */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Trace/Space Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-[#dc2551]" />
              <Label className="font-semibold">Trace and Space Rules</Label>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Min Trace Width (mm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rules.minTraceWidth}
                    onChange={(e) => updateRule('minTraceWidth', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Min Space (mm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rules.minSpace}
                    onChange={(e) => updateRule('minSpace', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Min Annular Ring (mm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rules.minAnnularRing}
                  onChange={(e) => updateRule('minAnnularRing', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Drill Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#dc2551]" />
              <Label className="font-semibold">Drill Rules</Label>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Min Drill Size (mm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rules.minDrillSize}
                    onChange={(e) => updateRule('minDrillSize', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Max Aspect Ratio</Label>
                  <Input
                    type="number"
                    step="1"
                    value={rules.maxDrillAspectRatio}
                    onChange={(e) => updateRule('maxDrillAspectRatio', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Board Size Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#dc2551]" />
              <Label className="font-semibold">Board Size Limits</Label>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Min Width (mm)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={rules.minBoardSize.width}
                    onChange={(e) => updateRule('minBoardSize.width', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Min Height (mm)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={rules.minBoardSize.height}
                    onChange={(e) => updateRule('minBoardSize.height', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Max Width (mm)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={rules.maxBoardSize.width}
                    onChange={(e) => updateRule('maxBoardSize.width', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Max Height (mm)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={rules.maxBoardSize.height}
                    onChange={(e) => updateRule('maxBoardSize.height', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validation Examples */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#dc2551]" />
              <Label className="font-semibold">Validation Examples</Label>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Trace width ≥ {rules.minTraceWidth}mm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Space between features ≥ {rules.minSpace}mm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Annular ring ≥ {rules.minAnnularRing}mm</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Drill aspect ratio ≤ {rules.maxDrillAspectRatio}:1</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Min drill size ≥ {rules.minDrillSize}mm</span>
              </div>
              <div className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-rose-600" />
                <span>Board size: {rules.minBoardSize.width}x{rules.minBoardSize.height}mm to {rules.maxBoardSize.width}x{rules.maxBoardSize.height}mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button
            className="bg-[#dc2551] hover:bg-[#dc2551]/90 gap-2"
            onClick={saveRules}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Rules
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}