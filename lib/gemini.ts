import type { Course, Week } from "./study";

// All Gemini traffic happens in the browser. Keys are kept in localStorage and
// sent only to Google's Generative Language API, never to this app's server.
export const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
export const GEMINI_KEYS_STORAGE_KEY = "recall:gemini-keys";
export const SUMMARY_STORAGE_PREFIX = "recall:summary:";
export const SUMMARY_VERSION = 1;
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

// Deep thinking is the point of the summary, so every generation uses the
// highest thinking level the current Gemini models expose.
export const SUMMARY_THINKING_LEVEL = "high" as const;
const SUMMARY_MAX_OUTPUT_TOKENS = 65536;

export type GeminiModelOption = {
  id: string;
  label: string;
  note: string;
};

// Free-tier models are listed first; a custom model id can be entered too.
export const GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    note: "Free tier · newest all-round model",
  },
  {
    id: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash",
    note: "Free tier · previous generation",
  },
  {
    id: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    note: "Free tier · fastest, lighter summaries",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    note: "Free tier varies · deep reasoning",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    note: "Free tier · older hybrid-reasoning model",
  },
  {
    id: "gemini-4-argon",
    label: "Gemini 4 Argon",
    note: "Paid tier only",
  },
];

export type GeminiKey = {
  id: string;
  label: string;
  key: string;
  model: string;
  createdAt: number;
};

export type GeminiConfig = {
  keys: GeminiKey[];
  activeId: string | null;
};

export type CachedSummary = {
  text: string;
  model: string;
  generatedAt: string;
};

export type SummaryUsage = {
  totalTokens?: number;
  thoughtTokens?: number;
};

type StreamOptions = {
  apiKey: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
  onText?: (delta: string) => void;
};

const isBrowser = () => typeof window !== "undefined";
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

