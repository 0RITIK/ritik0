import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

export function RiskZoneLegend() {
  const riskZones = useAppStore((state) => state.riskZones);
  
  const highRiskCount = riskZones.filter(z => z.riskLevel === 'high').length;
  const mediumRiskCount = riskZones.filter(z => z.riskLevel === 'medium').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-24 z-20 glass rounded-xl p-3 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Risk Zones</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger" />
          <span className="text-xs">High Risk ({highRiskCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-caution" />
          <span className="text-xs">Medium ({mediumRiskCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-safe" />
          <span className="text-xs">Low Risk</span>
        </div>
      </div>
    </motion.div>
  );
}
