import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number; // Distance in pixels to trigger refresh
  maxPullDistance?: number; // Maximum distance user can pull
  holdDuration?: number; // Duration in ms to hold before allowing pull
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
  holdDuration = 300, // 300ms hold duration
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showHoldIndicator, setShowHoldIndicator] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Pull to refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsHolding(false);
      setShowHoldIndicator(false);
    }
  }, [onRefresh, isRefreshing]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    
    // Only allow pull-to-refresh when at the top of the scrollable area
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
      isDragging.current = true;
      touchStartTime.current = Date.now();
      
      // Start hold timer
      holdTimer.current = setTimeout(() => {
        setIsHolding(true);
        setShowHoldIndicator(true);
      }, holdDuration);
    }
  }, [holdDuration]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward pull after holding
    if (deltaY > 0 && isHolding) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, maxPullDistance); // Dampen the pull
      setPullDistance(distance);
      setIsPulling(distance > 0);
    } else if (deltaY > 0 && !isHolding) {
      // Show hold indicator if user starts pulling without holding
      setShowHoldIndicator(true);
    }
  }, [isRefreshing, maxPullDistance, isHolding]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;

    // Clear hold timer
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    isDragging.current = false;
    
    if (pullDistance >= threshold && isHolding) {
      handleRefresh();
    } else {
      // Reset if not pulled enough or not held
      setPullDistance(0);
      setIsPulling(false);
      setIsHolding(false);
      setShowHoldIndicator(false);
    }
  }, [pullDistance, threshold, isHolding, handleRefresh]);

  const handleTouchCancel = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    
    isDragging.current = false;
    setPullDistance(0);
    setIsPulling(false);
    setIsHolding(false);
    setShowHoldIndicator(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
      
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Hold indicator */}
      {showHoldIndicator && !isHolding && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-yellow-50 to-transparent transition-opacity duration-200 opacity-100"
          style={{
            height: '60px',
            transform: 'translateY(-60px)'
          }}
        >
          <div className="flex items-center gap-2 text-yellow-600">
            <span className="text-sm font-medium">Hold to enable pull-to-refresh</span>
          </div>
        </div>
      )}

      {/* Pull indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-blue-50 to-transparent transition-opacity duration-200 ${
          isPulling && isHolding ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          height: `${Math.max(pullDistance, 60)}px`,
          transform: `translateY(-${Math.max(pullDistance, 60)}px)`
        }}
      >
        <div className="flex items-center gap-2 text-blue-600">
          <span className="text-sm font-medium">
            {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>

      {/* Loading overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-3 text-blue-600">
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}; 