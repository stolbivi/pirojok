/**
 * Type definitions and utilities for Chrome extension messaging system.
 * Provides a type-safe way to handle request-response style communication between different parts of a Chrome extension.
 */

import Port = chrome.runtime.Port;
import MessageSender = chrome.runtime.MessageSender;

/**
 * Type definition for a message handler function
 * @template Payload - Type of the incoming message payload
 * @template Response - Type of the response to be sent back
 */
export type Handler<Payload, Response> = (payload: Payload, sender?: MessageSender) => Promise<Response>;

/**
 * Type definition for a request creator function
 * @template Payload - Type of the request payload
 * @template Response - Type of the expected response
 */
export type RequestCreator<Payload, Response> = { (payload?: Payload): Request<Payload, Response>; type: string };

/**
 * Type definition for an action creator function
 * @template Payload - Type of the action payload
 * @template Response - Type of the response to be sent back
 */
export type ActionCreator<Payload, Response> = { (payload?: Payload): Action<Payload, Response>; type: string };

/**
 * Interface representing a request message
 * @template Payload - Type of the request payload
 * @template Response - Type of the expected response
 */
export interface Request<Payload, Response> {
  type: string;
  payload?: Payload;
  toAction: () => Action<Payload, Response>;
}

/**
 * Interface representing an action that can handle a request
 * @template Payload - Type of the action payload
 * @template Response - Type of the response to be sent back
 */
export interface Action<Payload, Response> {
  type: string;
  payload?: Payload;
  handler: Handler<Payload, Response>;
}

/**
 * Type representing an error response
 */
export type Error = {
  error: string;
};

/**
 * Creates a request creator function for a specific message type
 * @template Payload - Type of the request payload
 * @template Response - Type of the expected response
 * @param type - Unique identifier for the request type
 * @returns A function that creates requests of the specified type
 */
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

/**
 * Creates an action creator function for handling specific message types
 * @template Payload - Type of the action payload
 * @template Response - Type of the response to be sent back
 * @param type - Unique identifier for the action type
 * @param handler - Function that will handle the incoming message
 * @returns A function that creates actions of the specified type
 */
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

/**
 * Creates an action creator from an existing request creator
 * @template Payload - Type of the payload
 * @template Response - Type of the response
 * @param requestCreator - The request creator to base the action on
 * @param handler - Function that will handle the incoming message
 * @returns A function that creates actions matching the request type
 */
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

/**
 * Type definition for a connection listener function
 */
export type OnConnectListener = (port: Port) => void;

/**
 * Enhanced messaging API wrapper for Chrome extensions.
 * Provides a type-safe way to handle request-response communication between different parts of the extension.
 * Automatically cleans up listeners after receiving a response or on failure.
 */
export class Messages {
  private readonly _verbose: boolean;

  /**
   * Creates a new Messages instance
   * @param verbose - Whether to enable verbose logging
   */
  constructor(verbose = false) {
    this._verbose = verbose;
  }

  /**
   * Sends a request to the extension runtime
   * @template Payload - Type of the request payload
   * @template Response - Type of the expected response
   * @param request - The request to send
   * @returns Promise that resolves with the response or rejects with an error
   */
  request<Payload, Response>(request: Request<Payload, Response>) {
    return this.handleRequest<Payload, Response>(request, chrome.runtime.connect({ name: request.type }));
  }

  /**
   * Sends a request to a specific tab
   * @template Payload - Type of the request payload
   * @template Response - Type of the expected response
   * @param tabId - ID of the target tab
   * @param request - The request to send
   * @returns Promise that resolves with the response or rejects with an error
   */
  requestTab<Payload, Response>(tabId: number, request: Request<Payload, Response>) {
    return this.handleRequest<Payload, Response>(request, chrome.tabs.connect(tabId, { name: request.type }));
  }

  /**
   * Handles the request-response cycle for a given port
   * @template Payload - Type of the request payload
   * @template Response - Type of the expected response
   * @param request - The request to send
   * @param port - The port to communicate through
   * @returns Promise that resolves with the response or rejects with an error
   */
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

  /**
   * Sets up a listener for incoming connections of a specific type
   * @template Payload - Type of the incoming message payload
   * @template Response - Type of the response to be sent back
   * @param actionCreator - Function that creates actions for handling messages
   * @returns The connection listener function that was added
   */
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

  /**
   * Removes a previously added connection listener
   * @param onConnect - The listener function to remove
   */
  removeListener(onConnect: OnConnectListener) {
    if (this._verbose) {
      console.debug('Removing listener');
    }
    chrome.runtime.onConnect.removeListener(onConnect);
  }
}
