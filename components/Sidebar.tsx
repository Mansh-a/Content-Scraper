import React from 'react';
import { LayoutGrid, Bookmark, Settings, HelpCircle, LogOut } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  savedCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, savedCount }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-20">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">CurateFlow</span>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'discover'
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={18} />
            Discover
          </button>
          
          <button
            onClick={() => setActiveTab('saved')}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'saved'
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bookmark size={18} />
              Saved
            </div>
            {savedCount > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'saved' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {savedCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-1 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Settings size={18} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <HelpCircle size={18} />
          Help
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-colors">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;