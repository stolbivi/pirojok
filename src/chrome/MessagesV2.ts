import Port = chrome.runtime.Port;

export type Handler<Payload, Response> = (payload: Payload) => Promise<Response>;
export type PayloadAction<Payload> = () => Payload;
export type ActionCreator<Payload, Response> = (payload?: Payload) => Action<Payload, Response>;

export interface Action<Payload, Response> {
  type: string;
  payload: Payload;
  handler: Handler<Payload, Response>;
}

export type Error = {
  error: string;
};

export function createAction<Payload, Response>(
  type: string,
  handler: Handler<Payload, Response>,
): ActionCreator<Payload, Response> {
  function create(...args: any[]): Action<Payload, Response> {
    return {
      type,
      payload: args[0],
      handler,
    };
  }

  create.toString = () => `${type}`;
  create.type = type;
  return create;
}

export type OnConnectListener = (port: Port) => void;

/**
 * Upgraded version of messaging API wrapper. Designed for one time request-response style of communication.
 * Internally cleans up listeners everywhere after receiving response or failing to receive it.
 * You are still responsible to remove connection listener manually on the listening side, see #removeListener
 */
export class MessagesV2 {
  private readonly _verbose: boolean;

  constructor(verbose = false) {
    this._verbose = verbose;
  }

  request<Payload, Response>(action: Action<Payload, Response>) {
    return this.handleRequest<Payload, Response>(action, chrome.runtime.connect({ name: action.type }));
  }

  requestTab<Payload, Response>(tabId: number, action: Action<Payload, Response>) {
    return this.handleRequest<Payload, Response>(action, chrome.tabs.connect(tabId, { name: action.type }));
  }

  private handleRequest<Payload, Response>(action: Action<Payload, Response>, port: Port) {
    return new Promise<Response & Error>((resolve, reject) => {
      const onDisconnect = () => {
        if (chrome.runtime.lastError) {
          try {
            reject(chrome.runtime.lastError.message as string);
          } catch (e) {
            reject('Error handling runtime error: ' + JSON.stringify(e));
          }
        }
        if (this._verbose) {
          console.debug('Removing onDisconnect listener for:', action.type);
        }
        port.onDisconnect.removeListener(onDisconnect);
      };
      port.onDisconnect.addListener(onDisconnect);
      const onMessage = (response: Response & Error) => {
        resolve(response);
        if (this._verbose) {
          console.debug('Removing onMessage listener for:', action.type);
        }
        port.onMessage.removeListener(onMessage);
      };
      port.onMessage.addListener(onMessage);
      port.postMessage(action.payload);
    });
  }

  listen<Payload, Response>(actionCreator: ActionCreator<Payload, Response>): OnConnectListener {
    const onConnect = (port: Port) => {
      const action = actionCreator();
      if (port.name === action.type) {
        const onMessage = (payload: Payload) => {
          action
            .handler(payload)
            .then((response) => {
              if (response) {
                port.postMessage(response);
              }
            })
            .then(() => {
              if (this._verbose) {
                console.debug('Listener completed for:', port.name);
              }
            })
            .catch((e) => console.error(e))
            .finally(() => {
              if (this._verbose) {
                console.debug('Disconnecting port and removing listener');
              }
              port.disconnect();
              port.onMessage.removeListener(onMessage);
            });
        };
        if (this._verbose) {
          console.debug('Adding listener for port:', port.name);
        }
        port.onMessage.addListener(onMessage);
        const onDisconnect = (p: Port) => {
          if (this._verbose) {
            console.debug('Disconnect detected for:', p.name, 'removing listeners');
          }
          p.onMessage.removeListener(onMessage);
          p.onDisconnect.removeListener(onDisconnect);
        };
        port.onDisconnect.addListener(onDisconnect);
      }
    };
    chrome.runtime.onConnect.addListener(onConnect);
    return onConnect;
  }

  removeListener(onConnect: OnConnectListener) {
    if (this._verbose) {
      console.debug('Removing listener');
    }
    chrome.runtime.onConnect.removeListener(onConnect);
  }
}
