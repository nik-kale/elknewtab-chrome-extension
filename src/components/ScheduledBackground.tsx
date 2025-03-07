import { useState, useEffect } from 'react';
import storage from '../utils/storage';

interface Schedule {
  id: string;
  backgroundId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday
  isRecurring: boolean;
}

interface ScheduledBackground {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif' | 'color' | 'gradient';
  value: string; // URL for images/videos, color/gradient value for others
  name: string;
  schedules: Schedule[];
}

interface ScheduledBackgroundManagerProps {
  onBackgroundChange: (background: { type: string; value: string }) => void;
}

// Convert to a custom hook
export const useScheduledBackgroundManager = ({
  onBackgroundChange
}: ScheduledBackgroundManagerProps) => {
  const [scheduledBackgrounds, setScheduledBackgrounds] = useState<ScheduledBackground[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  // Keep activeBackground for internal use
  const [activeBackground, setActiveBackground] = useState<ScheduledBackground | null>(null);

  // Load scheduled backgrounds from storage
  useEffect(() => {
    storage.sync.get(['scheduledBackgrounds'], (result: { scheduledBackgrounds: ScheduledBackground[] }) => {
      if (result.scheduledBackgrounds) {
        setScheduledBackgrounds(result.scheduledBackgrounds);
      }
    });
  }, []);

  // Save scheduled backgrounds when they change
  useEffect(() => {
    storage.sync.set({ scheduledBackgrounds });
  }, [scheduledBackgrounds]);

  // Check for active schedules based on current time
  useEffect(() => {
    const checkSchedules = () => {
      // Fix the filter function to use a different parameter name
      const applicableSchedules = scheduledBackgrounds.filter(bg => {
        // Logic to determine if the schedule is applicable
        return bg.schedules && bg.schedules.length > 0; // Basic check for schedules
      });

      if (applicableSchedules.length > 0) {
        // Fix the destructuring to match the actual structure
        const background = applicableSchedules[0];
        const schedule = background.schedules[0]; // Just use the first schedule for now

        // Only update if different from current
        if (!activeSchedule || activeSchedule.id !== schedule.id) {
          setActiveSchedule(schedule);
          setActiveBackground(background);
          onBackgroundChange({
            type: background.type,
            value: background.value
          });
        }
      } else if (activeSchedule) {
        // No active schedule, reset
        setActiveSchedule(null);
        setActiveBackground(null);
      }
    };

    // Check immediately and then every minute
    checkSchedules();
    const intervalId = setInterval(checkSchedules, 60000);

    return () => clearInterval(intervalId);
  }, [scheduledBackgrounds, activeSchedule, onBackgroundChange]);

  // Add a new scheduled background
  const addScheduledBackground = (background: Omit<ScheduledBackground, 'id' | 'schedules'>) => {
    const newBackground: ScheduledBackground = {
      ...background,
      id: Date.now().toString(),
      schedules: []
    };
    setScheduledBackgrounds([...scheduledBackgrounds, newBackground]);
    return newBackground.id;
  };

  // Add a schedule to a background
  const addSchedule = (backgroundId: string, schedule: Omit<Schedule, 'id'>) => {
    setScheduledBackgrounds(prev => prev.map(bg => {
      if (bg.id === backgroundId) {
        return {
          ...bg,
          schedules: [
            ...bg.schedules,
            { ...schedule, id: Date.now().toString() }
          ]
        };
      }
      return bg;
    }));
  };

  // Remove a schedule
  const removeSchedule = (backgroundId: string, scheduleId: string) => {
    setScheduledBackgrounds(prev => prev.map(bg => {
      if (bg.id === backgroundId) {
        return {
          ...bg,
          schedules: bg.schedules.filter(s => s.id !== scheduleId)
        };
      }
      return bg;
    }));
  };

  // Remove a background and all its schedules
  const removeBackground = (backgroundId: string) => {
    setScheduledBackgrounds(prev => prev.filter(bg => bg.id !== backgroundId));
  };

  return {
    scheduledBackgrounds,
    activeBackground,
    addScheduledBackground,
    addSchedule,
    removeSchedule,
    removeBackground
  };
};

// Create a wrapper component that uses the hook
const ScheduledBackgroundManager: React.FC<ScheduledBackgroundManagerProps> = (props) => {
  useScheduledBackgroundManager(props);
  return null; // This component doesn't render anything
};

export default ScheduledBackgroundManager;
export type { ScheduledBackground, Schedule };