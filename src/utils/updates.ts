/**
 * Extension update notification and version management
 */

interface UpdateInfo {
  previousVersion: string;
  currentVersion: string;
  isNewInstall: boolean;
  isUpdate: boolean;
}

/**
 * Check for extension updates
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  const manifestData = chrome.runtime.getManifest();
  const currentVersion = manifestData.version;

  return new Promise((resolve) => {
    chrome.storage.local.get(['last_known_version'], (result) => {
      const previousVersion = result.last_known_version;

      if (!previousVersion) {
        // New install
        chrome.storage.local.set({ last_known_version: currentVersion });
        resolve({
          previousVersion: '',
          currentVersion,
          isNewInstall: true,
          isUpdate: false
        });
      } else if (previousVersion !== currentVersion) {
        // Update detected
        chrome.storage.local.set({ last_known_version: currentVersion });
        resolve({
          previousVersion,
          currentVersion,
          isNewInstall: false,
          isUpdate: true
        });
      } else {
        // No update
        resolve(null);
      }
    });
  });
}

/**
 * Show update notification
 */
export async function showUpdateNotification(info: UpdateInfo): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      pending_update_notification: info,
      update_notification_shown: false
    }, resolve);
  });
}

/**
 * Get pending update notification
 */
export async function getPendingUpdateNotification(): Promise<UpdateInfo | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['pending_update_notification', 'update_notification_shown'],
      (result) => {
        if (result.pending_update_notification && !result.update_notification_shown) {
          resolve(result.pending_update_notification);
        } else {
          resolve(null);
        }
      }
    );
  });
}

/**
 * Mark update notification as shown
 */
export async function markUpdateNotificationShown(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ update_notification_shown: true }, resolve);
  });
}

/**
 * Get changelog for version
 */
export function getChangelogForVersion(version: string): string[] {
  const changelogs: Record<string, string[]> = {
    '2.0.0': [
      'Real weather integration with OpenWeatherMap',
      'Unsplash image browser with search',
      'Multi-search engine support (6 engines)',
      'Full keyboard shortcuts',
      'Import/Export settings',
      'Dark mode theme',
      'Preset configurations',
      'Accessibility improvements',
      'Enhanced security',
      'Performance optimizations'
    ],
    '1.5.0': [
      'Initial release',
      'Custom backgrounds',
      'Gradient customization',
      'Quick links',
      'Weather widget',
      'Quote rotation'
    ]
  };

  return changelogs[version] || [];
}

/**
 * Schedule backup reminder
 */
export async function scheduleBackupReminder(daysUntilReminder: number = 30): Promise<void> {
  const reminderDate = Date.now() + (daysUntilReminder * 24 * 60 * 60 * 1000);

  return new Promise((resolve) => {
    chrome.storage.local.set({
      backup_reminder_date: reminderDate,
      backup_reminder_dismissed: false
    }, resolve);
  });
}

/**
 * Check if backup reminder is due
 */
export async function isBackupReminderDue(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['backup_reminder_date', 'backup_reminder_dismissed'],
      (result) => {
        if (result.backup_reminder_dismissed) {
          resolve(false);
          return;
        }

        const reminderDate = result.backup_reminder_date || 0;
        resolve(Date.now() >= reminderDate);
      }
    );
  });
}

/**
 * Dismiss backup reminder
 */
export async function dismissBackupReminder(snoozeForDays?: number): Promise<void> {
  if (snoozeForDays) {
    await scheduleBackupReminder(snoozeForDays);
  } else {
    return new Promise((resolve) => {
      chrome.storage.local.set({ backup_reminder_dismissed: true }, resolve);
    });
  }
}
