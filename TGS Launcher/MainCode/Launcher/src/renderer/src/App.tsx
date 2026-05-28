import { useState, useEffect, useRef } from "react";
const { ipcRenderer } = window.require("electron");

type Phase = "idle" | "installing" | "done";
type Mode = "dark" | "light";

/* ─── Theme definitions ─────────────────────────────────────── */
const THEMES = {
  dark: {
    // backgrounds
    windowBg: "#060810",
    titlebarBg: "transparent",
    footerBg: "#07090f",
    progressSectionBg: "#07090f",
    logBg: "#030508",
    outerBg: "#0a0c14",
    // border
    border: "#0e2a2a",
    // accent
    accent: "#00e5cc",
    accentAlt: "#00b4a0",
    accentGlow: "rgba(0,229,204,0.35)",
    accentGradient: "linear-gradient(90deg, #00e5cc, #00b4a0)",
    accentGradientHover: "linear-gradient(90deg, #00ffdd, #00cdb5)",
    // progress bar
    progressBg: "#0d1f1e",
    progressFill: "linear-gradient(90deg, #00e5cc, #00b4a0)",
    progressDotActive: "#00e5cc",
    progressDotDone: "#00b4a0",
    progressDotIdle: "#0d1f1e",
    // text
    textPrimary: "#e0fff8",
    textSecondary: "#4d9e98",
    textMuted: "#1f4f4a",
    textLabel: "#7ecbc5",
    // toggle
    toggleOn: "#00e5cc",
    toggleOff: "#0d1f1e",
    toggleThumb: "#e0fff8",
    // buttons
    cancelBorder: "#0e2a2a",
    cancelText: "#4d9e98",
    cancelHoverBg: "#0d1f1e",
    disabledBg: "#0d1f1e",
    disabledText: "#1f4f4a",
    // badge
    badgeInstalling: "#00e5cc",
    badgeDone: "#00b4a0",
    // window controls hover
    minHover: "rgba(255,255,255,0.08)",
    closeHover: "rgba(200,0,0,0.6)",
    controlText: "rgba(0,229,204,0.5)",
    // outer glow blobs
    blob1: "rgba(0,229,204,0.04)",
    blob2: "rgba(0,180,160,0.04)",
    // banner overlay top
    bannerTopGradient: "rgba(0,0,0,0.55)",
    bannerBottomGradient: "#060810",
    bannerLeftGradient: "rgba(6,8,16,0.65)",
    // step label
    stepColor: "#4d9e98",
    percentColor: "#00e5cc",
    // log text
    logText: "#2a6e6a",
    logLinkText: "#7ecbc5",
    // done button
    doneGradient: "linear-gradient(90deg, #00b4a0, #00e5cc)",
    doneHover: "linear-gradient(90deg, #00cdb5, #00ffdd)",
    doneGlow: "rgba(0,229,204,0.4)",
    // mode label
    modeLabel: "Pack Manager",
    modeSub: "",
    // banner
    banner: "/images/banner-dark.jpg",
    // name + version accent
    nameAccent: "#00e5cc",
  },
  light: {
    windowBg: "#f5f5f8",
    titlebarBg: "transparent",
    footerBg: "#ececf2",
    progressSectionBg: "#ececf2",
    logBg: "#e0e0ea",
    outerBg: "#dddde8",
    border: "#d0cfe8",
    accent: "#7c5cbf",
    accentAlt: "#9b7fdb",
    accentGlow: "rgba(124,92,191,0.25)",
    accentGradient: "linear-gradient(90deg, #7c5cbf, #9b7fdb)",
    accentGradientHover: "linear-gradient(90deg, #6a4aad, #8a6ec9)",
    progressBg: "#dddde8",
    progressFill: "linear-gradient(90deg, #7c5cbf, #9b7fdb)",
    progressDotActive: "#9b7fdb",
    progressDotDone: "#7c5cbf",
    progressDotIdle: "#dddde8",
    textPrimary: "#1a1628",
    textSecondary: "#7c5cbf",
    textMuted: "#c0bcd8",
    textLabel: "#9b8fc0",
    toggleOn: "#7c5cbf",
    toggleOff: "#c0bcd8",
    toggleThumb: "#ffffff",
    cancelBorder: "#c0bcd8",
    cancelText: "#9b8fc0",
    cancelHoverBg: "#dddde8",
    disabledBg: "#dddde8",
    disabledText: "#b0aac8",
    badgeInstalling: "#7c5cbf",
    badgeDone: "#5a3f9e",
    minHover: "rgba(0,0,0,0.07)",
    closeHover: "rgba(200,0,0,0.15)",
    controlText: "rgba(100,80,160,0.6)",
    blob1: "rgba(124,92,191,0.06)",
    blob2: "rgba(155,127,219,0.06)",
    bannerTopGradient: "rgba(245,245,248,0.35)",
    bannerBottomGradient: "#f5f5f8",
    bannerLeftGradient: "rgba(245,245,248,0.55)",
    stepColor: "#9b8fc0",
    percentColor: "#7c5cbf",
    logText: "#9b8fc0",
    logLinkText: "#7c5cbf",
    doneGradient: "linear-gradient(90deg, #7c5cbf, #9b7fdb)",
    doneHover: "linear-gradient(90deg, #6a4aad, #8a6ec9)",
    doneGlow: "rgba(124,92,191,0.35)",
    modeLabel: "Mod Manager",
    modeSub: "",
    banner: "/images/banner-light.jpg",
    nameAccent: "#7c5cbf",
  },
} as const;

