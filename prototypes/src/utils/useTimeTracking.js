import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Track time spent on a page.
 *
 * This hook is used by each prototype page to record:
 * - Total time on the page
 * - Time spent viewing the instructions modal
 * - Active time (total minus instructions)
 *
 * Times are stored in seconds in the final payload returned by `getFinalTimeData`.
 */
export function useTimeTracking(pageName) {
  const [timeData, setTimeData] = useState({
    totalTime: 0,
    instructionsTime: 0,
    // Time when actually using the page (not in instructions).
    activeTime: 0,
  });

  const startTimeRef = useRef(null);
  const instructionsStartRef = useRef(null);
  const isActiveRef = useRef(true);

  // Start tracking when component mounts.
  useEffect(() => {
    startTimeRef.current = Date.now();
    isActiveRef.current = true;

    return () => {
      // Clean up when component unmounts.
      if (startTimeRef.current && isActiveRef.current) {
        const totalElapsed = Date.now() - startTimeRef.current;
        setTimeData(prev => ({
          ...prev,
          totalTime: prev.totalTime + totalElapsed,
        }));
      }
    };
  }, []);

  // Track when instructions modal opens.
  const startInstructionsTimer = useCallback(() => {
    instructionsStartRef.current = Date.now();
  }, []);

  // Track when instructions modal closes.
  const stopInstructionsTimer = useCallback(() => {
    if (instructionsStartRef.current) {
      const instructionsElapsed = Date.now() - instructionsStartRef.current;
      setTimeData(prev => ({
        ...prev,
        instructionsTime: prev.instructionsTime + instructionsElapsed,
      }));
      instructionsStartRef.current = null;
    }
  }, []);

  // Get final time data. Call this right before submitting.
  const getFinalTimeData = useCallback(() => {
    const totalElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const total = timeData.totalTime + totalElapsed;
    const instructionsTotal = timeData.instructionsTime + 
      (instructionsStartRef.current ? Date.now() - instructionsStartRef.current : 0);
    const activeTotal = total - instructionsTotal;

    return {
      page: pageName,
      // Convert to seconds.
      totalTime: Math.round(total / 1000),
      instructionsTime: Math.round(instructionsTotal / 1000),
      activeTime: Math.round(activeTotal / 1000),
      timestamp: new Date().toISOString(),
    };
  }, [pageName, timeData.instructionsTime, timeData.totalTime]);

  return {
    timeData,
    startInstructionsTimer,
    stopInstructionsTimer,
    getFinalTimeData,
  };
}
