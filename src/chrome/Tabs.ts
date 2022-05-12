import Tab = chrome.tabs.Tab;

export class Tabs {
  withCurrentTab(): Promise<Tab[]> {
    return new Promise<Tab[]>((resolve) =>
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs)),
    );
  }
}
