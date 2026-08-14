'use client';

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from './Header';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-aws-bg text-aws-text">
        <Loader2 className="w-8 h-8 text-aws-orange animate-spin mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider">Loading AWS Management Console...</span>
      </div>
    );
  }

  if (!user) {
    return null; // redirecting to login will happen in useAuth
  }

  return (
    <div className="min-h-screen bg-aws-bg text-aws-text flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-x-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
