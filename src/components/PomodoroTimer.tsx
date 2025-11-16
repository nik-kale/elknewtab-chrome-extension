/**
 * Pomodoro Timer Widget for Focus Mode
 */

import React, { useState, useEffect, useRef } from 'react';

export interface PomodoroSettings {
  workDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4
};

interface PomodoroTimerProps {
  onComplete?: () => void;
  settings?: PomodoroSettings;
}

type TimerMode = 'work' | 'break' | 'longBreak';

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onComplete,
  settings = DEFAULT_SETTINGS
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    // Play notification sound
    playNotificationSound();

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: mode === 'work' ? 'Time for a break!' : 'Time to work!',
        icon: '/icons/icon128.png'
      });
    }

    if (onComplete) {
      onComplete();
    }

    // Switch mode
    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);

      if (newSessions % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode('break');
        setTimeLeft(settings.breakDuration * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(settings.workDuration * 60);
    setSessionsCompleted(0);
  };

  const skipToBreak = () => {
    setIsRunning(false);
    setMode('break');
    setTimeLeft(settings.breakDuration * 60);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    const totalTime = mode === 'work'
      ? settings.workDuration * 60
      : mode === 'break'
        ? settings.breakDuration * 60
        : settings.longBreakDuration * 60;

    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeColor = (): string => {
    switch (mode) {
      case 'work': return '#e74c3c';
      case 'break': return '#2ecc71';
      case 'longBreak': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getModeLabel = (): string => {
    switch (mode) {
      case 'work': return 'Focus Time';
      case 'break': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return '';
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        minWidth: '280px',
        textAlign: 'center'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: getModeColor(), fontWeight: 600, marginBottom: '8px' }}>
          {getModeLabel()}
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2c3e50', fontFamily: 'monospace' }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: '#ecf0f1',
        borderRadius: '3px',
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            width: `${getProgressPercentage()}%`,
            height: '100%',
            background: getModeColor(),
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Session counter */}
      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '16px' }}>
        Sessions completed: {sessionsCompleted} / {settings.sessionsUntilLongBreak}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={toggleTimer}
          style={{
            padding: '12px 24px',
            background: getModeColor(),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            flex: 1
          }}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={resetTimer}
          style={{
            padding: '12px 16px',
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ↻ Reset
        </button>
        {mode === 'work' && (
          <button
            onClick={skipToBreak}
            style={{
              padding: '12px 16px',
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
