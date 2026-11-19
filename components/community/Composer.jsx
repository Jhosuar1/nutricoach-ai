"use client";

import { useEffect, useRef, useState } from "react";
import { Film, ImagePlus, LockKeyhole, X } from "lucide-react";
import { communityRequest } from "./api";
import { Avatar, button, field, Notice, primary } from "./controls";

const isVideoFile = file => file.type === "video/mp4" || /\.mp4$/i.test(file.name);

const fileTypes = {
  photo: "image/jpeg,image/png,image/webp",
  video: "video/mp4",
};

export default function Composer({ profile, mode, onClose, onPublished }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
  }, []);

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  function select(incoming) {
    const next = Array.from(incoming);
    if (!next.length) return;
    const formats = Object.values(fileTypes).join(",").split(",");
    if (next.some(file => !formats.includes(file.type) &&
        !(file.type === "" && /\.(jpe?g|png|webp|mp4)$/i.test(file.name)))) {
      setError("Elige fotos JPG, PNG o WebP, o un video MP4.");
      return;
    }
    if (next.length > 4 || (next.length > 1 && next.some(isVideoFile))) {
      setError("Elige hasta cuatro fotos o un solo video.");
      return;
    }
    if (next.reduce((size, file) => size + file.size, 0) > 3000000) {
      setError("El total de los archivos debe pesar hasta 3 MB.");
      return;
    }
    setError("");
    setSelected(0);
    setFiles(next);
  }

  async function publish(event) {
    event.preventDefault();
    if (busy || (!caption.trim() && !files.length)) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("body", caption);
      for (const file of files) form.append("media", file);
      await communityRequest("posts", { method: "POST", body: form });
      onPublished();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  const file = files[selected];
  const preview = previews[selected];
  const isVideo = file && isVideoFile(file);

  return <dialog ref={dialog} className="community-dialog" aria-labelledby="community-composer-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={publish} className="grid gap-4 p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 id="community-composer-title" className="text-xl font-semibold">Crear publicación</h2>
        <button type="button" className={button} disabled={busy} aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" size={19} /></button>
      </header>
      <div className="flex items-center gap-3">
        <Avatar person={profile} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{profile.display_name}</p>
          <p className="flex items-center gap-1 text-xs text-[var(--sub)]"><LockKeyhole aria-hidden="true" size={12} /> Solo amistades</p>
        </div>
      </div>
      <label className="grid gap-1 text-sm">Texto de la publicación
        <textarea className={field + " resize-y"} rows={3} maxLength={1500} value={caption}
          onChange={event => setCaption(event.target.value)} placeholder="¿Qué quieres compartir hoy?" />
        <span className="text-right text-xs text-[var(--sub)]">{caption.length}/1500</span>
      </label>
      <input className="sr-only" tabIndex={-1} ref={input} type="file" aria-label="Seleccionar archivo"
        multiple={mode !== "video"} accept={fileTypes[mode] || Object.values(fileTypes).join(",")}
        onChange={event => { select(event.target.files); event.target.value = ""; }} />
      {file && preview ? <div className="grid gap-2 rounded-2xl border border-[var(--border)] p-2">
        {isVideo
          ? <video className="max-h-[32dvh] w-full rounded-xl bg-black/30 object-contain" controls playsInline src={preview} aria-label="Vista previa del video" />
          : <img className="max-h-[32dvh] w-full rounded-xl object-contain" src={preview} alt="Vista previa de la publicación" />}
        {files.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Fotos seleccionadas">
          {previews.map((url, index) => <button key={url} type="button" className={button + " !p-1"}
            aria-label={`Vista previa de la foto ${index + 1}`} aria-pressed={selected === index}
            onClick={() => setSelected(index)}>
            <img className="h-10 w-10 rounded-md object-cover" src={url} alt="" />
          </button>)}
        </div>}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <span className="min-w-0 truncate text-xs text-[var(--sub)]">{file.name}</span>
          <div className="flex gap-2">
            <button type="button" className={button} disabled={busy} onClick={() => input.current.click()}>Cambiar</button>
            <button type="button" className={button} disabled={busy} onClick={() => {
              setSelected(Math.max(0, selected - 1));
              setFiles(items => items.filter((_, index) => index !== selected));
            }}>Quitar</button>
          </div>
        </div>
      </div> : <button type="button" className="grid min-h-28 place-items-center gap-1 rounded-2xl border border-dashed border-[var(--border)] p-3 text-sm"
        disabled={busy} onClick={() => input.current.click()}>
        {mode === "video" ? <Film aria-hidden="true" size={22} /> : <ImagePlus aria-hidden="true" size={22} />}
        <span>{mode === "video" ? "Elegir video" : mode === "photo" ? "Elegir fotos" : "Añadir fotos o video"}</span>
        <span className="text-xs text-[var(--sub)]">Hasta 4 fotos o 1 MP4 · 3 MB en total</span>
      </button>}
      <Notice error={error} />
      <button className={primary} disabled={busy || (!caption.trim() && !files.length)}>{busy ? "Publicando…" : "Publicar"}</button>
    </form>
  </dialog>;
}
