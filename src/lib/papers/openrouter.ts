/**
 * XeroxQ Papers — OpenRouter Free-Model Client
 *
 * Uses strictly server-side OPENROUTER_API_KEY and defaults to OpenRouter's
 * Free Models Router (`openrouter/free`) with automatic fallback across verified
 * zero-cost `:free` models so temporary provider limits never break document builds.
 */

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Ordered by speed & structured JSON reliability on free tier.
// Fast models that support disabling hidden reasoning come first; mandatory-reasoning
// and router endpoints follow as automatic fallbacks.
const DEFAULT_FREE_MODELS = [
  "baidu/ernie-5.5-flash-preview:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3.5-lightning:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "particle-ai/particle-1:free",
  "recursive/flint-v1.0:free",
  "liquid/lfm-3-1.7b:free",
  "openrouter/free",
] as const;

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterCallOptions {
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface OpenRouterResult {
  content: string;
  modelUsed: string;
}

export class OpenRouterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigError";
  }
}

export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  if (
    !key ||
    key === "your_openrouter_api_key_here" ||
    key.startsWith("your_") ||
    key.length < 12
  ) {
    throw new OpenRouterConfigError(
      "AI service is not connected yet. Add your free OPENROUTER_API_KEY in .env.local and restart the server."
    );
  }
  return key;
}

export function isOpenRouterConfigured(): boolean {
  try {
    getOpenRouterApiKey();
    return true;
  } catch {
    return false;
  }
}

function getCandidateModels(): string[] {
  const configured = process.env.OPENROUTER_MODEL?.trim();
  const list: string[] = [];

  // Only prioritize an explicit specific `:free` model override ahead of defaults;
  // leave generic `openrouter/free` in its fallback slot so fast direct models run first.
  if (configured && configured.endsWith(":free")) {
    list.push(configured);
  }

  for (const m of DEFAULT_FREE_MODELS) {
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

/**
 * Some free models (like Gemma variants) reject a separate `system` role.
 * Folding system instructions into the first user message avoids 400 errors.
 */
function foldSystemPrompt(messages: OpenRouterMessage[]): OpenRouterMessage[] {
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean);
  const rest = messages.filter((m) => m.role !== "system");

  if (systemParts.length === 0) return rest;
  const prefix = `[Instructions]\n${systemParts.join("\n\n")}\n\n[Request]\n`;

  if (rest.length === 0) {
    return [{ role: "user", content: prefix }];
  }

  return rest.map((m, idx) =>
    idx === 0 && m.role === "user"
      ? { ...m, content: `${prefix}${m.content}` }
      : m
  );
}

async function callSingleModel(
  model: string,
  apiKey: string,
  options: OpenRouterCallOptions,
  compatFallback = false
): Promise<OpenRouterResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);

  const payloadMessages = compatFallback
    ? foldSystemPrompt(options.messages)
    : options.messages;

  const bodyPayload: Record<string, unknown> = {
    model,
    messages: payloadMessages,
    temperature: options.temperature ?? 0.35,
    max_tokens: options.maxTokens ?? 6144,
  };

  // Disable hidden reasoning traces on first attempt so free models don't exhaust max_tokens
  // before writing output. Mandatory-reasoning endpoints retry cleanly on compatFallback.
  if (!compatFallback) {
    bodyPayload.reasoning = { enabled: false };
  }

  if (options.jsonMode && !compatFallback) {
    bodyPayload.response_format = { type: "json_object" };
  }

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://xeroxq.arkio.in",
        "X-Title": "XeroxQ Papers",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      // Retry once without `reasoning: { enabled: false }`, without `response_format`,
      // and with system prompt folded into user message if provider rejected any of those.
      if (res.status === 400 && !compatFallback) {
        return callSingleModel(model, apiKey, options, true);
      }
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 220)}`);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      if (!compatFallback) {
        return callSingleModel(model, apiKey, options, true);
      }
      throw new Error("Empty model response — model returned blank content");
    }

    return {
      content,
      modelUsed: typeof data?.model === "string" && data.model ? data.model : model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends a completion request to OpenRouter using free models with automatic fallback.
 */
export async function callOpenRouterFree(
  options: OpenRouterCallOptions
): Promise<OpenRouterResult> {
  const apiKey = getOpenRouterApiKey();
  const models = getCandidateModels();
  const errors: string[] = [];

  for (const model of models) {
    try {
      return await callSingleModel(model, apiKey, options, false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model}: ${msg}`);
      // Don't retry other models if the API key itself is invalid/unauthorized
      if (msg.includes("HTTP 401") || msg.includes("HTTP 403")) {
        throw new OpenRouterConfigError(
          "Your OpenRouter API key appears invalid or unauthorized. Please check OPENROUTER_API_KEY."
        );
      }
    }
  }

  throw new Error(
    `Free AI servers are temporarily busy right now. Please try again in a few moments. (${errors[0] || "no response"})`
  );
}

/**
 * Extracts and parses a JSON object from an AI response, tolerating markdown code fences
 * or extra conversational text before/after the JSON payload.
 */
export function extractJsonFromResponse<T = Record<string, unknown>>(raw: string): T {
  const trimmed = raw.trim();

  // 1. Direct parse
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }

  // 2. Strip ```json ... ``` fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // 3. Slice outermost { ... }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const sliced = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(sliced) as T;
    } catch {
      // Attempt gentle cleanup of trailing commas
      const cleaned = sliced.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(cleaned) as T;
    }
  }

  throw new Error("Could not understand the AI's structured response. Please try again.");
}
