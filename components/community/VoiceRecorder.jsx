"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { button } from "./controls";

export default function VoiceRecorder({ disabled, onRecord, onError }) {
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const control = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const active = control.current;
      if (!active) return;
      clearTimeout(active.timer);
      if (active.recorder.state !== "inactive") active.recorder.stop();
      active.stream.getTracks().forEach(track => track.stop());
      control.current = null;
    };
  }, []);

  async function start() {
    if (recording) {
      if (control.current?.recorder.state === "recording") control.current.recorder.stop();
      return;
    }
    setStarting(true);
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("Este navegador no puede grabar audio.");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64000 });
      const chunks = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        clearTimeout(control.current?.timer);
        control.current = null;
        stream.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false);
        const type = recorder.mimeType.split(";")[0];
        const extension = type === "audio/mp4" ? "m4a" : type === "audio/ogg" ? "ogg" : "webm";
        const file = new File(chunks, `nota-de-voz.${extension}`, { type });
        if (!file.size || file.size > 3000000) onError("La nota está vacía o supera 3 MB.");
        else onRecord(file);
      };
      recorder.start();
      control.current = { stream, recorder, timer: setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 120000) };
      setRecording(true);
    } catch (failure) {
      stream?.getTracks().forEach(track => track.stop());
      onError(failure.name === "NotAllowedError" ? "Permite el acceso al micrófono." : failure.message);
    } finally {
      if (mounted.current) setStarting(false);
    }
  }

  return <button type="button" className={button + (recording ? " text-rose-400" : "")} disabled={disabled || starting}
    aria-label={recording ? "Detener grabación" : "Grabar audio"} onClick={start}>
    {recording ? <Square size={17} /> : <Mic size={17} />}
  </button>;
}
