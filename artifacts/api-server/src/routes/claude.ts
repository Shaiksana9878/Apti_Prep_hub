import { Router, type IRouter } from "express";

const router: IRouter = Router();
const MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_PROMPT_LENGTH = 24_000;
const MAX_MESSAGES = 24;

function normalizeMessages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_MESSAGES)
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        !!message &&
        typeof message === "object" &&
        "role" in message &&
        "content" in message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_PROMPT_LENGTH),
    }));
}

router.post("/claude", async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "AI study features are temporarily unavailable.",
      code: "AI_NOT_CONFIGURED",
    });
  }

  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const messages = normalizeMessages(req.body?.messages);

  if (!prompt && messages.length === 0) {
    return res.status(400).json({
      error: "A prompt or conversation is required.",
      code: "AI_REQUEST_ERROR",
    });
  }

  const system =
    typeof req.body?.system === "string"
      ? req.body.system.trim().slice(0, MAX_PROMPT_LENGTH)
      : undefined;

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        ...(system ? { system } : {}),
        messages:
          messages.length > 0
            ? messages
            : [
                {
                  role: "user",
                  content: prompt.slice(0, MAX_PROMPT_LENGTH),
                },
              ],
      }),
    });

    if (!response.ok) {
      req.log.warn({ status: response.status }, "Anthropic request failed");
      return res.status(502).json({
        error: "The AI service could not complete that request.",
        code: "AI_UPSTREAM_ERROR",
      });
    }

    const data: unknown = await response.json();
    const content = data && typeof data === "object" && "content" in data
      ? data.content
      : undefined;
    const text = Array.isArray(content)
      ? content
          .filter(
            (block): block is { type: "text"; text: string } =>
              !!block &&
              typeof block === "object" &&
              "type" in block &&
              "text" in block &&
              block.type === "text" &&
              typeof block.text === "string",
          )
          .map((block) => block.text)
          .join("\n")
          .trim()
      : "";

    if (!text) {
      return res.status(502).json({
        error: "The AI returned an empty response. Please try again.",
        code: "AI_EMPTY_RESPONSE",
      });
    }

    return res.json({ text });
  } catch (error) {
    req.log.error({ err: error }, "Unexpected AI request error");
    return res.status(502).json({
      error: "We couldn't reach the AI service. Please try again.",
      code: "AI_NETWORK_ERROR",
    });
  }
});

export default router;