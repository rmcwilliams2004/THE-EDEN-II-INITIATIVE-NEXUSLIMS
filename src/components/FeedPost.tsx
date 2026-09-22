import React, { FC, useState, useRef, useEffect } from 'react';
import { MediaPost, PostComment } from '../types';
import { MOCK_USERS } from '../data';
import { MOCK_POST_COMMENTS } from '../data/forumArchiveData';
import { TelemetryOverlay } from './TelemetryOverlay';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Link as LinkIcon, 
  ShieldCheck, Download, Copy, Bookmark, AlertTriangle, X, CheckCircle2,
  Send, Thermometer, Gauge, Droplets, Activity
} from 'lucide-react';

export const FeedPost: FC<{ 
  post: MediaPost;
  onBookmarkToggle?: (postId: string) => void;
}> = ({ post, onBookmarkToggle }) => {
  const author = MOCK_USERS[post.authorId as keyof typeof MOCK_USERS] || {
    id: post.authorId,
    name: 'Sister Partner Node',
    role: 'COOPERATIVE_MANAGER',
    location: 'Global Network',
    avatarUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150',
  };
  
  const fallbackPostImage = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200';
  const fallbackAvatar = 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150';

  // Interactive States
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(!!post.isBookmarked);
  
  // Three Dots & Actions
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isHederaModalOpen, setIsHederaModalOpen] = useState(false);

  // Close menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);
  
  // Comments
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(MOCK_POST_COMMENTS[post.id] || [
    {
      id: `c_default_${post.id}`,
      postId: post.id,
      authorName: 'Sister-Link Verification Edge',
      authorRole: 'Automated Bot',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
      authorLocation: 'Hedera HCS Network',
      content: 'Consensus verified by Hedera Topic #0.0.492019. Zero telemetry anomalies flagged.',
      createdAt: post.createdAt,
      likes: 3
    }
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    setIsMenuOpen(false);
    if (onBookmarkToggle) onBookmarkToggle(post.id);
    triggerToast(next ? 'Saved post to Archive.' : 'Removed post from Archive.');
  };

  const handleExportJSON = () => {
    setIsMenuOpen(false);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      postId: post.id,
      author: author.name,
      location: author.location,
      createdAt: post.createdAt,
      description: post.description,
      telemetrySnapshot: post.telemetrySnapshot,
      hederaProof: {
        topicId: '0.0.492019',
        sequenceNumber: 14892,
        runningHash: '0x8f19b22a08dc34b9981e44f9104c',
        dMRVStatus: 'VERIFIED_ZERO_RUNOFF'
      }
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `packet_${post.telemetrySnapshot.nodeId}_${post.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Downloaded telemetry JSON snapshot.');
  };

  const handleCopyLink = () => {
    setIsMenuOpen(false);
    navigator.clipboard.writeText(`${window.location.origin}/#feed-${post.id}`);
    triggerToast('Copied post reference link to clipboard.');
  };

  const handleReportAnomaly = () => {
    setIsMenuOpen(false);
    triggerToast(`Anomaly flag submitted for Node ${post.telemetrySnapshot.nodeId}. Logged to SIL-3 supervisor.`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const created: PostComment = {
      id: `c_${Date.now()}`,
      postId: post.id,
      authorName: 'Dr. Marcus Vance (You)',
      authorRole: 'Senior Agronomy Engineer',
      authorAvatar: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150',
      authorLocation: 'Central Hub',
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0
    };

    setComments(prev => [...prev, created]);
    setNewCommentText('');
    triggerToast('Comment posted.');
  };

  return (
    <article className="glass overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-3 right-3 z-40 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Post Header */}
      <div className="p-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <img 
            src={author.avatarUrl || fallbackAvatar} 
            alt={author.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackAvatar;
            }}
            className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm"
          />
          <div>
            <h3 className="font-medium text-slate-100 flex items-center gap-2">
              {author.name}
              {author.role === 'COOPERATIVE_MANAGER' && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide uppercase">
                  Co-op
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {author.location}
              </span>
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <LinkIcon className="w-3 h-3" />
                Sister-Link Partner
              </span>
            </div>
          </div>
        </div>

        {/* Three Dots Menu Container */}
        <div ref={menuRef} className="relative">
          <button 
            type="button"
            id={`post-menu-btn-${post.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(prev => !prev);
            }}
            aria-label="Post actions"
            aria-expanded={isMenuOpen}
            className={`transition-all p-1.5 rounded-lg flex items-center justify-center ${
              isMenuOpen 
                ? 'bg-slate-800 text-emerald-400 ring-1 ring-emerald-500/50 shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Contextual Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
              <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                  Node Actions • {post.telemetrySnapshot.nodeId}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTelemetryModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors group"
              >
                <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Inspect Node Telemetry</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsHederaModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors group"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Verify Hedera HCS Proof</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors group"
              >
                <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Export Packet (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleBookmark}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors group"
              >
                <Bookmark className={`w-4 h-4 group-hover:scale-110 transition-transform ${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
                <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark to Archive'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/90 flex items-center gap-2.5 transition-colors group"
              >
                <Copy className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                <span>Copy Post & Node Link</span>
              </button>

              <div className="h-px bg-slate-800 my-1"></div>

              <button
                type="button"
                onClick={handleReportAnomaly}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/50 flex items-center gap-2.5 transition-colors group"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                <span>Flag Sensor Anomaly</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Container with Telemetry */}
      <div className="relative aspect-video bg-black w-full overflow-hidden group">
        <img 
          src={post.imageUrl || fallbackPostImage} 
          alt="Post media" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackPostImage;
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-5 gradient-overlay">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-bold mb-1 tracking-widest uppercase drop-shadow-md flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Sister-Link Packet: Node {post.telemetrySnapshot.nodeId}
              </span>
              <p className="text-sm text-slate-200 max-w-md mt-1 drop-shadow-md leading-relaxed">{post.description}</p>
            </div>
            <div className="h-9 px-3 shrink-0 rounded-full border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300 bg-black/60 backdrop-blur-sm shadow-lg font-mono">
              LIVE 4K
            </div>
          </div>
        </div>
        <TelemetryOverlay data={post.telemetrySnapshot} />
      </div>

      {/* Post Footer / Interactions */}
      <div className="p-4 border-t border-white/5 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Heart / Like Button */}
            <button 
              onClick={handleLikeToggle}
              className={`flex items-center gap-2 transition-all group ${
                isLiked ? 'text-red-400 font-bold' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                isLiked ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500/20'
              }`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            {/* Comment Button */}
            <button 
              onClick={() => setIsCommentsOpen(prev => !prev)}
              className={`flex items-center gap-2 transition-colors group ${
                isCommentsOpen ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <MessageCircle className={`w-5 h-5 ${isCommentsOpen ? 'fill-blue-500/20' : 'group-hover:fill-blue-400/20'}`} />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium uppercase tracking-wider font-mono">
            {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            
            {/* Share Button */}
            <button 
              onClick={handleCopyLink}
              title="Share Sister-Link Post"
              className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Comments Section */}
        {isCommentsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>Cooperative Discussion Thread ({comments.length})</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {comments.map(c => (
                <div key={c.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src={c.authorAvatar} 
                        alt={c.authorName} 
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-slate-700" 
                      />
                      <span className="text-xs font-bold text-slate-200">{c.authorName}</span>
                      <span className="text-[10px] text-slate-500">({c.authorRole})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-7 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add agronomy insight or comment..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal 1: Live Telemetry Inspection */}
      {isTelemetryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                  NODE TELEMETRY TELE-DIAGNOSTICS
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  Node {post.telemetrySnapshot.nodeId}
                </h3>
              </div>
              <button 
                onClick={() => setIsTelemetryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <Droplets className="w-8 h-8 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Soil / Foliar pH</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{post.telemetrySnapshot.phLevel.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <Gauge className="w-8 h-8 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Loop Pressure</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">{post.telemetrySnapshot.pressureBar.toFixed(1)} bar</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <Thermometer className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Catalyst Bed Temp</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{post.telemetrySnapshot.temperatureC.toFixed(1)}°C</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <Activity className="w-8 h-8 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Canopy Moisture</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">{post.telemetrySnapshot.moisturePercent || 58}%</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Packet Timestamp:</span>
                <span className="text-slate-200">{post.telemetrySnapshot.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>SIL-3 Interlock Verification:</span>
                <span className="text-emerald-400 font-bold">ALL GATES ACTIVE</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsTelemetryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Hedera Consensus Proof */}
      {isHederaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Hedera Consensus Service (HCS) Proof
                </h3>
              </div>
              <button 
                onClick={() => setIsHederaModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Hedera Topic ID:</span>
                <span className="text-indigo-400 font-bold">0.0.492019</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sequence Number:</span>
                <span className="text-slate-200">#14,892</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consensus Timestamp:</span>
                <span className="text-emerald-400">{new Date(post.createdAt).toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Running Hash:</span>
                <span className="text-slate-400 truncate max-w-[200px]">0x8f19b22a08dc34b9981e44f9104c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">dMRV Status:</span>
                <span className="text-emerald-400 font-bold">VERIFIED ZERO RUNOFF</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText('0.0.492019 #14892 (0x8f19b22a08dc34b9981e44f9104c)');
                  triggerToast('Copied Hedera HCS proof to clipboard.');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Copy Proof Hash
              </button>
              <button
                onClick={() => setIsHederaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
