
import fetch from 'node-fetch';

const N8N_MCP_URL = "https://cvc.app.n8n.cloud/mcp-server/http";
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmY0YjdmMy1hMTM5LTRiYjgtOTE2OC1iMmExMGRkNWFjY2UiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjU1NDYwYmQ4LTZmYzEtNDMxYi04ZWZkLTM0NzRjOTJmZGM1ZCIsImlhdCI6MTc2NTM0NDczNH0.KovKNLtlvY6nMNOcGS4MLbeyeDO7jwitJly2v5_u1g4";

async function checkMcp() {
    console.log("Testing connection to:", N8N_MCP_URL);

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
                method: "tools/list",
                params: {}
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response Body:", text);

    } catch (error) {
        console.error("Error:", error);
    }
}

checkMcp();
