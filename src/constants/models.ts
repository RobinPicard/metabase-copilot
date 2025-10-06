interface ProviderModelsConfig {
  [key: string]: {
    displayName: string;
    models: Record<string, {
      apiName?: string;
      displayName?: string;
      contextWindow?: number;
      isThinkingModel?: boolean;
    }>;
  };
}

export const providerModelsConfigs: ProviderModelsConfig = {
  gemini: {
    displayName: "Gemini",
    models: {
      "gemini-2.5-pro": {
        apiName: "gemini-2.5-pro",
        displayName: "Gemini 2.5 Pro",
        contextWindow: 1048576,
        isThinkingModel: true,
      },
      "gemini-2.5-flash": {
        apiName: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        contextWindow: 1048576,
        isThinkingModel: true,
      },
      "gemini-2.0-flash": {
        apiName: "gemini-2.0-flash",
        displayName: "Gemini 2.0 Flash",
        contextWindow: 1048576,
        isThinkingModel: false,
      },
    }
  },
  openai: {
    displayName: "OpenAI",
    models: {
      "gpt-4o": {
        apiName: "gpt-4o",
        displayName: "GPT-4o",
        contextWindow: 128000,
        isThinkingModel: false,
      },
      "gpt-4o-mini": {
        apiName: "gpt-4o-mini",
        displayName: "GPT-4o Mini",
        contextWindow: 128000,
        isThinkingModel: false,
      },
      "gpt-4.1": {
        apiName: "gpt-4.1",
        displayName: "GPT-4.1",
        contextWindow: 1047576,
        isThinkingModel: false,
      },
      "gpt-4.1-mini": {
        apiName: "gpt-4.1-mini",
        displayName: "GPT-4.1 Mini",
        contextWindow: 1047576,
        isThinkingModel: false,
      },
      "o3": {
        apiName: "o3",
        displayName: "o3",
        contextWindow: 1047576,
        isThinkingModel: true,
      },
      "o3-mini": {
        apiName: "o3-mini",
        displayName: "o3-mini",
        contextWindow: 200000,
        isThinkingModel: true,
      },
      "o4-mini": {
        apiName: "o4-mini",
        displayName: "o4-mini",
        contextWindow: 200000,
        isThinkingModel: true,
      },
    }
  },
  anthropic: {
    displayName: "Anthropic",
    models: {
      "claude-haiku-3-5": {
        apiName: "claude-3-5-haiku-latest",
        displayName: "Claude 3.5 Haiku",
        contextWindow: 200000,
        isThinkingModel: false,
      },
      "claude-sonnet-4-0": {
        apiName: "claude-sonnet-4-0",
        displayName: "Claude 4 Sonnet",
        contextWindow: 200000,
        isThinkingModel: true,
      },
      "claude-opus-4-1": {
        apiName: "claude-opus-4-1",
        displayName: "Claude 4.1 Opus",
        contextWindow: 200000,
        isThinkingModel: true,
      },
    }
  },
}
