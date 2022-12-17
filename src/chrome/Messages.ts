import Port = chrome.runtime.Port;

export type MessageError = {
  error: string;
};

export interface TMessage {
  type: number;
}

type ConnectionListener = (port: Port) => void;
type OnResponse<R> = (response: R & MessageError) => void;
type OnRequest<M extends TMessage, R> = (message: M) => Promise<R>;
type Handler<M extends TMessage, R> = { [key: number]: OnRequest<M, R> };

/**
 * Chrome Messaging API wrapped into an easy to use framework.
 */
export class Messages {
  private readonly _channelId: string;
  private readonly _verbose: boolean;

  /**
   * Requires a unique identifier used to group all messages in one channel.
   * Listeners and senders on channels with different ids cannot communicate
   * @param channelId
   */
  constructor(channelId: string, verbose = false) {
    if (channelId) {
      this._channelId = channelId;
      this._verbose = verbose;
    } else {
      throw new Error('Channel id has to be non-empty string');
    }
  }

  private handlePort<M extends TMessage, R>(
    message: M,
    port: Port,
    resolve: (_: string) => void,
    reject: (_: string) => void,
    responder?: OnResponse<R>,
  ) {
    const onDisconnectListener = () => {
      if (chrome.runtime.lastError) {
        try {
          reject(chrome.runtime.lastError.message as string);
        } catch (e) {
          reject('Error handling runtime error: ' + JSON.stringify(e));
        }
      } else {
        resolve('Disconnected port for: ' + this._channelId);
      }
      if (this._verbose) {
        console.debug('Removing onDisconnect listener for:', this._channelId);
      }
      port.onDisconnect.removeListener(onDisconnectListener);
    };
    port.onDisconnect.addListener(onDisconnectListener);
    if (responder) {
      const listener = (response: R & MessageError) => {
        responder(response);
        if (this._verbose) {
          console.debug('Removing onMessage listener for:', this._channelId);
        }
        port.onMessage.removeListener(listener);
      };
      port.onMessage.addListener(listener);
    }
    port.postMessage(message);
  }

  /**
   * Send a message from anywhere to anywhere except content script of a tab. There must be at least one listener created by using onMessage
   * @param message object of type <b>M</b> to send to listeners
   * @param receiver callback used to receive replies from listeners as an object of type <b>R</b>
   */
  request<M extends TMessage, R>(message: M, onResponse?: OnResponse<R>) {
    return new Promise((resolve, reject) => {
      const port = chrome.runtime.connect({ name: this._channelId });
      this.handlePort(message, port, resolve, reject, onResponse);
    });
  }

  /**
   * Send a message from anywhere to content script of a specific tab. There must be at least one listener created by using onMessage
   * @param message object of type <b>M</b> to send to listeners
   * @param receiver callback used to receive replies from listeners as an object of type <b>R</b>
   */
  requestTab<M extends TMessage, R>(tabId: number, message: M, onResponse?: OnResponse<R>) {
    return new Promise((resolve, reject) => {
      const port = chrome.tabs.connect(tabId, { name: this._channelId });
      this.handlePort(message, port, resolve, reject, onResponse);
    });
  }

  /**
   * Add listener to messages anywhere, including content scripts of tabs. Each handler corresponds to specific request type. If handler returns anything but false/null/undefined, this will be sent back to requester
   * @param onRequest
   */
  listen<M extends TMessage, R>(handler: Handler<M, R>): ConnectionListener {
    const onConnectListener = (port: Port) => {
      if (port.name === this._channelId) {
        const onMessageListener = (message: M) => {
          const onRequest = handler[message.type];
          if (onRequest) {
            onRequest(message)
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
                  console.debug('Disconnecting port and removing listener for:', this._channelId);
                }
                port.disconnect();
                port.onMessage.removeListener(onMessageListener);
              });
          }
        };
        if (this._verbose) {
          console.debug('Adding listener for port:', port.name);
        }
        port.onMessage.addListener(onMessageListener);
        const onDisconnectListener = (p: Port) => {
          if (this._verbose) {
            console.debug('Disconnect detected for:', p.name, 'removing listeners');
          }
          p.onMessage.removeListener(onMessageListener);
          p.onDisconnect.removeListener(onDisconnectListener);
        };
        port.onDisconnect.addListener(onDisconnectListener);
      }
    };
    chrome.runtime.onConnect.addListener(onConnectListener);
    return onConnectListener;
  }

  /**
   * Remove previously created with onMessage listener
   * @param listener
   */
  removeListener(listener: ConnectionListener) {
    if (this._verbose) {
      console.debug('Removing listener for:', this._channelId);
    }
    chrome.runtime.onConnect.removeListener(listener);
  }
}
