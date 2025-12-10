import React from 'react';
import { Heart, MessageSquare, ExternalLink, Wand2, Trash2, Calendar } from 'lucide-react';
import { ContentItem } from '../types';

interface ContentCardProps {
  item: ContentItem;
  onSave: (item: ContentItem) => void;
  onRemove: (id: string) => void;
  onGenerateHook?: (item: ContentItem) => void;
  onView: (item: ContentItem) => void;
  view: 'discover' | 'saved';
}

const ContentCard: React.FC<ContentCardProps> = ({ item, onSave, onRemove, onGenerateHook, onView, view }) => {
  const isSavedView = view === 'saved';

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSavedView) {
      onRemove(item.id);
    } else {
      // Toggle save based on current state (mock logic handled in parent)
      if (item.isSaved) onRemove(item.id);
      else onSave(item);
    }
  };

  return (
    <div
      className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300 flex flex-col h-full relative overflow-hidden cursor-pointer"
      onClick={() => onView(item)}
    >

      {/* Top Source Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${item.source === 'reddit' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
          }`}>
          {item.source === 'reddit' ? (
            <MessageSquare size={12} className="fill-current" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          )}
          {item.sourceName}
        </div>

        <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Calendar size={12} />
          {new Date(item.timestamp).toLocaleDateString()}
        </div>
      </div>

      {/* Image if available */}
      {item.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden h-32 w-full relative">
          <img src={item.imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-slate-800 font-bold text-lg leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
          {item.title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
          {item.content}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
        >
          <ExternalLink size={16} />
        </a>

        <div className="flex items-center gap-2">
          {isSavedView && onGenerateHook && (
            <button
              onClick={() => onGenerateHook(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Wand2 size={12} />
              Generate Hook
            </button>
          )}

          <button
            onClick={handleAction}
            className={`p-2 rounded-full transition-all duration-200 ${item.isSaved || isSavedView
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-slate-400 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-500'
              }`}
            title={isSavedView ? "Delete" : (item.isSaved ? "Unsave" : "Save")}
          >
            {isSavedView ? (
              <Trash2 size={18} />
            ) : (
              <Heart size={18} className={item.isSaved ? "fill-current" : ""} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;