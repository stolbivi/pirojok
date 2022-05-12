export class Storage {
  clearStorage() {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.clear(() => {
        console.debug('Storage cleared');
        resolve();
      });
    });
  }

  removeFromStorage(keys: string | string[]) {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.remove(keys, () => {
        console.debug('Removing from storage:', keys);
        resolve();
      });
    });
  }

  saveToStorage(data: object) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, () => {
        console.debug('Storage is updated:', data);
        resolve(data);
      });
    });
  }

  readFromStorage(keys: string | object | string[]) {
    return new Promise((resolve) => {
      console.debug('Reading storage for:', keys);
      chrome.storage.sync.get(keys, (result) => resolve(result));
    });
  }

  clearLocalStorage() {
    return new Promise<void>((resolve) => {
      chrome.storage.local.clear(() => {
        console.debug('Storage cleared');
        resolve();
      });
    });
  }

  removeFromLocalStorage(keys: string | string[]) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove(keys, () => {
        console.debug('Removing from storage:', keys);
        resolve();
      });
    });
  }

  saveToLocalStorage(data: object) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        console.debug('Storage is updated:', data);
        resolve(data);
      });
    });
  }

  readFromLocalStorage(keys: string | object | string[]) {
    return new Promise((resolve) => {
      console.debug('Reading storage for:', keys);
      chrome.storage.local.get(keys, (result) => resolve(result));
    });
  }
}
