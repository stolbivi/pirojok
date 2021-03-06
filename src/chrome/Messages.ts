export type MessageError = {
  error: string;
};

export class Messages {
  private handlePort<M, R>(
    name: string,
    message: M,
    port: chrome.runtime.Port,
    resolve: (_: string) => void,
    reject: (_: string) => void,
    responder?: (response: R & MessageError) => void,
  ) {
    const onDisconnectListener = () => {
      if (chrome.runtime.lastError) {
        try {
          reject(chrome.runtime.lastError.message as string);
        } catch (e) {
          reject('Error handling runtime error: ' + JSON.stringify(e));
        }
      } else {
        resolve('Disconnected port for: ' + name);
      }
      console.debug('Removing onDisconnect listener for:', name);
      port.onDisconnect.removeListener(onDisconnectListener);
    };
    port.onDisconnect.addListener(onDisconnectListener);
    if (responder) {
      const listener = (response: R & MessageError) => {
        responder(response);
        console.debug('Removing onMessage listener for:', name);
        port.onMessage.removeListener(listener);
      };
      port.onMessage.addListener(listener);
    }
    port.postMessage(message);
  }

  runtimeMessage<M, R>(name: string, message: M, responder?: (response: R & MessageError) => void) {
    return new Promise((resolve, reject) => {
      const port = chrome.runtime.connect({ name });
      this.handlePort(name, message, port, resolve, reject, responder);
    });
  }

  tabMessage<M, R>(tabId: number, name: string, message: M, responder?: (response: R & MessageError) => void) {
    return new Promise((resolve, reject) => {
      const port = chrome.tabs.connect(tabId, { name });
      this.handlePort(name, message, port, resolve, reject, responder);
    });
  }

  onMessage<M>(name: string, listener: (message: M, port: chrome.runtime.Port) => Promise<M>) {
    const onConnectListener = (port: chrome.runtime.Port) => {
      if (port.name === name) {
        const onMessageListener = (message: M) => {
          listener(message, port)
            .then(() => console.debug('Listener completed for:', port.name))
            .catch((e) => {
              console.error(e);
            })
            .finally(() => {
              console.debug('Disconnecting port and removing listener for:', name);
              port.disconnect();
              port.onMessage.removeListener(onMessageListener);
            });
        };
        console.debug('Adding listener for port:', port.name);
        port.onMessage.addListener(onMessageListener);
        const onDisconnectListener = (p: chrome.runtime.Port) => {
          console.debug('Disconnect detected for:', p.name, 'removing listeners');
          p.onMessage.removeListener(onMessageListener);
          p.onDisconnect.removeListener(onDisconnectListener);
        };
        port.onDisconnect.addListener(onDisconnectListener);
      }
    };
    chrome.runtime.onConnect.addListener(onConnectListener);
    return onConnectListener;
  }

  removeOnMessage(name: string, listener: any) {
    console.debug('Removing listener for:', name);
    chrome.runtime.onConnect.removeListener(listener);
  }
}
