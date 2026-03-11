import { PromptBuilder } from "./promptBuilder.js";
import { MockLlmProvider } from "./providers/mockProvider.js";
import { OpenAiStructuredProvider } from "./providers/openaiProvider.js";

export class LlmClient {
  constructor({ provider, promptBuilder } = {}) {
    this.promptBuilder = promptBuilder ?? new PromptBuilder();
    this.provider = provider ?? this.createDefaultProvider();
  }

  createDefaultProvider() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (apiKey) {
      return new OpenAiStructuredProvider({
        apiKey,
        model: "gpt-5-mini",
      });
    }

    return new MockLlmProvider();
  }

  getProviderName() {
    return this.provider?.providerName ?? "mock";
  }

  async generate(payload) {
    const systemPrompt = this.promptBuilder.buildSystemPrompt(payload);
    const responseSchema = this.promptBuilder.buildResponseSchema(payload.mode);

    return this.provider.generate({
      payload,
      systemPrompt,
      responseSchema,
    });
  }
}
