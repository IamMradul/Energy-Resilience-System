import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-robotics-er-1.6-preview" });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function callGemini(prompt: string, retries = 3, backoff = 5000): Promise<string | null> {
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
  } catch (error: any) {
    if (error?.message?.includes('429') && retries > 0) {
      console.warn(`[Gemini] 429 Rate Limit Hit. Retrying in ${backoff / 1000}s...`);
      await sleep(backoff);
      return callGemini(prompt, retries - 1, backoff * 2);
    }
    console.error('[Gemini] Error calling API:', error);
    return null;
  }
}
