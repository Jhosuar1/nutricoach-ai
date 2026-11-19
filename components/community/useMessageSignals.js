"use client";

import { useEffect, useRef, useState } from "react";
import { communityRequest } from "./api";

const empty = { userId: null, unread: 0, versions: {}, revision: 0, notice: null };

export function useMessageSignals(userId, activePeer) {
  const [state, setState] = useState(empty);
  const peer = useRef(activePeer);

  useEffect(() => { peer.current = activePeer; }, [activePeer]);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const seen = new Map();
    let initialized = false;
    let busy = false;
    let timer;
    let failures = 0;

    async function refresh() {
      if (document.hidden || busy || controller.signal.aborted) return;
      clearTimeout(timer);
      busy = true;

      try {
        const { senders } = await communityRequest("message-signals", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (controller.signal.aborted) return;
        failures = 0;

        const changed = senders.filter(sender => seen.get(sender.user_id) !== sender.latest);
        const notice = initialized ? changed.find(sender => sender.user_id !== peer.current) : null;
        initialized = true;
        changed.forEach(sender => seen.set(sender.user_id, sender.latest));
        const versions = changed.length ? Object.fromEntries(seen) : null;
        const unread = senders.reduce((count, sender) => count + sender.unread, 0);

        setState(previous => {
          const current = previous.userId === userId ? previous : { ...empty, userId };
          if (!changed.length && current.unread === unread) return current;
          return {
            ...current,
            unread,
            versions: versions ?? current.versions,
            revision: current.revision + (changed.length ? 1 : 0),
            notice: notice ?? current.notice,
          };
        });
      } catch {
        failures += 1;
      } finally {
        busy = false;
        if (!controller.signal.aborted && !document.hidden) {
          timer = setTimeout(refresh, Math.min(15000, 2000 * (2 ** failures)));
        }
      }
    }

    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [userId]);

  const current = state.userId === userId ? state : empty;

  useEffect(() => {
    if (!current.notice) return;
    const timer = setTimeout(() => setState(previous => previous.notice === current.notice
      ? { ...previous, notice: null } : previous), 8000);
    return () => clearTimeout(timer);
  }, [current.notice]);

  return {
    ...current,
    dismiss: () => setState(previous => previous.notice ? { ...previous, notice: null } : previous),
  };
}
