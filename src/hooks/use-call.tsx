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
/** Whether audio/video packets are actually flowing between the two
 * devices — distinct from `status`, which only tracks the signaling-level
 * handshake. It's possible for `status` to say "connected" while this
 * stays "connecting" forever if the two networks (e.g. two different
 * mobile carriers) can never establish a working ICE/TURN path — that's
 * exactly what silent "no audio, no video, both sides" looks like. */
type MediaFlowState = "connecting" | "live" | "failed";

interface CallState {
  /** Your own call code — share this with someone so *they* can call *you*. */
  myCallId: string | null;
  /** Whether this device has actually finished connecting to the signaling
   * server yet. If this is false, calling won't work — not a "friend's
   * device" problem, this device just isn't ready. */
  connected: boolean;
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
  /** True once we've detected that the WebView blocked automatic playback
   * of the remote audio (its autoplay policy requires a real tap first).
   * Only meaningful for audio-only calls — video calls handle their own
   * playback state locally in the overlay, since that's where the
   * <video> element lives. */
  playbackBlocked: boolean;
  /** See MediaFlowState — tells the UI whether audio/video packets are
   * actually reaching the other person, separately from `status`. */
  mediaState: MediaFlowState;
  /** Call this from a real user tap to retry playing the blocked remote
   * audio — browsers only allow media to start after a user gesture, so
   * this must run inside a click handler, not automatically. */
  retryPlayback: () => void;
  startCall: (remoteId: string, kind: CallKind) => void;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallState | null>(null);

// ---- TURN servers -----------------------------------------------------
// A TURN relay is what lets two phones on completely different networks
// (different countries, different mobile carriers) actually exchange audio
// and video — without one, calls between such networks fail *even though
// the app UI can say "connected"* (the signaling handshake succeeds; the
// actual media never gets a path). No single free TURN provider is 100%
// reliable on its own, so this combines two independent ones — if one is
// overloaded or blocked on a given network, the browser can still find a
// working path through the other. Both are free and need no signup.
const STATIC_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Open Relay Project (metered.ca) — shared demo TURN server, works on
  // ports 80/443 to get through most corporate/carrier firewalls.
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

/** A second, independent free TURN relay (elixir-webrtc/rel's public test
 * deployment) — no account needed, issues short-lived credentials on
 * request. Its maintainers note it's meant for testing rather than heavy
 * production traffic, so this is a bonus relay path layered on top of the
 * static one above, not a replacement for it. */
async function fetchBonusTurnServer(): Promise<RTCIceServer | null> {
  try {
    const username = `cv${Date.now()}`;
    const res = await fetch(`https://turn.elixir-webrtc.org/?service=turn&username=${username}`, {
      method: "POST",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { username?: string; password?: string; uris?: string[] };
    if (!data.uris?.length || !data.username || !data.password) return null;
    return { urls: data.uris, username: data.username, credential: data.password };
  } catch {
    // Offline, this particular server down, etc. — the static list above
    // still gives the call a chance.
    return null;
  }
}

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const bonus = await fetchBonusTurnServer();
  return bonus ? [...STATIC_ICE_SERVERS, bonus] : STATIC_ICE_SERVERS;
}

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
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [kind, setKind] = useState<CallKind>("audio");
  const [peerName, setPeerName] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [mediaState, setMediaState] = useState<MediaFlowState>("connecting");

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCallRef = useRef<MediaConnection | null>(null);
  const pendingKindRef = useRef<CallKind>("audio");
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("peerjs"), fetchIceServers()]).then(([{ default: Peer }, iceServers]) => {
      if (cancelled) return;
      const code = getOrCreateDeviceCode();
      const peer = new Peer(`cryptvora-${code}`, {
        debug: 0,
        config: { iceServers },
      });
      peerRef.current = peer;

      peer.on("open", () => {
        setMyCallId(code);
        setConnected(true);
      });

      peer.on("disconnected", () => {
        setConnected(false);
        // PeerJS does NOT auto-reconnect on its own after a drop — without
        // this, a code goes silently dead (looks fine, shared, but nothing
        // ever arrives) the moment Android's battery-saving network policy
        // kills an idle background connection, which happens easily just
        // from the screen turning off for a bit.
        if (!peer.destroyed) peer.reconnect();
      });

      // Belt-and-suspenders: any time the app comes back to the foreground,
      // proactively make sure we're still connected. This is what actually
      // matters in practice — a friend generates a code, backgrounds the
      // app for a few minutes, then someone tries to call; without this,
      // that code is already dead by the time the call comes in.
      const onVisible = () => {
        if (document.visibilityState === "visible" && peer.disconnected && !peer.destroyed) {
          peer.reconnect();
        }
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onVisible);
      visibilityHandlerRef.current = onVisible;

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
      if (visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
        window.removeEventListener("focus", visibilityHandlerRef.current);
      }
      peerRef.current?.destroy();
      peerRef.current = null;
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stopConnectTimeout = () => {
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = null;
  };

  const detachIceMonitor = useCallback(() => {
    if (pcRef.current && iceHandlerRef.current) {
      pcRef.current.removeEventListener("iceconnectionstatechange", iceHandlerRef.current);
    }
    pcRef.current = null;
    iceHandlerRef.current = null;
  }, []);

  const cleanupStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setPlaybackBlocked(false);
    setMediaState("connecting");
    detachIceMonitor();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
  }, [detachIceMonitor]);

  const endCall = useCallback(() => {
    connRef.current?.close();
    connRef.current = null;
    pendingCallRef.current = null;
    cleanupStreams();
    stopTimer();
    stopConnectTimeout();
    setSeconds(0);
    setStatus("idle");
    setPeerName(null);
    setMuted(false);
    setCameraOff(false);
  }, [cleanupStreams]);

  const wireConnection = useCallback(
    (call: MediaConnection, callKind: CallKind) => {
      connRef.current = call;
      call.on("stream", (stream) => {
        stopConnectTimeout();
        setRemoteStream(stream);
        setPlaybackBlocked(false);

        if (callKind === "audio") {
          // Voice calls have no <video> element to carry the audio, so this
          // standalone element is the only thing playing sound. WebViews
          // often block its autoplay() until a real tap happens — if that
          // happens, surface it as `playbackBlocked` so the UI can show a
          // "tap to enable sound" control.
          if (!remoteAudioRef.current) {
            remoteAudioRef.current = new Audio();
          }
          const audioEl = remoteAudioRef.current;
          audioEl.autoplay = true;
          audioEl.srcObject = stream;
          audioEl.play().catch(() => setPlaybackBlocked(true));
        } else if (remoteAudioRef.current) {
          // Video calls: the <video> element in the overlay carries both
          // video and audio for this same stream. Make sure the standalone
          // audio element isn't also playing it — that would double up the
          // sound (echo/robotic doubling).
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        }

        setStatus("connected");
        setSeconds(0);
        stopTimer();
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

        // `status` above just means the two devices found each other and
        // agreed to a call — it does NOT mean media packets are actually
        // flowing yet. That depends on ICE actually connecting, which can
        // silently never happen (both sides stuck at "checking"/"failed")
        // when the two networks can't reach each other directly and the
        // TURN relay doesn't work either. Watching iceConnectionState is
        // the only reliable way to know whether real audio/video is
        // getting through.
        setMediaState("connecting");
        const pc = (call as unknown as { peerConnection?: RTCPeerConnection }).peerConnection;
        if (pc) {
          detachIceMonitor();
          pcRef.current = pc;
          const onIceChange = () => {
            const iceState = pc.iceConnectionState;
            if (iceState === "connected" || iceState === "completed") {
              setMediaState("live");
            } else if (iceState === "failed" || iceState === "disconnected" || iceState === "closed") {
              setMediaState("failed");
            } else {
              setMediaState("connecting");
            }
          };
          pc.addEventListener("iceconnectionstatechange", onIceChange);
          iceHandlerRef.current = onIceChange;
          onIceChange();
        }
      });
      call.on("close", endCall);
      call.on("error", endCall);
    },
    [endCall, detachIceMonitor],
  );

  /** Re-attempt playback of the blocked remote audio. Must be called from
   * inside a real user-tap handler — WebView autoplay policies only allow
   * media to start playing as a direct result of a user gesture, not from
   * a timer or effect. */
  const retryPlayback = useCallback(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !audioEl.srcObject) {
      setPlaybackBlocked(false);
      return;
    }
    audioEl
      .play()
      .then(() => setPlaybackBlocked(false))
      .catch(() => setPlaybackBlocked(true));
  }, []);

  const startCall = useCallback(
    async (remoteId: string, callKind: CallKind) => {
      const peer = peerRef.current;
      if (!peer || !connected) {
        setError("Still connecting to the calling network — wait a second and try again.");
        return;
      }
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
        wireConnection(call, callKind);

        stopConnectTimeout();
        connectTimeoutRef.current = setTimeout(() => {
          // No "stream" event after 25s means either the other device never
          // answered (app closed, wrong code), or the two networks couldn't
          // establish a direct/relayed connection at all.
          setError("Couldn't reach them — make sure they have the app open and the code is right.");
          endCall();
        }, 25000);
      } catch {
        setError(
          callKind === "video"
            ? "Couldn't access the camera/microphone — check app permissions."
            : "Couldn't access the microphone — check app permissions.",
        );
        setStatus("idle");
      }
    },
    [wireConnection, connected, endCall],
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
      wireConnection(call, callKind);
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
        connected,
        status,
        kind,
        peerName,
        muted,
        cameraOff,
        seconds,
        error,
        localStream,
        remoteStream,
        playbackBlocked,
        mediaState,
        retryPlayback,
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
