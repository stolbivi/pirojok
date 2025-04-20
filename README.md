# Pirojok Documentation

Pirojok is a minimalistic TypeScript library designed to simplify the development of Chrome extensions by providing convenient wrappers around common Chrome Extension APIs.

## Installation

```bash
npm install @stolbivi/pirojok
```

## Features

### 1. Chrome Storage Management

The `Storage` class provides methods for managing both sync and local storage in Chrome extensions.

```typescript
import { Storage } from '@stolbivi/pirojok';

const storage = new Storage();

// Sync Storage Operations
await storage.saveToStorage({ key: 'value' });
const data = await storage.readFromStorage('key');
await storage.removeFromStorage('key');
await storage.clearStorage();

// Local Storage Operations
await storage.saveToLocalStorage({ key: 'value' });
const localData = await storage.readFromLocalStorage('key');
await storage.removeFromLocalStorage('key');
await storage.clearLocalStorage();
```

### 2. Tab Management

The `Tabs` class provides methods for working with Chrome browser tabs.

```typescript
import { Tabs } from '@stolbivi/pirojok';

const tabs = new Tabs();

// Get current tab
const currentTab = await tabs.withCurrentTab();
console.log('Current tab:', currentTab);

// Get all tabs
const allTabs = await tabs.withAllTabs();
console.log('All tabs:', allTabs);
```

### 3. Content Injection

The library provides utilities for injecting scripts and iframes into web pages.

```typescript
import { injectScript, injectIframe } from '@stolbivi/pirojok';

// Inject a script file
injectScript('path/to/script.js', 'head');

// Inject an iframe
const iframe = injectIframe('my-iframe', 'https://example.com', document.body);
```

### 4. Dynamic UI Management

The `DynamicUI` class provides utilities for monitoring DOM changes.

```typescript
import { DynamicUI } from '@stolbivi/pirojok';

const dynamicUI = new DynamicUI();

// Watch for DOM changes
const observer = dynamicUI.watch(document.body, {
  childList: true,
  subtree: true,
  onAdd: (node) => {
    console.log('Node added:', node);
  },
  onRemove: (target, node) => {
    console.log('Node removed:', node);
  }
});

// Stop watching
observer.disconnect();
```

### 5. Messaging System

The `Messages` class provides a type-safe way to handle communication between different parts of a Chrome extension.

```typescript
import { Messages, createRequest, createAction } from '@stolbivi/pirojok';

// Define message types
const GetDataRequest = createRequest<{ id: string }, { data: any }>('GET_DATA');
const GetDataAction = createAction('GET_DATA', async (payload) => {
  // Handle the request
  return { data: { id: payload.id, value: 'some data' } };
});

// Set up message handling
const messages = new Messages(true);
messages.listen(GetDataAction);

// Send a request
const response = await messages.request(GetDataRequest({ id: '123' }));
console.log('Response:', response);
```

## Type Safety

The library is built with TypeScript and provides full type safety for all operations. This helps catch errors at compile time and provides better IDE support.

## Error Handling

All asynchronous operations return Promises and include proper error handling. The messaging system automatically cleans up listeners after receiving a response or on failure.

## Best Practices

1. **Storage Management**
   - Use sync storage for user preferences and settings
   - Use local storage for temporary data or large datasets
   - Always handle storage operations asynchronously

2. **Messaging**
   - Define clear message types using the provided type system
   - Handle errors appropriately in message handlers
   - Clean up listeners when they're no longer needed

3. **Content Injection**
   - Be careful with script injection to avoid security issues
   - Use unique IDs for iframes to prevent conflicts
   - Consider CSP (Content Security Policy) restrictions

## License

ISC License - See the LICENSE file for details 