'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '../../components/layout/AppLayout';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { getDashboardStats } from '../../lib/api/hostedZones';
import { DashboardStats } from '../../types';
import { 
  Globe, 
  Database, 
  ArrowRight, 
  Activity, 
  PlusCircle, 
  HeartHandshake, 
  ExternalLink 
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <AppLayout>
      <Breadcrumbs items={[{ name: 'Dashboard' }]} />
      
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Route 53 Dashboard</h1>
        <p className="text-xs text-aws-graytext">
          DNS management, traffic routing, and health checking service.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="bg-white h-32 border border-gray-200 rounded-sm"></div>
          <div className="bg-white h-32 border border-gray-200 rounded-sm"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800 rounded-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hosted Zones Card */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-aws-graytext uppercase tracking-wider mb-2">Hosted zones</h3>
                  <span className="text-3xl font-bold text-gray-900">{stats?.hosted_zones_count}</span>
                </div>
                <div className="bg-blue-50 p-2 rounded-sm text-aws-blue">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
              <Link 
                href="/hosted-zones" 
                className="bg-gray-50 border-t border-gray-200 px-5 py-3 text-xs font-bold text-aws-blue hover:text-aws-hoverblue hover:bg-gray-100 flex items-center justify-between"
              >
                <span>View all hosted zones</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* DNS Records Card */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-aws-graytext uppercase tracking-wider mb-2">Total DNS records</h3>
                  <span className="text-3xl font-bold text-gray-900">{stats?.dns_records_count}</span>
                </div>
                <div className="bg-orange-50 p-2 rounded-sm text-aws-orange">
                  <Database className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 text-xs text-aws-graytext flex items-center justify-between font-medium">
                <span>Across all active domains</span>
                <span>Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-5 lg:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-150 pb-2">Quick Links</h3>
              <div className="space-y-3">
                <Link 
                  href="/hosted-zones?create=true"
                  className="flex items-center space-x-2 text-xs font-bold text-aws-blue hover:underline"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Create hosted zone</span>
                </Link>
                <Link 
                  href="/health-checks"
                  className="flex items-center space-x-2 text-xs font-bold text-aws-blue hover:underline"
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>Create health check</span>
                </Link>
                <a 
                  href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-xs font-bold text-aws-blue hover:underline"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>Route 53 Developer Guide</span>
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-5 lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-150 pb-2">Recent activity</h3>
              
              {!stats?.recent_activities || stats.recent_activities.length === 0 ? (
                <div className="text-center py-6 text-xs text-aws-graytext">
                  No recent activities recorded.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recent_activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                      <div className="bg-green-50 text-green-700 p-1.5 rounded-sm mt-0.5">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{activity.message}</p>
                        <p className="text-[10px] text-aws-graytext mt-0.5">
                          Zone ID: {activity.metadata.zone_id} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Link 
                        href={`/hosted-zones/${activity.metadata.zone_id}`}
                        className="text-[11px] font-bold text-aws-blue hover:underline shrink-0"
                      >
                        Configure
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
