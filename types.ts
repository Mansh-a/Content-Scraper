export type SourceType = 'reddit' | 'newsletter';

export interface ContentItem {
  id: string;
  title: string;
  content: string; // Excerpt or full text
  source: SourceType;
  sourceName: string; // e.g., "r/webdev" or "Morning Brew"
  url: string;
  timestamp: string;
  isSaved: boolean;
  generatedHooks?: string[];
  imageUrl?: string;
}

export type TabType = 'discover' | 'saved';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}