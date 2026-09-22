import React, { useState, useMemo } from 'react';
import { 
  Archive, Search, Filter, Download, ExternalLink, ShieldCheck, 
  Calendar, Layers, CheckCircle2, AlertTriangle, RefreshCw, Bookmark,
  FileJson, FileSpreadsheet, Eye, X, ChevronRight, Hash
} from 'lucide-react';
import { ArchivedTelemetryPacket, MediaPost } from '../types';
import { MOCK_ARCHIVE_PACKETS } from '../data/forumArchiveData';
import { MOCK_FEED } from '../data';

export const FeedArchiveView: React.FC<{ bookmarkedPostIds?: string[] }> = ({ bookmarkedPostIds = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeSubView, setActiveSubView] = useState<'PACKETS' | 'BOOKMARKS'>('PACKETS');
  const [selectedPacket, setSelectedPacket] = useState<ArchivedTelemetryPacket | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredPackets = useMemo(() => {
    return MOCK_ARCHIVE_PACKETS.filter(packet => {
      const matchesSearch = 
        packet.nodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.nodeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.hederaTxHash.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCrop = selectedCrop === 'ALL' || packet.cropType.toLowerCase().includes(selectedCrop.toLowerCase());
      const matchesStatus = selectedStatus === 'ALL' || packet.status === selectedStatus;

      return matchesSearch && matchesCrop && matchesStatus;
    });
  }, [searchQuery, selectedCrop, selectedStatus]);

  const bookmarkedPosts = useMemo(() => {
    return MOCK_FEED.filter(p => p.isBookmarked || bookmarkedPostIds.includes(p.id));
  }, [bookmarkedPostIds]);

  const handleExportCSV = () => {
    const headers = ['Packet ID', 'Node ID', 'Node Name', 'Country', 'Crop Focus', 'Timestamp UTC', 'pH Level', 'Pressure (Bar)', 'Temp (°C)', 'Moisture (%)', 'NH3 Yield (kg/h)', 'Hedera HCS Hash', 'IPFS CID', 'SIL-3 Status'];
    const rows = filteredPackets.map(p => [
      p.id,
      p.nodeId,
      `"${p.nodeName}"`,
      p.country,
      `"${p.cropType}"`,
      p.timestamp,
      p.phLevel,
      p.pressureBar,
      p.temperatureC,
      p.moisturePercent,
      p.ammoniaYieldKg,
      `"${p.hederaTxHash}"`,
      p.ipfsCid,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eden2_telemetry_archive_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Exported ${filteredPackets.length} telemetry records to CSV.`);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredPackets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `eden2_telemetry_archive_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Exported ${filteredPackets.length} telemetry records to JSON.`);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1 flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            Total Archived Packets
          </div>
          <div className="text-xl font-bold text-slate-100 telemetry-font">
            14,892 <span className="text-xs font-normal text-emerald-400">pkts</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">100% On-Chain HCS Verified</div>
        </div>

        <div className="glass p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            SIL-3 Compliant Rate
          </div>
          <div className="text-xl font-bold text-cyan-400 telemetry-font">99.98%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">0 Uncontained Anomalies</div>
        </div>

        <div className="glass p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Mean Solution pH
          </div>
          <div className="text-xl font-bold text-amber-300 telemetry-font">
            6.24 <span className="text-xs font-normal text-slate-400">pH</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Target: 6.2 - 6.8 Optimal</div>
        </div>

        <div className="glass p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            Saved Sister Posts
          </div>
          <div className="text-xl font-bold text-indigo-300 telemetry-font">
            {bookmarkedPosts.length} <span className="text-xs font-normal text-slate-400">items</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Direct Field Bookmarks</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubView('PACKETS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === 'PACKETS' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Telemetry Logs ({filteredPackets.length})
            </button>
            <button
              onClick={() => setActiveSubView('BOOKMARKS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubView === 'BOOKMARKS' 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Bookmarks ({bookmarkedPosts.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search node, hash, crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
            />
          </div>

          {/* Crop Filter */}
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Crops</option>
            <option value="MAIZE">Maize / Corn</option>
            <option value="COFFEE">Coffee</option>
            <option value="SOYBEAN">Soybean</option>
            <option value="RICE">Rice</option>
            <option value="WHEAT">Wheat</option>
            <option value="POTATOES">Potatoes</option>
          </select>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Export CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Export JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Telemetry Records Table or Bookmarks Grid */}
      {activeSubView === 'PACKETS' ? (
        <div className="glass rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4 font-semibold">Node & Region</th>
                  <th className="py-3 px-3 font-semibold">Crop Focus</th>
                  <th className="py-3 px-3 font-semibold">Timestamp (UTC)</th>
                  <th className="py-3 px-3 font-semibold">pH Level</th>
                  <th className="py-3 px-3 font-semibold">Pressure</th>
                  <th className="py-3 px-3 font-semibold">NH3 Yield</th>
                  <th className="py-3 px-3 font-semibold">Hedera HCS Proof</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPackets.map((pkt) => (
                  <tr 
                    key={pkt.id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedPacket(pkt)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{pkt.nodeId}</div>
                      <div className="text-[10px] text-slate-500">{pkt.nodeName} ({pkt.country})</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium font-mono">
                        {pkt.cropType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {new Date(pkt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} {' '}
                      <span className="text-slate-500">{new Date(pkt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {pkt.phLevel.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-400">
                      {pkt.pressureBar.toFixed(1)} bar
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                      {pkt.ammoniaYieldKg.toFixed(1)} kg/h
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      <div className="flex items-center gap-1 text-[11px] text-indigo-300 group-hover:text-indigo-200">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        {pkt.hederaTxHash}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        pkt.status === 'VERIFIED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : pkt.status === 'CALIBRATING'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {pkt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPacket(pkt);
                        }}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="View Packet Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Saved Bookmarks View */
        <div className="space-y-4">
          {bookmarkedPosts.length === 0 ? (
            <div className="glass p-8 rounded-xl text-center border border-slate-800 text-slate-400">
              <Bookmark className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <h4 className="font-bold text-slate-200">No Saved Posts Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bookmark any post in the Sister-Link Feed using the three-dots action menu to keep important agronomy updates accessible here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarkedPosts.map((post) => (
                <div key={post.id} className="glass rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Node {post.telemetrySnapshot.nodeId}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{post.description}</p>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px]">
                    <div>
                      <span className="text-slate-500 block">pH Level</span>
                      <span className="font-bold text-amber-400">{post.telemetrySnapshot.phLevel.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pressure</span>
                      <span className="font-bold text-cyan-400">{post.telemetrySnapshot.pressureBar.toFixed(0)} bar</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Temp</span>
                      <span className="font-bold text-emerald-400">{post.telemetrySnapshot.temperatureC.toFixed(1)}°C</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Packet Detail Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-xl w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold block mb-1">
                  ARCHIVED TELEMETRY SNAPSHOT
                </span>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {selectedPacket.nodeId} • {selectedPacket.nodeName}
                </h3>
                <span className="text-xs text-slate-400">{selectedPacket.country} • {selectedPacket.cropType}</span>
              </div>
              <button 
                onClick={() => setSelectedPacket(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sensor Array Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Soil pH</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{selectedPacket.phLevel.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Loop Pressure</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{selectedPacket.pressureBar.toFixed(1)} bar</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Catalyst Temp</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{selectedPacket.temperatureC.toFixed(1)}°C</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Ammonia Yield</span>
                <span className="text-lg font-bold text-purple-400 font-mono">{selectedPacket.ammoniaYieldKg.toFixed(1)} kg/h</span>
              </div>
            </div>

            {/* Hedera Consensus & IPFS Details */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Hedera Consensus Proof:</span>
                <span className="text-indigo-300 font-bold">{selectedPacket.hederaTxHash}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>IPFS CID Payload:</span>
                <span className="text-slate-300 truncate max-w-[240px]">{selectedPacket.ipfsCid}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>SIL-3 Interlock Verification:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED ALL GATES
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedPacket, null, 2));
                  triggerToast('Copied full JSON packet to clipboard.');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Copy JSON Payload
              </button>
              <button
                onClick={() => setSelectedPacket(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
