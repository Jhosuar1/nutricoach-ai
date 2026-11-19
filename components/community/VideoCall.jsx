"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { communityRequest, sendJson } from "./api";
import { button, Notice } from "./controls";

function gather(connection) {
  if (connection.iceGatheringState === "complete") return Promise.resolve();
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      connection.removeEventListener("icegatheringstatechange", change);
      resolve();
    };
    const change = () => { if (connection.iceGatheringState === "complete") finish(); };
    const timer = setTimeout(finish, 6500);
    connection.addEventListener("icegatheringstatechange", change);
  });
}

export default function VideoCall({ invitation, onClose }) {
  const [status, setStatus] = useState("Solicitando permisos…");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const local = useRef(null);
  const remote = useRef(null);
  const stream = useRef(null);
  const dialog = useRef(null);

  useEffect(() => {
    const panel = dialog.current;
    if (!panel.open) panel.showModal();
    let stopped = false;
    let connection;
    let timer;
    let media;
    let callId = invitation.id;
    let answered = false;
    let connectionTimeout;

    async function poll() {
      if (stopped) return;
      try {
        const { call } = await communityRequest(`calls?id=${callId}`);
        if (stopped) return;
        if (call.closed) {
          setStatus("Llamada finalizada");
          connection.close();
          media.getTracks().forEach(track => track.stop());
          return;
        }
        if (!invitation.id && call.answer && !connection.remoteDescription) {
          await connection.setRemoteDescription(call.answer);
          if (!stopped && connection.connectionState !== "connected") {
            setStatus("Conectando…");
            clearTimeout(connectionTimeout);
            connectionTimeout = setTimeout(() => {
              if (!stopped && connection.connectionState !== "connected") setError("No se pudo conectar entre estas redes.");
            }, 15000);
          }
        }
        if (!stopped) timer = setTimeout(poll, 1800);
      } catch (failure) {
        if (!stopped) {
          setError(failure.message);
          timer = setTimeout(poll, 3000);
        }
      }
    }

    async function connect() {
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
          throw new Error("Este navegador no admite videollamadas.");
        }
        const { iceServers } = await communityRequest("calls?config=1");
        if (stopped) return;
        media = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "user" } });
        if (stopped) { media.getTracks().forEach(track => track.stop()); return; }
        stream.current = media;
        local.current.srcObject = media;
        connection = new RTCPeerConnection({ iceServers });
        connection.ontrack = event => {
          if (!stopped) remote.current.srcObject = event.streams[0];
        };
        connection.onconnectionstatechange = () => {
          if (stopped) return;
          if (connection.connectionState === "connected") {
            clearTimeout(connectionTimeout);
            setStatus("En llamada");
          }
          if (connection.connectionState === "failed") setError("No se pudo conectar entre estas redes.");
        };
        media.getTracks().forEach(track => connection.addTrack(track, media));
        if (invitation.id) {
          const { call } = await communityRequest(`calls?id=${callId}`);
          if (stopped) return;
          if (call.closed) throw new Error("La llamada ya finalizó.");
          await connection.setRemoteDescription(call.offer);
          await connection.setLocalDescription(await connection.createAnswer());
        } else {
          await connection.setLocalDescription(await connection.createOffer());
        }
        await gather(connection);
        if (stopped) return;
        const description = connection.localDescription.toJSON();
        if (invitation.id) {
          await sendJson("calls", { action: "answer", id: callId, description });
          answered = true;
          if (stopped) { await sendJson("calls", { action: "end", id: callId }); return; }
          if (!stopped && connection.connectionState !== "connected") {
            setStatus("Conectando…");
            clearTimeout(connectionTimeout);
            connectionTimeout = setTimeout(() => {
              if (!stopped && connection.connectionState !== "connected") setError("No se pudo conectar entre estas redes.");
            }, 15000);
          }
        } else {
          const { call } = await sendJson("calls", { action: "start", other: invitation.userId, description });
          callId = call.id;
          if (stopped) { await sendJson("calls", { action: "end", id: callId }); return; }
          setStatus("Llamando…");
        }
        poll();
      } catch (failure) {
        if (stopped) return;
        connection?.close();
        media?.getTracks().forEach(track => track.stop());
        if (callId) sendJson("calls", { action: "end", id: callId }).catch(() => {});
        setError(failure.name === "NotAllowedError" ? "Permite el acceso a cámara y micrófono." : failure.message);
        setStatus("No se pudo iniciar la llamada");
      }
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(connectionTimeout);
      connection?.close();
      media?.getTracks().forEach(track => track.stop());
      if (callId && (!invitation.id || answered)) sendJson("calls", { action: "end", id: callId }).catch(() => {});
    };
  }, [invitation]);

  function toggle(kind) {
    if (kind === "audio") {
      stream.current?.getAudioTracks().forEach(track => { track.enabled = muted; });
      setMuted(!muted);
    } else {
      stream.current?.getVideoTracks().forEach(track => { track.enabled = cameraOff; });
      setCameraOff(!cameraOff);
    }
  }

  return <dialog className="community-dialog" ref={dialog} aria-label="Videollamada" onCancel={event => { event.preventDefault(); onClose(); }}>
    <section className="grid gap-3 p-4">
      <h2 className="text-lg font-semibold">Videollamada con {invitation.name}</h2>
      <p role="status" className="text-sm">{status}</p>
      <Notice error={error} />
      <div className="relative bg-black">
        <video className="aspect-video w-full object-contain" ref={remote} autoPlay playsInline />
        <video className="absolute bottom-2 right-2 aspect-video w-1/4 rounded-lg bg-black object-cover" ref={local} autoPlay muted playsInline />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button className={button} aria-label={muted ? "Activar micrófono" : "Silenciar micrófono"} onClick={() => toggle("audio")}>{muted ? <MicOff size={18} /> : <Mic size={18} />}</button>
        <button className={button} aria-label={cameraOff ? "Activar cámara" : "Desactivar cámara"} onClick={() => toggle("video")}>{cameraOff ? <VideoOff size={18} /> : <Video size={18} />}</button>
        <button className={button + " bg-red-700 text-white"} onClick={onClose}><PhoneOff size={18} /> Colgar</button>
      </div>
    </section>
  </dialog>;
}