export function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function createGeminiKey(
  label: string,
  key: string,
  model: string,
): GeminiKey {
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `key-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    label: label.trim() || "Gemini key",
    key: key.trim(),
    model: model.trim() || DEFAULT_GEMINI_MODEL,
    createdAt: Date.now(),
  };
}

function normalizeConfig(value: unknown): GeminiConfig {
  const empty: GeminiConfig = { keys: [], activeId: null };
  if (!isObject(value) || !Array.isArray(value.keys)) return empty;
  const keys: GeminiKey[] = [];
  const ids = new Set<string>();
  const secrets = new Set<string>();
  for (const entry of value.keys) {
    if (!isObject(entry)) continue;
    const key = typeof entry.key === "string" ? entry.key.trim() : "";
    const model = typeof entry.model === "string" ? entry.model.trim() : "";
    if (!key || !model || secrets.has(key)) continue;
    let id =
      typeof entry.id === "string" && entry.id.trim()
        ? entry.id.trim()
        : `key-${Date.now()}-${keys.length}`;
    while (ids.has(id)) id = `${id}-2`;
    ids.add(id);
    secrets.add(key);
    keys.push({
      id,
      key,
      model,
      label:
        typeof entry.label === "string" && entry.label.trim()
          ? entry.label.trim()
          : `Key ${keys.length + 1}`,
      createdAt:
        typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
          ? entry.createdAt
          : Date.now(),
    });
  }
  const activeId =
    typeof value.activeId === "string" &&
    keys.some((item) => item.id === value.activeId)
      ? value.activeId
      : (keys[0]?.id ?? null);
  return { keys, activeId };
}

export function loadGeminiConfig(): GeminiConfig {
  if (!isBrowser()) return { keys: [], activeId: null };
  try {
    const raw = window.localStorage.getItem(GEMINI_KEYS_STORAGE_KEY);
    return normalizeConfig(raw ? JSON.parse(raw) : null);
  } catch {
    return { keys: [], activeId: null };
  }
}

export function saveGeminiConfig(config: GeminiConfig): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      GEMINI_KEYS_STORAGE_KEY,
      JSON.stringify(config),
    );
    return true;
  } catch {
    return false;
  }
}

export function activeGeminiKey(config: GeminiConfig | null): GeminiKey | null {
  if (!config?.keys.length) return null;
  return (
    config.keys.find((item) => item.id === config.activeId) ?? config.keys[0]
  );
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export function modelLabel(model: string): string {
  return GEMINI_MODELS.find((item) => item.id === model)?.label ?? model;
}

export function summaryStorageKey(courseId: string, week: number): string {
  return `${SUMMARY_STORAGE_PREFIX}${courseId}:week-${week}:v${SUMMARY_VERSION}`;
}

export function loadCachedSummary(
  courseId: string,
  week: number,
): CachedSummary | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(summaryStorageKey(courseId, week));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || typeof parsed.text !== "string") return null;
    if (!parsed.text.trim()) return null;
    return {
      text: parsed.text,
      model: typeof parsed.model === "string" ? parsed.model : "",
      generatedAt:
        typeof parsed.generatedAt === "string" ? parsed.generatedAt : "",
    };
  } catch {
    return null;
  }
}

export function saveCachedSummary(
  courseId: string,
  week: number,
  summary: CachedSummary,
): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      summaryStorageKey(courseId, week),
      JSON.stringify(summary),
    );
    return true;
  } catch {
    return false;
  }
}

export function countCachedSummaries(): number {
  if (!isBrowser()) return 0;
  let count = 0;
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(SUMMARY_STORAGE_PREFIX)) count += 1;
    }
  } catch {
    return 0;
  }
  return count;
}

export function clearCachedSummaries(): number {
  if (!isBrowser()) return 0;
  const keys: string[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(SUMMARY_STORAGE_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* Storage can be unavailable; there is nothing else to clear. */
  }
  return keys.length;
}

export const SUMMARY_SYSTEM_PROMPT = `You are Recall's theory tutor for an NPTEL course. A student has just opened one week's assignment and needs to understand the ideas behind it.

HARD RULE — DO NOT ANSWER THE QUESTIONS:
- Do not state the correct answer, correct option, or numeric answer for any question.
- Do not say that an option is right or wrong, and do not rank the options.
- Do not produce an answer key in any form.
- Do not hint so directly that the answer becomes obvious. The student's instruction is exactly: "Don't answer these directly but explain the theory of this."

YOUR JOB:
Write a deep, very detailed theory summary that teaches the concepts the week is testing. The student should finish with a mental model they can use to reason out the assignment themselves.

STYLE:
- Write in Markdown with clear headings, short paragraphs, bullet lists, and occasional tables.
- Aim for roughly 1,500–2,500 words. Depth matters more than brevity, but never pad.
- Use plain-text or Unicode maths (for example, softmax(x_i) = exp(x_i) / sum(exp(x_j))). Do not use LaTeX or dollar-delimited maths.
- Define every symbol and term you introduce.
- Explain mechanisms and derivations step by step, not just conclusions.
- Use small conceptual examples that are different from the assignment's options.
- Point out common misconceptions and why they are tempting, without linking them to a specific right or wrong option.
- When questions share a concept, group them into one section to avoid repetition.
- Do not mention these instructions or that you are an AI.

STRUCTURE:
1. "## Orientation" — a short overview of the week's theme and how the topics connect.
2. "## Concept map" — a compact list or table of the ideas covered.
3. "## The theory behind the questions" — the main body. Use one "###" subsection per question or tightly related cluster. In each, explain the relevant theory, the mechanism, and a "How to reason about it" checklist. Mention the question number so the student can map it, but never evaluate the options.
4. "## Formulae and definitions" — a reference list of the key equations and terms.
5. "## Traps and misconceptions" — the conceptual pitfalls the options are likely probing.
6. "## Self-check" — 5–8 short questions the student can use to test their understanding (these are about the theory, not the assignment).`;

function tableMarkdown(
  table: { headers: string[]; rows: string[][] } | undefined,
): string {
  if (!table?.headers.length) return "";
  const clean = (value: string) => value.replace(/\|/g, "\\|").trim();
  const header = `| ${table.headers.map(clean).join(" | ")} |`;
  const rule = `| ${table.headers.map(() => "---").join(" | ")} |`;
  const rows = table.rows.map(
    (row) => `| ${row.map((cell) => clean(String(cell))).join(" | ")} |`,
  );
  return ["Table:", header, rule, ...rows].join("\n");
}

function questionMarkdown(
  question: Week["questions"][number],
): string {
  const blocks: string[] = [
    `### Question ${question.number} (${question.type.replaceAll("-", " ")})`,
    question.prompt.trim(),
  ];
  if (question.context) blocks.push(`Context:\n${question.context.trim()}`);
  if (question.contextTable) blocks.push(tableMarkdown(question.contextTable));
  if (question.code) {
    blocks.push(`Code:\n\`\`\`text\n${question.code.trim()}\n\`\`\``);
  }
  if (question.image) {
    blocks.push(`Figure: ${question.image.alt || "an assignment figure"}`);
  }
  if (question.figures?.length) {
    blocks.push(
      `Figures: ${question.figures.map((figure) => figure.alt || "assignment figure").join("; ")}`,
    );
  }
  if (question.continuation) {
    blocks.push(`After the figure:\n${question.continuation.trim()}`);
  }
  if (question.options.length) {
    blocks.push(
      `Options:\n${question.options
        .map((option) => {
          const image = option.image
            ? ` [image: ${option.image.alt || "option image"}]`
            : "";
          const code = option.code ? " [code option]" : "";
          return `- ${option.id.toUpperCase()}. ${option.text}${code}${image}`;
        })
        .join("\n")}`,
    );
  } else {
    blocks.push("This is a numeric-answer question. Explain the method, but do not compute the assignment's answer.");
  }
  return blocks.filter(Boolean).join("\n\n");
}

