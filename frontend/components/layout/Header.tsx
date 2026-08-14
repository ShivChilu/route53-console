'use client';

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Cloud, LogOut, User as UserIcon } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-aws-dark text-white h-12 px-4 flex items-center justify-between z-40 relative select-none">
      <div className="flex items-center space-x-3">
        <div className="bg-aws-orange p-1 rounded-sm flex items-center justify-center">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-sm tracking-wide">AWS Management Console</span>
        <span className="border-l border-gray-600 pl-3 text-xs text-gray-300 font-medium">Route 53</span>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <>
            <div className="flex items-center space-x-2 text-xs text-gray-200 bg-gray-800 bg-opacity-40 px-3 py-1.5 rounded-sm border border-gray-700">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="font-semibold">{user.name}</span>
              <span className="text-gray-400">({user.email})</span>
            </div>
            <button
              onClick={logout}
              className="text-xs flex items-center space-x-1.5 bg-transparent hover:bg-gray-800 hover:bg-opacity-80 px-3 py-1.5 rounded-sm border border-gray-700 text-gray-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
