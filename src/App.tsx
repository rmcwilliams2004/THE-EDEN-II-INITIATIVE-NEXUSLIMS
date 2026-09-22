import React, { useState, useEffect } from 'react';
import { MOCK_FEED } from './data';
import { MediaPost } from './types';
import { FeedPost } from './components/FeedPost';
import { FeedArchiveView } from './components/FeedArchiveView';
import { FeedForumView } from './components/FeedForumView';
import { HardwareStatusWidget } from './components/HardwareStatusWidget';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { VcmLedger } from './components/VcmLedger';
import { HardwareAssetMap } from './components/HardwareAssetMap';
import { VoiceAssistant } from './components/VoiceAssistant';
import { VideoGenerator } from './components/VideoGenerator';
import { AudioTranscription } from './components/AudioTranscription';
import { MapsInsight } from './components/MapsInsight';
import { KioskSimulatorView } from './components/KioskSimulatorView';
import { OnboardingCalculatorView } from './components/OnboardingCalculatorView';
import { EcoCreditXView } from './components/EcoCreditXView';
import { IndustrialTouchscreenDashboard } from './components/touchscreen/IndustrialTouchscreenDashboard';
import { FarmCommandDashboard } from './components/farmcommand/FarmCommandDashboard';
import { Sidebar } from './components/Sidebar';
import { NavigationProvider, useNavigation, NavigationTab } from './context/NavigationContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { LanguageSelector } from './components/LanguageSelector';
import { Bell, Plus, Radio, Archive, MessageSquare, Image, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';

function AppContent() {
  const { activeTab, setActiveTab, navItems } = useNavigation();
  const { localeProfile, locale } = useLanguage();
  const [liveData, setLiveData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Feed Subtabs: FEED | ARCHIVE | FORUM
  const [feedSubTab, setFeedSubTab] = useState<'FEED' | 'ARCHIVE' | 'FORUM'>('FEED');
  const [feedPosts, setFeedPosts] = useState<MediaPost[]>(MOCK_FEED);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostCrop, setNewPostCrop] = useState('MAIZE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBookmarkToggle = (postId: string) => {
    setBookmarkedPostIds(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostDesc.trim()) return;

    const newPost: MediaPost = {
      id: `post_${Date.now()}`,
      authorId: 'u_001',
      imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      description: newPostDesc.trim(),
      createdAt: new Date().toISOString(),
      likes: 1,
      comments: 0,
      cropType: newPostCrop,
      telemetrySnapshot: {
        id: `tel_${Date.now()}`,
        nodeId: 'EDEN II NODE #042',
        timestamp: new Date().toISOString(),
        phLevel: 6.35,
        pressureBar: 597.2,
        temperatureC: 390.4,
        moisturePercent: 48,
      }
    };

    setFeedPosts([newPost, ...feedPosts]);
    setIsCreatePostOpen(false);
    setNewPostDesc('');
    triggerToast('Broadcasted new Sister-Link telemetry update to network.');
  };

  useEffect(() => {
    // Initial fetch of telemetry history
    fetch('/api/telemetry/history')
      .then(res => res.json())
      .then(data => setLiveData(data))
      .catch(() => {});

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
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              NEXUS<span className="text-emerald-400">LIMS</span>
              <span className="text-slate-500 font-normal text-sm ml-2 hidden sm:inline">/ Eden II Micro-DGA Container</span>
            </h1>
          </div>
        </div>

        {/* Mobile & Quick View Switcher synchronized via NavigationContext */}
        <div className="flex items-center gap-3">
          {/* Zero-Touch Localization Selector */}
          <LanguageSelector compact />

          <div className="lg:hidden flex items-center">
            <select
              id="mobile-navigation-dropdown"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as NavigationTab)}
              aria-label="Navigation View Switcher"
              className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
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
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        <Sidebar />
        
        <section className={`col-span-1 ${activeTab === 'FEED' && feedSubTab === 'FEED' ? 'lg:col-span-6' : 'lg:col-span-9'} flex flex-col gap-4 overflow-hidden`}>
          {activeTab === 'FEED' && (
            <>
              {/* Sub-navigation Header: FEED | ARCHIVE | FORUM */}
              <div className="h-12 flex items-center justify-between glass px-4 shrink-0 rounded-xl border border-slate-800">
                <div className="flex gap-2 text-xs font-bold font-mono">
                  <button 
                    onClick={() => setFeedSubTab('FEED')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      feedSubTab === 'FEED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    FEED
                  </button>

                  <button 
                    onClick={() => setFeedSubTab('ARCHIVE')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      feedSubTab === 'ARCHIVE'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    ARCHIVE
                    {bookmarkedPostIds.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    )}
                  </button>

                  <button 
                    onClick={() => setFeedSubTab('FORUM')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      feedSubTab === 'FORUM'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    FORUM
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {feedSubTab === 'FEED' && (
                    <button
                      onClick={() => setIsCreatePostOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1 shadow-md shadow-emerald-950/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New Dispatch</span>
                    </button>
                  )}
                  <div className="text-[10px] text-slate-500 tracking-widest hidden sm:block font-mono">
                    ENCRYPTED_SYNC_PULSE
                  </div>
                </div>
              </div>

              {/* View Rendering based on feedSubTab */}
              {feedSubTab === 'FEED' && (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-6 pb-20">
                    {feedPosts.map(post => (
                      <FeedPost 
                        key={post.id} 
                        post={{
                          ...post,
                          isBookmarked: post.isBookmarked || bookmarkedPostIds.includes(post.id)
                        }} 
                        onBookmarkToggle={handleBookmarkToggle}
                      />
                    ))}
                  </div>
                </div>
              )}

              {feedSubTab === 'ARCHIVE' && (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <FeedArchiveView bookmarkedPostIds={bookmarkedPostIds} />
                </div>
              )}

              {feedSubTab === 'FORUM' && (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <FeedForumView />
                </div>
              )}
            </>
          )}

          {/* New Dispatch Modal */}
          {isCreatePostOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Broadcast Sister-Link Field Update
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsCreatePostOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Field Note & Agronomic Telemetry Context
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newPostDesc}
                      onChange={(e) => setNewPostDesc(e.target.value)}
                      placeholder="e.g. Completed foliar micro-dosing across West Plot. Soil pH stabilized at 6.35 with 0.8% aqueous solution..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Crop Target
                      </label>
                      <select
                        value={newPostCrop}
                        onChange={(e) => setNewPostCrop(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="MAIZE">Maize / Corn</option>
                        <option value="COFFEE">Coffee</option>
                        <option value="SOYBEAN">Soybean</option>
                        <option value="RICE">Paddy Rice</option>
                        <option value="WHEAT">Wheat</option>
                        <option value="POTATOES">Potatoes</option>
                      </select>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Telemetry Lock</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">Node #042 (Live 597.2 bar)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCreatePostOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/40"
                    >
                      Publish Dispatch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {(activeTab === 'FARM_COMMAND' || activeTab === 'MAP' || activeTab === 'ANALYTICS' || activeTab === 'SETTINGS') && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <FarmCommandDashboard />
            </div>
          )}

          {activeTab === 'TOUCHSCREEN' && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <IndustrialTouchscreenDashboard nodeId="EDEN II NODE #042" />
            </div>
          )}

          {activeTab === 'DASHBOARD' && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <TelemetryDashboard liveData={liveData} />
            </div>
          )}

          {activeTab === 'KIOSK' && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <KioskSimulatorView />
            </div>
          )}

          {activeTab === 'ONBOARDING' && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <OnboardingCalculatorView />
            </div>
          )}

          {activeTab === 'ECOCREDITX' && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <EcoCreditXView />
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

        {activeTab === 'FEED' && (
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
        )}
      </main>

      <footer className="h-8 flex items-center justify-between px-6 glass text-[10px] tracking-widest text-slate-500 shrink-0 hidden md:flex">
        <div>SCHEMA_STATUS: <span className="text-emerald-400">PRISMA_V4_SYNCED</span> // REPLICA_LAG: 4ms</div>
        <div>ASYNCHRONOUS PACKET QUEUE: 0 // EDGE_NODE: HEALTHY</div>
        <div>PLATFORM VERSION: 2.4.1-STABLE // BUILD: 0xA7F2</div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </LanguageProvider>
  );
}
