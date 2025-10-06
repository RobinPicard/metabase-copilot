import {GoogleGenerativeAI} from "@google/generative-ai";

import { apiStatusStreamingCall } from "../types/apiRequests";


export async function* streamRequest(
  modelName: string,
  apiKey: string,
  systemInstruction: string,
  messages: Array<string>,
  maxTokens: number | null = null,
): AsyncGenerator<[string, boolean], void, unknown> {

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
    generationConfig: {
      maxOutputTokens: maxTokens || 8192,
    }
  });

  try {
    const responseStream = await model.generateContentStream(messages);

    for await (const chunk of responseStream.stream) {
      yield [chunk.text(), false];
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
