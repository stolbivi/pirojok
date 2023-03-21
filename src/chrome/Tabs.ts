import Tab = chrome.tabs.Tab;

export class Tabs {
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

  withAllTabs(): Promise<Tab[]> {
    return new Promise<Tab[]>((resolve) => chrome.tabs.query({}, (tabs) => resolve(tabs)));
  }
}
