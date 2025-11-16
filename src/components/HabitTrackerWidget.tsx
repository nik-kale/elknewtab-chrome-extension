/**
 * Habit Tracker Widget - Track daily habits
 */

import React, { useState, useEffect } from 'react';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ISO date strings
  createdAt: number;
}

interface HabitTrackerWidgetProps {
  onHabitsChange?: (habits: Habit[]) => void;
}

const HABIT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
];

const COMMON_HABITS = [
  { name: 'Exercise', emoji: '💪' },
  { name: 'Read', emoji: '📚' },
  { name: 'Meditate', emoji: '🧘' },
  { name: 'Drink Water', emoji: '💧' },
  { name: 'Sleep 8h', emoji: '😴' },
  { name: 'No Social Media', emoji: '📵' },
  { name: 'Journal', emoji: '📝' },
  { name: 'Learn Something', emoji: '🎓' }
];

const HabitTrackerWidget: React.FC<HabitTrackerWidgetProps> = ({ onHabitsChange }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✅');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = () => {
    chrome.storage.local.get(['habits'], (result) => {
      if (result.habits) {
        setHabits(result.habits);
      }
    });
  };

  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    chrome.storage.local.set({ habits: updatedHabits });
    if (onHabitsChange) {
      onHabitsChange(updatedHabits);
    }
  };

  const getTodayString = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      frequency: 'daily',
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: Date.now()
    };

    saveHabits([habit, ...habits]);
    setNewHabitName('');
    setNewHabitEmoji('✅');
    setShowAddForm(false);
  };

  const toggleHabit = (id: string) => {
    const today = getTodayString();
    const updated = habits.map((habit) => {
      if (habit.id !== id) return habit;

      const isCompletedToday = habit.completedDates.includes(today);
      let newCompletedDates: string[];
      let newStreak = habit.streak;
      let newBestStreak = habit.bestStreak;

      if (isCompletedToday) {
        // Uncomplete
        newCompletedDates = habit.completedDates.filter((d) => d !== today);
        newStreak = Math.max(0, habit.streak - 1);
      } else {
        // Complete
        newCompletedDates = [...habit.completedDates, today].sort();
        newStreak = calculateStreak(newCompletedDates);
        newBestStreak = Math.max(newStreak, habit.bestStreak);
      }

      return {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak,
        bestStreak: newBestStreak
      };
    });

    saveHabits(updated);
  };

  const calculateStreak = (completedDates: string[]): number => {
    if (completedDates.length === 0) return 0;

    const sorted = [...completedDates].sort().reverse();
    const today = getTodayString();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Must include today or yesterday to have active streak
    if (sorted[0] !== today && sorted[0] !== yesterday) {
      return 0;
    }

    let streak = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i]);
      const next = new Date(sorted[i + 1]);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / 86400000);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const deleteHabit = (id: string) => {
    if (confirm('Delete this habit?')) {
      saveHabits(habits.filter((h) => h.id !== id));
    }
  };

  const getLast7Days = (): string[] => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = getTodayString();
    if (dateStr === today) return 'Today';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isCompletedOnDate = (habit: Habit, date: string): boolean => {
    return habit.completedDates.includes(date);
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        minWidth: '400px',
        maxWidth: '600px',
        maxHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>Habit Tracker</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '8px 16px',
            background: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Habit'}
        </button>
      </div>

      {showAddForm && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Quick Add:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COMMON_HABITS.map((h) => (
                <button
                  key={h.name}
                  onClick={() => {
                    setNewHabitName(h.name);
                    setNewHabitEmoji(h.emoji);
                  }}
                  style={{
                    padding: '6px 10px',
                    background: 'white',
                    border: '1px solid #ecf0f1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{h.emoji}</span>
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Emoji"
              value={newHabitEmoji}
              onChange={(e) => setNewHabitEmoji(e.target.value)}
              style={{
                width: '60px',
                padding: '8px',
                border: '2px solid #ecf0f1',
                borderRadius: '6px',
                fontSize: '16px',
                textAlign: 'center'
              }}
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '2px solid #ecf0f1',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              autoFocus
            />
            <button
              onClick={addHabit}
              style={{
                padding: '8px 16px',
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {habits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#95a5a6', fontSize: '14px' }}>
            No habits yet. Click "Add Habit" to start tracking!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {habits.map((habit) => (
              <div
                key={habit.id}
                style={{
                  padding: '16px',
                  background: 'white',
                  border: `2px solid ${habit.color}`,
                  borderRadius: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{habit.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#2c3e50' }}>
                      {habit.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                      🔥 {habit.streak} day streak • Best: {habit.bestStreak}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      color: '#e74c3c',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {getLast7Days().map((date) => {
                    const isCompleted = isCompletedOnDate(habit, date);
                    const isToday = date === getTodayString();
                    return (
                      <div
                        key={date}
                        onClick={() => isToday && toggleHabit(habit.id)}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          cursor: isToday ? 'pointer' : 'default'
                        }}
                      >
                        <div style={{ fontSize: '9px', color: '#7f8c8d', marginBottom: '4px' }}>
                          {getDayLabel(date)}
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '32px',
                            background: isCompleted ? habit.color : '#ecf0f1',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            border: isToday ? '2px solid #3498db' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isCompleted && '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTrackerWidget;
