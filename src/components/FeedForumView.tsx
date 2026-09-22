import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, Plus, ThumbsUp, CheckCircle2, Search, Filter, 
  Tag, User, Calendar, MapPin, Sparkles, Send, X, ArrowLeft, ShieldCheck, 
  HelpCircle, Lightbulb, ChevronRight, Award
} from 'lucide-react';
import { ForumThread, ForumReply } from '../types';
import { MOCK_FORUM_THREADS } from '../data/forumArchiveData';

export const FeedForumView: React.FC = () => {
  const [threads, setThreads] = useState<ForumThread[]>(MOCK_FORUM_THREADS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [isNewThreadOpen, setIsNewThreadOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Thread Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ForumThread['category']>('AGRONOMY');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  // Reply Form State
  const [replyText, setReplyText] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
      const matchesCategory = selectedCategory === 'ALL' || thread.category === selectedCategory;
      const matchesSearch = 
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [threads, selectedCategory, searchQuery]);

  const handleUpvoteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, upvotes: t.upvotes + 1 };
      }
      return t;
    }));
    if (activeThread && activeThread.id === threadId) {
      setActiveThread(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null);
    }
    triggerToast('Upvoted discussion thread.');
  };

  const handleUpvoteReply = (replyId: string) => {
    if (!activeThread) return;
    const updatedReplies = (activeThread.replies || []).map(r => {
      if (r.id === replyId) return { ...r, upvotes: r.upvotes + 1 };
      return r;
    });
    const updatedThread = { ...activeThread, replies: updatedReplies };
    setActiveThread(updatedThread);
    setThreads(prev => prev.map(t => t.id === activeThread.id ? updatedThread : t));
    triggerToast('Upvoted reply.');
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const created: ForumThread = {
      id: `th_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      authorName: 'Dr. Marcus Vance (You)',
      authorRole: 'Senior Agronomy Engineer',
      authorAvatar: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150',
      nodeLocation: 'Central Hub • Primary Operator',
      content: newContent.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['Agronomy', 'Eden-II'],
      createdAt: new Date().toISOString(),
      upvotes: 1,
      repliesCount: 0,
      replies: []
    };

    setThreads([created, ...threads]);
    setIsNewThreadOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    triggerToast('Discussion thread posted to Sister-Link Community!');
  };

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const newReply: ForumReply = {
      id: `rep_${Date.now()}`,
      threadId: activeThread.id,
      authorName: 'Dr. Marcus Vance (You)',
      authorRole: 'Senior Agronomy Engineer',
      authorAvatar: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=150&h=150',
      authorLocation: 'Central Hub',
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 1,
    };

    const updatedReplies = [...(activeThread.replies || []), newReply];
    const updatedThread: ForumThread = {
      ...activeThread,
      repliesCount: (activeThread.repliesCount || 0) + 1,
      replies: updatedReplies
    };

    setActiveThread(updatedThread);
    setThreads(prev => prev.map(t => t.id === activeThread.id ? updatedThread : t));
    setReplyText('');
    triggerToast('Reply submitted.');
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Forum View or Thread Detail View */}
      {!activeThread ? (
        <>
          {/* Header Bar */}
          <div className="glass p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Sister-Link Agronomy & Engineering Forum
              </h2>
              <span className="text-xs text-slate-400">
                Global cooperative peer knowledge, micro-dosing protocols, and Haber-Bosch telemetry exchange.
              </span>
            </div>

            <button
              onClick={() => setIsNewThreadOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Start New Topic
            </button>
          </div>

          {/* Categories & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'ALL', label: 'All Topics' },
                { id: 'AGRONOMY', label: '🌱 Soil & Agronomy' },
                { id: 'ELECTROLYZER', label: '⚡ 600-Bar Synthesis' },
                { id: 'FOLIAR_DOSING', label: '💧 Foliar Micro-Dose' },
                { id: 'ECOCREDITX', label: '🪙 Hedera dMRV Split' },
                { id: 'KIOSK_HARDWARE', label: '📱 20-ft Kiosks & Voice' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative md:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search forum topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="space-y-3">
            {filteredThreads.length === 0 ? (
              <div className="glass p-8 rounded-xl text-center border border-slate-800 text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <h4 className="font-bold text-slate-200">No Discussions Found</h4>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or category filter.</p>
              </div>
            ) : (
              filteredThreads.map(thread => (
                <article
                  key={thread.id}
                  onClick={() => setActiveThread(thread)}
                  className="glass p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/30 hover:border-slate-700 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={thread.authorAvatar}
                        alt={thread.authorName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-700 mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-200">{thread.authorName}</span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {thread.nodeLocation}
                          </span>
                          {thread.isResolved && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Solved
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug">
                          {thread.title}
                        </h3>
                      </div>
                    </div>

                    {/* Upvotes Counter */}
                    <button
                      onClick={(e) => handleUpvoteThread(thread.id, e)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-400 transition-all flex flex-col items-center shrink-0 min-w-[44px]"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold font-mono mt-0.5">{thread.upvotes}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pl-12">
                    {thread.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 pl-12 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {thread.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        {thread.repliesCount} {thread.repliesCount === 1 ? 'reply' : 'replies'}
                      </span>
                      <span>
                        {new Date(thread.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        /* Single Thread Discussion Detail View */
        <div className="space-y-4">
          <button
            onClick={() => setActiveThread(null)}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
          </button>

          {/* Original Post */}
          <article className="glass p-5 rounded-2xl border border-slate-700 bg-slate-900/60 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeThread.authorAvatar}
                  alt={activeThread.authorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{activeThread.authorName}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{activeThread.authorRole}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-slate-500">
                      <MapPin className="w-3 h-3" /> {activeThread.nodeLocation}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => handleUpvoteThread(activeThread.id, e)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-500/60 text-slate-200 hover:text-emerald-400 transition-all flex items-center gap-2 text-xs font-bold font-mono"
              >
                <ThumbsUp className="w-4 h-4" />
                {activeThread.upvotes} Upvotes
              </button>
            </div>

            <div>
              <h1 className="text-base font-bold text-slate-100 leading-snug mb-2">
                {activeThread.title}
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {activeThread.content}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
              {activeThread.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </article>

          {/* Replies Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold px-1 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Community Responses ({activeThread.replies?.length || 0})
            </h3>

            {(activeThread.replies || []).map(reply => (
              <div
                key={reply.id}
                className={`glass p-4 rounded-xl border space-y-2.5 ${
                  reply.isVerifiedSolution 
                    ? 'border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_20px_rgba(16,185,129,0.06)]' 
                    : 'border-slate-800 bg-slate-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={reply.authorAvatar}
                      alt={reply.authorName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200">{reply.authorName}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{reply.authorRole}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {reply.isVerifiedSolution && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 font-mono">
                        <Award className="w-3 h-3 text-emerald-400" /> VERIFIED SOLUTION
                      </span>
                    )}
                    <button
                      onClick={() => handleUpvoteReply(reply.id)}
                      className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-emerald-400 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {reply.upvotes}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-9">
                  {reply.content}
                </p>
              </div>
            ))}

            {/* Add Reply Form */}
            <form onSubmit={handleAddReply} className="glass p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Contribute Technical Agronomy Insight or Field Feedback
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your technical analysis, dosage recipe, or edge controller observation..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {isNewThreadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-xl w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Create New Forum Discussion
              </h3>
              <button 
                onClick={() => setIsNewThreadOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Topic Title / Question
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. In-line pH stabilization under variable irrigation flow..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category Focus
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="AGRONOMY">🌱 Soil & Agronomy</option>
                    <option value="ELECTROLYZER">⚡ 600-Bar Haber-Bosch</option>
                    <option value="FOLIAR_DOSING">💧 Foliar Micro-Dose</option>
                    <option value="ECOCREDITX">🪙 Hedera dMRV Split</option>
                    <option value="KIOSK_HARDWARE">📱 20-ft Kiosks & Voice AI</option>
                    <option value="GENERAL">🌐 General Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. pH, Maize, Ruthenium"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Technical Description & Telemetry Context
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Detail your findings, question, node telemetry parameters, or field recipe recommendations..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewThreadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/40"
                >
                  Publish Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
