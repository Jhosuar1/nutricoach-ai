import { Download, FileText } from "lucide-react";
import { button } from "./controls";

export default function ChatAttachment({ message }) {
  if (!message.mime) return null;
  const src = `/api/community/chat-file?id=${message.id}`;
  if (message.mime.startsWith("image/")) return <a href={src} target="_blank" rel="noreferrer">
    <img src={src} className="max-h-56 w-full rounded-lg object-contain" loading="lazy" alt={message.filename} />
  </a>;
  if (message.mime.startsWith("video/")) return <video className="max-h-56 w-full rounded-lg" src={src} controls playsInline preload="none" aria-label={message.filename} />;
  if (message.mime.startsWith("audio/")) return <audio className="block max-w-full" controls preload="none" src={src} aria-label="Nota de voz" />;
  return <a className={button + " max-w-full"} href={src} download={message.filename}>
    <FileText size={16} className="shrink-0" aria-hidden="true" /><span className="min-w-0 break-all">{message.filename}</span>
    <Download size={16} className="shrink-0" aria-hidden="true" />
  </a>;
}
