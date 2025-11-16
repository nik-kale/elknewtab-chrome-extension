/**
 * Settings import/export manager
 */

export interface ExportedSettings {
  version: string;
  exportDate: string;
  settings: Record<string, any>;
  backgrounds?: Array<{ id: string; url: string; type: string }>;
}

/**
 * Export all settings to JSON file
 */
export async function exportSettings(): Promise<void> {
  try {
    // Get all data from storage
    const syncData = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get(null);

    const exported: ExportedSettings = {
      version: '1.5.0',
      exportDate: new Date().toISOString(),
      settings: syncData,
      backgrounds: localData.backgrounds || []
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elk-newtab-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export settings:', error);
    throw error;
  }
}

/**
 * Import settings from JSON file
 */
export async function importSettings(file: File): Promise<void> {
  try {
    const text = await file.text();
    const imported: ExportedSettings = JSON.parse(text);

    // Validate structure
    if (!imported.version || !imported.settings) {
      throw new Error('Invalid settings file format');
    }

    // Import settings to sync storage
    await chrome.storage.sync.set(imported.settings);

    // Import backgrounds to local storage if present
    if (imported.backgrounds && imported.backgrounds.length > 0) {
      await chrome.storage.local.set({ backgrounds: imported.backgrounds });
    }

    console.log('Settings imported successfully');
  } catch (error) {
    console.error('Failed to import settings:', error);
    throw error;
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    console.log('Settings reset successfully');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
}

/**
 * Get storage usage information
 */
export async function getStorageInfo(): Promise<{
  syncUsed: number;
  syncQuota: number;
  localUsed: number;
  localQuota: number;
}> {
  try {
    const syncUsed = await chrome.storage.sync.getBytesInUse();
    const localUsed = await chrome.storage.local.getBytesInUse();

    return {
      syncUsed,
      syncQuota: chrome.storage.sync.QUOTA_BYTES,
      localUsed,
      localQuota: chrome.storage.local.QUOTA_BYTES
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      syncUsed: 0,
      syncQuota: 102400, // Default Chrome sync quota
      localUsed: 0,
      localQuota: 5242880 // Default Chrome local quota
    };
  }
}
