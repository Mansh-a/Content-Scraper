import { GoogleGenAI } from "@google/genai";

// Ideally, this is injected via process.env.API_KEY.
// For this demo artifact, if no key is present, we will simulate a response.
const apiKey = process.env.API_KEY || ''; 

export const generateHooks = async (content: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key found. Returning mock hooks.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          "🚀 This insight completely changed how I think about the topic. Here is why...",
          "You're doing it wrong. Here is the better way to handle this situation. 🧵",
          "🔥 I saved this for later, but I can't stop thinking about it. A breakdown:"
        ]);
      }, 1500);
    });
  }

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