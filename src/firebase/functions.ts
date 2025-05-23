import { BACKEND_BASE_URL_DEV, BACKEND_BASE_URL_PROD } from '../constants/firebaseBaseUrl';


declare const __FIREBASE_ENV__: string;

const FIREBASE_ENV = __FIREBASE_ENV__ || 'dev';

let baseUrl;
if (FIREBASE_ENV === 'prod') {
  baseUrl = BACKEND_BASE_URL_PROD;
} else {
  baseUrl = BACKEND_BASE_URL_DEV;
}


class FirebaseFunctionsCaller {
  private static instance: FirebaseFunctionsCaller;

  public static getInstance(): FirebaseFunctionsCaller {
    if (!FirebaseFunctionsCaller.instance) {
      FirebaseFunctionsCaller.instance = new FirebaseFunctionsCaller();
    }
    return FirebaseFunctionsCaller.instance;
  }

  public async callFunction<T = any>(
    functionName: string,
    authToken: string,
    method: 'GET' | 'POST',
    data?: any,
  ): Promise<T> {
    const url = new URL(`${baseUrl}/${functionName}`);
  
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  
    const options: RequestInit = {
      method,
      headers,
    };
  
    if (method === 'GET' && data) {
      Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
    } else if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), options);
  
    if (!response.ok) {
      let errorMessage = "";
      try {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.error("Error calling function", data);
          errorMessage = data.error;
        } else {
          // Handle non-JSON responses (like HTML error pages)
          const textResponse = await response.text();
          console.error("Received non-JSON error response:", textResponse);
          errorMessage = `Server returned ${response.status} ${response.statusText}`;
        }
      } catch (error) {
        console.error("Unexpected error occurred", error);
        errorMessage = "An unexpected error occurred, sorry for the inconvenience. Please refresh the page and try again.";
      }
      throw new Error(errorMessage);
    }
  
    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }
    
    return response.json();
  }

  private formatCurlRequest(url: string, options: RequestInit): string {
    let curlCommand = `curl -X ${options.method} '${url}'`;
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        curlCommand += ` -H '${key}: ${value}'`;
      });
    }
    
    if (options.body) {
      curlCommand += ` -d '${options.body}'`;
    }
    
    return curlCommand;
  }

  public callFunctionSSE(functionName: string, authToken: string, data?: any): EventSource {
    const url = new URL(`${baseUrl}/${functionName}`);

    url.searchParams.append('authorization', authToken);
    if (data) {
      Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
    }
  
    const eventSource = new EventSource(url.toString(), {}) as EventSource;
  
    return eventSource;
  }
}

const functions = FirebaseFunctionsCaller.getInstance();


export default functions;
