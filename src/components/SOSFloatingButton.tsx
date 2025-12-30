import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

export function SOSFloatingButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const sosActive = useAppStore((state) => state.sosActive);
  
  // Don't show on SOS page
  if (location.pathname === '/sos') return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/sos')}
        className={cn(
          "fixed right-4 bottom-24 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
          "bg-gradient-danger text-danger-foreground",
          sosActive && "pulse-danger"
        )}
      >
        {sosActive ? (
          <>
            {/* Pulsing rings when active */}
            <motion.div
              className="absolute inset-0 rounded-full bg-danger/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-danger/20"
              animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
          </>
        ) : null}
        <Shield className="w-6 h-6 relative z-10" />
      </motion.button>
    </AnimatePresence>
  );
}
