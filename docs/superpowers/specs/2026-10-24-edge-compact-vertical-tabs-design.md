# Design Spec: Edge Compact Vertical Tabs Extension

## 1. Overview
Microsoft Edge provides a native "Vertical Tabs" feature, but when collapsed into an icon strip, hovering over it forces the pane to slide out / expand to show tab titles. Users who want a fixed-width, favicon-only strip without accidental or intrusive hover-expansion cannot disable this in Edge native settings.

This project creates a Microsoft Edge extension utilizing the `chrome.sidePanel` API to render a fixed-width, icon-only vertical tab strip that mimics Edge's collapsed vertical tab appearance while strictly preventing auto-expansion on hover.

## 2. Architecture & File Structure

The project follows standard Chromium / Microsoft Edge Manifest V3 architecture with pure HTML5, CSS3, and Vanilla JavaScript (no bundlers or node_modules needed).

```text
d:/Data/Workspace/
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-10-24-edge-compact-vertical-tabs-design.md
├── manifest.json
├── background.js
├── sidepanel/
│   ├── sidepanel.html
│   ├── sidepanel.css
│   └── sidepanel.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Components:
- **`manifest.json`**: Declares Manifest V3, permissions (`sidePanel`, `tabs`), and background service worker. Configures `side_panel.default_path` to point to `sidepanel/sidepanel.html`.
- **`background.js`**: Background service worker. Sets side panel behavior (`chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`) so clicking the extension toolbar icon opens the side panel in the active window.
- **`sidepanel/sidepanel.html`**: Layout structure container:
  - Top header area (collapse indicator / status).
  - Main scrollable tab list container (`#tabs-container`).
  - Separator line.
  - Action footer containing the "+ New tab" button (`#new-tab-btn`).
  - Floating custom tooltip element (`#tab-tooltip`) positioned dynamically beside hovered tabs.
- **`sidepanel/sidepanel.css`**: Strict fixed-width styling matching Microsoft Edge's dark theme:
  - Background color: `#202020` / `#1b1b1b`.
  - Border and separators: `#383838`.
  - Width: Fixed `50px`, `box-sizing: border-box`, `overflow-x: hidden`.
  - Smooth transitions on active tab highlights and audio badges.
  - Floating tooltip styles: dark card with border, small close button `x`.
- **`sidepanel/sidepanel.js`**: Pure vanilla state synchronization with Chrome tabs API:
  - Tab rendering & DOM caching.
  - Event listeners: `chrome.tabs.onCreated`, `chrome.tabs.onUpdated`, `chrome.tabs.onActivated`, `chrome.tabs.onRemoved`, `chrome.tabs.onMoved`.
  - Audio mute/unmute toggle handling on speaker badge click.
  - Middle click tab closing.
  - Tooltip positioning and hover debouncing.

## 3. UI/UX Specifications

### 3.1 Sidebar Dimensions & Layout
- Width: Fixed `50px`. Cannot be expanded by hovering.
- Items are stacked vertically, centered with 4px gap.
- Scrollbar: Invisible or ultra-thin custom scrollbar (`scrollbar-width: thin`, subtle thumb color).

### 3.2 Tab Item Elements
Each tab item contains:
- **Container**: `40px x 40px`, rounded corners (`radius: 6px`).
- **Favicon**: `20px x 20px`, centered. Fallback to a default generic globe / page SVG icon if the tab doesn't have a favicon (e.g. `edge://` or `chrome://` URLs, or blank pages).
- **Active State**: Distinct background color (`#3b3b3b` or `#2d3748`) with an accent left border pill (color `#4cc2ff` or `#0078d4` matching Edge styling).
- **Audio Indicator Badge**:
  - Visible when `tab.audible === true` or `tab.mutedInfo?.muted === true`.
  - Position: Small badge overlaid or floating over the icon.
  - Shows volume speaker icon (animated or static). If muted, shows speaker with slash or lowered opacity.
  - Clicking directly on the audio badge toggles mute (`chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted })`) without switching tabs.

### 3.3 New Tab Button
- Located after a subtle horizontal divider (`1px solid #383838`).
- Plus `+` icon centered in a `40px x 40px` circular or rounded button.
- Clicking calls `chrome.tabs.create({})`.

### 3.4 Floating Tooltip
- Appears on hover next to the tab (on the right side of the side panel, or inside the panel if constrained).
- Displays:
  - Full tab title (truncated gracefully with ellipsis if > 50 characters).
  - Quick close button `×` on the right side of the tooltip.
- Tooltip does NOT expand the sidebar itself.

## 4. Tab Events & Synchronization Logic

1. **Initial Load**:
   - `chrome.tabs.query({ currentWindow: true })` retrieves all tabs in current window.
   - Renders tab items in order.
2. **`tabs.onCreated(tab)`**:
   - Adds new DOM element at specified `tab.index`.
3. **`tabs.onUpdated(tabId, changeInfo, tab)`**:
   - Updates favicon (`changeInfo.favIconUrl`), title (`changeInfo.title`), or audio status (`changeInfo.audible`, `changeInfo.mutedInfo`).
4. **`tabs.onActivated(activeInfo)`**:
   - Removes `.active` class from previous tab, adds `.active` class to new tab, scrolls into view if out of viewport.
5. **`tabs.onRemoved(tabId)`**:
   - Removes tab DOM element.
6. **`tabs.onMoved(tabId, moveInfo)`**:
   - Re-inserts DOM element to match the updated `moveInfo.toIndex`.

## 5. Error Handling & Edge Cases
- **Internal Pages (`edge://`, `chrome://`, `view-source:`)**: Edge restricts favicons or scripts on some internal pages; fallback SVG icon is rendered if `favIconUrl` is missing or fails to load (`img.onerror`).
- **Multiple Windows**: `chrome.tabs.query({ currentWindow: true })` ensures only the tabs of the active window in which the side panel is running are displayed.
- **Audio indicator events**: Some tabs play short audio bursts; audio icon state toggles seamlessly without flashing the entire tab item.

## 6. Verification Plan
- Load unpacked extension into Microsoft Edge (`edge://extensions`).
- Open Side Panel in Edge (clicking extension icon or Edge sidebar).
- Test opening, closing, switching tabs, middle-clicking, and creating tabs via `+`.
- Verify tab playing audio (e.g. YouTube or Discord) shows speaker icon and clicking it mutes/unmutes.
- Verify hovering over any icon only shows the compact tooltip and does NOT expand the panel.
