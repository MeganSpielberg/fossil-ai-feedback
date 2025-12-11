import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for tracking time spent on different parts of the application
 * @param {string} pageName - Name of the page/prototype being tracked
 * @returns {Object} - Time tracking data and control functions
 */
export function useTimeTracking(pageName) {
  const [timeData, setTimeData] = useState({
    totalTime: 0,
    instructionsTime: 0,
    activeTime: 0, // Time when actually using the page (not in instructions)
  });

  const startTimeRef = useRef(null);
  const instructionsStartRef = useRef(null);
  const isActiveRef = useRef(true);

  // Start tracking when component mounts
  useEffect(() => {
    startTimeRef.current = Date.now();
    isActiveRef.current = true;

    return () => {
      // Clean up when component unmounts
      if (startTimeRef.current && isActiveRef.current) {
        const totalElapsed = Date.now() - startTimeRef.current;
        setTimeData(prev => ({
          ...prev,
          totalTime: prev.totalTime + totalElapsed,
        }));
      }
    };
  }, []);

  // Track when instructions modal opens
  const startInstructionsTimer = () => {
    instructionsStartRef.current = Date.now();
  };

  // Track when instructions modal closes
  const stopInstructionsTimer = () => {
    if (instructionsStartRef.current) {
      const instructionsElapsed = Date.now() - instructionsStartRef.current;
      setTimeData(prev => ({
        ...prev,
        instructionsTime: prev.instructionsTime + instructionsElapsed,
      }));
      instructionsStartRef.current = null;
    }
  };

  // Get final time data (call before submitting)
  const getFinalTimeData = () => {
    const totalElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const total = timeData.totalTime + totalElapsed;
    const instructionsTotal = timeData.instructionsTime + 
      (instructionsStartRef.current ? Date.now() - instructionsStartRef.current : 0);
    const activeTotal = total - instructionsTotal;

    return {
      page: pageName,
      totalTime: Math.round(total / 1000), // Convert to seconds
      instructionsTime: Math.round(instructionsTotal / 1000),
      activeTime: Math.round(activeTotal / 1000),
      timestamp: new Date().toISOString(),
    };
  };

  return {
    timeData,
    startInstructionsTimer,
    stopInstructionsTimer,
    getFinalTimeData,
  };
}
