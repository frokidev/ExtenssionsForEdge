# Edge Compact Vertical Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight Manifest V3 Microsoft Edge extension that provides a fixed-width, icon-only vertical tab manager in Edge's Side Panel that does not expand on hover.

**Architecture:** Vanilla HTML5, CSS3, and JavaScript running inside Edge's `chrome.sidePanel`. A background service worker configures opening behavior, and the side panel listens to `chrome.tabs` events to keep the tab list and audio state synchronized in real-time.

**Tech Stack:** Chrome / Microsoft Edge Extension Manifest V3, Vanilla JavaScript, CSS3.

## Global Constraints
- Target platform: Microsoft Edge (Chromium Manifest V3).
- Fixed width sidebar: 50px (no expanding on hover).
- Zero dependencies: No Node modules or bundlers required.

---

### Task 1: Extension Manifest and Icons

**Files:**
- Create: `manifest.json`
- Create: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

**Interfaces:**
- Produces: `manifest.json` configuring `side_panel.default_path: "sidepanel/sidepanel.html"`, permissions: `["sidePanel", "tabs"]`, and background service worker.

- [ ] **Step 1: Create icon generation script**

Create `scripts/generate_icons.js` to generate solid dark-themed icon PNGs for sizes 16, 48, and 128.

```javascript
// scripts/generate_icons.js
const fs = require('fs');
const path = require('path');
// Uses standard pure node or canvas/svg to base64 if needed
```

- [ ] **Step 2: Generate PNG icons and verify files exist**

Run: `node scripts/generate_icons.js`
Expected: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` created.

- [ ] **Step 3: Create `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Edge Compact Vertical Tabs",
  "version": "1.0.0",
  "description": "Fixed-width vertical tabs for Edge sidebar without hover expansion.",
  "permissions": [
    "sidePanel",
    "tabs"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "Open Compact Vertical Tabs"
  },
  "side_panel": {
    "default_path": "sidepanel/sidepanel.html"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add manifest.json icons/ scripts/
git commit -m "feat: setup extension manifest and icons"
```

---

### Task 2: Background Service Worker

**Files:**
- Create: `background.js`

**Interfaces:**
- Produces: Service worker that calls `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.

- [ ] **Step 1: Write `background.js`**

```javascript
// background.js
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error enabling side panel on action click:", error));
```

- [ ] **Step 2: Verify `background.js` syntax**

Run: `node -c background.js`
Expected: Syntax OK.

- [ ] **Step 3: Commit**

```bash
git add background.js
git commit -m "feat: add background service worker for side panel opening"
```

---

### Task 3: Side Panel HTML & CSS Layout

**Files:**
- Create: `sidepanel/sidepanel.html`
- Create: `sidepanel/sidepanel.css`

**Interfaces:**
- Produces: 50px fixed-width container, dark theme styling matching Edge, tab item layouts, audio badge positioning, floating tooltip.

- [ ] **Step 1: Write `sidepanel/sidepanel.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compact Tabs</title>
  <link rel="stylesheet" href="sidepanel.css">
</head>
<body>
  <div id="sidebar-container">
    <div id="tabs-list" role="tablist"></div>
    <div class="divider"></div>
    <button id="new-tab-btn" title="New tab (Ctrl+T)" aria-label="New tab">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>

  <div id="tab-tooltip" class="tooltip hidden" role="tooltip">
    <span id="tooltip-title"></span>
    <button id="tooltip-close" title="Close tab" aria-label="Close tab">&times;</button>
  </div>

  <script src="sidepanel.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `sidepanel/sidepanel.css`**

Implement fixed width (50px), dark theme colors, tab item styling, audio speaker icon, active indicator, and floating tooltip styles.

- [ ] **Step 3: Commit**

```bash
git add sidepanel/sidepanel.html sidepanel/sidepanel.css
git commit -m "feat: create side panel layout and css styles"
```

---

### Task 4: Tab Synchronization & Event Handling

**Files:**
- Create: `sidepanel/sidepanel.js`

**Interfaces:**
- Produces: Real-time tab sync (`onCreated`, `onUpdated`, `onActivated`, `onRemoved`, `onMoved`), audio muting toggle, middle-click close, hover tooltip.

- [ ] **Step 1: Implement tab rendering & Chrome API listeners in `sidepanel.js`**

Implement:
- `loadTabs()` querying `chrome.tabs.query({ currentWindow: true })`.
- `createTabElement(tab)` creating DOM icon, favicon, audio badge.
- Event listeners for `tabs.onCreated`, `tabs.onUpdated`, `tabs.onActivated`, `tabs.onRemoved`, `tabs.onMoved`.
- Audio mute toggle on speaker icon click.
- Tab click to activate.
- Middle click to remove tab.
- Hover handlers for floating tooltip with close button.
- "+ New tab" button event listener.

- [ ] **Step 2: Verify `sidepanel.js` syntax**

Run: `node -c sidepanel/sidepanel.js`
Expected: Syntax OK.

- [ ] **Step 3: Commit**

```bash
git add sidepanel/sidepanel.js
git commit -m "feat: implement side panel tab synchronization and interactions"
```

---

### Task 5: Documentation & Installation Guide

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: Clear, step-by-step instructions for loading the unpacked extension into Microsoft Edge and how to configure Edge's native sidebar and vertical tabs for the best experience.

- [ ] **Step 1: Create `README.md`**

Document:
1. How to load unpacked extension in `edge://extensions`.
2. How to open the Side Panel via extension icon or Edge sidebar.
3. How to position the sidebar on the left side in Edge settings (`edge://settings/appearance`).
4. How to turn off native vertical tabs to prevent redundancy.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add installation and usage guide"
```
