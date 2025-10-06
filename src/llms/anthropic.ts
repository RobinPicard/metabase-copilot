import Anthropic from "@anthropic-ai/sdk";

import { apiStatusStreamingCall } from "../types/apiRequests";


export async function* streamRequest(
  modelName: string,
  apiKey: string,
  systemInstruction: string,
  messages: Array<string>,
  maxTokens: number | null = null,
): AsyncGenerator<[string, boolean], void, unknown> {

  const client = new Anthropic({apiKey: apiKey});

  const formattedMessages = messages.map((content) => ({
    role: "user" as const,
    content,
  }));

  try {
    const stream = await client.messages.create({
      model: modelName,
      system: systemInstruction,
      messages: formattedMessages,
      stream: true,
      max_tokens: maxTokens || 8192,
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && "text" in chunk.delta) {
        yield [chunk.delta.text, false];
      }
    }
    
    yield ["", true];
  } catch (error: any) {
    const errorInfo = {
      type: 'unknown_error' as apiStatusStreamingCall,
      message: error.message || 'Unknown error occurred'
    };

    if (error?.status >= 500) {
      errorInfo.type = 'server_error' as apiStatusStreamingCall;
    } else if (error?.status === 429) {
      errorInfo.type = 'rate_limit_exceeded' as apiStatusStreamingCall;
    } else if (error?.status === 401 || error?.status === 403) {
      errorInfo.type = 'invalid' as apiStatusStreamingCall;
    } else {
      errorInfo.type = 'other_error' as apiStatusStreamingCall;
    }

    throw errorInfo;
  }
}