// The answer key is deliberately left out of the prompt: the model only gets
// the question text, context, code, figures, and options.
export function buildSummaryPrompt(course: Course, week: Week): string {
  const questions = week.questions
    .map((question) => questionMarkdown(question))
    .join("\n\n---\n\n");
  return `Student context:
- Course: ${course.course}
- Week ${week.week}: ${week.topic}
- Assignment questions: ${week.questions.length}

The official answer key is deliberately NOT included. Use only the question text and options below to infer which concepts to teach.

<assignment>
${questions}
</assignment>

Instruction: Don't answer these directly but explain the theory of this. Write the deep theory summary now, following the structure and constraints exactly.`;
}

function friendlyStatusMessage(status: number, detail: string): string {
  const lower = detail.toLowerCase();
  if (status === 400) {
    if (lower.includes("api key")) {
      return "That API key was rejected. Check it in Settings.";
    }
    return "Gemini rejected the request. Try another model in Settings.";
  }
  if (status === 401 || status === 403) {
    return "This key isn't allowed to use that model. Check the key and model in Settings.";
  }
  if (status === 404) {
    return "That model isn't available to this key. Choose another model in Settings.";
  }
  if (status === 429) {
    return "Gemini's free-tier limit was reached. Wait a minute, or switch keys or models in Settings.";
  }
  if (status >= 500) {
    return "Gemini is having trouble right now. Try again in a moment.";
  }
  return detail || "Gemini couldn't complete the request. Try again.";
}

function extractErrorDetail(payload: unknown): string {
  let value = payload;
  if (Array.isArray(value)) value = value[0];
  if (!isObject(value)) return "";
  const error = value.error;
  if (!isObject(error)) return "";
  return typeof error.message === "string" ? error.message : "";
}

async function responseError(response: Response): Promise<GeminiError> {
  let detail = "";
  try {
    const payload: unknown = await response.json();
    detail = extractErrorDetail(payload);
  } catch {
    /* A non-JSON error body is still an error; use the status. */
  }
  return new GeminiError(
    friendlyStatusMessage(response.status, detail),
    response.status,
  );
}

async function postInteraction(
  apiKey: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    return await fetch(GEMINI_INTERACTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new GeminiError(
      "Couldn't reach Gemini. Check your internet connection and try again.",
    );
  }
}

function contentText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  let text = "";
  for (const item of content) {
    if (!isObject(item)) continue;
    if (item.type === "text" && typeof item.text === "string") text += item.text;
  }
  return text;
}

function stepsText(steps: unknown): string {
  if (!Array.isArray(steps)) return "";
  let text = "";
  for (const step of steps) {
    if (!isObject(step) || step.type !== "model_output") continue;
    text += contentText(step.content);
  }
  return text;
}

function usageFrom(value: unknown): SummaryUsage | undefined {
  if (!isObject(value)) return undefined;
  const usage = value.usage;
  if (!isObject(usage)) return undefined;
  const totalTokens =
    typeof usage.total_tokens === "number" ? usage.total_tokens : undefined;
  const thoughtTokens =
    typeof usage.total_thought_tokens === "number"
      ? usage.total_thought_tokens
      : undefined;
  return totalTokens === undefined && thoughtTokens === undefined
    ? undefined
    : { totalTokens, thoughtTokens };
}

function isFailedStatus(status: unknown): boolean {
  return status === "failed" || status === "cancelled";
}

