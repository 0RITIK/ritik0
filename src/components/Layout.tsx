import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/';

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      <main className={isMapPage ? "flex-1" : "flex-1 pb-20"}>
        <Outlet />
      </main>
      {/* Bottom nav is z-50 */}
      <BottomNav />
    </div>
  );
}
