import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SOSFloatingButton } from './SOSFloatingButton';

export function Layout() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <SOSFloatingButton />
      <BottomNav />
    </div>
  );
}
