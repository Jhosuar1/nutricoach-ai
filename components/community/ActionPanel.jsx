"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function ActionPanel({ title, label, Icon, items, className }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [open]);

  return <div className="community-action-panel" ref={root} onKeyDown={event => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
  }}>
    <button className={className} type="button" ref={trigger} aria-label={title} aria-expanded={open}
      aria-controls={id} onClick={() => setOpen(value => !value)}>
      <Icon size={18} aria-hidden="true" />{label && <span>{label}</span>}
    </button>
    <div className="community-action-options" id={id} hidden={!open}>
      {items.map(({ Icon: ItemIcon, label: itemLabel, description, action }) => <button
        key={itemLabel} type="button" className="community-action-item" onClick={() => {
          setOpen(false);
          trigger.current?.focus();
          action();
        }}>
        <span className="community-action-icon"><ItemIcon size={18} aria-hidden="true" /></span>
        <span>
          <span className="block text-sm font-semibold">{itemLabel}</span>
          {description && <span className="block text-xs text-[var(--sub)]">{description}</span>}
        </span>
      </button>)}
    </div>
  </div>;
}
