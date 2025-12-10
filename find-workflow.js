
import fetch from 'node-fetch';

const N8N_MCP_URL = "https://cvc.app.n8n.cloud/mcp-server/http";
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmY0YjdmMy1hMTM5LTRiYjgtOTE2OC1iMmExMGRkNWFjY2UiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjU1NDYwYmQ4LTZmYzEtNDMxYi04ZWZkLTM0NzRjOTJmZGM1ZCIsImlhdCI6MTc2NTM0NDczNH0.KovKNLtlvY6nMNOcGS4MLbeyeDO7jwitJly2v5_u1g4";

async function findWorkflow() {
    console.log("Searching for workflows...");

    try {
        const response = await fetch(N8N_MCP_URL, {
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
                    arguments: {
                        limit: 10
                    }
                }
            })
        });

        const text = await response.text();
        console.log("RAW RESPONSE:", text);
        // Parse SSE format
        const lines = text.split('\n');
        let jsonResult = null;

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const jsonStr = line.substring(6);
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.result) {
                        jsonResult = parsed;
                        break;
                    }
                } catch (e) {
                    // ignore invalid json lines
                }
            }
        }

        if (jsonResult && jsonResult.result && jsonResult.result.data && jsonResult.result.data.length > 0) {
            console.log("WORKFLOW_ID:", jsonResult.result.data[0].id);
            console.log("WORKFLOW_NAME:", jsonResult.result.data[0].name);
        } else {
            console.log("No workflow found");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

findWorkflow();
