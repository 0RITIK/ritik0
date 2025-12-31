import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';

export function RiskZoneLegend() {
  const [isExpanded, setIsExpanded] = useState(true);
  const riskZones = useAppStore((state) => state.riskZones);
  
  const highRiskCount = riskZones.filter(z => z.riskLevel === 'high').length;
  const mediumRiskCount = riskZones.filter(z => z.riskLevel === 'medium').length;
  const lowRiskCount = riskZones.filter(z => z.riskLevel === 'low').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-4 top-28 z-30"
    >
      {/* Solid background card */}
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-2 p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Risk Zones</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-danger/10">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span className="text-xs text-foreground font-medium">High Risk</span>
                  <span className="text-xs text-danger font-bold ml-auto">{highRiskCount}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-caution/10">
                  <div className="w-3 h-3 rounded-full bg-caution" />
                  <span className="text-xs text-foreground font-medium">Medium</span>
                  <span className="text-xs text-caution font-bold ml-auto">{mediumRiskCount}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-safe/10">
                  <div className="w-3 h-3 rounded-full bg-safe" />
                  <span className="text-xs text-foreground font-medium">Low Risk</span>
                  <span className="text-xs text-safe font-bold ml-auto">{lowRiskCount}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