const STEPS_DARK = [
  "Verificando requisitos do sistema...",
  "Baixando TGS Pack Manager...",
  "Extraindo pacotes de dados...",
  "Registrando módulos...",
  "Configurando banco de dados local...",
  "Finalizando instalação do Pack Manager...",
];

const STEPS_LIGHT = [
  "Verificando requisitos do sistema...",
  "Baixando TGS Mod Manager...",
  "Extraindo biblioteca de mods...",
  "Indexando biblioteca de mods...",
  "Configurando interface do manager...",
  "Finalizando instalação do Mod Manager...",
];

export default function App() {
  const [mode, setMode] = useState<Mode>("dark");
  const [transitioning, setTransitioning] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMode = useRef<Mode>(mode);
  const titlebarRef = useRef<HTMLDivElement>(null);

  const t = THEMES[mode];
  const STEPS = mode === "dark" ? STEPS_DARK : STEPS_LIGHT;
  const isRunning = phase === "installing";
  const isDone = phase === "done";

  /* ── mode switch with fade ─────────────────────────────────── */
  const MODES: Mode[] = ["dark", "light"];
  const cycleMode = () => {
    if (isRunning) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode((m) => {
        const currentIndex = MODES.indexOf(m);
        const nextIndex = (currentIndex + 1) % MODES.length;
        return MODES[nextIndex];
      });
      setPhase("idle");
      setProgress(0);
      setStepIndex(0);
      setLog([]);
      setTransitioning(false);
    }, 280);
  };

  /* ── keep prevMode in sync ─────────────────────────────────── */
  useEffect(() => {
    prevMode.current = mode;
  }, [mode]);

  /* ── log scroll ────────────────────────────────────────────── */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("pt-BR");
    setLog((prev) => [...prev, `[${time}] ${msg}`]);
  };

  /* ── installation animation ────────────────────────────────── */
  useEffect(() => {
    if (phase !== "installing") return;

    const target = ((stepIndex + 1) / STEPS.length) * 100;
    addLog(STEPS[stepIndex]);
    let current = progress;
    const stepDurations = [1200, 2000, 1500, 1000, 1300, 1000];
    const duration = stepDurations[stepIndex] ?? 1200;

    intervalRef.current = setInterval(() => {
      current += (target - current) * 0.08 + 0.2;
      if (current >= target - 0.5) {
        current = target;
        setProgress(Math.round(current));
        clearInterval(intervalRef.current!);
        setTimeout(() => {
          if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
          } else {
            setProgress(100);
            setPhase("done");
            addLog("✅ Instalação concluída com sucesso!");
          }
        }, 320);
      } else {
        setProgress(Math.round(current));
      }
    }, duration / 60);

    return () => clearInterval(intervalRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIndex]);

  const handleInstall = () => {
    setProgress(0);
    setStepIndex(0);
    setLog([]);
    addLog(`Iniciando instalação — modo ${mode === "dark" ? "Pack Manager" : "Mod Manager"}...`);
    setPhase("installing");
  };

  const handleCancel = () => {
    clearInterval(intervalRef.current!);
    setPhase("idle");
    setProgress(0);
    setStepIndex(0);
    setLog([]);
  };

  const handleMinimize = () => {
    ipcRenderer.invoke("window-minimize");
  };

  const handleClose = () => {
    ipcRenderer.invoke("window-close");
  };

  return (
    <div className="font-sans select-none">
      {/* ── Window ────────────────────────────────────────────── */}
      <div
        className="relative w-full h-screen overflow-hidden flex flex-col transition-all duration-300"
        style={{
          background: t.windowBg,
          opacity: transitioning ? 0 : 1,
          transition: "opacity 0.28s ease, background 0.5s ease",
        }}
      >
        {/* ── Title Bar ──────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 h-12 z-10 absolute top-0 left-0 right-0"
          style={{ 
            background: t.titlebarBg,
            WebkitAppRegion: 'drag' as any
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-1 drop-shadow-lg">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="w-8 h-8 object-cover shadow-lg"
            />
            <span
              className="font-semibold text-sm tracking-wide drop-shadow transition-colors duration-500"
              style={{ color: t.textPrimary }}
            >
              MyApp{" "}
              <span
                className="font-bold transition-colors duration-500"
                style={{ color: t.nameAccent }}
              >
                Launcher
                <sup
                  className="text-[10px] ml-0.5 transition-colors duration-500"
                  style={{ color: t.accent }}
                >
                  v2.4.1
                </sup>
              </span>
            </span>
          </div>

          {/* Controls */}
          <div 
            className="flex items-center gap-1"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={handleMinimize}
              className="w-8 h-8 flex items-center justify-center text-lg leading-none transition-colors duration-150"
              style={{ color: t.controlText }}
              onMouseEnter={(e) => (e.currentTarget.style.background = t.minHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="Minimizar"
            >
              −
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center text-sm transition-colors duration-150"
              style={{ color: t.controlText }}
              onMouseEnter={(e) => (e.currentTarget.style.background = t.closeHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        {/* Banner */}
        <div className="relative w-full h-[280px] overflow-hidden">
          <img
            key={t.banner}
            src={t.banner}
            alt="Banner"
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          {/* Overlays */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${t.bannerBottomGradient} 0%, transparent 55%)`,
              transition: "background 0.5s ease",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${t.bannerLeftGradient} 0%, transparent 50%)`,
              transition: "background 0.5s ease",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${t.bannerTopGradient} 0%, transparent 40%)`,
              transition: "background 0.5s ease",
            }}
          />

          {/* App info */}
          <div className="absolute bottom-6 left-6">
            <h1
              className="text-2xl font-bold drop-shadow-lg transition-colors duration-500"
              style={{ color: t.textPrimary }}
            >
              {t.modeLabel}
            </h1>
            <p
              className="text-sm mt-1 drop-shadow transition-colors duration-500"
              style={{ color: t.textLabel }}
            >
              245 MB · Windows / macOS / Linux
            </p>
          </div>

          {/* Status badge */}
          {isDone && (
            <div
              className="absolute top-14 right-4 text-white text-xs font-semibold px-3 py-1 shadow-lg"
              style={{ background: t.badgeDone }}
            >
              ✓ Instalado
            </div>
          )}
          {isRunning && (
            <div
              className="absolute top-14 right-4 text-white text-xs font-semibold px-3 py-1 shadow-lg animate-pulse"
              style={{ background: t.badgeInstalling }}
            >
              ⟳ Instalando...
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div
          className="px-6 py-4 transition-colors duration-500"
          style={{
            background: t.progressSectionBg,
            borderTop: `1px solid ${t.border}`,
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className="text-xs truncate max-w-[500px] transition-colors duration-500"
              style={{ color: t.stepColor }}
            >
              {isRunning
                ? STEPS[stepIndex]
                : isDone
                ? "Instalação concluída com sucesso!"
                : "Pronto para instalar"}
            </span>
            <span
              className="text-sm font-bold tabular-nums transition-colors duration-500"
              style={{
                color: isDone
                  ? t.accent
                  : isRunning
                  ? t.accent
                  : t.textMuted,
              }}
            >
              {progress}%
            </span>
          </div>

          {/* Bar */}
          <div
            className="w-full h-2.5 overflow-hidden transition-colors duration-500"
            style={{ background: t.progressBg }}
          >
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${progress}%`,
                background: t.progressFill,
                boxShadow: progress > 0 ? `0 0 8px ${t.accentGlow}` : "none",
              }}
            />
          </div>

          {/* Step dots */}
          {(isRunning || isDone) && (
            <div className="flex gap-1.5 mt-3">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 transition-all duration-500"
                  style={{
                    background:
                      i < stepIndex || isDone
                        ? t.progressDotDone
                        : i === stepIndex
                        ? t.progressDotActive
                        : t.progressDotIdle,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between transition-colors duration-500"
          style={{ background: t.footerBg }}
        >
          {/* Left: mode toggle + log */}
          <div className="flex items-center gap-4">
            {/* Mode button */}
            <button
              onClick={cycleMode}
              disabled={isRunning}
              title="Trocar modo"
              className="mode-button relative flex items-center overflow-hidden"
              style={{
                background: t.accentGradient,
                color: "#fff",
                fontFamily: "inherit",
                padding: "0.35em",
                paddingLeft: "1.2em",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "0.25em",
                border: "none",
                letterSpacing: "0.05em",
                height: "2.4em",
                paddingRight: "2.8em",
                cursor: isRunning ? "not-allowed" : "pointer",
                opacity: isRunning ? 0.45 : 1,
                boxShadow: `inset 0 0 1.6em -0.6em ${t.accentAlt}`,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!isRunning) {
                  const icon = e.currentTarget.querySelector('.mode-icon') as HTMLElement;
                  if (icon) {
                    icon.style.width = "calc(100% - 0.6em)";
                  }
                  const svg = e.currentTarget.querySelector('.mode-icon svg') as HTMLElement;
                  if (svg) {
                    svg.style.transform = "translateX(0.1em)";
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!isRunning) {
                  const icon = e.currentTarget.querySelector('.mode-icon') as HTMLElement;
                  if (icon) {
                    icon.style.width = "1.9em";
                  }
                  const svg = e.currentTarget.querySelector('.mode-icon svg') as HTMLElement;
                  if (svg) {
                    svg.style.transform = "translateX(0)";
                  }
                }
              }}
              onMouseDown={(e) => {
                if (!isRunning) {
                  const icon = e.currentTarget.querySelector('.mode-icon') as HTMLElement;
                  if (icon) {
                    icon.style.transform = "scale(0.95)";
                  }
                }
              }}
              onMouseUp={(e) => {
                if (!isRunning) {
                  const icon = e.currentTarget.querySelector('.mode-icon') as HTMLElement;
                  if (icon) {
                    icon.style.transform = "scale(1)";
                  }
                }
              }}
            >
              <span>change mode</span>
              <span
                className="mode-icon absolute flex items-center justify-center"
                style={{
                  background: "#fff",
                  marginLeft: "1em",
                  height: "1.9em",
                  width: "1.9em",
                  borderRadius: "0.2em",
                  boxShadow: `0.1em 0.1em 0.6em 0.2em ${t.accentAlt}`,
                  right: "0.25em",
                  transition: "all 0.3s",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    width: "1.1em",
                    color: t.accentAlt,
                    transition: "transform 0.3s",
                  }}
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path
                    d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>

            {/* Log button */}
            <button
              onClick={() => setShowLog((v) => !v)}
              className="text-xs transition-colors duration-200"
              style={{
                color: t.textMuted,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.textLabel)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
            >
              {showLog ? "Ocultar log" : "Ver log"}
            </button>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-3">
            {!isDone ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={phase === "idle"}
                  className="px-5 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    border: `1px solid ${t.cancelBorder}`,
                    color: phase === "idle" ? t.textMuted : t.cancelText,
                    cursor: phase === "idle" ? "not-allowed" : "pointer",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (phase !== "idle") e.currentTarget.style.background = t.cancelHoverBg;
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInstall}
                  disabled={isRunning}
                  className="px-6 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                  style={{
                    background: isRunning ? t.disabledBg : t.accentGradient,
                    color: isRunning ? t.disabledText : "#fff",
                    cursor: isRunning ? "not-allowed" : "pointer",
                    boxShadow: isRunning ? "none" : `0 0 18px ${t.accentGlow}`,
                    transition: "background 0.5s ease, box-shadow 0.5s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isRunning) {
                      e.currentTarget.style.background = t.accentGradientHover;
                      e.currentTarget.style.boxShadow = `0 0 28px ${t.accentGlow}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRunning) {
                      e.currentTarget.style.background = t.accentGradient;
                      e.currentTarget.style.boxShadow = `0 0 18px ${t.accentGlow}`;
                    }
                  }}
                >
                  {isRunning ? "Instalando..." : "Instalar"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    border: `1px solid ${t.cancelBorder}`,
                    color: t.cancelText,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.cancelHoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Reinstalar
                </button>
                <button
                  className="px-6 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                  style={{
                    background: t.doneGradient,
                    boxShadow: `0 0 18px ${t.doneGlow}`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.doneHover;
                    e.currentTarget.style.boxShadow = `0 0 28px ${t.doneGlow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.doneGradient;
                    e.currentTarget.style.boxShadow = `0 0 18px ${t.doneGlow}`;
                  }}
                >
                  Executar App ↗
                </button>
              </>
            )}
          </div>
        </div>

        {/* Log panel */}
        {showLog && (
          <div
            className="transition-colors duration-500"
            style={{ borderTop: `1px solid ${t.border}`, background: t.logBg }}
          >
            <div
              ref={logRef}
              className="h-32 overflow-y-auto p-3 font-mono text-[11px] space-y-0.5 transition-colors duration-500"
              style={{ color: t.logText }}
            >
              {log.length === 0 ? (
                <p className="italic" style={{ color: t.textMuted }}>
                  Nenhum log ainda...
                </p>
              ) : (
                log.map((line, i) => (
                  <p key={i} className="leading-relaxed">
                    {line}
                  </p>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}