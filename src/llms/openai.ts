import {OpenAI} from "openai";
import {ChatCompletionMessageParam} from "openai/resources/chat";

import { apiStatusStreamingCall } from "../types/apiRequests";


export async function* streamRequest(
  modelName: string,
  apiKey: string,
  systemInstruction: string,
  messages: Array<string>,
  maxTokens: number | null = null,
): AsyncGenerator<[string, boolean], void, unknown> {

  const client = new OpenAI({apiKey: apiKey, dangerouslyAllowBrowser: true});

  const formattedMessages: ChatCompletionMessageParam[] = [
    {role: "system", content: systemInstruction},
    ...messages.map<ChatCompletionMessageParam>((content) => ({role: "user", content})),
  ];

  try {
    const stream = await client.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
      stream: true,
      max_tokens: maxTokens || 8192,
    });

    for await (const chunk of stream) {
      yield [chunk.choices[0]?.delta?.content || "", false];
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
