interface ReduxState {
  qb?: {
    card?: {
      dataset_query?: {
        native?: {
          query?: string;
        };
        database?: string;
      };
    };
    queryResults?: Array<{ error?: string }>;
  };
};

interface Window {
  Metabase: {
    store: any;
  }
}


let reduxStore = window.Metabase.store;

if (reduxStore) {
  let latestQueryContent: string | undefined = undefined;
  let latestQueryError: string | undefined = undefined;
  let latestDatabaseSelected: string | undefined = undefined;

  // triggered by each update of the store, check whether the fields that interest us have changed
  const onReduxStoreStateUpdate = (): void => {
    const state: ReduxState = reduxStore.getState();
    const queryContent: string | undefined = state.qb?.card?.dataset_query?.native?.query;

    if (queryContent !== latestQueryContent) {
      sendMessage(queryContent, 'METABASE_CHATGPT_QUERY_CONTENT_STATE');
      latestQueryContent = queryContent;
    }

    const queryError: string | undefined = state.qb?.queryResults ? state.qb?.queryResults[0]?.error : undefined;
    if (queryError !== latestQueryError) {
      sendMessage(queryError, 'METABASE_CHATGPT_QUERY_ERROR_STATE');
      latestQueryError = queryError;
    }

    const databaseSelected: string | undefined = state.qb?.card?.dataset_query?.database;
    if (databaseSelected !== latestDatabaseSelected) {
      sendMessage(databaseSelected, 'METABASE_CHATGPT_DATABASE_SELECTED_STATE');
      latestDatabaseSelected = databaseSelected;
    }
  };

  // Send updates of the store's state via postMessage
  const sendMessage = (content: string | undefined, type: string): void => {
    window.postMessage({
      type: type,
      payload: content
    }, '*');
  };

  reduxStore.subscribe(onReduxStoreStateUpdate);
  
  // Send initial state when script is loaded
  onReduxStoreStateUpdate();
}
