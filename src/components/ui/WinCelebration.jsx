import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Fix 5.8: Scale celebration intensity with payout amount
export const WinCelebration = ({ show, payout = 0, duration = 3000 }) => {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  // Scale confetti based on payout: small win = few pieces, big win = lots
  const getIntensity = () => {
    if (payout >= 500) return { pieces: 500, gravity: 0.2, dur: 5000 };
    if (payout >= 200) return { pieces: 350, gravity: 0.25, dur: 4000 };
    if (payout >= 100) return { pieces: 250, gravity: 0.3, dur: 3500 };
    if (payout >= 50) return { pieces: 150, gravity: 0.3, dur: 3000 };
    return { pieces: 60, gravity: 0.4, dur: 2000 };
  };

  const intensity = getIntensity();

  useEffect(() => {
    if (show) {
      setIsActive(true);
      if (navigator.vibrate) {
        if (payout >= 200) {
          navigator.vibrate([100, 50, 100, 50, 200, 50, 100]);
        } else if (payout >= 50) {
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
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={intensity.pieces}
      gravity={intensity.gravity}
      colors={['#fbbf24', '#f59e0b', '#d97706', '#10b981', '#059669', '#047857']}
      tweenDuration={intensity.dur}
    />
  );
};