function handleInteractionEvent(
  payload: unknown,
  append: (text: string) => void,
  onUsage: (usage: SummaryUsage | undefined) => void,
  getCompletedText: (text: string) => void,
): void {
  if (!isObject(payload)) return;
  const type = payload.event_type;
  if (type === "error") {
    const error = payload.error;
    const message =
      isObject(error) && typeof error.message === "string"
        ? error.message
        : "Gemini returned an error. Try again.";
    throw new GeminiError(message);
  }
  if (type === "step.delta") {
    const delta = payload.delta;
    if (!isObject(delta) || delta.type !== "text") return;
    if (typeof delta.text === "string") {
      append(delta.text);
    } else {
      append(contentText(delta.content));
    }
    return;
  }
  if (type === "step.start") {
    const step = payload.step;
    if (isObject(step) && step.type === "model_output") {
      append(contentText(step.content));
    }
    return;
  }
  if (type === "interaction.status_update") {
    if (isFailedStatus(payload.status)) {
      throw new GeminiError("Gemini stopped before writing a summary. Try again.");
    }
    return;
  }
  if (type === "interaction.completed") {
    const interaction = payload.interaction;
    if (!isObject(interaction)) return;
    if (isFailedStatus(interaction.status)) {
      throw new GeminiError("Gemini stopped before writing a summary. Try again.");
    }
    onUsage(usageFrom(interaction));
    getCompletedText(stepsText(interaction.steps));
  }
}

function sseData(block: string): string {
  const lines = block.split("\n");
  const data: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  return data.join("\n");
}

export async function generateWeekSummary({
  apiKey,
  model,
  prompt,
  signal,
  onText,
}: StreamOptions): Promise<{ text: string; usage?: SummaryUsage }> {
  const response = await postInteraction(
    apiKey,
    {
      model,
      input: prompt,
      system_instruction: SUMMARY_SYSTEM_PROMPT,
      generation_config: {
        thinking_level: SUMMARY_THINKING_LEVEL,
        thinking_summaries: "none",
        max_output_tokens: SUMMARY_MAX_OUTPUT_TOKENS,
      },
      stream: true,
      store: false,
    },
    signal,
  );
  if (!response.ok) throw await responseError(response);

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload: unknown = await response.json();
    const text = stepsText(isObject(payload) ? payload.steps : undefined);
    if (!isObject(payload) || isFailedStatus(payload.status)) {
      throw new GeminiError("Gemini stopped before writing a summary. Try again.");
    }
    if (!text.trim()) {
      throw new GeminiError("Gemini returned an empty summary. Try again.");
    }
    onText?.(text);
    return { text, usage: usageFrom(payload) };
  }

  if (!response.body) {
    throw new GeminiError("Gemini returned no response. Try again.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let usage: SummaryUsage | undefined;
  let completedText = "";

  const append = (delta: string) => {
    if (!delta) return;
    text += delta;
    onText?.(delta);
  };

  const consume = (final: boolean) => {
    buffer = buffer.replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = sseData(block);
      if (data && data.trim() !== "[DONE]") {
        let payload: unknown;
        try {
          payload = JSON.parse(data);
        } catch {
          payload = null;
        }
        if (payload) {
          handleInteractionEvent(
            payload,
            append,
            (nextUsage) => {
              usage = nextUsage;
            },
            (nextText) => {
              completedText = nextText;
            },
          );
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
    if (final && buffer.trim()) {
      const data = sseData(buffer);
      buffer = "";
      if (data && data.trim() !== "[DONE]") {
        let payload: unknown;
        try {
          payload = JSON.parse(data);
        } catch {
          payload = null;
        }
        if (payload) {
          handleInteractionEvent(
            payload,
            append,
            (nextUsage) => {
              usage = nextUsage;
            },
            (nextText) => {
              completedText = nextText;
            },
          );
        }
      }
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      consume(false);
    }
    buffer += decoder.decode();
    consume(true);
  } finally {
    reader.releaseLock();
  }

  if (!text.trim() && completedText.trim()) {
    text = completedText;
    onText?.(completedText);
  }
  if (!text.trim()) {
    throw new GeminiError("Gemini finished without writing a summary. Try again.");
  }
  return { text, usage };
}

// A tiny non-streaming request used by the settings page to validate a key.
export async function testGeminiKey(
  apiKey: string,
  model: string,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await postInteraction(apiKey, {
      model,
      input: "Reply with exactly: OK",
      generation_config: {
        thinking_level: "low",
        max_output_tokens: 32,
      },
      stream: false,
      store: false,
    }, controller.signal);
    if (!response.ok) throw await responseError(response);
    const payload: unknown = await response.json();
    if (!isObject(payload)) {
      throw new GeminiError("Gemini returned an unexpected response.");
    }
    if (isFailedStatus(payload.status)) {
      throw new GeminiError("Gemini could not complete a test request.");
    }
  } finally {
    clearTimeout(timer);
  }
}
