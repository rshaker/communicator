# Communicator

![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![License](https://img.shields.io/github/license/rshaker/communicator)
![version](https://img.shields.io/github/package-json/v/rshaker/communicator)

## Overview

Communicator provides a unified API for messaging between background scripts, content scripts, and extension pages, as well as pluggable storage providers. It is compatible with Chromium-based browsers.

## Features

-  **Cross-context Messaging** – Type-safe messaging between background, content, and extension pages
-  **Request-Reply Pattern** – Message correlation and reply support using unique message IDs
-  **Pluggable Storage** – Built-in IndexedDB, in-memory, and messaging-based providers
-  **TypeScript-first** – Full type safety and modern async/await APIs
-  **Extensible & Lightweight** – Minimal dependencies, easy to integrate and extend

## Installation

```bash
npm install @rshaker/communicator
```

## Usage

### Basic Messaging Setup

The `CommMgr` singleton automatically detects the current browser context and registers listeners for incoming messages. Usage is identical in each extension context:

```typescript
import { CommMgr, CommMsg } from "@rshaker/communicator";
import { detectContext } from "@rshaker/context-detect";

console.info(`Startup in context: ${detectContext()}`);

const commMgr = CommMgr.getInstance<CommMsg>();
commMgr.addListener((message) => {
    console.log(`Handled message from ${message?.fromContext}`, message);
});
```

### Sending Messages Between Contexts

```typescript
import { CommMgr, CommMsg } from "@rshaker/communicator";
import { detectContext, BrowserContextType } from "@rshaker/context-detect";

const commMgr = CommMgr.getInstance<CommMsg>();

const currentContext = detectContext();
if (currentContext === BrowserContextType.MAIN_WORLD) {
    // Report mouse coordinates to the background context
    document.addEventListener("mousemove", ({ clientX, clientY }) => {
        const msg: CommMsg = {
            type: "ping",
            id: "pointer-coordinates",
            toContext: BrowserContextType.BACKGROUND_WORKER,
            payload: { entry: { clientX, clientY, timestamp: Date.now() } },
        };
        commMgr.sendMessage(msg);
    });
} else if (currentContext === BrowserContextType.BACKGROUND_WORKER) {
    commMgr.addListener((msg: CommMsg) => {
        if (msg.type === "ping" && msg.id === "pointer-coordinates") {
            console.log("Pointer coordinates received:", msg.payload.entry);
        }
    });
}
```

### Persistent Storage Across Contexts (IndexedDB via MessagingProvider)

Suppose you want to allow content scripts or main-world pages to persist data, but only the background worker has direct access to IndexedDB. You can use `MessagingProvider` in the main-world, and have the background worker act as a bridge to IndexedDB.

**In the background worker:**

```typescript
import { CommMgr, MessagingProvider, IndexedDBProvider } from "@rshaker/communicator";

// Set up the physical IndexedDB provider
const idbStorage = new IndexedDBProvider("communicator", "test");

// Set up the comm manager and messaging provider
const commMgr = CommMgr.getInstance();
const _messagingProvider = new MessagingProvider(commMgr, { idbProvider: idbStorage });
```

**In the main-world (or content script):**

```typescript
import { CommMgr, MessagingProvider } from "@rshaker/communicator";

// Set up the comm manager
const commMgr = CommMgr.getInstance();

// Use MessagingProvider to proxy storage requests to the background worker
const msgStorage = new MessagingProvider(commMgr);

// Add an entry
const id = await msgStorage.add({
    data: {
        message: "User action recorded",
        timestamp: Date.now(),
        level: "info",
    },
});

// List all entries
const entries = await msgStorage.list();
console.log("All entries:", entries);

// Retrieve the entry by its actual ID
const entry = await msgStorage.get(id);
```

## Architecture

Communicator is organized into several core modules:

-  **CommMgr**: Singleton manager for cross-context messaging
-  **PersistProvider**: Interface for pluggable storage providers
-  **IndexedDBProvider**: Persistent storage using browser IndexedDB
-  **InMemoryProvider**: Volatile storage using JavaScript Map
-  **MessagingProvider**: Storage provider using extension messaging (for ephemeral or remote storage)
-  **Context Utilities**: Helpers for detecting and working with browser extension contexts

## Development

### Prerequisites

-   Node.js (22.12.0+)
-   npm (10.9+) or yarn

### Building

```bash
# Clone the repository
git clone https://github.com/rshaker/communicator.git
cd communicator

# Use the correct node version
nvm use

# Install dependencies
npm install

# Generate API documentation
npm run docs

# Build (development library)
npm run build:dev

# Build (web extension)
npm run build:webext

# Run all tests
npm test
```

## Documentation

Full API documentation (generated with TypeDoc) is available under the <a href="https://rshaker.github.io/communicator/docs">docs</a> directory. Auto-generated docs contains class, interface, and type details for all modules.

## License

MIT
