import { useEffect, useState, useMemo } from 'react';
import Confetti from 'react-confetti';

// Fix 5.8: Scale celebration intensity with payout amount
export const WinCelebration = ({ show, payout = 0 }) => {
  const [isActive, setIsActive] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Memoize intensity to prevent unnecessary effect re-fires
  const intensity = useMemo(() => {
    if (payout >= 500) return { pieces: 200, gravity: 0.25, dur: 4000 };
    if (payout >= 200) return { pieces: 150, gravity: 0.3, dur: 3500 };
    if (payout >= 100) return { pieces: 100, gravity: 0.35, dur: 3000 };
    if (payout >= 50) return { pieces: 60, gravity: 0.35, dur: 2500 };
    return { pieces: 30, gravity: 0.4, dur: 2000 };
  }, [payout]);

  // Debounced window resize listener instead of react-use useWindowSize
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      if (navigator.vibrate) {
        if (payout >= 200) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        } else {
          navigator.vibrate([50, 30, 50]);
        }
      }

      const timer = setTimeout(() => {
        setIsActive(false);
      }, intensity.dur);

      return () => clearTimeout(timer);
    }
  }, [show, payout, intensity.dur]);

  if (!isActive) return null;

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={intensity.pieces}
      gravity={intensity.gravity}
      colors={['#fbbf24', '#f59e0b', '#d97706', '#10b981', '#059669', '#047857']}
      tweenDuration={intensity.dur}
    />
  );
};
