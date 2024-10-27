import getFirebaseAuthToken from '../chromeMessaging/getFirebaseAuthToken';
import functions from '../firebase/functions'


function backendStreamingRequest(
  endpointName: string,
  payload: Object,
  streamContentCallback: (content: string, done: boolean) => void,
  errorCallback: (errorMessage: string) => void
) {

  async function postRequest(token: string) {

    const eventSource = functions.callFunctionSSE(endpointName, token, payload)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message === "[DONE]") {
        streamContentCallback('', true);
        eventSource.close();
      } else {
        streamContentCallback(data.message, false);
      }
    }
  
    eventSource.onerror = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.error("An error occurred", data);
        errorCallback(data.error);
      } catch (error) {
        console.error("Unexpected error occurred", error);
        errorCallback("An unexpected error occurred, sorry for the inconvenience! Please try again later.");
      }
      eventSource.close();
    };

    const closeHandler = () => {
      streamContentCallback('', true);
    };
    eventSource.addEventListener('close', closeHandler);
 
    return () => {
      eventSource.close();
      eventSource.removeEventListener('close', closeHandler);
    };

  }

  getFirebaseAuthToken().then(token => {
    if (token) {
      postRequest(token);
    } else {
      errorCallback("No logged in user found. Sign in with the extension popup to use Metabase Copilot");
    }
  }).catch(error => {
    console.error("Error getting Firebase token saaaaad", error);
    errorCallback("No logged in user found. Sign in with the extension popup to use Metabase Copilot");
  });

}


export default backendStreamingRequest;
