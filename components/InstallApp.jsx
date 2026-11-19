"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

const InstallContext = createContext(null);

function getPlatform() {
  const agent = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(agent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(agent)) return "android";
  return "desktop";
}

export function InstallAppProvider({ children }) {
  const [platform, setPlatform] = useState(null);
  const [installed, setInstalled] = useState(false);
  const prompt = useRef(null);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    function updateDisplayMode() {
      setInstalled(displayMode.matches || navigator.standalone === true);
    }
    function rememberPrompt(event) {
      event.preventDefault();
      prompt.current = event;
    }
    function onInstalled() {
      prompt.current = null;
      setInstalled(true);
    }

    setPlatform(getPlatform());
    updateDisplayMode();
    displayMode.addEventListener?.("change", updateDisplayMode);
    window.addEventListener("beforeinstallprompt", rememberPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("No se pudo registrar el servicio de la app", error.name);
      });
    }

    return () => {
      displayMode.removeEventListener?.("change", updateDisplayMode);
      window.removeEventListener("beforeinstallprompt", rememberPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <InstallContext.Provider value={{ platform, installed, prompt, setInstalled }}>
      {children}
    </InstallContext.Provider>
  );
}

const instructions = {
  ios: [
    "Abre NutriCoach en Safari y toca Compartir. En algunas versiones está dentro del menú de la página.",
    "Selecciona Agregar a pantalla de inicio.",
    "Activa Abrir como app web si aparece y toca Agregar.",
  ],
  android: [
    "Abre NutriCoach en Chrome y toca el menú ⋮.",
    "Elige Instalar aplicación. Si ves Agregar a pantalla principal o Instalar y crear acceso directo, ábrelo y selecciona Instalar.",
    "Abre NutriCoach desde su ícono en la pantalla de inicio o en la lista de aplicaciones.",
  ],
  desktop: [
    "Abre el menú de Chrome o Edge y busca Instalar esta página como aplicación.",
    "Confirma y abre NutriCoach desde el ícono que se creó.",
  ],
};

export function InstallAppButton() {
  const { platform, installed, prompt, setInstalled } = useContext(InstallContext);
  const dialog = useRef(null);
  const [pending, setPending] = useState(false);

  if (!platform || installed) return null;

  async function install() {
    const event = prompt.current;
    if (!event) {
      dialog.current?.showModal();
      return;
    }

    prompt.current = null;
    setPending(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      dialog.current?.showModal();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold"
        style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--card)" }}
      >
        <Download size={17} aria-hidden="true" /> Instalar app
      </button>
      <dialog
        ref={dialog}
        aria-label="Instalar NutriCoach AI"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border p-5 backdrop:bg-black/65"
        style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--card)" }}
      >
        <h2 className="text-lg font-semibold">Instalar NutriCoach AI</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
          {instructions[platform].map((step) => <li key={step}>{step}</li>)}
        </ol>
        <form method="dialog" className="mt-5 flex justify-end">
          <button className="min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white">
            Entendido
          </button>
        </form>
      </dialog>
    </>
  );
}
