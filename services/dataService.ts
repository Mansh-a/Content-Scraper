import { ContentItem } from '../types';

// MCP Configuration
const N8N_MCP_URL = "/mcp-server/http";
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

    // 1. Search for Workflows to find the correct ID
    // We use the proxy path to avoid CORS
    const searchResponse = await fetch('/mcp-server/http', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "search_workflows",
          arguments: { limit: 1 }
        }
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`n8n connection failed: ${searchResponse.status}`);
    }

    // Parse SSE response for Search
    const searchText = await searchResponse.text();
    let workflowId = null;

    const lines = searchText.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.substring(6));

          // Check for nested content text first (Standard MCP)
          const contentText = parsed.result?.content?.[0]?.text;
          if (contentText) {
            try {
              const inner = JSON.parse(contentText);
              if (inner.data && Array.isArray(inner.data) && inner.data.length > 0) {
                workflowId = inner.data[0].id;
                break;
              }
            } catch (e) { /* ignore */ }
          }

          if (parsed.result?.data?.[0]?.id) {
            workflowId = parsed.result.data[0].id;
            break;
          }
        } catch (e) { /* ignore */ }
      }
    }

    if (!workflowId) {
      console.warn("No workflow found via MCP. Using fallback.");
      return getFallbackData();
    }

    console.log("Found Workflow ID:", workflowId);

    // 2. Execute the found workflow
    const runResponse = await fetch('/mcp-server/http', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "execute_workflow",
          arguments: {
            workflowId: workflowId,
            // Assuming the workflow takes a webhook trigger or no input. 
            // We pass a dummy Webhook method if needed by the schema.
            inputs: {
              type: 'webhook',
              webhookData: {
                method: 'POST',
                body: { trigger: 'manual_scrape' }
              }
            }
          }
        }
      })
    });

    const runText = await runResponse.text();
    // Parse SSE response for Execution
    // The Execution result might contain the scraped data or just a success message.
    console.log("Workflow Execution Response:", runText);

    // For now, if execution is successful, we might still need to parse the RESULT of the workflow.
    // But n8n workflows usually return JSON. Let's see if we can extract it.
    // If the workflow returns the items directly, they will be in the result.

    let executionResult = null;
    const runLines = runText.split('\n');
    for (const line of runLines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.substring(6));

          // Check for nested content text first (Standard MCP)
          const contentText = parsed.result?.content?.[0]?.text;
          if (contentText) {
            try {
              const inner = JSON.parse(contentText);

              // Helper to extract items from n8n runData
              if (inner.result && inner.result.runData) {
                const runData = inner.result.runData;
                console.log("n8n runData keys:", Object.keys(runData));

                let lastNode: any = null;
                let maxIndex = -1;

                // Find the last executed node (highest executionIndex)
                Object.values(runData).forEach((nodeExecs: any) => {
                  if (Array.isArray(nodeExecs)) {
                    nodeExecs.forEach((exec: any) => {
                      if (exec.executionIndex > maxIndex) {
                        maxIndex = exec.executionIndex;
                        lastNode = exec; // This execution instance
                      }
                    });
                  }
                });

                console.log("Last Node Found:", lastNode ? `Index ${maxIndex}` : "None", lastNode);

                // Extract items from the last node's output
                // Standard n8n output is data.main[0] -> array of { json: {...}, pairedItem: ... }
                if (lastNode?.data?.main?.[0]) {
                  console.log("Found data in last node:", lastNode.data.main[0]);
                  executionResult = lastNode.data.main[0].map((item: any) => item.json);
                  break;
                } else {
                  console.warn("Last node found but no data.main[0]. Structure:", lastNode?.data);
                }
              }

              // Fallback: The workflow result might be directly the array, or wrapped
              executionResult = inner.result || inner.data || inner;
              break;
            } catch (e) {
              // If text is not JSON, use text as content
              if (contentText.length > 0) {
                executionResult = { description: contentText };
                break;
              }
            }
          }

          if (parsed.result) {
            executionResult = parsed.result;
            break;
          }
        } catch (e) { /* ignore */ }
      }
    }

    if (executionResult) {
      // Attempt to find items in the result
      // The structure depends heavily on the workflow output.
      // We'll look for an array in 'result' or 'data' or just cast the whole thing.
      const outputData = executionResult.result || executionResult;

      const items = Array.isArray(outputData) ? outputData : (outputData.items || [outputData]);

      // Special handling for n8n AI Agent output which often returns { output: ["string", ...] }
      let processedItems = items;
      if (items.length > 0 && items[0].output && Array.isArray(items[0].output)) {
        console.log("Detected nested 'output' array from AI Agent. parsing...");
        processedItems = items[0].output.map((text: any) => {
          if (typeof text === 'string') {
            // Create a title from the first few words
            const cleanText = text.replace(/^[-*•]\s*/, ''); // Remove bullet points
            const title = cleanText.split('.')[0].substring(0, 60) + (cleanText.length > 60 ? '...' : '');
            return {
              title: title,
              content: text,
              source: 'newsletter', // Assume AI summaries are often newsletter-like
              sourceName: 'AI Digest'
            };
          }
          return text;
        });
      } else if (items.length > 0) {
        processedItems = items;
      }

      if (Array.isArray(processedItems) && processedItems.length > 0) {
        console.log("Parsing items sample:", JSON.stringify(processedItems[0], null, 2));

        return processedItems.map((item: any) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || item.headline || item.name || 'Untitled Scrape',
          content: item.content || item.description || item.text || item.summary || item.snippet || '',
          source: (item.source?.toLowerCase().includes('reddit') ? 'reddit' : 'newsletter') as any,
          sourceName: item.sourceName || 'Scraped Source',
          url: item.url || item.link || '#',
          timestamp: item.timestamp || item.pubDate || new Date().toISOString(),
          isSaved: false,
          imageUrl: item.imageUrl
        }));
      }
    }

    console.warn("Workflow executed but returned no mapped data. Using fallback.");
    return getFallbackData();

  } catch (error) {
    console.warn("n8n Integration Error (Falling back to mock):", error);
    return getFallbackData();
  }
};

import { supabase } from './supabaseClient';

// ... (previous imports and constants)

// Fetch saved items from Supabase
export const getSavedItems = async (): Promise<ContentItem[]> => {
  const { data, error } = await supabase
    .from('saved_content')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved items:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    source: item.source,
    sourceName: item.source_name,
    url: item.url,
    timestamp: item.timestamp,
    imageUrl: item.image_url,
    isSaved: true
  }));
};

// ... (scrapeContent remain largely similar but maybe we can optimize the check later, 
// for now let's keep scrapeContent returning isSaved: false and let App handle the merge as it does)

// Save to Supabase
export const saveItemToDb = async (item: ContentItem): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_content')
    .insert([{
      id: item.id,
      title: item.title,
      content: item.content,
      source: item.source,
      source_name: item.sourceName,
      url: item.url,
      timestamp: item.timestamp,
      image_url: item.imageUrl,
      is_saved: true
    }]);

  if (error) {
    console.error('Error saving item:', error);
    throw error;
  }
  return true;
};

// Delete from Supabase
export const deleteItemFromDb = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_content')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
  return true;
};