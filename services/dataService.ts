import { ContentItem } from '../types';
import { supabase } from './supabaseClient';

// Make.com Configuration
const MAKE_WEBHOOK_URL = (import.meta as any).env.VITE_MAKE_WEBHOOK_URL;

// Mock data (Fallback)
const MOCK_REDDIT_DATA: ContentItem[] = [
  {
    id: 'r1',
    title: 'The future of React Server Components is wild',
    content: 'Just tried the new Next.js app router with RSC and the mental model shift is real. Here are my top 5 takeaways after building a production app...',
    source: 'reddit',
    sourceName: 'r/reactjs',
    url: '#',
    timestamp: new Date().toISOString(),
    isSaved: false,
    imageUrl: 'https://picsum.photos/400/200?random=1'
  },
  {
    id: 'r2',
    title: 'How I scaled my SaaS to $10k MRR in 3 months',
    content: 'Bootstrap journey: No ads, just pure content marketing and cold outreach. Breaking down the exact email templates I used...',
    source: 'reddit',
    sourceName: 'r/SaaS',
    url: '#',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isSaved: false,
  },
  {
    id: 'r3',
    title: 'Stop using useEffect for fetching data',
    content: 'React Query / TanStack Query is the standard now. Managing loading states and caching manually is a recipe for bugs.',
    source: 'reddit',
    sourceName: 'r/webdev',
    url: '#',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isSaved: false,
  }
];

const MOCK_NEWSLETTER_DATA: ContentItem[] = [
  {
    id: 'n1',
    title: 'AI Agents are the new Apps',
    content: 'In this weeks edition: Why single-purpose AI agents are replacing traditional SaaS dashboards. Plus, a look at the new Gemini 1.5 Pro capabilities.',
    source: 'newsletter',
    sourceName: 'The AI Edge',
    url: '#',
    timestamp: new Date().toISOString(),
    isSaved: false,
    imageUrl: 'https://picsum.photos/400/200?random=2'
  },
  {
    id: 'n2',
    title: 'Design Trends for 2025',
    content: 'Glassmorphism is back, but cleaner. Bento grids are everywhere. We analyze the top 50 landing pages of YC W24 companies.',
    source: 'newsletter',
    sourceName: 'UI/UX Weekly',
    url: '#',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isSaved: false,
  }
];

// Helper to get fallback data
const getFallbackData = (): Promise<ContentItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mixedData = [...MOCK_REDDIT_DATA, ...MOCK_NEWSLETTER_DATA].sort(() => Math.random() - 0.5);
      const freshData = mixedData.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      }));
      resolve(freshData);
    }, 1500);
  });
};

// IMAGE SCAVENGER - Finds any image inside fields or raw content
const scavengeImage = (item: any): string => {
  const candidates = ['image', 'imageUrl', 'thumbnail', 'pic', 'url_overridden_by_dest', 'preview', 'media_url'];
  for (const f of candidates) {
    const val = item[f];
    if (typeof val === 'string' && val.trim().startsWith('http')) {
      if (val.includes('redditmedia.com') && (val.endsWith('/self.png') || val.endsWith('/default.png') || val.endsWith('/nsfw.png'))) continue;
      return val.trim();
    }
  }
  if (item.preview?.images?.[0]?.source?.url) return item.preview.images[0].source.url.replace(/&amp;/g, '&');
  const raw = (item.description || item.content || item.summary || '') + '';
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = raw.match(imgRegex);
  if (match && match[1].startsWith('http')) return match[1];
  const linkRegex = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|gif|png|webp|svg)(?:\?[^\s"'<>]*)?)/i;
  const linkMatch = raw.match(linkRegex);
  if (linkMatch) return linkMatch[1];
  return '';
};

const isValidDate = (dateString: any) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  return !isNaN(d.getTime());
};

