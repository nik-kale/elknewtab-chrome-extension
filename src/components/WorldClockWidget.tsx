/**
 * World Clock Widget - Multiple timezones
 */

import React, { useState, useEffect } from 'react';

export interface TimeZoneConfig {
  id: string;
  name: string;
  timezone: string;
  emoji: string;
}

const DEFAULT_TIMEZONES: TimeZoneConfig[] = [
  { id: '1', name: 'New York', timezone: 'America/New_York', emoji: '🗽' },
  { id: '2', name: 'London', timezone: 'Europe/London', emoji: '🇬🇧' },
  { id: '3', name: 'Tokyo', timezone: 'Asia/Tokyo', emoji: '🗼' },
  { id: '4', name: 'Sydney', timezone: 'Australia/Sydney', emoji: '🦘' },
  { id: '5', name: 'Dubai', timezone: 'Asia/Dubai', emoji: '🏜️' },
  { id: '6', name: 'Los Angeles', timezone: 'America/Los_Angeles', emoji: '🌴' },
  { id: '7', name: 'Paris', timezone: 'Europe/Paris', emoji: '🗼' },
  { id: '8', name: 'Singapore', timezone: 'Asia/Singapore', emoji: '🦁' },
  { id: '9', name: 'Mumbai', timezone: 'Asia/Kolkata', emoji: '🇮🇳' },
  { id: '10', name: 'São Paulo', timezone: 'America/Sao_Paulo', emoji: '🇧🇷' }
];

interface WorldClockWidgetProps {
  selectedTimezones?: TimeZoneConfig[];
  onTimezonesChange?: (timezones: TimeZoneConfig[]) => void;
}

const WorldClockWidget: React.FC<WorldClockWidgetProps> = ({
  selectedTimezones,
  onTimezonesChange
}) => {
  const [timezones, setTimezones] = useState<TimeZoneConfig[]>([]);
  const [currentTimes, setCurrentTimes] = useState<Record<string, Date>>({});
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    loadTimezones();
  }, []);

  useEffect(() => {
    if (selectedTimezones) {
      setTimezones(selectedTimezones);
    }
  }, [selectedTimezones]);

  useEffect(() => {
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [timezones]);

  const loadTimezones = () => {
    chrome.storage.local.get(['worldClockTimezones'], (result) => {
      if (result.worldClockTimezones) {
        setTimezones(result.worldClockTimezones);
      } else {
        // Default to first 4 timezones
        const defaults = DEFAULT_TIMEZONES.slice(0, 4);
        setTimezones(defaults);
        saveTimezones(defaults);
      }
    });
  };

  const saveTimezones = (newTimezones: TimeZoneConfig[]) => {
    setTimezones(newTimezones);
    chrome.storage.local.set({ worldClockTimezones: newTimezones });
    if (onTimezonesChange) {
      onTimezonesChange(newTimezones);
    }
  };

  const updateTimes = () => {
    const times: Record<string, Date> = {};
    timezones.forEach((tz) => {
      times[tz.id] = new Date();
    });
    setCurrentTimes(times);
  };

  const formatTime = (date: Date, timezone: string): string => {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date, timezone: string): string => {
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeOffset = (timezone: string): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart?.value || '';
  };

  const addTimezone = (tz: TimeZoneConfig) => {
    if (!timezones.find((t) => t.id === tz.id)) {
      saveTimezones([...timezones, tz]);
    }
    setShowSelector(false);
  };

  const removeTimezone = (id: string) => {
    saveTimezones(timezones.filter((tz) => tz.id !== id));
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        minWidth: '320px',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>World Clock</h3>
        <button
          onClick={() => setShowSelector(!showSelector)}
          style={{
            padding: '8px 16px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {showSelector ? 'Close' : '+ Add City'}
        </button>
      </div>

      {showSelector && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '8px', fontWeight: 600 }}>
            Select a city to add:
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {DEFAULT_TIMEZONES.filter((tz) => !timezones.find((t) => t.id === tz.id)).map((tz) => (
              <button
                key={tz.id}
                onClick={() => addTimezone(tz)}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid #ecf0f1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tz.emoji}</span>
                <span>{tz.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {timezones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#95a5a6', fontSize: '14px' }}>
            No cities added. Click "Add City" to get started!
          </div>
        ) : (
          timezones.map((tz) => (
            <div
              key={tz.id}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <button
                onClick={() => removeTimezone(tz.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px' }}>{tz.emoji}</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{tz.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>{getTimeOffset(tz.timezone)}</div>
                </div>
              </div>

              <div style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '4px' }}>
                {currentTimes[tz.id] && formatTime(currentTimes[tz.id], tz.timezone)}
              </div>

              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {currentTimes[tz.id] && formatDate(currentTimes[tz.id], tz.timezone)}
              </div>
            </div>
          ))
        )}
      </div>

      {timezones.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#7f8c8d', textAlign: 'center' }}>
          Showing {timezones.length} {timezones.length === 1 ? 'timezone' : 'timezones'}
        </div>
      )}
    </div>
  );
};

export default WorldClockWidget;
