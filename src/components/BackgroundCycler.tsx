import { useState, useEffect } from 'react';
import storage from '../utils/storage';

interface BackgroundImage {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
}

interface BackgroundCyclerProps {
  enabled: boolean;
  shuffle: boolean;
  interval?: number; // in seconds
  onBackgroundChange: (background: BackgroundImage) => void;
}

// Change to a custom hook instead of a React component
export const useBackgroundCycler = ({
  enabled,
  shuffle,
  interval = 300, // default 5 minutes
  onBackgroundChange
}: BackgroundCyclerProps) => {
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load saved backgrounds from storage
  useEffect(() => {
    storage.sync.get(['backgrounds'], (result: { backgrounds: BackgroundImage[] }) => {
      if (result.backgrounds) {
        setBackgrounds(result.backgrounds);
      }
    });
  }, []);

  // Save backgrounds when they change
  useEffect(() => {
    storage.sync.set({ backgrounds });
  }, [backgrounds]);

  // Handle cycling backgrounds
  useEffect(() => {
    if (!enabled || backgrounds.length <= 1) return;

    const cycleBackground = () => {
      if (shuffle) {
        // Random background (different from current)
        let newIndex = currentIndex;
        while (newIndex === currentIndex && backgrounds.length > 1) {
          newIndex = Math.floor(Math.random() * backgrounds.length);
        }
        setCurrentIndex(newIndex);
      } else {
        // Sequential cycling
        setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
      }
    };

    // Initial background
    if (backgrounds.length > 0) {
      onBackgroundChange(backgrounds[currentIndex]);
    }

    // Set up interval for cycling
    const timerId = setInterval(cycleBackground, interval * 1000);

    return () => clearInterval(timerId);
  }, [enabled, shuffle, interval, backgrounds, currentIndex, onBackgroundChange]);

  // Effect to change background when currentIndex changes
  useEffect(() => {
    if (backgrounds.length > 0) {
      onBackgroundChange(backgrounds[currentIndex]);
    }
  }, [currentIndex, backgrounds, onBackgroundChange]);

  // Add a new background
  const addBackground = (background: Omit<BackgroundImage, 'id'>) => {
    const newBackground = {
      ...background,
      id: Date.now().toString()
    };
    setBackgrounds([...backgrounds, newBackground]);
  };

  // Remove a background
  const removeBackground = (id: string) => {
    setBackgrounds(backgrounds.filter(bg => bg.id !== id));
  };

  return {
    backgrounds,
    currentIndex,
    addBackground,
    removeBackground
  };
};

// Create a wrapper component that uses the hook
const BackgroundCycler: React.FC<BackgroundCyclerProps> = (props) => {
  useBackgroundCycler(props);
  return null; // This component doesn't render anything
};

export default BackgroundCycler;