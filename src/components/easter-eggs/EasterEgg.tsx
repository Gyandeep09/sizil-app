import { useRef, useState, type ReactNode } from "react";
import { sound } from "../../utils/sound";
import { useUiStore } from "../../store/useUiStore";

const TRIGGER_CLICKS = 7;
const RESET_WINDOW_MS = 1500;
const FLASH_DURATION_MS = 1200;

interface EasterEggProps {
  children: ReactNode;
}

export function EasterEgg({ children }: EasterEggProps) {
  const [flashing, setFlashing] = useState(false);
  const clickCount = useRef(0);
  const lastClick = useRef(0);
  const pushToast = useUiStore((s) => s.pushToast);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClick.current > RESET_WINDOW_MS) {
      clickCount.current = 0;
    }
    clickCount.current += 1;
    lastClick.current = now;

    if (clickCount.current >= TRIGGER_CLICKS) {
      clickCount.current = 0;
      setFlashing(true);
      sound.levelUp();
      pushToast("You found the easter egg! 🎮", "success");
      setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
    }
  };

  return (
    <div className="relative inline-block">
      <span onClick={handleClick} className="cursor-default select-none">
        {children}
      </span>
      {flashing && (
        <span
          className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-2 whitespace-nowrap bg-brutYellow text-fg border-[3px] border-line rounded-lg font-sans font-black text-xs px-3 py-1.5 shadow-brut-sm animate-toast-in"
          aria-hidden
        >
          LEVEL UP!
        </span>
      )}
    </div>
  );
}
