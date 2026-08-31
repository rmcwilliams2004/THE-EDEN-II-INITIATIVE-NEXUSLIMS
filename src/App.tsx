import React, { useState, useEffect } from 'react';
import { MOCK_FEED, currentUser } from './data';
import { FeedPost } from './components/FeedPost';
import { HardwareStatusWidget } from './components/HardwareStatusWidget';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { VcmLedger } from './components/VcmLedger';
import { HardwareAssetMap } from './components/HardwareAssetMap';
import { VoiceAssistant } from './components/VoiceAssistant';
import { VideoGenerator } from './components/VideoGenerator';
import { AudioTranscription } from './components/AudioTranscription';
import { MapsInsight } from './components/MapsInsight';
import { Hexagon, LayoutGrid, Users, Video, Settings, Sprout, Bell, Map, Mic, LogIn, LogOut } from 'lucide-react';
import { io } from 'socket.io-client';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <aside className="col-span-3 flex flex-col gap-4 overflow-hidden hidden lg:flex">
      <div className="flex-1 glass p-4 flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Global Infrastructure</h2>
        <nav className="flex-1 space-y-2 mt-2">
          <button 
            onClick={() => setActiveTab('FEED')}
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors font-medium text-sm ${activeTab === 'FEED' ? 'bg-slate-900/50 border-l-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
            <Users className="w-4 h-4" />
            Sister-Link Feed
          </button>
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors font-medium text-sm ${activeTab === 'DASHBOARD' ? 'bg-slate-900/50 border-l-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
            <LayoutGrid className="w-4 h-4" />
            Live Telemetry
          </button>
          <button 
            onClick={() => setActiveTab('VCM')}
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors font-medium text-sm ${activeTab === 'VCM' ? 'bg-slate-900/50 border-l-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
            <Sprout className="w-4 h-4" />
            Carbon Credits (VCM)
          </button>
          <button 
            onClick={() => setActiveTab('ASSET_MAP')}
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors font-medium text-sm ${activeTab === 'ASSET_MAP' ? 'bg-slate-900/50 border-l-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
            <Map className="w-4 h-4" />
            Hardware Asset Map
          </button>
          <button 
            onClick={() => setActiveTab('VOICE_ASSISTANT')}
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors font-medium text-sm ${activeTab === 'VOICE_ASSISTANT' ? 'bg-slate-900/50 border-l-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
            <Mic className="w-4 h-4" />
            Universal Translator
          </button>
          <button 
            onClick={() => setActiveTab('VIDEO_GEN')}
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors font-medium text-sm ${activeTab === 'VIDEO_GEN' ? 'bg-slate-900/50 border-l-2 border-emerald-500 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
            <Video className="w-4 h-4" />
            Neural Video Gen
          </button>
        </nav>

        <div className="mt-4 flex-1 overflow-hidden">
          <div className="text-[10px] text-slate-500 uppercase mb-2">Node Tree (Edge Compute)</div>
          <div className="space-y-2 text-sm telemetry-font text-slate-400">
            <div className="flex items-center gap-2"><span className="dot bg-emerald-500"></span>US-CAL-01-EDEN</div>
            <div className="flex items-center gap-2"><span className="dot bg-emerald-500"></span>KE-NBI-04-COOP</div>
            <div className="flex items-center gap-2"><span className="dot bg-amber-500 animate-pulse"></span>ID-JKT-12-EDEN</div>
            <div className="flex items-center gap-2 opacity-50"><span className="dot bg-slate-600"></span>BR-SP-09-COOP</div>
          </div>
        </div>
      </div>

      <div className="glass p-4 flex flex-col gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <img src={user.photoURL || currentUser.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-200 truncate">{user.displayName || 'Unknown User'}</span>
              <span className="text-[10px] text-slate-500 truncate uppercase">Principal Engineer</span>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs uppercase tracking-widest font-bold rounded border border-emerald-500/50 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            System Authentication
          </button>
        )}
      </div>
    </aside>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('FEED');
  const [liveData, setLiveData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch of telemetry history
    fetch('/api/telemetry/history')
      .then(res => res.json())
      .then(data => setLiveData(data));

    // Connect WebSocket
    const socket = io(window.location.origin);
    
    socket.on('telemetry_update', (data) => {
      setLiveData(prev => {
        const newData = [...prev, data];
        if (newData.length > 100) newData.shift();
        return newData;
      });
    });

    socket.on('maintenance_alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5)); // keep last 5 alerts
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="h-screen w-screen p-4 gap-4 flex flex-col overflow-hidden bg-[#05070a] text-slate-200 font-sans selection:bg-emerald-500/30">
      <header className="h-16 flex items-center justify-between px-6 glass shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            NX
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            NEXUS<span className="text-emerald-400">LIMS</span>
            <span className="text-slate-500 font-normal text-sm ml-2 hidden sm:inline">/ PRINCIPAL_ARCHITECT_CONSOLE</span>
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Satellite Connectivity</span>
            <div className="flex items-center gap-1">
              <div className="h-3 w-1 bg-emerald-500"></div>
              <div className="h-4 w-1 bg-emerald-500"></div>
              <div className="h-5 w-1 bg-emerald-500"></div>
              <div className="h-2 w-1 bg-slate-700"></div>
              <span className="text-xs telemetry-font ml-2 text-emerald-400">0.8 Mbps / LATENCY 420ms</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-800 hidden md:block"></div>
          <div className="text-right">
            <div className="text-xs text-slate-400">SYSTEM_TIME</div>
            <div className="telemetry-font font-bold">{new Date().toISOString().replace('T', ' // ').substring(0, 23)} UTC</div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <section className="col-span-1 lg:col-span-6 flex flex-col gap-4 overflow-hidden">
          {activeTab === 'FEED' && (
            <>
              <div className="h-12 flex items-center justify-between glass px-4 shrink-0">
                <div className="flex gap-4 text-xs font-bold">
                  <button className="text-emerald-400">FEED</button>
                  <button className="text-slate-500 hover:text-slate-300">ARCHIVE</button>
                  <button className="text-slate-500 hover:text-slate-300">FORUM</button>
                </div>
                <div className="text-[10px] text-slate-500 tracking-widest">ENCRYPTED_SYNC_PULSE</div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-6 pb-20">
                  {MOCK_FEED.map(post => (
                    <FeedPost key={post.id} post={post} />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'DASHBOARD' && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <TelemetryDashboard liveData={liveData} />
            </div>
          )}

          {activeTab === 'VCM' && (
            <div className="flex-1 overflow-hidden">
              <VcmLedger />
            </div>
          )}

          {activeTab === 'ASSET_MAP' && (
            <div className="flex-1 overflow-hidden">
              <HardwareAssetMap />
            </div>
          )}

          {activeTab === 'VOICE_ASSISTANT' && (
            <div className="flex-1 overflow-hidden">
              <VoiceAssistant />
            </div>
          )}

          {activeTab === 'VIDEO_GEN' && (
            <div className="flex-1 overflow-hidden">
              <VideoGenerator />
            </div>
          )}
        </section>

        <aside className="col-span-3 flex flex-col gap-4 overflow-hidden hidden lg:flex">
          <div className="flex-1 glass p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <HardwareStatusWidget />
            
            <div className="bg-slate-900/50 border border-white/5 rounded-lg p-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Network Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Global Sync Queue</span>
                    <span className="text-slate-200 telemetry-font">1.2k pkts</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-1/4 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Edge Connectivity</span>
                    <span className="text-slate-200 telemetry-font">92%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-11/12 rounded-full glow-green"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <MapsInsight />
            <AudioTranscription />

            <div className="mt-2 border-t border-slate-800 pt-4">
              <div className="text-[10px] text-slate-500 uppercase mb-2 flex items-center justify-between">
                <span>Predictive Alerts</span>
                {alerts.length > 0 && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <div className="text-[10px] text-slate-500 p-2 border border-slate-800 rounded bg-slate-900/30">
                    No active hardware anomalies detected.
                  </div>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} className="text-[10px] p-2 bg-amber-900/20 text-amber-200 border border-amber-900/50 rounded flex flex-col gap-1 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <div className="flex items-center gap-1 font-bold">
                        <Bell className="w-3 h-3 text-amber-400" />
                        PREDICTIVE ALERT // {a.nodeId}
                      </div>
                      <span className="text-amber-100/70">{a.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="h-8 flex items-center justify-between px-6 glass text-[10px] tracking-widest text-slate-500 shrink-0 hidden md:flex">
        <div>SCHEMA_STATUS: <span className="text-emerald-400">PRISMA_V4_SYNCED</span> // REPLICA_LAG: 4ms</div>
        <div>ASYNCHRONOUS PACKET QUEUE: 0 // EDGE_NODE: HEALTHY</div>
        <div>PLATFORM VERSION: 2.4.1-STABLE // BUILD: 0xA7F2</div>
      </footer>
    </div>
  );
}
