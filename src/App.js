import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

function App() {
  // Move isZerollMode to the top
  const [isZerollMode, setIsZerollMode] = useState(() => {
    const saved = localStorage.getItem('isZerollMode');
    return saved === 'true';
  });

  // Create refs for the current mode
  const isZerollModeRef = useRef(isZerollMode);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const emojiIntervalRef = useRef(null);
  const notificationTimerRef = useRef(null);

  // Load settings from localStorage or use defaults
  const [hourlyRate, setHourlyRate] = useState(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    const saved = localStorage.getItem(`${prefix}hourlyRate`);
    return saved !== null ? parseFloat(saved) : 15;
  });
  
  const [startTime, setStartTime] = useState(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    const saved = localStorage.getItem(`${prefix}startTime`);
    return saved !== null ? saved : '';
  });
  
  const [duration, setDuration] = useState(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    const saved = localStorage.getItem(`${prefix}duration`);
    return saved !== null ? parseFloat(saved) : 8;
  });
  
  // Load saved timer state if exists
  const [earnings, setEarnings] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  const [manuallyPaused, setManuallyPaused] = useState(() => {
    const saved = localStorage.getItem('manuallyPaused');
    return saved === 'true';
  });
  
  const [endTime, setEndTime] = useState(() => {
    const saved = localStorage.getItem('endTime');
    return saved !== null ? new Date(parseInt(saved)) : null;
  });

  const [startTimestamp, setStartTimestamp] = useState(() => {
    const saved = localStorage.getItem('startTimestamp');
    return saved !== null ? parseInt(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsExiting, setIsSettingsExiting] = useState(false);
  const [emojis, setEmojis] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Money-related emojis for payroll mode
  const moneyEmojis = ['💰', '💵', '💲', '💸', '🤑', '💎', '👑', '💶', '💷'];
  // Sad emojis for zeroll mode
  const sadEmojis = ['😢', '😭', '😔', '😞', '😥', '💔', '😪', '😫', '😩'];

  // Update ref when mode changes
  useEffect(() => {
    isZerollModeRef.current = isZerollMode;
  }, [isZerollMode]);

  // Save zeroll mode state to localStorage
  useEffect(() => {
    localStorage.setItem('isZerollMode', isZerollMode.toString());
  }, [isZerollMode]);

  // Dismiss notification manually - wrap in useCallback
  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    // Set exiting state to trigger animation
    setIsExiting(true);
    
    // Wait for animation to complete before removing
    setTimeout(() => {
      setNotification(null);
      setIsExiting(false);
    }, 300); // Match animation duration
  }, []);
  
  // Display notification - wrap in useCallback
  const showNotification = useCallback((message, type = 'info') => {
    // Clear any existing notification timer
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    // Reset exiting state
    setIsExiting(false);
    
    // Set the new notification
    setNotification({ message, type });
    
    // Auto dismiss after 4 seconds
    notificationTimerRef.current = setTimeout(() => {
      dismissNotification();
    }, 4000);
  }, [dismissNotification]);

  // Update timer states when mode changes
  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    // Load mode-specific timer states
    const savedEarnings = localStorage.getItem(`${prefix}earnings`);
    const savedIsRunning = localStorage.getItem(`${prefix}isRunning`);
    const savedElapsed = localStorage.getItem(`${prefix}elapsed`);
    
    setEarnings(savedEarnings !== null ? parseFloat(savedEarnings) : 0);
    setIsRunning(savedIsRunning === 'true');
    setElapsed(savedElapsed !== null ? parseFloat(savedElapsed) : 0);
  }, [isZerollMode]);

  // Save timer states with mode-specific keys
  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    localStorage.setItem(`${prefix}earnings`, earnings.toString());
  }, [earnings, isZerollMode]);

  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    localStorage.setItem(`${prefix}isRunning`, isRunning.toString());
  }, [isRunning, isZerollMode]);

  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    localStorage.setItem(`${prefix}elapsed`, elapsed.toString());
  }, [elapsed, isZerollMode]);

  // Update settings when mode changes
  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    // Load mode-specific settings
    const savedHourlyRate = localStorage.getItem(`${prefix}hourlyRate`);
    const savedStartTime = localStorage.getItem(`${prefix}startTime`);
    const savedDuration = localStorage.getItem(`${prefix}duration`);
    
    setHourlyRate(savedHourlyRate !== null ? parseFloat(savedHourlyRate) : 15);
    setStartTime(savedStartTime !== null ? savedStartTime : '');
    setDuration(savedDuration !== null ? parseFloat(savedDuration) : 8);
  }, [isZerollMode]);

  // Save settings with mode-specific keys
  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    localStorage.setItem(`${prefix}hourlyRate`, hourlyRate.toString());
  }, [hourlyRate, isZerollMode]);

  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    localStorage.setItem(`${prefix}startTime`, startTime);
  }, [startTime, isZerollMode]);

  useEffect(() => {
    const prefix = isZerollMode ? 'zeroll' : '';
    localStorage.setItem(`${prefix}duration`, duration.toString());
  }, [duration, isZerollMode]);

  // Toggle zeroll mode with animation and reset timer
  const toggleZerollMode = useCallback(() => {
    setIsAnimating(true);
    setIsZerollMode(prev => !prev);
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 300);

    // Complete timer reset when switching modes
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (emojiIntervalRef.current) {
      clearInterval(emojiIntervalRef.current);
      emojiIntervalRef.current = null;
    }
    
    // Reset all timer-related states
    setIsRunning(false);
    setElapsed(0);
    setEarnings(0);
    startTimeRef.current = null;
    setStartTimestamp(null);
    setEndTime(null);
    setManuallyPaused(false);
    setEmojis([]);
    setStartTime('');

    // Clear all mode-specific localStorage items
    const keysToRemove = [
      'earnings',
      'isRunning',
      'elapsed',
      'startTimestamp',
      'endTime',
      'manuallyPaused',
      'zerollEarnings',
      'zerollIsRunning',
      'zerollElapsed',
      'startTime',
      'hourlyRate',
      'duration',
      'zerollHourlyRate',
      'zerollStartTime',
      'zerollDuration'
    ];
    
    // Remove each key from localStorage
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    showNotification('Mode switched - Timer reset', 'info');
  }, [showNotification]);

  // Initialize startTimeRef from localStorage on component mount
  useEffect(() => {
    if (startTimestamp) {
      startTimeRef.current = new Date(startTimestamp);
    }
  }, [startTimestamp]);
  
  // Save startTimestamp to localStorage when it changes
  useEffect(() => {
    if (startTimestamp) {
      localStorage.setItem('startTimestamp', startTimestamp.toString());
    } else {
      localStorage.removeItem('startTimestamp');
    }
  }, [startTimestamp]);
  
  // Resume timer on page refresh if it was running
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      // Update elapsed time immediately to sync with system time
      const now = new Date();
      const elapsedSeconds = Math.max(0, (now - startTimeRef.current) / 1000);
      setElapsed(elapsedSeconds);
      
      // Calculate earnings based on actual elapsed time
      const earnedAmount = (hourlyRate / 3600) * elapsedSeconds;
      setEarnings(earnedAmount);
      
      // Set up interval that calculates elapsed time from the start time on each tick
      timerRef.current = setInterval(() => {
        const currentTime = new Date();
        const actualElapsed = Math.max(0, (currentTime - startTimeRef.current) / 1000);
        
        // Update elapsed time based on actual time difference
        setElapsed(actualElapsed);
        
        // Calculate earnings based on actual elapsed time
        const currentEarnings = (hourlyRate / 3600) * actualElapsed;
        setEarnings(currentEarnings);
        
        // Check if we've reached the work duration
        const durationInSeconds = duration * 3600;
        if (actualElapsed >= durationInSeconds) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          
          // Set elapsed time to exactly the duration
          setElapsed(durationInSeconds);
          
          // Calculate final earnings based on full duration
          const finalEarnings = (hourlyRate / 3600) * durationInSeconds;
          setEarnings(finalEarnings);
          
          showNotification('Work duration completed!', 'success');
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, hourlyRate, duration, showNotification]);
  
  // Time sync check - verify timer accuracy every 10 seconds
  useEffect(() => {
    let syncCheckInterval;
    
    if (isRunning && startTimeRef.current) {
      // Set up interval to check time sync every 10 seconds
      syncCheckInterval = setInterval(() => {
        const currentTime = new Date();
        const expectedElapsed = Math.max(0, (currentTime - startTimeRef.current) / 1000);
        const timeDrift = Math.abs(expectedElapsed - elapsed);
        
        // If drift is more than 0.5 seconds, resync the timer
        if (timeDrift > 0.5) {
          console.log(`Time drift detected: ${timeDrift.toFixed(2)}s. Resyncing timer.`);
          
          // Update elapsed time to the correct value
          setElapsed(expectedElapsed);
          
          // Recalculate earnings based on corrected elapsed time
          const correctedEarnings = (hourlyRate / 3600) * expectedElapsed;
          setEarnings(correctedEarnings);
        }
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (syncCheckInterval) {
        clearInterval(syncCheckInterval);
      }
    };
  }, [isRunning, elapsed, hourlyRate]);
  
  // Handle device sleep/wake and page visibility changes
  useEffect(() => {
    // Skip if timer is not running
    if (!isRunning || !startTimeRef.current) return;

    // Function to synchronize timer after sleep or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && startTimeRef.current) {
        // Immediately recalculate elapsed time when page becomes visible
        const now = new Date();
        const actualElapsed = Math.max(0, (now - startTimeRef.current) / 1000);
        
        // Check if there's significant drift (which could indicate sleep/wake)
        const timeDrift = Math.abs(actualElapsed - elapsed);
        
        if (timeDrift > 1) {
          console.log(`Device likely woke from sleep. Time drift: ${timeDrift.toFixed(2)}s. Resyncing timer.`);
          
          // Update elapsed time to the correct value
          setElapsed(actualElapsed);
          
          // Recalculate earnings based on corrected elapsed time
          const correctedEarnings = (hourlyRate / 3600) * actualElapsed;
          setEarnings(correctedEarnings);
          
          // Check if duration was reached during sleep
          const durationInSeconds = duration * 3600;
          if (actualElapsed >= durationInSeconds) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            
            // Set elapsed time to exactly the duration
            setElapsed(durationInSeconds);
            
            // Calculate final earnings based on full duration
            const finalEarnings = (hourlyRate / 3600) * durationInSeconds;
            setEarnings(finalEarnings);
            
            showNotification('Work duration completed while device was sleeping!', 'success');
          }
        }
      }
    };
    
    // Register visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Additional safeguard - check for sleep/wake detection using focus events
    window.addEventListener('focus', handleVisibilityChange);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isRunning, elapsed, hourlyRate, duration, showNotification]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  // Start the timer - wrap in useCallback
  const startTimer = useCallback(() => {
    if (isRunning) return;
    
    // Reset manually paused flag when explicitly starting the timer
    setManuallyPaused(false);
    
    const now = new Date();
    let start;
    
    if (startTime) {
      start = new Date();
      const [hours, minutes] = startTime.split(':');
      start.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      
      // Check if this time appears to be in the future
      if (start > now) {
        // First, check if treating this as yesterday's time makes more sense
        const yesterdayStart = new Date(start);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        
        const durationInMs = duration * 60 * 60 * 1000;
        const timeFromYesterdayStart = now - yesterdayStart;
        
        // If the time since yesterday's start is within the duration window,
        // assume the user meant yesterday's time
        if (timeFromYesterdayStart >= 0 && timeFromYesterdayStart <= durationInMs) {
          start = yesterdayStart;
          console.log('Interpreted future time as yesterday\'s time:', start.toLocaleString());
          showNotification(`Timer started with yesterday's start time (${startTime})`, 'info');
        } else {
          // This is genuinely a future start time
          showNotification(`Timer will start at ${startTime}`, 'info');
          
          // Store start time for reference
          startTimeRef.current = start;
          // Save timestamp to state for persistence
          setStartTimestamp(start.getTime());
          
          // Calculate end time based on duration
          const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
          setEndTime(end);
          
          // Close settings after scheduling
          setIsSettingsOpen(false);
          
          return;
        }
      }
    } else {
      start = now;
      const hours = start.getHours();
      const minutes = start.getMinutes();
      setStartTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
    
    // Always start fresh when starting the timer
    startTimeRef.current = start;
    setStartTimestamp(start.getTime());
    
    // Calculate end time based on duration
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    setEndTime(end);
    
    setIsRunning(true);
    setElapsed(0);
    setEarnings(0);
    
    // Start the interval that calculates time based on actual time difference
    timerRef.current = setInterval(() => {
      const currentTime = new Date();
      const actualElapsed = Math.max(0, (currentTime - start) / 1000);
      // Cap elapsed time at duration
      const cappedCurrentElapsed = Math.min(actualElapsed, duration * 3600);
      
      // Update elapsed time based on actual time difference
      setElapsed(cappedCurrentElapsed);
      
      // Calculate earnings based on actual elapsed time
      const earnedAmount = (hourlyRate / 3600) * cappedCurrentElapsed;
      setEarnings(earnedAmount);
      
      // Check if we've reached the work duration
      const durationInSeconds = duration * 3600;
      if (actualElapsed >= durationInSeconds) {
        clearInterval(timerRef.current);
        setIsRunning(false);
        
        // Set elapsed time to exactly the duration
        setElapsed(durationInSeconds);
        
        // Calculate final earnings based on full duration
        const finalEarnings = (hourlyRate / 3600) * durationInSeconds;
        setEarnings(finalEarnings);
        
        showNotification('Work duration completed!', 'success');
      }
    }, 1000);
    
    // Close settings after starting
    setIsSettingsOpen(false);
    
  }, [duration, hourlyRate, isRunning, showNotification, startTime]);
  
  // Apply settings while timer is running
  const applySettings = useCallback(() => {
    if (!isRunning) {
      startTimer();
      return;
    }
    
    // If start time has changed, recalculate elapsed time
    if (startTime && startTimeRef.current) {
      const now = new Date();
      const newStart = new Date();
      const [hours, minutes] = startTime.split(':');
      newStart.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      
      // Allow future start time when applying settings
      if (newStart > now) {
        // If new start time is in the future, pause the timer
        // and it will auto-start at the new time
        clearInterval(timerRef.current);
        setIsRunning(false);
        
        // Store the new start time
        startTimeRef.current = newStart;
        // Update timestamp in state for persistence
        setStartTimestamp(newStart.getTime());
        
        // Calculate end time based on duration
        const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);
        setEndTime(newEnd);
        
        // Reset elapsed time and earnings for future start
        setElapsed(0);
        setEarnings(0);
        
        // Close settings after applying
        setIsSettingsOpen(false);
        
        // Show notification
        showNotification(`Timer will start at ${startTime}`, 'info');
        return;
      }
      
      // Update start time reference
      startTimeRef.current = newStart;
      // Update timestamp in state for persistence
      setStartTimestamp(newStart.getTime());
      
      // Recalculate elapsed time
      const newElapsed = Math.max(0, (now - newStart) / 1000);
      setElapsed(newElapsed);
      
      // Recalculate earnings based on new elapsed time
      const earnedAmount = (hourlyRate / 3600) * newElapsed;
      setEarnings(earnedAmount);
    }
    
    // Recalculate end time based on current start time and new duration
    if (startTimeRef.current) {
      const newEnd = new Date(startTimeRef.current.getTime() + duration * 60 * 60 * 1000);
      setEndTime(newEnd);
    }
    
    // Close settings after applying
    setIsSettingsOpen(false);
    
    // Show notification
    showNotification('Settings updated!', 'success');
  }, [duration, hourlyRate, isRunning, showNotification, startTime, startTimer]);
  
  // Pause the timer - wrap in useCallback
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    clearInterval(timerRef.current);
    setIsRunning(false);
    
    // Set manually paused flag to prevent auto-restart
    setManuallyPaused(true);
    
    showNotification('Timer paused', 'warning');
  }, [isRunning, showNotification]);
  
  // Reset the timer - wrap in useCallback
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setElapsed(0);
    setEarnings(0);
    startTimeRef.current = null;
    setStartTimestamp(null); // Clear the persisted start timestamp
    setEndTime(null);
    
    // Reset manually paused flag on timer reset
    setManuallyPaused(false);
    
    showNotification('Timer reset', 'info');
  }, [showNotification]);
  
  // Toggle settings popup
  const toggleSettings = useCallback(() => {
    if (isSettingsOpen) {
      // Start exit animation
      setIsSettingsExiting(true);
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        setIsSettingsOpen(false);
        setIsSettingsExiting(false);
      }, 300); // Match animation duration
    } else {
      setIsSettingsOpen(true);
    }
  }, [isSettingsOpen]);
  
  // Clear all stored data
  const clearStoredData = useCallback(() => {
    // Use inline reset functionality instead of calling resetTimer
    clearInterval(timerRef.current);
    setIsRunning(false);
    setElapsed(0);
    setEarnings(0);
    startTimeRef.current = null;
    setStartTimestamp(null);
    setEndTime(null);
    setManuallyPaused(false);
    
    // List of keys to remove
    const keysToRemove = [
      'hourlyRate', 'startTime', 'duration',
      'earnings', 'isRunning', 'elapsed', 'endTime', 
      'manuallyPaused', 'startTimestamp'
    ];
    
    // Remove each key from localStorage
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reset to defaults
    setHourlyRate(15);
    setStartTime('');
    setDuration(8);
    
    showNotification('All saved data has been cleared', 'info');
  }, [showNotification]);
  
  // Add a new useEffect to check for auto-start based on start time
  useEffect(() => {
    // Only proceed if timer is not running, not manually paused, and a start time is set
    if (isRunning || manuallyPaused || !startTime || !startTimeRef.current) return;
    
    // Set up an interval to check current time against start time
    const autoStartCheckRef = setInterval(() => {
      const now = new Date();
      const startTimeValue = startTimeRef.current;
      
      // Check if current time has reached or passed the start time
      if (now >= startTimeValue) {
        setIsRunning(true);
        
        // Calculate initial elapsed time (should be 0 for a future start time)
        const initialElapsed = Math.max(0, (now - startTimeValue) / 1000);
        setElapsed(initialElapsed);
        
        // Calculate initial earnings
        const initialEarnings = (hourlyRate / 3600) * initialElapsed;
        setEarnings(initialEarnings);
        
        // Save start time for persistence across page loads
        // startTimeRef is already set, just need to update the state value
        if (startTimeRef.current && !startTimestamp) {
          setStartTimestamp(startTimeRef.current.getTime());
        }
        
        // Start the interval with time-based calculation
        timerRef.current = setInterval(() => {
          const currentTime = new Date();
          const actualElapsed = Math.max(0, (currentTime - startTimeValue) / 1000);
          
          // Update elapsed time based on actual time difference
          setElapsed(actualElapsed);
          
          // Calculate earnings based on actual elapsed time
          const earnedAmount = (hourlyRate / 3600) * actualElapsed;
          setEarnings(earnedAmount);
          
          // Check if we've reached the work duration
          const durationInSeconds = duration * 3600;
          if (actualElapsed >= durationInSeconds) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            // Set elapsed time to exactly the duration
            setElapsed(durationInSeconds);
            // Calculate final earnings based on full duration
            const finalEarnings = (hourlyRate / 3600) * durationInSeconds;
            setEarnings(finalEarnings);
            showNotification('Work duration completed!', 'success');
          }
        }, 1000);
        
        showNotification('Timer started! You are now earning', 'success');
        clearInterval(autoStartCheckRef);
      }
    }, 1000); // Check every second for more accuracy
    
    return () => clearInterval(autoStartCheckRef);
  }, [isRunning, startTime, duration, hourlyRate, showNotification, manuallyPaused, startTimestamp]);
  
  // Handle end time reached
  useEffect(() => {
    if (isRunning && endTime && new Date() >= endTime) {
      // Instead of calling pauseTimer, implement its functionality inline
      clearInterval(timerRef.current);
      setIsRunning(false);
      
      // Set elapsed time to exactly the duration
      const exactDuration = duration * 3600;
      setElapsed(exactDuration);
      
      // Calculate final earnings based on full duration
      const finalEarnings = (hourlyRate / 3600) * exactDuration;
      setEarnings(finalEarnings);
      
      showNotification('Work duration completed!', 'success');
    }
  }, [elapsed, isRunning, endTime, showNotification, duration, hourlyRate]);

  return (
    <div className={`app dark-theme ${isZerollMode ? 'zeroll-mode' : ''}`}>
      {/* Notification component */}
      {notification && (
        <div className={`notification ${notification.type} ${isExiting ? 'exiting' : ''}`}>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close" 
            onClick={dismissNotification}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <label className="mode-toggle-label">
          <input 
            type="checkbox" 
            checked={isZerollMode} 
            onChange={toggleZerollMode}
            aria-label="Toggle Zeroll Mode"
          />
          <span className="mode-toggle-text">
            {isZerollMode ? 'Zeroll Mode' : 'Payroll Mode'}
          </span>
        </label>
      </div>
      
      <main className="fullscreen-earnings">
        {/* Falling Emojis */}
        <div className="emoji-container">
          {emojis.map(emoji => (
            <div
              key={emoji.id}
              className="falling-emoji"
              style={{
                left: `${emoji.left}%`,
                animationDuration: `${emoji.animationDuration}s`,
                fontSize: `${emoji.size}em`
              }}
            >
              {emoji.emoji}
            </div>
          ))}
        </div>
        
        <div className="earnings-display fullscreen">
          <div className="earnings-amount">
            <span>{formatCurrency(earnings)}</span>
          </div>
          
          <div className="time-display">
            <div className="elapsed-time">
              <h3 className={isAnimating ? 'animate' : ''}>
                {isZerollMode ? 'Idle Time' : 'Elapsed Time'}
              </h3>
              <span>{formatTime(elapsed)}</span>
            </div>
            
            {endTime && (
              <div className="remaining-time">
                <h3>Remaining Time</h3>
                <span>
                  {formatTime(Math.max(0, (endTime - new Date()) / 1000))}
                </span>
              </div>
            )}
          </div>
          
          {/* <div className="rate-display">
            <span>{formatCurrency(hourlyRate)}/hr</span>
          </div> */}
          
          <div className="fullscreen-controls">
            <div className="button-group">
              {!isRunning ? (
                <button 
                  className="btn start small"
                  onClick={startTimer}
                  disabled={hourlyRate <= 0 || duration <= 0}
                >
                  Start
                </button>
              ) : (
                <button className="btn pause small" onClick={pauseTimer}>
                  Pause - {formatCurrency(hourlyRate)}/hr
                </button>
              )}
              <button 
                className="btn settings small" 
                onClick={toggleSettings}
                aria-label="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* Settings Popup/Modal */}
        {(isSettingsOpen || isSettingsExiting) && (
          <div className={`settings-modal-overlay ${isSettingsExiting ? 'exiting' : ''}`}>
            <div className={`settings-modal ${isSettingsExiting ? 'exiting' : ''}`}>
              <div className="settings-modal-header">
                <h2>Settings</h2>
                <button 
                  className="close-settings-btn" 
                  onClick={toggleSettings}
                  aria-label="Close settings"
                >
                  ×
                </button>
              </div>
              
              <div className="settings-content">
                <div className="form-group">
                  <label htmlFor="hourlyRate">Hourly Rate ($)</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    min="0.01"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="startTime">Start Time (optional)</label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <small>Leave empty to use current time</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="duration">{isZerollMode ? 'Idle Duration' : 'Work Duration'} (hours)</label>
                  <input
                    type="number"
                    id="duration"
                    min="0.1"
                    step="0.5"
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="controls">
                  <button 
                    className="btn start"
                    onClick={applySettings}
                    disabled={hourlyRate <= 0 || duration <= 0}
                  >
                    {isRunning ? 'Apply Changes' : 'Save & Start'}
                  </button>
                  <button 
                    className="btn cancel" 
                    onClick={toggleSettings}
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="btn reset" 
                    onClick={resetTimer}
                  >
                    Reset Timer
                  </button>
                </div>
                
                <div className="clear-data-section">
                  <button 
                    className="btn clear-data" 
                    onClick={clearStoredData}
                  >
                    Clear Saved Data
                  </button>
                  <small>This will reset all settings and timer data</small>
                </div>
                
                <div className="compile-time-section">
                  <small>
                    Build time: {process.env.REACT_APP_BUILD_TIME || new Date().toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;