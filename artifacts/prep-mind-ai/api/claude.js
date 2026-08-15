const MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_PROMPT_LENGTH = 24000;
const MAX_MESSAGES = 24;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function normalizeMessages(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_MESSAGES)
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_PROMPT_LENGTH),
    }));
}

function getRequestPayload(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request.");
  }

  const prompt =
    typeof body.prompt === "string" ? body.prompt.trim() : "";
  const messages = normalizeMessages(body.messages);

  if (!prompt && messages.length === 0) {
    throw new Error("A prompt or conversation is required.");
  }

  const system =
    typeof body.system === "string"
      ? body.system.trim().slice(0, MAX_PROMPT_LENGTH)
      : undefined;

  return {
    system,
    messages: messages.length > 0
      ? messages
      : [{ role: "user", content: prompt.slice(0, MAX_PROMPT_LENGTH) }],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "This endpoint only accepts POST requests." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(res, 503, {
      error: "AI study features are temporarily unavailable.",
      code: "AI_NOT_CONFIGURED",
    });
  }

  try {
    const payload = getRequestPayload(req.body);
    const anthropicResponse = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        ...(payload.system ? { system: payload.system } : {}),
        messages: payload.messages,
      }),
    });

    if (!anthropicResponse.ok) {
      return json(res, 502, {
        error: "The AI service could not complete that request.",
        code: "AI_UPSTREAM_ERROR",
      });
    }

    const data = await anthropicResponse.json();
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((block) => block?.type === "text")
          .map((block) => block.text)
          .join("\n")
          .trim()
      : "";

    if (!text) {
      return json(res, 502, {
        error: "The AI returned an empty response. Please try again.",
        code: "AI_EMPTY_RESPONSE",
      });
    }

    return json(res, 200, { text });
  } catch (error) {
    return json(res, 400, {
      error:
        error instanceof Error && error.message === "Invalid request."
          ? error.message
          : "We couldn't process that request. Please try again.",
      code: "AI_REQUEST_ERROR",
    });
  }
}