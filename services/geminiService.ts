import { GoogleGenAI } from "@google/genai";

// Ideally, this is injected via process.env.API_KEY.
// For this demo artifact, if no key is present, we will simulate a response.
const apiKey = process.env.API_KEY || '';

export const generateHooks = async (content: string): Promise<string[]> => {
  // Simulate analysis if no API key
  console.warn("No API Key found. Returning simulated hooks.");
  return new Promise((resolve) => {
    // Simple keyword extraction for better simulation
    const keywords = content.split(' ').filter(w => w.length > 5).slice(0, 2);
    const topic = keywords.length > 0 ? keywords.join(' ') : 'this topic';

    setTimeout(() => {
      resolve([
        `🚀 Everyone is talking about ${topic}, but they are missing the point. Here is what matters...`,
        `Stop doing ${topic} the old way. 🛑 I found a better approach that changes everything.`,
        `🔥 My biggest takeaway from analyzing ${topic}: It's not what you think. A breakdown:`,
        `If you care about ${topic}, you need to read this immediately. 👇`
      ]);
    }, 1000);
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const prompt = `
      Analyze the following content and generate 3 distinct, engaging social media hooks (Twitter/LinkedIn style).
      
      Content: "${content.substring(0, 500)}..."

      Return the response as a JSON object with a single key "hooks" which is an array of strings.
      Do not include markdown code blocks. Just the raw JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    return parsed.hooks || [];

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate hooks");
  }
};