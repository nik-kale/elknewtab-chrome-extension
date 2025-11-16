/**
 * Migration utilities for upgrading from v1.x to v2.x
 */

interface MigrationResult {
  success: boolean;
  backup?: any;
  errors?: string[];
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['version'], (result) => {
      const currentVersion = result.version || '1.0.0';
      const needsUpdate = currentVersion.startsWith('1.');
      resolve(needsUpdate);
    });
  });
}

/**
 * Backup current data before migration
 */
export async function backupData(): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (syncData) => {
      chrome.storage.local.get(null, (localData) => {
        const backup = {
          timestamp: Date.now(),
          version: '1.5.0',
          syncData,
          localData
        };

        // Save backup to local storage
        chrome.storage.local.set({
          'migration_backup': backup,
          'migration_backup_date': new Date().toISOString()
        });

        resolve(backup);
      });
    });
  });
}

/**
 * Migrate data from v1.x to v2.x
 */
export async function migrateData(): Promise<MigrationResult> {
  try {
    // Backup first
    const backup = await backupData();

    // Get current data
    const data: any = await new Promise((resolve) => {
      chrome.storage.sync.get(null, resolve);
    });

    // Migrations
    const migrated: any = { ...data };

    // Add default values for new features
    if (!migrated.searchEngine) {
      migrated.searchEngine = 'google';
    }

    if (!migrated.weatherApiKey) {
      migrated.weatherApiKey = '';
    }

    if (!migrated.unsplashApiKey) {
      migrated.unsplashApiKey = '';
    }

    if (!migrated.darkMode) {
      migrated.darkMode = false;
    }

    if (!migrated.keyboardShortcutsEnabled) {
      migrated.keyboardShortcutsEnabled = true;
    }

    // Migrate old background format if needed
    if (migrated.backgrounds && Array.isArray(migrated.backgrounds)) {
      migrated.backgrounds = migrated.backgrounds.map((bg: any) => ({
        ...bg,
        compressed: true // Mark as needing compression check
      }));
    }

    // Save migrated data
    await new Promise<void>((resolve) => {
      chrome.storage.sync.set(migrated, resolve);
    });

    // Update version
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ version: '2.0.0' }, resolve);
    });

    return {
      success: true,
      backup
    };

  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['migration_backup'], (result) => {
      if (result.migration_backup) {
        const { syncData, localData } = result.migration_backup;

        chrome.storage.sync.set(syncData, () => {
          chrome.storage.local.set(localData, () => {
            resolve(true);
          });
        });
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Check version compatibility
 */
export function checkCompatibility(version: string): { compatible: boolean; message?: string } {
  const major = parseInt(version.split('.')[0]);

  if (major < 1) {
    return {
      compatible: false,
      message: 'Version too old. Please reinstall the extension.'
    };
  }

  if (major > 2) {
    return {
      compatible: false,
      message: 'This data is from a newer version. Please update the extension.'
    };
  }

  return { compatible: true };
}
