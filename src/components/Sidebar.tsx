import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Tablet, 
  Hexagon, 
  LayoutGrid, 
  Radio, 
  Calculator, 
  Award, 
  Sprout, 
  Map, 
  Mic, 
  Video, 
  Settings, 
  LogIn, 
  LogOut,
  Layers,
  BarChart3,
  Droplets,
  ChevronRight,
  Globe
} from 'lucide-react';
import { useNavigation, NavigationTab } from '../context/NavigationContext';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MOCK_HARDWARE_NODES, currentUser } from '../data';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isFarmActive, navItems } = useNavigation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const getNavIcon = (id: NavigationTab) => {
    switch (id) {
      case 'FEED': return <Users className="w-4 h-4 text-emerald-400" />;
      case 'DASHBOARD': return <LayoutGrid className="w-4 h-4 text-emerald-400" />;
      case 'KIOSK': return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'FARM_COMMAND': return <Tablet className="w-4 h-4 text-emerald-400" />;
      case 'MAP': return <Droplets className="w-4 h-4 text-emerald-400" />;
      case 'ANALYTICS': return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      case 'TOUCHSCREEN': return <Hexagon className="w-4 h-4 text-orange-400" />;
      case 'MARKET_NEWS': return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'ECOCREDITX': return <Award className="w-4 h-4 text-emerald-400" />;
      case 'VCM': return <Sprout className="w-4 h-4 text-emerald-400" />;
      case 'ONBOARDING': return <Calculator className="w-4 h-4 text-emerald-400" />;
      case 'ASSET_MAP': return <Map className="w-4 h-4 text-emerald-400" />;
      case 'VOICE_ASSISTANT': return <Mic className="w-4 h-4 text-emerald-400" />;
      case 'VIDEO_GEN': return <Video className="w-4 h-4 text-emerald-400" />;
      case 'SETTINGS': return <Settings className="w-4 h-4 text-emerald-400" />;
      default: return <Layers className="w-4 h-4 text-emerald-400" />;
    }
  };

  const navCategories = [
    {
      name: 'Primary Operations',
      items: navItems.filter(i => i.group === 'primary')
    },
    {
      name: 'Edge & Field Command',
      items: navItems.filter(i => i.group === 'field')
    },
    {
      name: 'Environmental dMRV & Finance',
      items: navItems.filter(i => i.group === 'compliance')
    },
    {
      name: 'Intelligence & Diagnostics',
      items: navItems.filter(i => i.group === 'tools')
    }
  ];

  return (
    <aside className="col-span-3 flex flex-col gap-4 overflow-hidden hidden lg:flex">
      <div className="flex-1 glass p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Global Infrastructure</h2>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            NEXUS-V2
          </span>
        </div>

        {/* Dynamic Navigation Hierarchy triggered via useNavigation context */}
        <nav className="flex-1 space-y-3 mt-1 overflow-y-auto custom-scrollbar pr-1">
          {navCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-0.5">
                {cat.name}
              </div>
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const isOrange = item.id === 'TOUCHSCREEN';

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id.toLowerCase().replace(/_/g, '-')}`}
                      onClick={() => setActiveTab(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all font-medium text-xs cursor-pointer group ${
                        isActive
                          ? isOrange
                            ? 'bg-orange-500/20 border-l-2 border-orange-400 text-orange-200 font-bold shadow-sm'
                            : 'bg-emerald-500/20 border-l-2 border-emerald-400 text-emerald-200 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {getNavIcon(item.id)}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isOrange ? 'bg-orange-400' : 'bg-emerald-400'} animate-pulse`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Global Node Fleet Quick Switcher */}
        <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-col max-h-44">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center justify-between">
            <span>Global Node Fleet</span>
            <button
              onClick={() => setActiveTab('ASSET_MAP')}
              className="text-emerald-400 hover:text-emerald-300 font-mono text-[9px] flex items-center gap-0.5 cursor-pointer"
            >
              <span>{MOCK_HARDWARE_NODES.length} Active</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1 text-xs telemetry-font text-slate-400 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {MOCK_HARDWARE_NODES.map((node) => (
              <button
                key={node.id}
                id={`sidebar-node-${node.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setActiveTab('ASSET_MAP')}
                className="w-full flex items-center justify-between p-1.5 rounded hover:bg-slate-900/80 transition-colors group cursor-pointer text-left"
                title={`Inspect ${node.name || node.id} (${node.country}) on Hardware Asset Map`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`dot ${
                    node.status === 'ONLINE' ? 'bg-emerald-500' :
                    node.status === 'WARNING' ? 'bg-amber-500 animate-pulse' :
                    'bg-slate-600'
                  }`} />
                  <span className="font-mono text-[11px] text-slate-300 group-hover:text-emerald-300 truncate">
                    {node.id}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 uppercase font-sans shrink-0 ml-1 group-hover:text-slate-300">
                  {node.country?.slice(0, 3).toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-4 flex flex-col gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL || currentUser.avatarUrl} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150';
              }}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover" 
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-200 truncate">{user.displayName || 'Unknown User'}</span>
              <span className="text-[10px] text-slate-500 truncate uppercase">Principal Engineer</span>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs uppercase tracking-widest font-bold rounded border border-emerald-500/50 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            System Authentication
          </button>
        )}
      </div>
    </aside>
  );
};
