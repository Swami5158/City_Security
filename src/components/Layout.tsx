import React from 'react';
import { Sidebar } from './Sidebar';
import { ThreatAlertBanner } from './ThreatAlertBanner';
import { Toaster } from 'react-hot-toast';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        <ThreatAlertBanner />
        <div className="p-8 pt-16">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
};
