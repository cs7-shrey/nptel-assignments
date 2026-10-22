import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSummaryPrompt,
  generateWeekSummary,
  GeminiError,
  SUMMARY_SYSTEM_PROMPT,
  testGeminiKey,
} from '../lib/gemini.ts';

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});

const course = {
  course: 'Test Course',
  courseId: 'test-course',
  weeks: [],
};
const week = {
  week: 3,
  topic: 'Machine unlearning',
  questions: [
    {
      id: 'q1',
      number: 4,
      type: 'single-choice',
      prompt: 'Which statement describes exact unlearning?',
      context: 'A short shared passage.',
      code: 'theta = theta - eta * grad',
      contextTable: {
        headers: ['Method', 'Property'],
        rows: [['Exact', 'Identical distribution']],
      },
      options: [
        { id: 'a', text: 'A distributional statement.' },
        { id: 'z', text: 'The answer that must never be leaked.' },
      ],
      correctOptionIds: ['z'],
      correctNumericAnswer: null,
      reference: 'secret-reference',
    },
    {
      id: 'q2',
      number: 5,
      type: 'numeric',
      prompt: 'Enter a number.',
      options: [],
      correctOptionIds: null,
      correctNumericAnswer: '987654',
      reference: null,
    },
  ],
};

test('the summary prompt teaches theory but never sends answer-key fields', () => {
  const prompt = buildSummaryPrompt(course, week);
  assert.match(prompt, /Don't answer these directly but explain the theory of this/);
  assert.match(prompt, /Which statement describes exact unlearning\?/);
  assert.match(prompt, /Question 4/);
  assert.match(prompt, /Question 5/);
  assert.match(prompt, /A short shared passage/);
  assert.match(prompt, /theta = theta - eta \* grad/);
  assert.match(prompt, /\| Method \| Property \|/);
  assert.ok(!prompt.includes('correctOptionIds'));
  assert.ok(!prompt.includes('correctNumericAnswer'));
  assert.ok(!prompt.includes('987654'));
  assert.ok(!prompt.includes('secret-reference'));
  assert.ok(SUMMARY_SYSTEM_PROMPT.includes('Do not state the correct answer'));
});

function sse(events) {
  const body = events
    .map((event) => `event: x\ndata: ${JSON.stringify(event)}\n\n`)
    .join('');
  return new Response(`${body}event: done\ndata: [DONE]\n\n`, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

test('the stream reader accumulates output, ignores thoughts, and sends high thinking', async () => {
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url, init, body: JSON.parse(init.body) };
    return sse([
      {
        event_type: 'step.start',
        index: 1,
        step: {
          type: 'model_output',
          content: [{ type: 'text', text: 'Deep ' }],
        },
      },
      {
        event_type: 'step.delta',
        index: 1,
        delta: { type: 'text', text: 'theory' },
      },
      {
        event_type: 'step.delta',
        index: 1,
        delta: { type: 'thought_summary', content: { text: 'hidden thought' } },
      },
      {
        event_type: 'interaction.completed',
        interaction: {
          status: 'completed',
          usage: { total_tokens: 321, total_thought_tokens: 123 },
        },
      },
    ]);
  };
  const chunks = [];
  const result = await generateWeekSummary({
    apiKey: 'test-key',
    model: 'gemini-3.8-flash',
    prompt: 'prompt',
    onText: (delta) => chunks.push(delta),
  });
  assert.equal(result.text, 'Deep theory');
  assert.equal(result.usage.totalTokens, 321);
  assert.equal(result.usage.thoughtTokens, 123);
  assert.equal(chunks.join(''), 'Deep theory');
  assert.ok(!result.text.includes('hidden thought'));
  assert.match(request.url, /\/v1beta\/interactions$/);
  assert.equal(request.init.headers['x-goog-api-key'], 'test-key');
  assert.equal(request.body.system_instruction, SUMMARY_SYSTEM_PROMPT);
  assert.equal(request.body.stream, true);
  assert.equal(request.body.store, false);
  assert.equal(request.body.generation_config.thinking_level, 'high');
  assert.equal(request.body.generation_config.max_output_tokens, 65536);
});

test('a non-streaming JSON response also yields summary text', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: 'completed',
        steps: [
          {
            type: 'model_output',
            content: [{ type: 'text', text: 'JSON fallback' }],
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  const result = await generateWeekSummary({
    apiKey: 'test-key',
    model: 'gemini-3.8-flash',
    prompt: 'prompt',
  });
  assert.equal(result.text, 'JSON fallback');
});

test('invalid-key errors become a friendly, actionable message', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          error: {
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
          },
        },
      ]),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  await assert.rejects(
    () =>
      generateWeekSummary({
        apiKey: 'bad-key',
        model: 'gemini-3.8-flash',
        prompt: 'prompt',
      }),
    (error) =>
      error instanceof GeminiError &&
      error.status === 400 &&
      /API key was rejected/.test(error.message),
  );
});

test('the settings key test uses low thinking and a tiny output', async () => {
  let body;
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(init.body);
    return new Response(JSON.stringify({ status: 'completed', steps: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  await testGeminiKey('test-key', 'gemini-3.8-flash');
  assert.equal(body.generation_config.thinking_level, 'low');
  assert.equal(body.generation_config.max_output_tokens, 32);
  assert.equal(body.stream, false);
});
