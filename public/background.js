/**
 * Background service worker for Elk New Tab
 */

// Installation and update handling
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First time install
    await handleFirstInstall();
  } else if (details.reason === 'update') {
    // Extension updated
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;
    await handleUpdate(previousVersion, currentVersion);
  }

  // Setup context menus
  setupContextMenus();
});

/**
 * Handle first install
 */
async function handleFirstInstall() {
  const currentVersion = chrome.runtime.getManifest().version;

  await chrome.storage.local.set({
    first_install_date: new Date().toISOString(),
    last_known_version: currentVersion,
    onboarding_required: true
  });

  // Open new tab to show onboarding
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
}

/**
 * Handle extension update
 */
async function handleUpdate(previousVersion, currentVersion) {
  console.log(`Updating from ${previousVersion} to ${currentVersion}`);

  // Check if migration is needed
  if (previousVersion && previousVersion.startsWith('1.')) {
    await chrome.storage.local.set({
      migration_required: true,
      previous_version: previousVersion
    });
  }

  // Store update notification
  await chrome.storage.local.set({
    pending_update_notification: {
      previousVersion,
      currentVersion,
      isUpdate: true
    },
    update_notification_shown: false,
    last_known_version: currentVersion
  });
}

/**
 * Setup context menus
 */
function setupContextMenus() {
  // Remove all existing menus
  chrome.contextMenus.removeAll(() => {
    // Add "Set as background" for images
    chrome.contextMenus.create({
      id: 'set-image-as-background',
      title: 'Set as background in Elk New Tab',
      contexts: ['image']
    });

    // Add "Add to quick links" for links
    chrome.contextMenus.create({
      id: 'add-to-quick-links',
      title: 'Add to Elk New Tab quick links',
      contexts: ['link']
    });

    // Add "Open settings" in page context
    chrome.contextMenus.create({
      id: 'open-settings',
      title: 'Elk New Tab Settings',
      contexts: ['page']
    });
  });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'set-image-as-background') {
    handleSetImageAsBackground(info.srcUrl);
  } else if (info.menuItemId === 'add-to-quick-links') {
    handleAddToQuickLinks(info.linkUrl, info.selectionText);
  } else if (info.menuItemId === 'open-settings') {
    handleOpenSettings();
  }
});

/**
 * Set image as background
 */
async function handleSetImageAsBackground(imageUrl) {
  try {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result;

      // Save to storage
      const result = await chrome.storage.sync.get(['backgrounds']);
      const backgrounds = result.backgrounds || [];

      backgrounds.push({
        id: Date.now().toString(),
        url: base64data,
        type: 'image'
      });

      await chrome.storage.sync.set({
        backgrounds,
        backgroundType: 'image',
        backgroundImage: base64data
      });

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Background Updated',
        message: 'Image has been set as your background!'
      });
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Failed to set image as background:', error);
  }
}

/**
 * Add to quick links
 */
async function handleAddToQuickLinks(url, title) {
  try {
    const result = await chrome.storage.sync.get(['quickLinks']);
    const quickLinks = result.quickLinks || [];

    // Generate a simple icon (first letter of title)
    const icon = title ? title[0].toUpperCase() : '🔗';

    quickLinks.push({
      id: Date.now().toString(),
      name: title || new URL(url).hostname,
      url: url,
      icon: icon
    });

    await chrome.storage.sync.set({ quickLinks });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Quick Link Added',
      message: `Added "${title || url}" to quick links!`
    });
  } catch (error) {
    console.error('Failed to add quick link:', error);
  }
}

/**
 * Open settings
 */
function handleOpenSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html?openSettings=true') });
}

/**
 * Periodic tasks (every 30 minutes)
 */
chrome.alarms.create('periodic-tasks', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodic-tasks') {
    performPeriodicTasks();
  }
});

/**
 * Perform periodic maintenance tasks
 */
async function performPeriodicTasks() {
  // Check storage quota
  const syncBytesInUse = await chrome.storage.sync.getBytesInUse();
  const localBytesInUse = await chrome.storage.local.getBytesInUse();

  const syncQuota = chrome.storage.sync.QUOTA_BYTES;
  const localQuota = chrome.storage.local.QUOTA_BYTES;

  const syncPercentage = (syncBytesInUse / syncQuota) * 100;
  const localPercentage = (localBytesInUse / localQuota) * 100;

  // Warn if storage is getting full
  if (syncPercentage > 90) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Storage Warning',
      message: `Sync storage is ${syncPercentage.toFixed(0)}% full. Consider cleaning up old data.`,
      priority: 2
    });
  }

  if (localPercentage > 90) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Storage Warning',
      message: `Local storage is ${localPercentage.toFixed(0)}% full. Consider removing old backgrounds.`,
      priority: 2
    });
  }

  // Check for backup reminders
  const { backup_reminder_date, backup_reminder_dismissed } = await chrome.storage.local.get([
    'backup_reminder_date',
    'backup_reminder_dismissed'
  ]);

  if (!backup_reminder_dismissed && backup_reminder_date && Date.now() >= backup_reminder_date) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Backup Reminder',
      message: 'Time to backup your Elk New Tab settings!',
      buttons: [
        { title: 'Backup Now' },
        { title: 'Remind Later' }
      ]
    });
  }
}

/**
 * Handle notification clicks
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Backup Now
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?action=backup') });
  } else if (buttonIndex === 1) {
    // Remind Later (30 days)
    const reminderDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
    chrome.storage.local.set({ backup_reminder_date: reminderDate });
  }
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'keep-alive') {
    sendResponse({ status: 'alive' });
  }
  return true;
});

console.log('Elk New Tab background service worker loaded');
