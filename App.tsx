import React, { useState, useEffect } from 'react';
import { Search, Bell, DownloadCloud, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ContentCard from './components/ContentCard';
import HookModal from './components/HookModal';
import { ContentItem, TabType, Toast } from './types';
import { scrapeContent, saveItemToDb, deleteItemFromDb } from './services/dataService';
import { generateHooks } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  
  // State for content
  const [discoverItems, setDiscoverItems] = useState<ContentItem[]>([]);
  const [savedItems, setSavedItems] = useState<ContentItem[]>([]);
  
  // UI State
  const [isScraping, setIsScraping] = useState(false);
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentHooks, setCurrentHooks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast State
  const [toast, setToast] = useState<Toast | null>(null);

  // Show toast helper
  const showToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToast({ id, type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Handler: Scrape Data
  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const newItems = await scrapeContent();
      
      // Merge with existing but avoid duplicates based on ID (simple check)
      setDiscoverItems(prev => {
         const existingIds = new Set(prev.map(i => i.id));
         const uniqueNew = newItems.filter(i => !existingIds.has(i.id));
         return [...uniqueNew, ...prev];
      });
      
      showToast('success', `Found ${newItems.length} new items`);
    } catch (error) {
      showToast('error', 'Failed to fetch content');
    } finally {
      setIsScraping(false);
    }
  };

  // Handler: Save Item
  const handleSaveItem = async (item: ContentItem) => {
    // Optimistic UI update
    const updatedItem = { ...item, isSaved: true, savedAt: new Date().toISOString() };
    
    // Check if already in saved to prevent dupes
    if (savedItems.some(i => i.id === item.id)) {
        showToast('info', 'Item already saved');
        return;
    }

    setSavedItems(prev => [updatedItem, ...prev]);
    setDiscoverItems(prev => prev.map(i => i.id === item.id ? { ...i, isSaved: true } : i));
    
    try {
      await saveItemToDb(updatedItem);
      showToast('success', 'Saved to library');
    } catch (e) {
      // Revert if failed (simplified)
      showToast('error', 'Failed to save');
    }
  };

  // Handler: Remove/Delete Item
  const handleRemoveItem = async (id: string) => {
    // If we are in saved tab, remove from saved list
    if (activeTab === 'saved') {
      setSavedItems(prev => prev.filter(i => i.id !== id));
      // Also update discover list status
      setDiscoverItems(prev => prev.map(i => i.id === id ? { ...i, isSaved: false } : i));
      
      try {
        await deleteItemFromDb(id);
        showToast('info', 'Item removed');
      } catch (e) {
         showToast('error', 'Failed to delete');
      }
    } else {
      // If in discover tab, this acts as "Unsave" or "Hide"
      // For this demo, let's treat it as unsave if saved, or hide if not
      const item = discoverItems.find(i => i.id === id);
      if (item?.isSaved) {
         setSavedItems(prev => prev.filter(i => i.id !== id));
         setDiscoverItems(prev => prev.map(i => i.id === id ? { ...i, isSaved: false } : i));
         showToast('info', 'Unsaved');
      } else {
         // Hide from feed
         setDiscoverItems(prev => prev.filter(i => i.id !== id));
      }
    }
  };

  // Handler: Generate Hook
  const handleGenerateHook = async (item: ContentItem) => {
    setModalOpen(true);
    setIsGeneratingHook(true);
    setCurrentHooks([]); // Clear previous

    try {
      const hooks = await generateHooks(item.content);
      setCurrentHooks(hooks);
    } catch (error) {
      showToast('error', 'Failed to generate hooks');
      setModalOpen(false);
    } finally {
      setIsGeneratingHook(false);
    }
  };

  // Filtering
  const displayedItems = (activeTab === 'discover' ? discoverItems : savedItems).filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        savedCount={savedItems.length}
      />

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between">
            <div className="flex-1 max-w-xl">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search content..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                 />
               </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
                <button 
                  onClick={handleScrape}
                  disabled={isScraping}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-700/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isScraping ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                  {isScraping ? 'Scraping...' : 'Scrape Now'}
                </button>
                
                <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                    <Bell size={20} />
                </button>
                
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                   <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-800">Alex Creator</p>
                      <p className="text-xs text-slate-400">Pro Plan</p>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white shadow-sm overflow-hidden">
                      <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full object-cover" />
                   </div>
                </div>
            </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 flex-1 overflow-y-auto">
           <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2 capitalize">
                 {activeTab === 'discover' ? 'Explore Content' : 'Saved Collection'}
              </h1>
              <p className="text-slate-500">
                 {activeTab === 'discover' 
                    ? 'Latest updates from your configured sources.' 
                    : 'Your curated list of content ideas.'}
              </p>
           </div>

           {displayedItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
               {activeTab === 'discover' ? (
                 <>
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <DownloadCloud size={32} />
                   </div>
                   <h3 className="text-lg font-medium text-slate-700">No content found</h3>
                   <p className="text-slate-500 mt-2 max-w-sm">Hit the "Scrape Now" button to fetch the latest posts from Reddit and your newsletters.</p>
                 </>
               ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                       <DownloadCloud size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">No saved items</h3>
                    <p className="text-slate-500 mt-2">Items you save from the Discover tab will appear here.</p>
                  </>
               )}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map(item => (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    onSave={handleSaveItem}
                    onRemove={handleRemoveItem}
                    onGenerateHook={handleGenerateHook}
                    view={activeTab}
                  />
                ))}
             </div>
           )}
        </div>
      </main>

      {/* Modals & Overlays */}
      <HookModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        hooks={currentHooks}
        isLoading={isGeneratingHook}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl z-50 transform transition-all animate-bounce-in flex items-center gap-3 border ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
          'bg-white border-slate-200 text-slate-800'
        }`}>
           <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-slate-500'
           }`} />
           <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;