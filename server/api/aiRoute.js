import { AiService } from "../ai/service.js";
import { isNonEmptyString, isValidMode } from "../ai/types.js";

const aiService = new AiService();

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function toClientError(code, message, status = 400) {
  return {
    status,
    body: {
      error: {
        code,
        message,
      },
    },
  };
}

async function parseJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw toClientError("INVALID_JSON", `JSON parse failed: ${error.message}`, 400);
  }
}

function validatePayload(payload) {
  if (!isValidMode(payload.mode)) {
    throw toClientError("INVALID_MODE", "mode must be one of explain / quiz / grading / free", 400);
  }

  if (!isNonEmptyString(payload.user_message)) {
    throw toClientError("INVALID_USER_MESSAGE", "user_message must be a non-empty string", 400);
  }

  if (payload.mode === "grading" && !payload.active_quiz_data) {
    throw toClientError("MISSING_ACTIVE_QUIZ_DATA", "grading mode requires active_quiz_data", 422);
  }
}

export async function handleAiRoute(req, res) {
  if (req.method !== "POST") {
    jsonResponse(res, 405, {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST is allowed on /api/ai",
      },
    });
    return;
  }

  try {
    const payload = await parseJson(req);
    validatePayload(payload);

    const data = await aiService.execute({
      mode: payload.mode,
      subject: payload.subject ?? null,
      user_message: payload.user_message,
      active_quiz_data: payload.active_quiz_data ?? null,
    });

    jsonResponse(res, 200, {
      data,
      meta: {
        mode: payload.mode,
        provider: aiService.getProviderName(),
      },
    });
  } catch (error) {
    if (error?.body && error?.status) {
      jsonResponse(res, error.status, error.body);
      return;
    }

    jsonResponse(res, 500, {
      error: {
        code: "AI_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Unexpected AI request error",
      },
    });
  }
}
