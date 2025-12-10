
import fetch from 'node-fetch';
import * as fs from 'fs';

const N8N_MCP_URL = "https://cvc.app.n8n.cloud/mcp-server/http";
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmY0YjdmMy1hMTM5LTRiYjgtOTE2OC1iMmExMGRkNWFjY2UiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjU1NDYwYmQ4LTZmYzEtNDMxYi04ZWZkLTM0NzRjOTJmZGM1ZCIsImlhdCI6MTc2NTM0NDczNH0.KovKNLtlvY6nMNOcGS4MLbeyeDO7jwitJly2v5_u1g4";

async function debugExecution() {
  console.log("1. Searching for workflow...");
  let workflowId = null;
  
  try {
    const searchResp = await fetch(N8N_MCP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${N8N_API_KEY}`
        },
        body: JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "tools/call",
            params: { name: "search_workflows", arguments: { limit: 1 } }
        })
    });
    
    const searchText = await searchResp.text();
    const lines = searchText.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const parsed = JSON.parse(line.substring(6));
                // Try standard path
                if (parsed.result?.data?.[0]?.id) {
                    workflowId = parsed.result.data[0].id;
                    break;
                }
                // Try nested path
                 const contentText = parsed.result?.content?.[0]?.text;
                 if (contentText) {
                     const inner = JSON.parse(contentText);
                     if (inner.data && inner.data[0]?.id) {
                         workflowId = inner.data[0].id;
                         break;
                     }
                 }
            } catch (e) {}
        }
    }

    if (!workflowId) {
        console.log("Could not find workflow ID. Raw Search Output:\n", searchText);
        return;
    }
    console.log("Found Workflow ID:", workflowId);

    console.log("2. Executing workflow...");
    const runResp = await fetch(N8N_MCP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${N8N_API_KEY}`
        },
        body: JSON.stringify({
            jsonrpc: "2.0", id: 2, method: "tools/call",
            params: {
                name: "execute_workflow",
                arguments: {
                    workflowId: workflowId,
                    inputs: {
                        type: 'webhook',
                        webhookData: { method: 'POST', body: { trigger: 'manual_debug' } }
                    }
                }
            }
        })
    });

    const runText = await runResp.text();
    fs.writeFileSync('debug_output.txt', runText);
    console.log("Logged output to debug_output.txt");

  } catch (error) {
    console.error("Error:", error);
  }
}

debugExecution();