// SURGICAL REPAIR - Extracts items from malformed text with missing commas and unescaped quotes
export const extractItemsFromText = (text: string): ContentItem[] => {
  // Expanded keys list to catch common Reddit/Make metadata that might be leaking
  const keys = ['id', 'title', 'summary', 'description', 'content', 'author', 'url', 'image', 'imageUrl', 'thumbnail', 'published_at', 'dateCreated', 'source', 'comments', 'rssFields'];
  const hits: { key: string, idx: number, val: string }[] = [];

  // Find all key anchors
  keys.forEach(k => {
    let pos = 0;
    const searchStr = `"${k}":`;
    while ((pos = text.indexOf(searchStr, pos)) !== -1) {
      const startVal = text.indexOf('"', pos + k.length + 2) + 1;
      if (startVal > 0) {
        // Find the absolute next key in the ENTIRE text (not just known keys)
        // But for safety, we'll use our keys list to find the boundary
        const nextKeyIdxs = keys.map(k2 => text.indexOf(`"${k2}":`, startVal)).filter(idx => idx !== -1);
        const minNext = nextKeyIdxs.length > 0 ? Math.min(...nextKeyIdxs) : text.length;

        const segment = text.substring(0, minNext);
        // PRECISION FIX: Find the last quote that is NOT preceded by a comma and space if that comma and space are part of the next field
        // Actually, the simplest fix for the leak is to find the last quote before the NEXT key that is preceded by a " or ,
        let endVal = segment.lastIndexOf('"');

        // If we captured a bunch of junk like ", "comments":"", search backwards more carefully
        if (endVal > startVal) {
          const trailingJunkCheck = segment.substring(startVal, endVal);
          // If the value ends with ", "something":, it means we overshot
          const overshootRegex = /",\s*"[^"]+":\s*/g;
          let match;
          let lastValidEnd = endVal;
          while ((match = overshootRegex.exec(trailingJunkCheck)) !== null) {
            lastValidEnd = startVal + match.index;
            break; // Stop at the first occurrence of an unknown key pattern
          }
          endVal = lastValidEnd;
        }

        if (endVal > startVal) {
          hits.push({ key: k, idx: pos, val: text.substring(startVal, endVal) });
        }
      }
      pos += searchStr.length;
    }
  });

  hits.sort((a, b) => a.idx - b.idx);
  if (hits.length === 0) return [];

  const rawItems: any[] = [];
  let currentItem: any = {};

  hits.forEach((hit, i) => {
    // IMPROVED BOUNDARY DETECTION:
    // A new object starts ONLY if we see a key that's already in the object, 
    // OR if we see "title" after we already have most essential keys (title, author, url etc).
    const isDuplicateKey = currentItem[hit.key] !== undefined;
    const essentialKeysCount = Object.keys(currentItem).filter(k => ['title', 'author', 'url', 'description'].includes(k)).length;
    const isNewItemTrigger = hit.key === 'title' && essentialKeysCount >= 2;

    if (isDuplicateKey || isNewItemTrigger) {
      rawItems.push(currentItem);
      currentItem = {};
    }
    currentItem[hit.key] = hit.val;
  });
  if (Object.keys(currentItem).length > 0) rawItems.push(currentItem);

  // NORMALIZE AND FILTER
  const finalItems: ContentItem[] = [];
  rawItems.forEach(raw => {
    const title = (raw.title || '').trim();
    const content = (raw.description || raw.summary || raw.content || '').trim();

    // Quality Filter: Skip items that are essentially empty or placeholders
    if (title.length < 5 || (content.length < 10 && !raw.url)) return;
    if (title === 'Untitled Post' || title.toLowerCase() === 'null') return;

    // Fix the "source" leak in title/author
    const cleanTitle = title.replace(/",\s*"[^"]+":\s*".*$/g, '').trim();
    const cleanAuthor = (raw.author || 'Scraped Source').replace(/",\s*"[^"]+":\s*".*$/g, '').trim();

    const date = raw.published_at || raw.dateCreated;
    const timestamp = isValidDate(date) ? new Date(date).toISOString() : new Date().toISOString();

    finalItems.push({
      id: raw.id || Math.random().toString(36).substr(2, 9),
      title: cleanTitle,
      content: content,
      source: (((cleanAuthor || '').toLowerCase().includes('reddit') || (raw.url || '').includes('reddit.com')) ? 'reddit' : 'newsletter') as any,
      sourceName: cleanAuthor,
      url: raw.url || '#',
      timestamp: timestamp,
      isSaved: false,
      imageUrl: scavengeImage(raw)
    });
  });

  return finalItems;
};

// STREAMING SCRAPE - Yields items as they are discovered
export const scrapeContentStreaming = async (onItem: (item: ContentItem) => void): Promise<void> => {
  try {
    const isMockMode = (import.meta as any).env.VITE_MOCK_MODE === 'true';

    if (isMockMode || !MAKE_WEBHOOK_URL) {
      console.log(isMockMode ? "Mock Mode enabled. Using fallback data." : "No webhook URL found. Using fallback data.");
      const fallback = await getFallbackData();
      fallback.forEach(onItem);
      return;
    }

    console.log("Connecting to Make.com...");
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'manual_scrape' })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) {
      const text = await response.text();
      const items = extractItemsFromText(text);
      items.forEach(onItem);
      return;
    }

    let accumulatedText = "";
    const processedIds = new Set<string>();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      accumulatedText += decoder.decode(value, { stream: true });
      const items = extractItemsFromText(accumulatedText);

      items.forEach(item => {
        if (!processedIds.has(item.id)) {
          processedIds.add(item.id);
          onItem(item);
        }
      });
    }
  } catch (error) {
    console.warn("Scrape error:", error);
  }
};

export const scrapeContent = async (): Promise<ContentItem[]> => {
  const items: ContentItem[] = [];
  await scrapeContentStreaming((item) => items.push(item));
  return items;
};

// Supabase Logic
export const getSavedItems = async (userId: string): Promise<ContentItem[]> => {
  if (!userId) return [];
  const { data, error } = await supabase.from('saved_content').select('*').eq('user_id', userId).eq('is_saved', true).order('created_at', { ascending: false });
  if (error) return [];
  return data.map((item: any) => ({
    id: item.id, title: item.title, content: item.content, source: item.source, sourceName: item.source_name,
    url: item.url, timestamp: item.timestamp, imageUrl: item.image_url, isSaved: true
  }));
};

export const getDiscoveredItems = async (userId: string): Promise<ContentItem[]> => {
  if (!userId) return [];
  const { data, error } = await supabase.from('saved_content').select('*').eq('user_id', userId).eq('is_saved', false).order('created_at', { ascending: false });
  if (error) return [];
  return data.map((item: any) => ({
    id: item.id, title: item.title, content: item.content, source: item.source, sourceName: item.source_name,
    url: item.url, timestamp: item.timestamp, imageUrl: item.image_url, isSaved: false
  }));
};

export const saveItemToDb = async (item: ContentItem, userId: string): Promise<boolean> => {
  if (!userId) throw new Error("userId required");
  const { error } = await supabase.from('saved_content').upsert([{
    id: item.id, user_id: userId, title: item.title, content: item.content, source: item.source,
    source_name: item.sourceName, url: item.url, timestamp: item.timestamp, image_url: item.imageUrl, is_saved: !!item.isSaved
  }], { onConflict: 'id' });
  if (error) throw error;
  return true;
};

export const deleteItemFromDb = async (id: string, userId: string): Promise<boolean> => {
  const { error } = await supabase.from('saved_content').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  return true;
};