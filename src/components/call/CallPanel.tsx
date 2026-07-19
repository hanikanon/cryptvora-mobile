import { useState } from "react";
import { Phone, Copy, Check } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { useCall } from "@/hooks/use-call";

/**
 * Opened from the phone icon in a conversation header. This is the one
 * place both directions of "who calls whom" happen:
 *  - Your own code is shown large, with a copy button — send it to a friend
 *    so *they* can call *you*.
 *  - The input below is where you type *their* code to call *them*.
 * No phone numbers, no account system — just a random per-device code
 * (like a Zoom meeting ID), generated once and reused every time.
 */
export function CallPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { myCallId, startCall, error } = useCall();
  const [remoteCode, setRemoteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!myCallId) return;
    try {
      await navigator.clipboard.writeText(myCallId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable in some WebView contexts — the
      // code is still visible on screen to copy by hand.
    }
  };

  const call = () => {
    if (!remoteCode.trim()) return;
    startCall(remoteCode);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Voice call">
      <div className="space-y-5 px-1 pb-2">
        <div className="rounded-2xl border border-border bg-surface/60 p-4 text-center">
          <p className="text-[11px] text-muted-foreground">Your call code — share it so a friend can call you</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-2xl font-semibold tracking-[0.2em]">{myCallId ?? "…"}</span>
            <button
              type="button"
              onClick={copyCode}
              disabled={!myCallId}
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              aria-label="Copy code"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] text-muted-foreground">Or enter a friend's code to call them</label>
          <div className="flex gap-2">
            <input
              value={remoteCode}
              onChange={(e) => setRemoteCode(e.target.value.toUpperCase())}
              placeholder="e.g. F3K9QZ"
              maxLength={6}
              className="h-12 flex-1 rounded-xl border border-border bg-white/5 px-4 text-center text-lg font-semibold tracking-[0.15em] outline-none focus:border-primary focus:bg-white/10 focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={call}
              disabled={!remoteCode.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              <Phone className="size-4" />
              Call
            </button>
          </div>
        </div>

        {error && <p className="text-center text-[12px] text-red-400">{error}</p>}
      </div>
    </BottomSheet>
  );
}
