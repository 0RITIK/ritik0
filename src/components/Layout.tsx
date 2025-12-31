import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      {/* Bottom nav is z-50 */}
      <BottomNav />
    </div>
  );
}
