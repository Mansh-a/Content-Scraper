import { ContentItem } from '../types';

// MCP Configuration
const N8N_MCP_URL = "https://cvc.app.n8n.cloud/mcp-server/http";
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmY0YjdmMy1hMTM5LTRiYjgtOTE2OC1iMmExMGRkNWFjY2UiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjU1NDYwYmQ4LTZmYzEtNDMxYi04ZWZkLTM0NzRjOTJmZGM1ZCIsImlhdCI6MTc2NTM0NDczNH0.KovKNLtlvY6nMNOcGS4MLbeyeDO7jwitJly2v5_u1g4";

// Mock data to simulate the "Scrape" result from n8n (Fallback)
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
      // Simulate network delay
      const mixedData = [...MOCK_REDDIT_DATA, ...MOCK_NEWSLETTER_DATA].sort(() => Math.random() - 0.5);
      // Give them new IDs so we can scrape multiple times effectively in demo
      const freshData = mixedData.map(item => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      }));
      resolve(freshData);
    }, 1500);
  });
};

// Main Scrape Function connecting to n8n MCP
export const scrapeContent = async (): Promise<ContentItem[]> => {
  try {
    console.log("Connecting to n8n MCP...");

    // 1. Discover Tools via JSON-RPC
    // Although we know we want 'reddit', listing ensures auth works and session is active.
    const listResponse = await fetch(N8N_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      })
    });

    if (!listResponse.ok) {
      throw new Error(`n8n connection failed: ${listResponse.status}`);
    }

    // 2. Call the Tool 'reddit' explicitly as requested
    console.log("Calling n8n tool: reddit");
    
    const callResponse = await fetch(N8N_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "reddit",
          arguments: {} 
        }
      })
    });

    const callData = await callResponse.json();
    
    if (callData.error) {
        throw new Error(`MCP Error: ${callData.error.message}`);
    }

    // 3. Parse and Normalize Data
    // MCP tool execution results usually reside in result.content[0].text
    const rawContent = callData.result?.content?.[0]?.text;

    if (rawContent) {
      try {
        const parsed = JSON.parse(rawContent);
        
        // Ensure we have an array
        const items = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);
        
        if (Array.isArray(items) && items.length > 0) {
          return items.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            title: item.title || 'Untitled Scrape',
            content: item.content || item.description || item.text || item.summary || '',
            source: (item.source?.toLowerCase().includes('reddit') ? 'reddit' : 'newsletter') as any,
            sourceName: item.sourceName || (item.source?.toLowerCase().includes('reddit') ? 'r/AI' : 'AI Newsletter'),
            url: item.url || '#',
            timestamp: item.timestamp || new Date().toISOString(),
            isSaved: false,
            imageUrl: item.imageUrl
          }));
        }
      } catch (e) {
        console.warn("Could not parse n8n tool output as JSON array. Output was:", rawContent);
      }
    }
    
    // If we got here, the tool ran but didn't return a usable JSON array.
    console.warn("n8n response format unrecognized, using fallback.");
    return getFallbackData();

  } catch (error) {
    console.warn("n8n Integration Error (Falling back to mock):", error);
    return getFallbackData();
  }
};

// Simulates saving to Supabase
export const saveItemToDb = async (item: ContentItem): Promise<boolean> => {
    // In a real app, this would be: await supabase.from('saved_items').insert(item);
    return new Promise(resolve => setTimeout(() => resolve(true), 300));
};

// Simulates deleting from Supabase
export const deleteItemFromDb = async (id: string): Promise<boolean> => {
    // In a real app: await supabase.from('saved_items').delete().eq('id', id);
    return new Promise(resolve => setTimeout(() => resolve(true), 300));
};