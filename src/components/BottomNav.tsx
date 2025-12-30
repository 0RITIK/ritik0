import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Map, AlertTriangle, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

const navItems = [
  { path: '/', icon: Map, label: 'Navigate' },
  { path: '/report', icon: AlertTriangle, label: 'Report' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const sosActive = useAppStore((state) => state.sosActive);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors tap-highlight",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="text-2xs mt-1 font-medium relative z-10">{label}</span>
            </NavLink>
          );
        })}
        
        {/* SOS Quick Access */}
        <NavLink
          to="/sos"
          className={cn(
            "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors tap-highlight",
            sosActive ? "text-danger" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {sosActive && (
            <motion.div
              className="absolute inset-0 bg-danger/20 rounded-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          <Shield className={cn("w-5 h-5 relative z-10", sosActive && "text-danger")} />
          <span className={cn(
            "text-2xs mt-1 font-medium relative z-10",
            sosActive && "text-danger"
          )}>
            {sosActive ? 'Active' : 'SOS'}
          </span>
        </NavLink>
      </div>
    </nav>
  );
}
