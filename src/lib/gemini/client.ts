import { env } from "~/env";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiTextPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiTextPart[];
  role?: "user" | "model";
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

/**
 * Google Gemini API Client
 */
class GeminiClient {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY ?? "";
    this.model = "gemini-pro";
  }

  /**
   * Check if the API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate text content using Gemini
   */
  async generateContent(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key not configured");
    }

    const contents: GeminiContent[] = [];
    
    // Add system prompt as first user message if provided
    if (options?.systemPrompt) {
      contents.push({
        parts: [{ text: options.systemPrompt }],
        role: "user",
      });
      contents.push({
        parts: [{ text: "Forstått. Jeg vil følge disse instruksjonene." }],
        role: "model",
      });
    }
    
    // Add the main prompt
    contents.push({
      parts: [{ text: prompt }],
      role: "user",
    });

    const request: GeminiRequest = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
        topK: 40,
        topP: 0.95,
      },
    };

    const response = await fetch(
      `${GEMINI_API_URL}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated");
    }

    const text = data.candidates[0]?.content.parts[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  }

  /**
   * Generate structured JSON output
   */
  async generateJson<T>(
    prompt: string,
    options?: {
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON, no markdown code blocks or other text.`;
    
    const response = await this.generateContent(jsonPrompt, {
      ...options,
      temperature: options?.temperature ?? 0.3, // Lower temperature for structured output
    });

    // Try to parse JSON from response
    try {
      // Remove markdown code blocks if present
      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(`Failed to parse JSON response: ${response}`);
    }
  }
}

export const geminiClient = new GeminiClient();
