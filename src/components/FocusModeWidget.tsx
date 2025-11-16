/**
 * Focus Mode Widget - Block distracting websites
 */

import React, { useState, useEffect } from 'react';

export interface FocusModeConfig {
  enabled: boolean;
  blockedSites: string[];
  allowedSites: string[];
  mode: 'block' | 'allow'; // block specific sites or allow only specific sites
  schedule?: {
    days: number[]; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
}

interface FocusModeWidgetProps {
  onConfigChange?: (config: FocusModeConfig) => void;
}

const DEFAULT_BLOCKED_SITES = [
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'reddit.com',
  'youtube.com',
  'tiktok.com',
  'netflix.com',
  'twitch.tv'
];

const FocusModeWidget: React.FC<FocusModeWidgetProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<FocusModeConfig>({
    enabled: false,
    blockedSites: [],
    allowedSites: [],
    mode: 'block'
  });
  const [newSite, setNewSite] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    chrome.storage.local.get(['focusModeConfig'], (result) => {
      if (result.focusModeConfig) {
        setConfig(result.focusModeConfig);
      }
    });
  };

  const saveConfig = (newConfig: FocusModeConfig) => {
    setConfig(newConfig);
    chrome.storage.local.set({ focusModeConfig: newConfig });
    if (onConfigChange) {
      onConfigChange(newConfig);
    }

    // Send message to background script to update blocking rules
    chrome.runtime.sendMessage({
      type: 'UPDATE_FOCUS_MODE',
      config: newConfig
    });
  };

  const toggleFocusMode = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    saveConfig(newConfig);

    // Show notification
    if (newConfig.enabled) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Mode Activated', {
          body: `Blocking ${config.blockedSites.length} distracting sites`,
          icon: '/icons/icon128.png'
        });
      }
    }
  };

  const addSite = () => {
    if (!newSite.trim()) return;

    const site = newSite.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const list = config.mode === 'block' ? config.blockedSites : config.allowedSites;

    if (!list.includes(site)) {
      const newConfig = {
        ...config,
        [config.mode === 'block' ? 'blockedSites' : 'allowedSites']: [...list, site]
      };
      saveConfig(newConfig);
    }

    setNewSite('');
  };

  const removeSite = (site: string) => {
    const listKey = config.mode === 'block' ? 'blockedSites' : 'allowedSites';
    const newConfig = {
      ...config,
      [listKey]: config[listKey].filter((s) => s !== site)
    };
    saveConfig(newConfig);
  };

  const addDefaultSites = () => {
    const newConfig = {
      ...config,
      blockedSites: [...new Set([...config.blockedSites, ...DEFAULT_BLOCKED_SITES])]
    };
    saveConfig(newConfig);
  };

  const clearAllSites = () => {
    if (confirm('Clear all sites from the list?')) {
      const listKey = config.mode === 'block' ? 'blockedSites' : 'allowedSites';
      const newConfig = {
        ...config,
        [listKey]: []
      };
      saveConfig(newConfig);
    }
  };

  // Future feature: schedule-based focus mode
  // const updateSchedule = (schedule: FocusModeConfig['schedule']) => {
  //   const newConfig = { ...config, schedule };
  //   saveConfig(newConfig);
  // };

  const getCurrentList = (): string[] => {
    return config.mode === 'block' ? config.blockedSites : config.allowedSites;
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        minWidth: '400px',
        maxWidth: '500px',
        maxHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2c3e50' }}>Focus Mode</h3>
        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
          Block distracting websites to stay focused
        </div>
      </div>

      {/* Main toggle */}
      <div
        style={{
          padding: '16px',
          background: config.enabled ? '#2ecc71' : '#e74c3c',
          borderRadius: '12px',
          marginBottom: '16px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {config.enabled ? '🎯 Focus Mode Active' : '😴 Focus Mode Inactive'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
            {config.enabled
              ? `Blocking ${config.blockedSites.length} sites`
              : 'Click to activate'}
          </div>
        </div>
        <button
          onClick={toggleFocusMode}
          style={{
            padding: '10px 20px',
            background: 'white',
            color: config.enabled ? '#2ecc71' : '#e74c3c',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {config.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Mode selector */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: 600, marginBottom: '8px' }}>
          Mode:
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => saveConfig({ ...config, mode: 'block' })}
            style={{
              flex: 1,
              padding: '10px',
              background: config.mode === 'block' ? '#3498db' : '#ecf0f1',
              color: config.mode === 'block' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            🚫 Block List
          </button>
          <button
            onClick={() => saveConfig({ ...config, mode: 'allow' })}
            style={{
              flex: 1,
              padding: '10px',
              background: config.mode === 'allow' ? '#3498db' : '#ecf0f1',
              color: config.mode === 'allow' ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            ✅ Allow List Only
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '6px' }}>
          {config.mode === 'block'
            ? 'Block specific sites, allow everything else'
            : 'Only allow specific sites, block everything else'}
        </div>
      </div>

      {/* Add site */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="example.com"
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSite()}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '2px solid #ecf0f1',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={addSite}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Add
          </button>
        </div>

        {config.mode === 'block' && config.blockedSites.length === 0 && (
          <button
            onClick={addDefaultSites}
            style={{
              width: '100%',
              padding: '8px',
              background: '#f8f9fa',
              color: '#7f8c8d',
              border: '1px dashed #bdc3c7',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Add common distracting sites
          </button>
        )}
      </div>

      {/* Sites list */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: 600 }}>
            {config.mode === 'block' ? 'Blocked Sites' : 'Allowed Sites'} ({getCurrentList().length})
          </div>
          {getCurrentList().length > 0 && (
            <button
              onClick={clearAllSites}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                color: '#e74c3c',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                textDecoration: 'underline'
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {getCurrentList().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#95a5a6', fontSize: '13px' }}>
            No sites added yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {getCurrentList().map((site) => (
              <div
                key={site}
                style={{
                  padding: '10px 12px',
                  background: 'white',
                  border: '1px solid #ecf0f1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: '#2c3e50', wordBreak: 'break-all' }}>{site}</span>
                <button
                  onClick={() => removeSite(site)}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#e74c3c',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #ecf0f1' }}>
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          style={{
            width: '100%',
            padding: '10px',
            background: '#f8f9fa',
            color: '#7f8c8d',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          ⏰ {showSchedule ? 'Hide' : 'Show'} Schedule (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default FocusModeWidget;
