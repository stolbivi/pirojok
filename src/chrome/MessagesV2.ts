import Port = chrome.runtime.Port;
import MessageSender = chrome.runtime.MessageSender;

export type Handler<Payload, Response> = (payload: Payload, sender?: MessageSender) => Promise<Response>;
export type RequestCreator<Payload, Response> = { (payload?: Payload): Request<Payload, Response>; type: string };
export type ActionCreator<Payload, Response> = { (payload?: Payload): Action<Payload, Response>; type: string };

export interface Request<Payload, Response> {
  type: string;
  payload?: Payload;
  toAction: () => Action<Payload, Response>;
}

export interface Action<Payload, Response> {
  type: string;
  payload?: Payload;
  handler: Handler<Payload, Response>;
}

export type Error = {
  error: string;
};

export function createRequest<Payload, Response>(type: string): RequestCreator<Payload, Response> {
  function create(payload?: Payload): Request<Payload, Response> {
    const request = {
      type,
      payload,
    };
    return {
      ...request,
      toAction: () => request as Action<Payload, Response>,
    };
  }

  create.toString = () => `${type}`;
  create.type = type;
  return create;
}

export function createAction<Payload, Response>(
  type: string,
  handler: Handler<Payload, Response>,
): ActionCreator<Payload, Response> {
  function create(payload?: Payload): Action<Payload, Response> {
    return {
      type,
      payload: payload ?? undefined,
      handler,
    };
  }

  create.toString = () => `${type}`;
  create.type = type;
  return create;
}

export function createFromRequest<Payload, Response>(
  requestCreator: RequestCreator<Payload, Response>,
  handler: Handler<Payload, Response>,
): ActionCreator<Payload, Response> {
  function create(payload?: Payload): Action<Payload, Response> {
    return {
      type: requestCreator.type,
      payload,
      handler,
    };
  }

  create.toString = () => `${requestCreator.type}`;
  create.type = requestCreator.type;
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

  request<Payload, Response>(request: Request<Payload, Response>) {
    return this.handleRequest<Payload, Response>(request, chrome.runtime.connect({ name: request.type }));
  }

  requestTab<Payload, Response>(tabId: number, request: Request<Payload, Response>) {
    return this.handleRequest<Payload, Response>(request, chrome.tabs.connect(tabId, { name: request.type }));
  }

  private handleRequest<Payload, Response>(request: Request<Payload, Response>, port: Port) {
    return new Promise<Response & Error>((resolve, reject) => {
      const onDisconnect = () => {
        try {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError.message as string);
          }
        } catch (e) {
          reject('Error handling runtime error: ' + JSON.stringify(e));
        }
        if (this._verbose) {
          console.debug('Removing onDisconnect listener for:', request.type);
        }
        port.onDisconnect.removeListener(onDisconnect);
      };
      port.onDisconnect.addListener(onDisconnect);
      const onMessage = (response: Response & Error) => {
        resolve(response);
        if (this._verbose) {
          console.debug('Removing onMessage listener for:', request.type);
        }
        port.onMessage.removeListener(onMessage);
      };
      port.onMessage.addListener(onMessage);
      try {
        port.postMessage(request.payload);
      } catch (e) {
        reject('Error posting message: ' + JSON.stringify(e));
      }
    });
  }

  listen<Payload, Response>(actionCreator: ActionCreator<Payload, Response>): OnConnectListener {
    const onConnect = (port: Port) => {
      const action = actionCreator();
      if (port.name === action.type) {
        const onMessage = (payload: Payload) => {
          action
            .handler(payload, port.sender)
            .then((response) => {
              try {
                port.postMessage(response);
              } catch (e) {
                console.error('Error posting response:', JSON.stringify(e));
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
