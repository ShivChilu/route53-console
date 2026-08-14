'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Globe, 
  Map, 
  Activity, 
  Shuffle, 
  User, 
  Settings 
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();

  const menuGroups: MenuGroup[] = [
    {
      title: "Route 53",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      title: "DNS management",
      items: [
        { name: "Hosted zones", href: "/hosted-zones", icon: <Globe className="w-4 h-4" /> }
      ]
    },
    {
      title: "Traffic management",
      items: [
        { name: "Traffic policies", href: "/traffic-policies", icon: <Map className="w-4 h-4" />, comingSoon: true },
        { name: "Health checks", href: "/health-checks", icon: <Activity className="w-4 h-4" />, comingSoon: true }
      ]
    },
    {
      title: "Resolver",
      items: [
        { name: "Resolver query log", href: "/resolver", icon: <Shuffle className="w-4 h-4" />, comingSoon: true }
      ]
    },
    {
      title: "Settings",
      items: [
        { name: "Profiles", href: "/profiles", icon: <User className="w-4 h-4" />, comingSoon: true }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-3rem)] text-sm select-none flex flex-col py-4 shrink-0">
      <div className="px-4 mb-4">
        <h2 className="font-bold text-base text-gray-800 tracking-tight">Route 53</h2>
      </div>

      <nav className="flex-1 space-y-4">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.title && (
              <h3 className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            
            <ul className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={iIdx}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-l-4 transition-colors ${
                        isActive 
                          ? 'bg-gray-50 text-aws-blue font-semibold border-aws-blue' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={isActive ? 'text-aws-blue' : 'text-gray-500'}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      {item.comingSoon && (
                        <span className="text-[10px] font-bold bg-gray-150 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
