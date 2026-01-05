import React from 'react';
import { X, Calendar, ExternalLink, Hash } from 'lucide-react';
import { ContentItem } from '../types';

interface ContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ContentItem | null;
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, item }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl z-10 overflow-hidden transform transition-all scale-100 relative flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0">
                    <div className="pr-8">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${item.source === 'reddit' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {item.sourceName}
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                            {item.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {item.imageUrl && item.imageUrl !== "" && (
                        <div className="mb-6 rounded-xl overflow-hidden w-full">
                            <img
                                src={item.imageUrl}
                                alt="Article header"
                                className="w-full h-auto object-cover max-h-96"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}

                    <div className="prose prose-slate max-w-none">
                        <div
                            className="text-slate-600 leading-relaxed text-base"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Hash size={14} />
                            {item.id.slice(0, 8)}
                        </span>
                    </div>

                    <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                        Open Original
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ContentModal;
