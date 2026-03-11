import OpenAI from "openai";

function extractOutputText(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const texts = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        texts.push(content.text);
      }
    }
  }

  const merged = texts.join("").trim();
  return merged || null;
}

function extractRefusalText(response) {
  const refusals = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content?.type === "refusal" && typeof content.refusal === "string") {
        refusals.push(content.refusal);
      }
    }
  }

  const merged = refusals.join(" ").trim();
  return merged || null;
}

function buildTextFormat(responseSchema) {
  return {
    type: "json_schema",
    name: responseSchema.name,
    schema: responseSchema.schema,
    strict: true,
  };
}

export class OpenAiStructuredProvider {
  constructor({
    apiKey,
    model = "gpt-5-mini",
    client = null,
  }) {
    this.apiKey = apiKey;
    this.model = model;
    this.providerName = "openai";
    this.client = client ?? new OpenAI({ apiKey: this.apiKey });
  }

  async generate({ payload, systemPrompt, responseSchema }) {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: systemPrompt,
      input: payload.user_message,
      store: false,
      text: {
        format: buildTextFormat(responseSchema),
      },
    });

    if (response?.output_parsed && typeof response.output_parsed === "object") {
      return response.output_parsed;
    }

    const refusal = extractRefusalText(response);
    if (refusal) {
      throw new Error(`OpenAI Responses API refused request: ${refusal}`);
    }

    const text = extractOutputText(response);
    if (!text) {
      throw new Error("OpenAI Responses API returned empty structured content");
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`OpenAI structured response parse failed: ${error.message}`);
    }
  }
}
