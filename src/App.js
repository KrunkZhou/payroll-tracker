import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

function App() {
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [emojis, setEmojis] = useState([]);
  
  // Notification system
  const [notification, setNotification] = useState(null);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const emojiIntervalRef = useRef(null);
  const notificationTimerRef = useRef(null);
  
  // Display notification - wrap in useCallback
  const showNotification = useCallback((message, type = 'info') => {
    // Clear any existing notification timer
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    // Set the new notification
    setNotification({ message, type });
    
    // Auto dismiss after 4 seconds
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);
  
  // Dismiss notification manually - wrap in useCallback
  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification(null);
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
      
      // Handle future start time
      if (start > now) {
        // Set up a scheduled start
        showNotification(`Timer will start at ${startTime}`, 'info');
        
        // Store start time for reference
        startTimeRef.current = start;
        
        // Calculate end time based on duration
        const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
        setEndTime(end);
        
        // Close settings after scheduling
        setIsSettingsOpen(false);
        
        return;
      }
    } else {
      start = now;
      const hours = start.getHours();
      const minutes = start.getMinutes();
      setStartTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
    
    startTimeRef.current = start;
    
    // Calculate end time based on duration
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    setEndTime(end);
    
    setIsRunning(true);
    
    // Calculate initial elapsed time if start time is in the past
    const initialElapsed = Math.max(0, (now - start) / 1000);
    setElapsed(initialElapsed);
    
    // Calculate initial earnings
    const initialEarnings = (hourlyRate / 3600) * initialElapsed;
    setEarnings(initialEarnings);
    
    // Start the interval that calculates time based on actual time difference
    timerRef.current = setInterval(() => {
      const currentTime = new Date();
      const actualElapsed = Math.max(0, (currentTime - start) / 1000);
      
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
    
    // Close settings after starting
    setIsSettingsOpen(false);
    
    // Show notification
    // showNotification('Timer started! You are now earning', 'success');
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
    setEndTime(null);
    
    // Reset manually paused flag on timer reset
    setManuallyPaused(false);
    
    showNotification('Timer reset', 'info');
  }, [showNotification]);
  
  // Toggle settings popup
  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(!isSettingsOpen);
  }, [isSettingsOpen]);
  
  // Clear all stored data
  const clearStoredData = useCallback(() => {
    // Use inline reset functionality instead of calling resetTimer
    clearInterval(timerRef.current);
    setIsRunning(false);
    setElapsed(0);
    setEarnings(0);
    startTimeRef.current = null;
    setEndTime(null);
    setManuallyPaused(false);
    
    // List of keys to remove
    const keysToRemove = [
      'hourlyRate', 'startTime', 'duration',
      'earnings', 'isRunning', 'elapsed', 'endTime', 'manuallyPaused'
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
  }, [isRunning, startTime, duration, hourlyRate, showNotification, manuallyPaused]);
  
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
    <div className="app dark-theme">
      {/* Notification component */}
      {notification && (
        <div className={`notification ${notification.type}`}>
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
              <h3>Elapsed Time</h3>
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
          
          <div className="rate-display">
            <span>Current Rate: {formatCurrency(hourlyRate)} per hour</span>
          </div>
          
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
                  Pause
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
        {isSettingsOpen && (
          <div className="settings-modal-overlay">
            <div className="settings-modal">
              <div className="settings-modal-header">
                <h2>Work Settings</h2>
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
                  <label htmlFor="duration">Work Duration (hours)</label>
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 