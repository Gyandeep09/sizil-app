import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useUiStore, type ToastTone } from "../../store/useUiStore";

const TONE_STYLES: Record<
  ToastTone,
  { Icon: typeof CheckCircle2; accent: string; border: string }
> = {
  success: { Icon: CheckCircle2, accent: "text-brutGreen", border: "border-line" },
  error: { Icon: XCircle, accent: "text-brutRed", border: "border-line" },
  info: { Icon: Info, accent: "text-brutBlue", border: "border-line" },
};

export function ToastStack() {
  const { toasts, dismissToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const { Icon, accent, border } = TONE_STYLES[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            onClick={() => dismissToast(t.id)}
            className={`flex items-start gap-2 bg-surface border-[3px] ${border} rounded-lg shadow-brut-sm px-3 py-2.5 cursor-pointer animate-toast-in`}
          >
            <Icon size={16} className={`${accent} shrink-0 mt-0.5`} aria-hidden />
            <p className="font-sans text-sm text-fg leading-snug">{t.message}</p>
          </div>
        );
      })}
    </div>
  );
}
