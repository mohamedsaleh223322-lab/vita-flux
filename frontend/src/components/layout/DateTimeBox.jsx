import React, { useEffect, useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';

export const DateTimeBox = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Update date/time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format last updated text
  const getLastUpdatedText = useCallback(() => {
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return 'Last updated just now';
    return `Last updated ${diffMin} min ago`;
  }, [lastUpdated]);

  // Refresh last updated time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '10px 16px',
        background: 'white',
        minWidth: '200px'
      }}
    >
      <Calendar className="w-5 h-5 text-gray-500" />
      <div className="flex flex-col">
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          {currentDateTime.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
          <span style={{ marginLeft: '6px', marginRight: '6px', color: '#9ca3af' }}>•</span>
          {currentDateTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          {getLastUpdatedText()}
        </span>
      </div>
    </div>
  );
};

export default DateTimeBox;
