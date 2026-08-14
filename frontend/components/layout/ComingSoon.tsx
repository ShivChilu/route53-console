'use client';

import React from 'react';
import AppLayout from './AppLayout';
import Breadcrumbs from './Breadcrumbs';

interface ComingSoonProps {
  featureName: string;
}

export default function ComingSoon({ featureName }: ComingSoonProps) {
  return (
    <AppLayout>
      <Breadcrumbs items={[{ name: featureName }]} />
      
      <div className="bg-white p-6 border border-gray-200 rounded-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{featureName}</h1>
        <p className="text-xs text-aws-graytext mb-6">
          This Route 53 feature is not implemented in this assignment.
        </p>
        
        <div className="border border-blue-200 bg-blue-50 p-4 rounded-sm flex items-start space-x-3 max-w-xl">
          <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Coming Soon</h4>
            <p className="text-xs text-blue-700">
              AWS Route 53 clone currently implements fully-featured Hosted Zones and DNS Records CRUD, local persistence with SQLite, and custom validation. Remaining infrastructure sections will be added in subsequent releases.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
