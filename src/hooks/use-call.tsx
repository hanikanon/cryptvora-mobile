import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type Peer from "peerjs";
import type { MediaConnection } from "peerjs";

type CallStatus = "idle" | "calling" | "ringing" | "connected";
type CallKind = "audio" | "video";

interface CallState {
  /** Your own call code — share this with someone so *they* can call *you*. */
  myCallId: string | null;
  status: CallStatus;
  kind: CallKind;
  /** The other person's call code, once known (either you dialed them, or
   * their code arrived with an incoming call). */
  peerName: string | null;
  muted: boolean;
  cameraOff: boolean;
  seconds: number;
  error: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (remoteId: string, kind: CallKind) => void;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallState | null>(null);

// One random, memorable-ish code per device, generated once and kept in
// localStorage — this is what gets shown to the person as "your call code".
// It intentionally has nothing to do with phone numbers, SIM cards, or any
// device identifier; it's just a random join code, the same idea as a Zoom
// meeting ID.
function getOrCreateDeviceCode(): string {
  const KEY = "cryptvora_call_code";
  let code = window.localStorage.getItem(KEY);
  if (!code) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    window.localStorage.setItem(KEY, code);
  }
  return code;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const [myCallId, setMyCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [kind, setKind] = useState<CallKind>("audio");
  const [peerName, setPeerName] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCallRef = useRef<MediaConnection | null>(null);
  const pendingKindRef = useRef<CallKind>("audio");

  useEffect(() => {
    let cancelled = false;
    import("peerjs").then(({ default: Peer }) => {
      if (cancelled) return;
      const code = getOrCreateDeviceCode();
      const peer = new Peer(`cryptvora-${code}`, { debug: 0 });
      peerRef.current = peer;

      peer.on("open", () => setMyCallId(code));

      peer.on("error", (err) => {
        // "unavailable-id" just means this device already has an open
        // connection elsewhere (e.g. another tab) — not fatal.
        if (String(err).includes("unavailable-id")) return;
        setError("Connection problem — check your internet and try again.");
      });

      peer.on("call", (incoming) => {
        // Someone is calling this device right now. The caller tells us
        // whether it's a video or voice call via metadata.
        const incomingKind: CallKind = incoming.metadata?.kind === "video" ? "video" : "audio";
        pendingCallRef.current = incoming;
        pendingKindRef.current = incomingKind;
        setKind(incomingKind);
        setPeerName(incoming.peer.replace(/^cryptvora-/, ""));
        setStatus("ringing");
      });
    });

    return () => {
      cancelled = true;
      peerRef.current?.destroy();
      peerRef.current = null;
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const cleanupStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const endCall = useCallback(() => {
    connRef.current?.close();
    connRef.current = null;
    pendingCallRef.current = null;
    cleanupStreams();
    stopTimer();
    setSeconds(0);
    setStatus("idle");
    setPeerName(null);
    setMuted(false);
    setCameraOff(false);
  }, [cleanupStreams]);

  const wireConnection = useCallback(
    (call: MediaConnection) => {
      connRef.current = call;
      call.on("stream", (stream) => {
        setRemoteStream(stream);
        // Audio always plays via a dedicated element (works even for video
        // calls — the <video> tag in the overlay is also allowed to carry
        // audio, but keeping a fallback audio element is harmless and
        // guarantees sound even before the overlay's <video> mounts).
        if (!remoteAudioRef.current) {
          remoteAudioRef.current = new Audio();
          remoteAudioRef.current.autoplay = true;
        }
        remoteAudioRef.current.srcObject = stream;
        setStatus("connected");
        setSeconds(0);
        stopTimer();
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      });
      call.on("close", endCall);
      call.on("error", endCall);
    },
    [endCall],
  );

  const startCall = useCallback(
    async (remoteId: string, callKind: CallKind) => {
      const peer = peerRef.current;
      if (!peer) return;
      const cleaned = remoteId.trim().toUpperCase().replace(/^CRYPTVORA-/, "");
      if (!cleaned) return;
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callKind === "video" ? { facingMode: "user" } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setKind(callKind);
        setPeerName(cleaned);
        setStatus("calling");
        const call = peer.call(`cryptvora-${cleaned}`, stream, { metadata: { kind: callKind } });
        wireConnection(call);
      } catch {
        setError(
          callKind === "video"
            ? "Couldn't access the camera/microphone — check app permissions."
            : "Couldn't access the microphone — check app permissions.",
        );
        setStatus("idle");
      }
    },
    [wireConnection],
  );

  const answerCall = useCallback(async () => {
    const call = pendingCallRef.current;
    if (!call) return;
    const callKind = pendingKindRef.current;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callKind === "video" ? { facingMode: "user" } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      call.answer(stream);
      wireConnection(call);
    } catch {
      setError(
        callKind === "video"
          ? "Couldn't access the camera/microphone — check app permissions."
          : "Couldn't access the microphone — check app permissions.",
      );
      endCall();
    }
  }, [wireConnection, endCall]);

  const declineCall = useCallback(() => {
    pendingCallRef.current?.close();
    pendingCallRef.current = null;
    setStatus("idle");
    setPeerName(null);
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted((m) => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff((c) => !c);
  }, [cameraOff]);

  return (
    <CallContext.Provider
      value={{
        myCallId,
        status,
        kind,
        peerName,
        muted,
        cameraOff,
        seconds,
        error,
        localStream,
        remoteStream,
        startCall,
        answerCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside <CallProvider>");
  return ctx;
}
