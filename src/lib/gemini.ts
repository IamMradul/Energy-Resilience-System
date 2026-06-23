import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function callGemini(prompt: string): Promise<string | null> {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    
    // Log token usage if available (requires setting in model config, but can check response)
    console.log(`[Gemini] Call successful.`);

    // Strip markdown code fences (```json ... ```)
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    return text.trim();
  } catch (error) {
    console.error('[Gemini] Error calling API:', error);
    return null;
  }
}
