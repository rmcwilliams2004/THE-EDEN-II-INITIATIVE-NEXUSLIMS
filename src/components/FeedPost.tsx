import React, { FC } from 'react';
import { MediaPost } from '../types';
import { MOCK_USERS } from '../data';
import { TelemetryOverlay } from './TelemetryOverlay';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Link as LinkIcon } from 'lucide-react';

export const FeedPost: FC<{ post: MediaPost }> = ({ post }) => {
  const author = MOCK_USERS[post.authorId as keyof typeof MOCK_USERS];
  
  return (
    <article className="glass overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={author.avatarUrl} 
            alt={author.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-700"
          />
          <div>
            <h3 className="font-medium text-slate-100 flex items-center gap-2">
              {author.name}
              {author.role === 'COOPERATIVE_MANAGER' && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase">
                  Co-op
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {author.location}
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                <LinkIcon className="w-3 h-3" />
                Sister-Link Partner
              </span>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media Container with Telemetry */}
      <div className="relative aspect-video bg-black w-full overflow-hidden group">
        <img 
          src={post.imageUrl} 
          alt="Post media" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/30"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 gradient-overlay">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-bold mb-1 tracking-widest uppercase shadow-black drop-shadow-md">
                Sister-Link Packet: Node {post.telemetrySnapshot.nodeId}
              </span>
              <p className="text-sm text-slate-200 max-w-sm mt-1 drop-shadow-md">{post.description}</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full border-2 border-emerald-500/50 flex items-center justify-center text-xs font-bold text-white bg-black/40 backdrop-blur-sm">
              4K
            </div>
          </div>
        </div>
        <TelemetryOverlay data={post.telemetrySnapshot} />
      </div>

      {/* Post Footer / Interactions */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors group">
              <Heart className="w-5 h-5 group-hover:fill-emerald-400/20" />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group">
              <MessageCircle className="w-5 h-5 group-hover:fill-blue-400/20" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
            {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            <button className="text-slate-400 hover:text-white transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
