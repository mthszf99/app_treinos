import { useState, useEffect, useRef } from 'react';

export function useStopwatch() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const formatTime = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const minutesAndSeconds = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${minutesAndSeconds}`;
    }
    return minutesAndSeconds;
  };

  return { 
    seconds, 
    formattedTime: formatTime(), 
    isRunning, 
    start, 
    pause, 
    reset 
  };
}