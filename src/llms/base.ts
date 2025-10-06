import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as gemini from "./gemini";
import {providerModelsConfigs} from "../constants/models";


const LETTERS_PER_TOKEN = 3.5;

// In case of error, return an error containing a "type" and a "message"
// type: "other", "invalid", "server_error"
// message: the error message

export async function* streamResponse(
  provider: string,
  modelName: string,
  apiKey: string,
  systemInstruction: string,
  messages: Array<string>,
  maxTokens: number | null = null,
): AsyncGenerator<[string, boolean], void, unknown> {

  const providerConfig = providerModelsConfigs[provider];
  if (!providerConfig) {
    const errorInfo = {
      type: 'other_error' as string,
      message: `Unknown provider: ${provider}`
    };
    throw errorInfo;
  }

  const modelConfig = providerConfig.models[modelName];
  if (!modelConfig) {
    const errorInfo = {
      type: 'other_error' as string,
      message: `Unknown model: ${modelName} for provider: ${provider}`
    };
    throw errorInfo;
  }

  const contextWindow = modelConfig.contextWindow;
  const modelApiName = modelConfig.apiName;

  // Calculate total message length and truncate if necessary
  const totalLength = (messages.reduce((acc, msg) => acc + msg.length, 0) + systemInstruction.length) / LETTERS_PER_TOKEN;
  if (totalLength > contextWindow) {
    const availableTokens = contextWindow - (messages.reduce((acc, msg) => acc + msg.length, 0) / LETTERS_PER_TOKEN);
    const maxSystemChars = Math.floor(availableTokens * LETTERS_PER_TOKEN);
    systemInstruction = systemInstruction.slice(0, maxSystemChars);
  }

  switch (provider) {
    case "openai":
      yield* openai.streamRequest(modelApiName, apiKey, systemInstruction, messages, maxTokens);
      break;
    case "anthropic":
      yield* anthropic.streamRequest(modelApiName, apiKey, systemInstruction, messages, maxTokens);
      break;
    case "gemini":
      yield* gemini.streamRequest(modelApiName, apiKey, systemInstruction, messages, maxTokens);
      break;
  }
}


export async function generateResponse(
  provider: string,
  modelName: string,
  apiKey: string,
  systemInstruction: string,
  messages: Array<string>,
  maxTokens: number | null = null,
) {
  const generator = streamResponse(provider, modelName, apiKey, systemInstruction, messages, maxTokens);
  let response = "";
  for await (const chunk of generator) {
    response += chunk;
  }
  return response;
}


export async function testConnection(
  provider: string,
  modelName: string,
  apiKey: string,
) {
  await generateResponse(provider, modelName, apiKey, "", ["Test"], 1);
  return true;
}
