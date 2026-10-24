// sidepanel/sidepanel.js

(function () {
  'use strict';

  let currentWindowId = null;
  let hoveredTabId = null;
  let tooltipHideTimeout = null;

  const tabsList = document.getElementById('tabs-list');
  const newTabBtn = document.getElementById('new-tab-btn');
  const tooltip = document.getElementById('tab-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipClose = document.getElementById('tooltip-close');

  // Fallback SVG icon when favicon is missing or fails to load
  const FALLBACK_ICON_SVG = `
    <svg class="tab-icon-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  `;

  // Speaker icons for audio states
  const SPEAKER_PLAYING_SVG = `
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
  `;

  const SPEAKER_MUTED_SVG = `
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
  `;

  /**
   * Initializes the side panel by querying the current window and all its tabs.
   */
  async function init() {
    try {
      const currentWin = await chrome.windows.getCurrent();
      currentWindowId = currentWin.id;
      await renderTabs();
      setupEventListeners();
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }

  /**
   * Fetches all tabs for the current window and populates the tab list.
   */
  async function renderTabs() {
    tabsList.innerHTML = '';
    const tabs = await chrome.tabs.query({ windowId: currentWindowId });
    for (const tab of tabs) {
      const tabEl = createTabElement(tab);
      tabsList.appendChild(tabEl);
    }
  }

  /**
   * Creates a DOM element representing a single tab item.
   */
  function createTabElement(tab) {
    const item = document.createElement('div');
    item.className = 'tab-item';
    item.dataset.tabId = tab.id;
    item.setAttribute('role', 'tab');
    item.setAttribute('aria-selected', tab.active ? 'true' : 'false');

    if (tab.active) {
      item.classList.add('active');
    }

    // Favicon image or fallback icon
    if (tab.favIconUrl && isValidFaviconUrl(tab.favIconUrl)) {
      const img = document.createElement('img');
      img.className = 'tab-favicon';
      img.src = tab.favIconUrl;
      img.alt = '';
      img.onerror = () => {
        img.remove();
        item.insertAdjacentHTML('afterbegin', FALLBACK_ICON_SVG);
      };
      item.appendChild(img);
    } else {
      item.insertAdjacentHTML('afterbegin', FALLBACK_ICON_SVG);
    }

    // Audio status badge
    updateAudioBadge(item, tab);

    // Left click: activate tab
    item.addEventListener('click', (e) => {
      // Do not activate tab if clicking audio badge
      if (e.target.closest('.audio-badge')) return;
      chrome.tabs.update(tab.id, { active: true });
    });

    // Middle click: close tab
    item.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        chrome.tabs.remove(tab.id);
      }
    });

    // Hover events for floating tooltip
    item.addEventListener('mouseenter', () => showTooltip(item, tab.id));
    item.addEventListener('mouseleave', () => scheduleHideTooltip());

    return item;
  }

  /**
   * Helper to check if a favicon URL is safe/valid to load
   */
  function isValidFaviconUrl(url) {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('chrome-extension://');
  }

  /**
   * Updates or creates the audio mute/unmute badge for a tab.
   */
  function updateAudioBadge(tabElement, tab) {
    const isAudible = Boolean(tab.audible);
    const isMuted = Boolean(tab.mutedInfo && tab.mutedInfo.muted);

    let badge = tabElement.querySelector('.audio-badge');

    if (isAudible || isMuted) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'audio-badge';
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.tabs.update(tab.id, { muted: !isMuted });
        });
        tabElement.appendChild(badge);
      }

      badge.classList.toggle('muted', isMuted);
      badge.title = isMuted ? 'Unmute tab' : 'Mute tab';
      badge.innerHTML = isMuted ? SPEAKER_MUTED_SVG : SPEAKER_PLAYING_SVG;
      tabElement.classList.add('playing-audio');
    } else {
      if (badge) {
        badge.remove();
      }
      tabElement.classList.remove('playing-audio');
    }
  }

  /**
   * Shows the floating tooltip alongside the hovered tab item.
   */
  async function showTooltip(tabElement, tabId) {
    clearTimeout(tooltipHideTimeout);
    hoveredTabId = tabId;

    try {
      const tab = await chrome.tabs.get(tabId);
      tooltipTitle.textContent = tab.title || 'Untitled Tab';

      const rect = tabElement.getBoundingClientRect();
      const sidebarWidth = document.body.clientWidth;

      // Position tooltip cleanly to the right of the tab icon, or inside if panel is wide
      let leftPos = rect.right + 6;
      if (leftPos + 180 > sidebarWidth && rect.left > 180) {
        // If constrained on right, position on the left
        leftPos = rect.left - 180;
      }
      let topPos = rect.top + (rect.height / 2) - 15;

      // Constrain top within viewport
      topPos = Math.max(6, Math.min(topPos, window.innerHeight - 36));

      tooltip.style.left = `${Math.max(4, leftPos)}px`;
      tooltip.style.top = `${topPos}px`;
      tooltip.classList.remove('hidden');
    } catch {
      // Tab might have been closed immediately
      hideTooltip();
    }
  }

  function scheduleHideTooltip() {
    tooltipHideTimeout = setTimeout(() => {
      hideTooltip();
    }, 120);
  }

  function hideTooltip() {
    tooltip.classList.add('hidden');
    hoveredTabId = null;
  }

  /**
   * Attaches listeners for tab events and user actions.
   */
  function setupEventListeners() {
    // New Tab button
    newTabBtn.addEventListener('click', () => {
      chrome.tabs.create({ windowId: currentWindowId });
    });

    // Tooltip close button
    tooltipClose.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hoveredTabId) {
        chrome.tabs.remove(hoveredTabId);
        hideTooltip();
      }
    });

    // Cancel hide when mouse enters tooltip
    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(tooltipHideTimeout);
    });

    // Hide tooltip when mouse leaves tooltip
    tooltip.addEventListener('mouseleave', () => {
      scheduleHideTooltip();
    });

    // Tab Created
    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.windowId !== currentWindowId) return;
      const tabEl = createTabElement(tab);
      const existingTabs = tabsList.children;
      if (tab.index < existingTabs.length) {
        tabsList.insertBefore(tabEl, existingTabs[tab.index]);
      } else {
        tabsList.appendChild(tabEl);
      }
    });

    // Tab Updated (Favicon, Title, Audio, Muted)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (tab.windowId !== currentWindowId) return;

      const tabEl = tabsList.querySelector(`[data-tab-id="${tabId}"]`);
      if (!tabEl) return;

      // Update favicon if changed
      if ('favIconUrl' in changeInfo) {
        const existingImg = tabEl.querySelector('.tab-favicon');
        const existingFallback = tabEl.querySelector('.tab-icon-fallback');

        if (tab.favIconUrl && isValidFaviconUrl(tab.favIconUrl)) {
          if (existingImg) {
            existingImg.src = tab.favIconUrl;
          } else {
            if (existingFallback) existingFallback.remove();
            const img = document.createElement('img');
            img.className = 'tab-favicon';
            img.src = tab.favIconUrl;
            img.alt = '';
            img.onerror = () => {
              img.remove();
              tabEl.insertAdjacentHTML('afterbegin', FALLBACK_ICON_SVG);
            };
            tabEl.insertBefore(img, tabEl.firstChild);
          }
        } else if (!existingFallback) {
          if (existingImg) existingImg.remove();
          tabEl.insertAdjacentHTML('afterbegin', FALLBACK_ICON_SVG);
        }
      }

      // Update audio badge
      if ('audible' in changeInfo || 'mutedInfo' in changeInfo) {
        updateAudioBadge(tabEl, tab);
      }

      // Update title in tooltip if active
      if (hoveredTabId === tabId && 'title' in changeInfo) {
        tooltipTitle.textContent = tab.title || 'Untitled Tab';
      }
    });

    // Tab Activated
    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (activeInfo.windowId !== currentWindowId) return;

      // Remove active class from old tab
      const prevActive = tabsList.querySelector('.tab-item.active');
      if (prevActive) {
        prevActive.classList.remove('active');
        prevActive.setAttribute('aria-selected', 'false');
      }

      // Add active class to new tab
      const currentActive = tabsList.querySelector(`[data-tab-id="${activeInfo.tabId}"]`);
      if (currentActive) {
        currentActive.classList.add('active');
        currentActive.setAttribute('aria-selected', 'true');
        currentActive.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });

    // Tab Removed
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      if (removeInfo.windowId !== currentWindowId) return;

      const tabEl = tabsList.querySelector(`[data-tab-id="${tabId}"]`);
      if (tabEl) {
        tabEl.remove();
      }

      if (hoveredTabId === tabId) {
        hideTooltip();
      }
    });

    // Tab Moved / Reordered
    chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
      if (moveInfo.windowId !== currentWindowId) return;

      const tabEl = tabsList.querySelector(`[data-tab-id="${tabId}"]`);
      if (!tabEl) return;

      const children = Array.from(tabsList.children);
      const targetEl = children[moveInfo.toIndex];

      if (targetEl) {
        if (moveInfo.fromIndex < moveInfo.toIndex) {
          targetEl.after(tabEl);
        } else {
          targetEl.before(tabEl);
        }
      } else {
        tabsList.appendChild(tabEl);
      }
    });
  }

  // Start initialization on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
