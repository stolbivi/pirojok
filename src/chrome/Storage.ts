/**
 * A utility class for managing Chrome extension storage operations.
 * Provides methods for both sync and local storage operations.
 */
export class Storage {
  /**
   * Clears all data from Chrome's sync storage.
   * @returns A promise that resolves when the storage is cleared
   */
  clearStorage() {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.clear(() => {
        console.debug('Storage cleared');
        resolve();
      });
    });
  }

  /**
   * Removes specific keys from Chrome's sync storage.
   * @param keys - A single key or array of keys to remove from storage
   * @returns A promise that resolves when the keys are removed
   */
  removeFromStorage(keys: string | string[]) {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.remove(keys, () => {
        console.debug('Removing from storage:', keys);
        resolve();
      });
    });
  }

  /**
   * Saves data to Chrome's sync storage.
   * @param data - The data object to store
   * @returns A promise that resolves with the stored data
   */
  saveToStorage(data: object) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, () => {
        console.debug('Storage is updated:', data);
        resolve(data);
      });
    });
  }

  /**
   * Reads data from Chrome's sync storage.
   * @param keys - A single key, array of keys, or object with default values
   * @returns A promise that resolves with the retrieved data
   */
  readFromStorage(keys: string | object | string[]) {
    return new Promise((resolve) => {
      console.debug('Reading storage for:', keys);
      chrome.storage.sync.get(keys, (result) => resolve(result));
    });
  }

  /**
   * Clears all data from Chrome's local storage.
   * @returns A promise that resolves when the storage is cleared
   */
  clearLocalStorage() {
    return new Promise<void>((resolve) => {
      chrome.storage.local.clear(() => {
        console.debug('Storage cleared');
        resolve();
      });
    });
  }

  /**
   * Removes specific keys from Chrome's local storage.
   * @param keys - A single key or array of keys to remove from storage
   * @returns A promise that resolves when the keys are removed
   */
  removeFromLocalStorage(keys: string | string[]) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove(keys, () => {
        console.debug('Removing from storage:', keys);
        resolve();
      });
    });
  }

  /**
   * Saves data to Chrome's local storage.
   * @param data - The data object to store
   * @returns A promise that resolves with the stored data
   */
  saveToLocalStorage(data: object) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        console.debug('Storage is updated:', data);
        resolve(data);
      });
    });
  }

  /**
   * Reads data from Chrome's local storage.
   * @param keys - A single key, array of keys, or object with default values
   * @returns A promise that resolves with the retrieved data
   */
  readFromLocalStorage(keys: string | object | string[]) {
    return new Promise((resolve) => {
      console.debug('Reading storage for:', keys);
      chrome.storage.local.get(keys, (result) => resolve(result));
    });
  }
}
