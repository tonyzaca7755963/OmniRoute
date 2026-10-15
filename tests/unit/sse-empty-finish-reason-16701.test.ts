import test from "node:test";
import assert from "node:assert/strict";

import { normalizeOpenAICompatibleFinishReason } from "../../open-sse/utils/finishReason.ts";
import { sanitizeStreamingChunk } from "../../open-sse/handlers/responseSanitizer.ts";
import { createPassthroughStreamWithLogger } from "../../open-sse/utils/stream.ts";

// ── 1. Unit tests for normalizeOpenAICompatibleFinishReason ──────────────────

test("normalizeOpenAICompatibleFinishReason: empty and whitespace-only strings normalize to null", () => {
  assert.equal(normalizeOpenAICompatibleFinishReason(""), null);
  assert.equal(normalizeOpenAICompatibleFinishReason("   "), null);
  assert.equal(normalizeOpenAICompatibleFinishReason("\t\n "), null);
});

test("normalizeOpenAICompatibleFinishReason: preserves null, standard, mapped, and unknown values", () => {
  assert.equal(normalizeOpenAICompatibleFinishReason(null), null);
  assert.equal(normalizeOpenAICompatibleFinishReason("stop"), "stop");
  assert.equal(normalizeOpenAICompatibleFinishReason("STOP"), "stop");
  assert.equal(normalizeOpenAICompatibleFinishReason("max_tokens"), "length");
  assert.equal(normalizeOpenAICompatibleFinishReason("safety"), "content_filter");
  assert.equal(normalizeOpenAICompatibleFinishReason("tool_calls"), "tool_calls");
  assert.equal(normalizeOpenAICompatibleFinishReason("unknown_abort_val"), "unknown_abort_val");
});

// ── 2. Sanitizer tests for sanitizeStreamingChunk ───────────────────────────

test("sanitizeStreamingChunk: converts empty/whitespace finish_reason in partial chunk to null", () => {
  const chunkEmpty = {
    id: "chatcmpl-test-1",
    object: "chat.completion.chunk",
    created: 1700000000,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: { content: "partial content" },
        finish_reason: "",
      },
    ],
  };

  const sanitizedEmpty = sanitizeStreamingChunk(chunkEmpty) as any;
  assert.equal(
    sanitizedEmpty.choices[0].finish_reason,
    null,
    "Empty string finish_reason must normalize to null"
  );
  assert.equal(sanitizedEmpty.choices[0].delta.content, "partial content");

  const chunkWhitespace = {
    id: "chatcmpl-test-2",
    object: "chat.completion.chunk",
    created: 1700000000,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: { content: "partial content 2" },
        finish_reason: "   ",
      },
    ],
  };

  const sanitizedWhitespace = sanitizeStreamingChunk(chunkWhitespace) as any;
  assert.equal(
    sanitizedWhitespace.choices[0].finish_reason,
    null,
    "Whitespace finish_reason must normalize to null"
  );
});

test("sanitizeStreamingChunk: preserves tool_calls and handles terminal finish_reason", () => {
  const partialToolCallChunk = {
    id: "chatcmpl-test-tool",
    object: "chat.completion.chunk",
    created: 1700000000,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: {
          tool_calls: [
            {
              index: 0,
              id: "call_123",
              type: "function",
              function: { name: "search", arguments: '{"q":' },
            },
          ],
        },
        finish_reason: "",
      },
    ],
  };

  const sanitizedTool = sanitizeStreamingChunk(partialToolCallChunk) as any;
  assert.equal(
    sanitizedTool.choices[0].finish_reason,
    null,
    "In-flight tool_calls chunk with empty finish_reason must become null"
  );
  assert.equal(sanitizedTool.choices[0].delta.tool_calls.length, 1);
  assert.equal(sanitizedTool.choices[0].delta.tool_calls[0].id, "call_123");

  const terminalToolCallChunk = {
    id: "chatcmpl-test-tool-term",
    object: "chat.completion.chunk",
    created: 1700000000,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "tool_calls",
      },
    ],
  };

  const sanitizedTermTool = sanitizeStreamingChunk(terminalToolCallChunk) as any;
  assert.equal(
    sanitizedTermTool.choices[0].finish_reason,
    "tool_calls",
    "Terminal tool_calls finish_reason must be preserved"
  );

  const omittedFinishReasonChunk = {
    id: "chatcmpl-test-omit",
    object: "chat.completion.chunk",
    created: 1700000000,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: { content: "streaming..." },
      },
    ],
  };

  const sanitizedOmitted = sanitizeStreamingChunk(omittedFinishReasonChunk) as any;
  assert.equal(
    sanitizedOmitted.choices[0].finish_reason,
    undefined,
    "Omitted finish_reason should remain omitted"
  );
});

