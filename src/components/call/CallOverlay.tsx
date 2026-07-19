import { AnimatePresence, motion } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { OwlMark } from "@/components/logo";
import { useCall } from "@/hooks/use-call";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Mounted once near the app root — so a call can ring in even while the
 * person is browsing feed, settings, anywhere. Renders nothing when idle. */
export function CallOverlay() {
  const { status, peerName, seconds, muted, answerCall, declineCall, endCall, toggleMute } = useCall();

  if (status === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay"
        className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-background px-6 pb-12 pt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={status === "ringing" || status === "calling" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 1.4, repeat: status === "connected" ? 0 : Infinity, ease: "easeInOut" }}
          >
            <OwlMark size={104} />
          </motion.div>
          <div>
            <p className="text-xl font-semibold tracking-tight">{peerName ?? "Unknown"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {status === "ringing" && "Incoming call…"}
              {status === "calling" && "Calling…"}
              {status === "connected" && formatDuration(seconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {status === "ringing" ? (
            <>
              <CallButton onClick={declineCall} tone="danger" icon={<PhoneOff className="size-6" />} label="Decline" />
              <CallButton onClick={answerCall} tone="primary" icon={<Phone className="size-6" />} label="Accept" />
            </>
          ) : (
            <>
              <CallButton
                onClick={toggleMute}
                tone="neutral"
                icon={muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                label={muted ? "Unmute" : "Mute"}
              />
              <CallButton onClick={endCall} tone="danger" icon={<PhoneOff className="size-6" />} label="End" />
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CallButton({
  onClick,
  icon,
  label,
  tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "primary" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "danger"
        ? "bg-red-500 text-white"
        : "bg-white/10 text-foreground";
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        className={`grid size-16 place-items-center rounded-full shadow-lg ${toneClass}`}
      >
        {icon}
      </motion.button>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
