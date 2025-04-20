import Tab = chrome.tabs.Tab;

/**
 * A utility class for interacting with Chrome browser tabs.
 * Provides methods to query and work with the current tab and all tabs.
 */
export class Tabs {
  /**
   * Retrieves the currently active tab in the current window.
   * @returns A promise that resolves to the current tab or null if no tab is found.
   */
  withCurrentTab(): Promise<Tab | null> {
    return new Promise<Tab | null>((resolve) =>
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => resolve(tabs?.length > 0 ? tabs[0] : null),
      ),
    );
  }

  /**
   * Retrieves all tabs across all windows.
   * @returns A promise that resolves to an array of all tabs.
   */
  withAllTabs(): Promise<Tab[]> {
    return new Promise<Tab[]>((resolve) => chrome.tabs.query({}, (tabs) => resolve(tabs)));
  }
}