// ── 3. Offline passthrough stream with strict consumer ───────────────────────

async function runPassthrough(rawSSE: string): Promise<string> {
  const transform = createPassthroughStreamWithLogger(
    "test-provider",
    null,
    null,
    "test-model",
    "conn-16701",
    { model: "test-model" }
  );

  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readAll = (async () => {
    const out: string[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out.push(decoder.decode(value));
    }
    return out.join("");
  })();

  await writer.write(encoder.encode(rawSSE));
  await writer.close();

  return readAll;
}

function parseDataEvents(raw: string): Record<string, unknown>[] {
  const events: Record<string, unknown>[] = [];
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      events.push(JSON.parse(payload) as Record<string, unknown>);
    } catch {}
  }
  return events;
}

test("offline passthrough stream: non-terminal chunks with empty/whitespace finish_reason emit null to strict consumer", async () => {
  const chunk1 = {
    id: "chatcmpl-stream-1",
    object: "chat.completion.chunk",
    created: 1700000000,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: { content: "Hello" },
        finish_reason: "",
      },
    ],
  };

  const chunk2 = {
    id: "chatcmpl-stream-1",
    object: "chat.completion.chunk",
    created: 1700000001,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: { content: " world" },
        finish_reason: "   ",
      },
    ],
  };

  const chunk3 = {
    id: "chatcmpl-stream-1",
    object: "chat.completion.chunk",
    created: 1700000002,
    model: "test-model",
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "stop",
      },
    ],
  };

  const rawSSE = [
    `data: ${JSON.stringify(chunk1)}\n\n`,
    `data: ${JSON.stringify(chunk2)}\n\n`,
    `data: ${JSON.stringify(chunk3)}\n\n`,
    "data: [DONE]\n\n",
  ].join("");

  const result = await runPassthrough(rawSSE);
  const events = parseDataEvents(result);

  const choiceEvents = events.filter(
    (e) => Array.isArray((e as any).choices) && (e as any).choices.length > 0
  );
  assert.equal(choiceEvents.length, 3, "Expected 3 choice chunks emitted");

  // Strict consumer check: finish_reason MUST NOT be empty or whitespace string
  for (const event of choiceEvents) {
    const choice = (event as any).choices[0];
    if (choice && choice.finish_reason !== null && choice.finish_reason !== undefined) {
      assert.notEqual(
        choice.finish_reason,
        "",
        "Strict consumer: finish_reason must not be empty string"
      );
      assert.notEqual(
        typeof choice.finish_reason === "string" && choice.finish_reason.trim() === "",
        true,
        "Strict consumer: finish_reason must not be whitespace string"
      );
    }
  }

  // Exact assertions for chunk1, chunk2, chunk3
  const c1 = (choiceEvents[0] as any).choices[0];
  const c2 = (choiceEvents[1] as any).choices[0];
  const c3 = (choiceEvents[2] as any).choices[0];

  assert.equal(c1.finish_reason, null, "chunk1 finish_reason must be null, not empty string");
  assert.equal(c2.finish_reason, null, "chunk2 finish_reason must be null, not whitespace string");
  assert.equal(c3.finish_reason, "stop", "chunk3 terminal finish_reason must be 'stop'");
});
