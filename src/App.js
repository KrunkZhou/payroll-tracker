import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from './i18n';
import { supportedLanguages } from './i18n/translations';
import './App.css';

function App() {
  // Initialize i18n
  const { t } = useTranslation();
  
  // Get current language from localStorage or default to 'system'
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language');
    return savedLang || 'system';
  });
  
  // Load settings from localStorage or use defaults
  const [hourlyRate, setHourlyRate] = useState(() => {
    const saved = localStorage.getItem('hourlyRate');
    return saved !== null ? parseFloat(saved) : 15;
  });
  
  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem('startTime');
    return saved !== null ? saved : '';
  });
  
  const [duration, setDuration] = useState(() => {
    const saved = localStorage.getItem('duration');
    return saved !== null ? parseFloat(saved) : 8;
  });
  
  // Load saved timer state if exists
  const [earnings, setEarnings] = useState(() => {
    const saved = localStorage.getItem('earnings');
    return saved !== null ? parseFloat(saved) : 0;
  });
  
  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem('isRunning');
    return saved === 'true';
  });
  
  const [elapsed, setElapsed] = useState(() => {
    const saved = localStorage.getItem('elapsed');
    return saved !== null ? parseFloat(saved) : 0;
  });
  
  // Add a new state variable to track if timer was manually paused
  const [manuallyPaused, setManuallyPaused] = useState(() => {
    const saved = localStorage.getItem('manuallyPaused');
    return saved === 'true';
  });
  
  const [endTime, setEndTime] = useState(() => {
    const saved = localStorage.getItem('endTime');
    return saved !== null ? new Date(parseInt(saved)) : null;
  });

  // Add state to store actual start timestamp
  const [startTimestamp, setStartTimestamp] = useState(() => {
    const saved = localStorage.getItem('startTimestamp');
    return saved !== null ? parseInt(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsExiting, setIsSettingsExiting] = useState(false);
  const [emojis, setEmojis] = useState([]);
  
  // Notification system
  const [notification, setNotification] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  
  // State for congratulations animation
  const [showCongrats, setShowCongrats] = useState(false);
  const [isCongratsExiting, setIsCongratsExiting] = useState(false);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const emojiIntervalRef = useRef(null);
  const notificationTimerRef = useRef(null);
  const congratsTimeoutRef = useRef(null);
  
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
  
  // Show congratulations animation
  const showCongratulations = useCallback(() => {
    // Clear any previous animation timeout
    if (congratsTimeoutRef.current) {
      clearTimeout(congratsTimeoutRef.current);
    }
    
    // Reset exiting state and show the animation
    setIsCongratsExiting(false);
    setShowCongrats(true);
    
    // Start fade-out after 3.5 seconds
    congratsTimeoutRef.current = setTimeout(() => {
      setIsCongratsExiting(true);
      
      // Hide the animation after fade-out animation completes
      setTimeout(() => {
        setShowCongrats(false);
        setIsCongratsExiting(false);
      }, 500); // Match the CSS animation duration
    }, 3500);
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('hourlyRate', hourlyRate.toString());
  }, [hourlyRate]);
  
  useEffect(() => {
    localStorage.setItem('startTime', startTime);
  }, [startTime]);
  
  useEffect(() => {
    localStorage.setItem('duration', duration.toString());
  }, [duration]);
  
  // Save timer state to localStorage
  useEffect(() => {
    localStorage.setItem('earnings', earnings.toString());
  }, [earnings]);
  
  useEffect(() => {
    localStorage.setItem('isRunning', isRunning.toString());
  }, [isRunning]);
  
  useEffect(() => {
    localStorage.setItem('elapsed', elapsed.toString());
  }, [elapsed]);
  
  // Save manuallyPaused state to localStorage
  useEffect(() => {
    localStorage.setItem('manuallyPaused', manuallyPaused.toString());
  }, [manuallyPaused]);
  
  useEffect(() => {
    if (endTime) {
      localStorage.setItem('endTime', endTime.getTime().toString());
    } else {
      localStorage.removeItem('endTime');
    }
  }, [endTime]);
  
  // Cleanup notification timer on unmount
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      if (congratsTimeoutRef.current) {
        clearTimeout(congratsTimeoutRef.current);
      }
    };
  }, []);
  
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
          
          // showNotification('Work duration completed!', 'success');
          showCongratulations();
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, hourlyRate, duration, showNotification, showCongratulations]);
  
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
  
  // Emoji animation effect
  useEffect(() => {
    // Money-related emojis
    const moneyEmojis = ['💰', '💵', '💲', '💸', '🤑', '💎', '👑', '💶', '💷'];
    
    if (isRunning) {
      // Start creating emojis
      emojiIntervalRef.current = setInterval(() => {
        const newEmoji = {
          id: Date.now(),
          emoji: moneyEmojis[Math.floor(Math.random() * moneyEmojis.length)],
          left: Math.random() * 100, // Random position from left (0-100%)
          animationDuration: 3 + Math.random() * 4, // Random duration between 3-7s
          size: 1 + Math.random() * 2 // Random size between 1-3em
        };
        
        setEmojis(prevEmojis => [...prevEmojis, newEmoji]);
        
        // Remove emojis after they've fallen to prevent memory issues
        setTimeout(() => {
          setEmojis(prevEmojis => prevEmojis.filter(e => e.id !== newEmoji.id));
        }, newEmoji.animationDuration * 1000);
      }, 300); // Create a new emoji every 300ms
    } else {
      // Clear interval when not running
      if (emojiIntervalRef.current) {
        clearInterval(emojiIntervalRef.current);
        emojiIntervalRef.current = null;
      }
      // Clear all emojis when stopped
      setEmojis([]);
    }
    
    return () => {
      if (emojiIntervalRef.current) {
        clearInterval(emojiIntervalRef.current);
      }
    };
  }, [isRunning]);
  
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
  
  // Helper function to create a new emoji for animation
  const createEmoji = () => {
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * 100, // Random position from left (0-100%)
      duration: 3 + Math.random() * 4, // Random duration between 3-7s
      created: Date.now()
    };
  };
  
  // Start the timer - wrap in useCallback
  const startTimer = useCallback(() => {
    if (isRunning) return;
    
    // Create emoji animation interval
    if (emojiIntervalRef.current) clearInterval(emojiIntervalRef.current);
    emojiIntervalRef.current = setInterval(() => {
      // Create new money emojis occasionally
      if (Math.random() < 0.3) { // 30% chance each second
        setEmojis(prev => {
          // Limit to 10 emojis at once
          if (prev.length >= 10) {
            return [...prev.slice(-9), createEmoji()];
          }
          return [...prev, createEmoji()];
        });
      }
      
      // Clean up old emojis
      setEmojis(prev => prev.filter(emoji => emoji.created > Date.now() - emoji.duration * 1000));
    }, 1000);
    
    // Reset manually paused flag
    setManuallyPaused(false);
    
    const now = new Date();
    let start;
    
    // If start time is provided, use it, otherwise use current time
    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      start = new Date();
      start.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      // If start time is in the future
      if (start > now) {
        // Check if it's reasonable to interpret as yesterday's time
        const yesterdayStart = new Date(start);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        
        const durationInMs = duration * 60 * 60 * 1000;
        const timeFromYesterdayStart = now - yesterdayStart;
        
        // If the time is within yesterday's working hours
        if (timeFromYesterdayStart >= 0 && timeFromYesterdayStart <= durationInMs) {
          start = yesterdayStart;
          console.log('Interpreted future time as yesterday\'s time:', start.toLocaleString());
          showNotification(`${t('notifications.startTimeYesterday')} (${startTime})`, 'info');
        } else {
          // This is genuinely a future start time
          showNotification(`${t('notifications.timerWillStart')} ${startTime}`, 'info');
          
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
      } else {
        // Handle start time from yesterday if within work duration
        const durationInMs = duration * 60 * 60 * 1000;
        const timeSinceStart = now - start;
        
        // If the start time is earlier today but more than the duration ago,
        // it's likely from yesterday but within duration
        if (timeSinceStart > durationInMs) {
          // Check if it's reasonable to assume it's from yesterday (within 24h + duration)
          if (timeSinceStart < (24 * 60 * 60 * 1000) + durationInMs) {
            // Adjust start time to yesterday
            start.setDate(start.getDate() - 1);
            console.log('Start time adjusted to yesterday:', start.toLocaleString());
            
            // Check if now is still within the duration window
            const potentialEnd = new Date(start.getTime() + durationInMs);
            if (now <= potentialEnd) {
              showNotification(`${t('notifications.startTimeYesterday')} (${startTime})`, 'info');
            } else {
              // If we're beyond the duration window, use the max duration
              showNotification(t('notifications.durationExceeded'), 'warning');
            }
          }
        }
      }
    } else {
      start = now;
      const hours = start.getHours();
      const minutes = start.getMinutes();
      setStartTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
    
    startTimeRef.current = start;
    // Save timestamp to state for persistence
    setStartTimestamp(start.getTime());
    
    // Calculate end time based on duration
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    setEndTime(end);
    
    setIsRunning(true);
    
    // Calculate initial elapsed time if start time is in the past
    const initialElapsed = Math.max(0, (now - start) / 1000);
    // Cap initial elapsed at duration if it exceeds it
    const cappedElapsed = Math.min(initialElapsed, duration * 3600);
    setElapsed(cappedElapsed);
    
    // Calculate initial earnings
    const initialEarnings = (hourlyRate / 3600) * cappedElapsed;
    setEarnings(initialEarnings);
    
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
        
        // showNotification('Work duration completed!', 'success');
        showCongratulations();
      }
    }, 1000);
    
    // Close settings after starting
    setIsSettingsOpen(false);
    
    // If timer is completing immediately
    if (cappedElapsed >= duration * 3600) {
      // showNotification(t('notifications.timerComplete'), 'success');
      showCongratulations();
    }
  }, [duration, hourlyRate, isRunning, showNotification, startTime, t, showCongratulations]);
  
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
        showNotification(t('notifications.settingsSaved'), 'success');
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
    showNotification(t('notifications.settingsSaved'), 'success');
  }, [duration, hourlyRate, isRunning, showNotification, startTime, startTimer, t]);
  
  // Pause the timer - wrap in useCallback
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    clearInterval(timerRef.current);
    setIsRunning(false);
    
    // Set manually paused flag to prevent auto-restart
    setManuallyPaused(true);
    
    showNotification(t('notifications.manuallyPaused'), 'warning');
  }, [isRunning, showNotification, t]);
  
  // Reset the timer - wrap in useCallback
  // eslint-disable-next-line no-unused-vars
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setElapsed(0);
    setEarnings(0);
    startTimeRef.current = null;
    setStartTimestamp(null); // Clear the persisted start timestamp
    setEndTime(null);
    
    showNotification(t('notifications.timerReset'), 'info');
    
    // Clear manually paused flag when resetting
    setManuallyPaused(false);
  }, [showNotification, t]);
  
  // Toggle settings popup
  const toggleSettings = useCallback(() => {
    if (isSettingsOpen) {
      // Close settings with animation
      setIsSettingsExiting(true);
      setTimeout(() => {
        setIsSettingsOpen(false);
        setIsSettingsExiting(false);
      }, 300); // Match animation duration
    } else {
      // Open settings without delay
      setIsSettingsOpen(true);
      setIsSettingsExiting(false);
    }
  }, [isSettingsOpen]);
  
  // Clear all stored data
  // eslint-disable-next-line no-unused-vars
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
      'manuallyPaused', 'startTimestamp', 'language'
    ];
    
    // Remove each key from localStorage
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reset to defaults
    setHourlyRate(15);
    setStartTime('');
    setDuration(8);
    setLanguage('system');
    
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
            // showNotification('Work duration completed!', 'success');
            showCongratulations();
          }
        }, 1000);
        
        showNotification('Timer started! You are now earning', 'success');
        clearInterval(autoStartCheckRef);
      }
    }, 1000); // Check every second for more accuracy
    
    return () => clearInterval(autoStartCheckRef);
  }, [isRunning, startTime, duration, hourlyRate, showNotification, manuallyPaused, startTimestamp, showCongratulations]);
  
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
      
      // showNotification('Work duration completed!', 'success');
      showCongratulations();
      setManuallyPaused(true);
    }
  }, [elapsed, isRunning, endTime, showNotification, duration, hourlyRate, showCongratulations]);

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    changeLanguage(newLang);
  };
  
  // Calculate progress percentage
  // eslint-disable-next-line no-unused-vars
  const progressPercentage = elapsed > 0 && duration > 0
    ? Math.min(100, (elapsed / (duration * 3600)) * 100)
    : 0;

  return (
    <div className="app dark-theme">
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
      
      {/* Congratulations animation */}
      {showCongrats && (
        <div className={`congrats-container ${isCongratsExiting ? 'exiting' : ''}`}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
              }}
            ></div>
          ))}
          <div className="congrats-message">
            <span>🎉</span> {t('notifications.congratulations')} <span>🎉</span>
          </div>
        </div>
      )}
      
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
              <h3>{t('stats.elapsedTime')}</h3>
              <span>{formatTime(elapsed)}</span>
            </div>
            
            {endTime && (
              <div className="remaining-time">
                <h3>{t('stats.estimatedEndTime')}</h3>
                <span>
                  {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          
          <div className="fullscreen-controls">
            <div className="button-group">
              {!isRunning ? (
                <button 
                  className="btn start small"
                  onClick={startTimer}
                  disabled={hourlyRate <= 0 || duration <= 0}
                >
                  {elapsed > 0 && manuallyPaused ? t('timer.resume') : t('timer.start')}
                </button>
              ) : (
                <button className="btn pause small" onClick={pauseTimer}>
                  {t('timer.pause')} - {formatCurrency(hourlyRate)}/hr
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
                <h2>{t('settings.title')}</h2>
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
                  <label htmlFor="hourlyRate">{t('settings.hourlyRate')}</label>
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
                  <label htmlFor="startTime">{t('settings.startTime')}</label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <small>Leave empty to use current time</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="duration">{t('settings.duration')}</label>
                  <input
                    type="number"
                    id="duration"
                    min="0.1"
                    step="0.5"
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="language">{t('settings.language')}</label>
                  <select
                    id="language"
                    value={language}
                    onChange={handleLanguageChange}
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {t(`languages.${lang.code}`)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="controls">
                  <button 
                    className="btn start"
                    onClick={applySettings}
                    disabled={hourlyRate <= 0 || duration <= 0}
                  >
                    {isRunning ? t('settings.save') : t('settings.save')}
                  </button>
                  <button 
                    className="btn cancel" 
                    onClick={toggleSettings}
                  >
                    {t('settings.cancel')}
                  </button>
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="btn reset" 
                    onClick={resetTimer}
                  >
                    {t('timer.reset')}
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