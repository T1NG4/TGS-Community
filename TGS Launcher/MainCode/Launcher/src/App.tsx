import { useState, useEffect, useRef } from "react";
import { initGa4 } from "./analytics/ga4";
import {
  trackHubAppInstallComplete,
  trackHubAppInstallFailed,
  trackHubAppInstallStart,
  trackHubAppLaunchFailed,
  trackHubAppOpen,
  trackHubAppUpdateComplete,
  trackHubAppUpdateFailed,
  trackHubAppUpdateStart,
  trackHubInstallCancelled,
  trackHubScreen,
  trackLauncherUpdateComplete,
  trackLauncherUpdateFailed,
  trackLauncherUpdateStart,
} from "./analytics/tgsEvents";

type Phase = "idle" | "installing" | "done";
type Mode = "dark" | "light" | "code";
type UpdateState = "checking" | "available" | "downloading" | "ready" | "error" | "idle";

function ButtonSpinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden
    />
  );
}

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
    modeLabel: "Pack Menager",
    modeSub: "245 MB",
    // banner
    banner: "./images/banner-dark.jpg",
    // name + version accent
    nameAccent: "#ffffff",
    // logo
    logo: "./images/TGS_logo.svg",
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
    modeLabel: "Mod Menager",
    modeSub: "120 MB",
    banner: "./images/banner-light.jpg",
    nameAccent: "#000000",
    // logo
    logo: "./images/TGS_logo_black.svg",
  },
  code: {
    // backgrounds
    windowBg: "#0a0a0a",
    titlebarBg: "transparent",
    footerBg: "#0c0c0c",
    progressSectionBg: "#0c0c0c",
    logBg: "#050505",
    outerBg: "#0d0d0d",
    // border
    border: "#2a2a2a",
    // accent - gray predominant with green accent
    accent: "#808080",
    accentAlt: "#76b900",
    accentGlow: "rgba(128,128,128,0.4)",
    accentGradient: "linear-gradient(90deg, #808080, #76b900)",
    accentGradientHover: "linear-gradient(90deg, #909090, #8cd100)",
    // progress bar
    progressBg: "#1a1a1a",
    progressFill: "linear-gradient(90deg, #808080, #76b900)",
    progressDotActive: "#808080",
    progressDotDone: "#76b900",
    progressDotIdle: "#1a1a1a",
    // text
    textPrimary: "#e0e0e0",
    textSecondary: "#808080",
    textMuted: "#4a4a4a",
    textLabel: "#76b900",
    // toggle
    toggleOn: "#808080",
    toggleOff: "#1a1a1a",
    toggleThumb: "#e0e0e0",
    // buttons
    cancelBorder: "#2a2a2a",
    cancelText: "#808080",
    cancelHoverBg: "#1a1a1a",
    disabledBg: "#1a1a1a",
    disabledText: "#4a4a4a",
    // badge
    badgeInstalling: "#808080",
    badgeDone: "#76b900",
    // window controls hover
    minHover: "rgba(255,255,255,0.08)",
    closeHover: "rgba(200,0,0,0.6)",
    controlText: "rgba(128,128,128,0.6)",
    // outer glow blobs
    blob1: "rgba(128,128,128,0.06)",
    blob2: "rgba(118,185,0,0.06)",
    // banner overlay top
    bannerTopGradient: "rgba(0,0,0,0.55)",
    bannerBottomGradient: "#0a0a0a",
    bannerLeftGradient: "rgba(10,10,10,0.65)",
    // step label
    stepColor: "#808080",
    percentColor: "#76b900",
    // log text
    logText: "#5a5a5a",
    logLinkText: "#76b900",
    // done button
    doneGradient: "linear-gradient(90deg, #76b900, #808080)",
    doneHover: "linear-gradient(90deg, #8cd100, #909090)",
    doneGlow: "rgba(128,128,128,0.4)",
    // mode label
    modeLabel: "TGS CODE",
    modeSub: "180 MB",
    // banner
    banner: "./images/banner-code.jpg",
    // name + version accent
    nameAccent: "#ffffff",
    // logo
    logo: "./images/TGS_logo.svg",
  },
} as const;

const STEPS_DARK = [
  "Verificando requisitos do sistema...",
  "Baixando TGS Pack Menager...",
  "Extraindo pacotes de dados...",
  "Registrando módulos...",
  "Configurando banco de dados local...",
  "Finalizando instalação do Pack Menager...",
];

const STEPS_LIGHT = [
  "Verificando requisitos do sistema...",
  "Baixando TGS Mod Menager...",
  "Extraindo catálogo de mods...",
  "Indexando biblioteca de mods...",
  "Configurando interface do catálogo...",
  "Finalizando instalação do Mod Menager...",
];

const STEPS_CODE = [
  "Verificando requisitos do sistema...",
  "Baixando TGS CODE...",
  "Extraindo arquivos de código...",
  "Configurando ambiente de desenvolvimento...",
  "Registrando componentes do CODE...",
  "Finalizando instalação do TGS CODE...",
];

export default function App() {
  const [mode, setMode] = useState<Mode>("dark");
  const [transitioning, setTransitioning] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMode = useRef<Mode>(mode);

  /* ── Auto-update state ───────────────────────────────────── */
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState<string>("");
  const [updateError, setUpdateError] = useState<string>("");
  const [appVersion, setAppVersion] = useState<string>("");
  const [installPath, setInstallPath] = useState<string>("");
  const [installError, setInstallError] = useState<string>("");
  const [appUpdate, setAppUpdate] = useState<{
    hasUpdate: boolean;
    installedVersion: string | null;
    latestVersion: string | null;
    notInstalled: boolean;
  }>({ hasUpdate: false, installedVersion: null, latestVersion: null, notInstalled: true });
  const [launcherUpdate, setLauncherUpdate] = useState({
    hasUpdate: false,
    currentVersion: "",
    latestVersion: "",
  });
  const [isLaunching, setIsLaunching] = useState(false);

  const t = THEMES[mode];

  /** Hub bloqueado enquanto o próprio Launcher não estiver na versão mais recente */
  const launcherBlocksHub =
    launcherUpdate.hasUpdate ||
    updateState === "available" ||
    updateState === "downloading" ||
    updateState === "ready";

  const getAppType = () =>
    mode === "dark" ? "packManager" : mode === "light" ? "modManager" : "codeManager";

  const getAppLabel = () =>
    mode === "dark" ? "Pack Menager" : mode === "light" ? "Mod Menager" : "TGS CODE";
  const STEPS = mode === "dark" ? STEPS_DARK : mode === "light" ? STEPS_LIGHT : STEPS_CODE;
  const isRunning = phase === "installing";
  const isDone = phase === "done";

  /* ── mode switch with fade ─────────────────────────────────── */
  const MODES: Mode[] = ["dark", "light", "code"];
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

  useEffect(() => {
    const appType = mode === "dark" ? "packManager" : mode === "light" ? "modManager" : "codeManager";
    const label = mode === "dark" ? "Pack Menager" : mode === "light" ? "Mod Menager" : "Code Manager";
    trackHubScreen(appType, label);
  }, [mode]);

  /* ── keep prevMode in sync ─────────────────────────────────── */
  useEffect(() => {
    prevMode.current = mode;
  }, [mode]);

  /* ── Auto-update IPC listeners ───────────────────────────── */
  useEffect(() => {
    // @ts-ignore
    if (!window.require) return;
    // @ts-ignore
    const { ipcRenderer } = window.require("electron");

    const onUpdateAvailable = (_: any, info: any) => {
      trackLauncherUpdateStart(appVersion, info?.version || "?");
      setUpdateState("available");
      setUpdateVersion(info?.version || "nova versão");
      setLauncherUpdate((prev) => ({
        ...prev,
        hasUpdate: true,
        latestVersion: info?.version || prev.latestVersion,
      }));
      addLog(`🔄 Update disponível: v${info?.version || "?"}`);
    };

    const onUpdateNotAvailable = () => {
      setUpdateState("idle");
      setLauncherUpdate((prev) => ({ ...prev, hasUpdate: false }));
      addLog("✅ Launcher está na versão mais recente");
    };

    const onDownloadProgress = (_: any, progress: any) => {
      setUpdateState("downloading");
      setUpdateProgress(Math.round(progress?.percent || 0));
    };

    const onUpdateDownloaded = (_: any, info: any) => {
      trackLauncherUpdateComplete(info?.version || updateVersion || appVersion);
      setUpdateState("ready");
      setLauncherUpdate((prev) => ({
        ...prev,
        hasUpdate: true,
        latestVersion: info?.version || prev.latestVersion,
      }));
      addLog("✅ Update baixado — pronto para instalar");
    };

    const onUpdateError = (_: any, err: any) => {
      const msg = err?.message || "Erro desconhecido";
      trackLauncherUpdateFailed(msg);
      setUpdateState("error");
      setUpdateError(msg);
      addLog(`❌ Erro no auto-update: ${msg}`);
    };

    const onInstallationProgress = (_: any, progress: any) => {
      const percent = Math.max(0, Math.min(100, Math.round(progress?.progress ?? 0)));
      setProgress(percent);
      if (percent < 25) setStepIndex(0);
      else if (percent < 50) setStepIndex(1);
      else if (percent < 75) setStepIndex(2);
      else if (percent < 95) setStepIndex(3);
      else setStepIndex(4);
    };

    ipcRenderer.on("update-available", onUpdateAvailable);
    ipcRenderer.on("update-not-available", onUpdateNotAvailable);
    ipcRenderer.on("download-progress", onDownloadProgress);
    ipcRenderer.on("update-downloaded", onUpdateDownloaded);
    ipcRenderer.on("update-error", onUpdateError);
    ipcRenderer.on("installation-progress", onInstallationProgress);

    ipcRenderer
      .invoke("get-app-info")
      .then(async (info: { version?: string } | null) => {
        if (info?.version) setAppVersion(info.version);
        await initGa4(info?.version);
        trackHubScreen("home", "hub");
      })
      .catch(() => {});

    ipcRenderer
      .invoke("get-default-install-path")
      .then((p: string) => {
        if (p) setInstallPath(p);
      })
      .catch(() => {});

    ipcRenderer.invoke("check-updates").catch(() => {});

    // Re-checar updates sem precisar reiniciar o .exe
    // - ao voltar o foco (usuário fica com app aberto por horas)
    // - em intervalo fixo
    const checkAutoUpdate = () => {
      ipcRenderer.invoke("check-updates").catch(() => {});
    };
    const onFocus = () => checkAutoUpdate();
    window.addEventListener("focus", onFocus);
    const autoUpdateInterval = setInterval(checkAutoUpdate, 10 * 60 * 1000);

    const checkLauncherVersion = async () => {
      try {
        const result = await ipcRenderer.invoke("check-launcher-update");
        if (result?.success) {
          setLauncherUpdate({
            hasUpdate: !!result.hasUpdate,
            currentVersion: result.currentVersion || "",
            latestVersion: result.latestVersion || "",
          });
          if (result.hasUpdate) {
            addLog(
              `⚠️ Launcher desatualizado (v${result.currentVersion} → v${result.latestVersion}). Atualize o hub antes de instalar/abrir apps.`
            );
          }
        }
      } catch {
        /* ignore */
      }
    };
    checkLauncherVersion();
    const launcherInterval = setInterval(checkLauncherVersion, 300000);

    return () => {
      clearInterval(launcherInterval);
      clearInterval(autoUpdateInterval);
      window.removeEventListener("focus", onFocus);
      ipcRenderer.removeListener("update-available", onUpdateAvailable);
      ipcRenderer.removeListener("update-not-available", onUpdateNotAvailable);
      ipcRenderer.removeListener("download-progress", onDownloadProgress);
      ipcRenderer.removeListener("update-downloaded", onUpdateDownloaded);
      ipcRenderer.removeListener("update-error", onUpdateError);
      ipcRenderer.removeListener("installation-progress", onInstallationProgress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstallUpdate = async () => {
    // @ts-ignore
    if (!window.require) return;
    // @ts-ignore
    const { ipcRenderer } = window.require("electron");
    await ipcRenderer.invoke("install-update");
  };

  /* ── log scroll ────────────────────────────────────────────── */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("pt-BR");
    setLog((prev) => [...prev, `[${time}] ${msg}`]);
  };

  /* ── Verificar update dos apps instalados (Pack/Mod/Code) ── */
  useEffect(() => {
    // @ts-ignore
    if (!window.require || !installPath) return;
    // @ts-ignore
    const { ipcRenderer } = window.require("electron");
    const appType = getAppType();

    const checkAppUpdate = async () => {
      try {
        const installed = await ipcRenderer.invoke("get-installed-apps", installPath);
        const appInfo = installed?.apps?.[appType];
        if (appInfo?.installed) {
          setPhase((p) => (p === "installing" ? p : "done"));
        }

        const result = await ipcRenderer.invoke("check-app-update", appType, installPath);
        if (!result?.success) return;

        setAppUpdate({
          hasUpdate: !!result.hasUpdate,
          installedVersion: result.installedVersion ?? null,
          latestVersion: result.latestVersion ?? null,
          notInstalled: !!result.notInstalled,
        });
      } catch {
        /* ignore */
      }
    };

    checkAppUpdate();
    const interval = setInterval(checkAppUpdate, 300000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installPath, mode]);

  /* ── installation step label sync ──────────────────────────── */
  useEffect(() => {
    if (phase !== "installing") return;
    if (STEPS[stepIndex]) addLog(STEPS[stepIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIndex]);

  /* ── Electron Window Resize ──────────────────────────────── */
  useEffect(() => {
    const handleResize = async () => {
      try {
        // @ts-ignore
        const electron = window.require ? window.require("electron") : null;
        if (electron) {
          const { ipcRenderer } = electron;
          let targetHeight = 410;

          if (minimized) {
            targetHeight = 48;
          } else if (showLog) {
            targetHeight = 410 + 128;
          }

          console.log(`[Resize] Target: ${targetHeight}px (Log: ${showLog}, Min: ${minimized})`);
          await ipcRenderer.invoke("window-resize", { width: 780, height: targetHeight });
        }
      } catch (err) {
        console.error("Erro ao redimensionar janela:", err);
      }
    };
    handleResize();
  }, [showLog, minimized]);

  /* ── System Handlers ─────────────────────────────────────── */
  const sysMinimize = async () => {
    // @ts-ignore
    if (window.require) {
      // @ts-ignore
      const { ipcRenderer } = window.require("electron");
      await ipcRenderer.invoke("window-minimize");
    }
  };

  const sysClose = async () => {
    // @ts-ignore
    if (window.require) {
      // @ts-ignore
      const { ipcRenderer } = window.require("electron");
      await ipcRenderer.invoke("window-close");
    }
  };

  const handlePickFolder = async () => {
    if (isRunning) return;
    // @ts-ignore
    if (!window.require) return;
    // @ts-ignore
    const { ipcRenderer } = window.require("electron");
    try {
      const picked = await ipcRenderer.invoke("pick-install-folder");
      if (!picked) return;
      setInstallPath(picked);
      const cfg = await ipcRenderer.invoke("load-config");
      await ipcRenderer.invoke("save-config", { ...cfg, installPath: picked });
      addLog(`Pasta de instalação definida: ${picked}`);
    } catch (err: any) {
      addLog(`❌ Erro ao escolher pasta: ${err?.message || String(err)}`);
    }
  };

  const handleInstall = async () => {
    if (launcherBlocksHub) {
      addLog(
        launcherUpdate.hasUpdate
          ? `⚠️ Atualize o TGS Launcher (v${launcherUpdate.currentVersion} → v${launcherUpdate.latestVersion}) antes de instalar apps.`
          : "⚠️ Conclua a atualização do TGS Launcher (banner no topo) antes de instalar apps."
      );
      return;
    }

    const appLabel = getAppLabel();
    const isAppUpdate =
      appUpdate.hasUpdate &&
      appUpdate.installedVersion &&
      appUpdate.latestVersion;

    setProgress(0);
    setStepIndex(0);
    setLog([]);
    setInstallError("");
    const appType = getAppType();
    addLog(
      isAppUpdate
        ? `Atualizando ${appLabel} (v${appUpdate.installedVersion} → v${appUpdate.latestVersion})...`
        : `Iniciando instalação — ${appLabel}...`
    );
    setPhase("installing");
    const installStartedAt = Date.now();
    if (isAppUpdate) {
      trackHubAppUpdateStart(
        appType,
        appUpdate.installedVersion || "?",
        appUpdate.latestVersion || "?"
      );
    } else {
      trackHubAppInstallStart(appType, appUpdate.latestVersion || "latest");
    }

    // @ts-ignore
    if (!window.require) {
      setInstallError("Ambiente Electron não detectado");
      setPhase("idle");
      return;
    }
    // @ts-ignore
    const { ipcRenderer } = window.require("electron");

    try {
      const result = await ipcRenderer.invoke("start-installation", {
        appType,
        installPath,
        type: "minimal",
        createShortcuts: true,
      });

      if (result?.success) {
        setProgress(100);
        setStepIndex(STEPS.length - 1);
        setPhase("done");
        addLog(`✅ ${appLabel} instalado com sucesso (v${result.version || "?"})`);
        const ver = result.version || "";
        if (isAppUpdate) {
          trackHubAppUpdateComplete(appType, ver);
        } else {
          trackHubAppInstallComplete(appType, ver, Date.now() - installStartedAt);
        }
        setAppUpdate({
          hasUpdate: false,
          installedVersion: result.version || null,
          latestVersion: result.version || null,
          notInstalled: false,
        });
        try {
          const cfg = await ipcRenderer.invoke("load-config");
          await ipcRenderer.invoke("save-config", { ...cfg, installPath });
        } catch {
          /* ignore persist errors */
        }
      } else {
        const errMsg = result?.errors?.join("; ") || "Falha desconhecida";
        if (isAppUpdate) trackHubAppUpdateFailed(appType, errMsg);
        else trackHubAppInstallFailed(appType, errMsg);
        setInstallError(errMsg);
        addLog(`❌ Falha na instalação: ${errMsg}`);
        setPhase("idle");
      }
    } catch (err: any) {
      const message = err?.message || String(err);
      if (isAppUpdate) trackHubAppUpdateFailed(appType, message);
      else trackHubAppInstallFailed(appType, message);
      setInstallError(message);
      addLog(`❌ Erro na instalação: ${message}`);
      setPhase("idle");
    }
  };

  const handleCancel = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phase === "installing") {
      trackHubInstallCancelled(getAppType());
    }
    // @ts-ignore
    if (phase === "installing" && window.require) {
      // @ts-ignore
      const { ipcRenderer } = window.require("electron");
      try {
        await ipcRenderer.invoke("cancel-installation");
      } catch {
        // ignore
      }
    }
    setPhase("idle");
    setProgress(0);
    setStepIndex(0);
    setLog([]);
    setInstallError("");
  };

  const handleLaunch = async () => {
    // @ts-ignore
    if (!window.require || isLaunching) return;

    if (launcherBlocksHub) {
      addLog(
        launcherUpdate.hasUpdate
          ? `⚠️ Atualize o TGS Launcher (v${launcherUpdate.currentVersion} → v${launcherUpdate.latestVersion}) antes de abrir apps.`
          : "⚠️ Conclua a atualização do TGS Launcher (banner no topo) antes de abrir apps."
      );
      return;
    }

    if (appUpdate.hasUpdate) return;

    // @ts-ignore
    const { ipcRenderer } = window.require("electron");
    const appType = getAppType();

    setIsLaunching(true);
    try {
      const fresh = await ipcRenderer.invoke("check-app-update", appType, installPath);
      if (fresh?.hasUpdate) {
        setAppUpdate({
          hasUpdate: true,
          installedVersion: fresh.installedVersion ?? null,
          latestVersion: fresh.latestVersion ?? null,
          notInstalled: !!fresh.notInstalled,
        });
        return;
      }

      await ipcRenderer.invoke("launch-app", appType, installPath);
      trackHubAppOpen(appType, appUpdate.installedVersion || appVersion);
      addLog(`▶ Aplicativo iniciado`);
    } catch (err: any) {
      const message = err?.message || String(err);
      trackHubAppLaunchFailed(appType, message);
      addLog(`❌ Falha ao iniciar app: ${message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-500"
      style={{ background: t.outerBg }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-700"
          style={{ background: t.blob1 }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl transition-colors duration-700"
          style={{ background: t.blob2 }}
        />
      </div>

      {/* ── Window ────────────────────────────────────────────── */}
      <div
        className="relative w-[780px] shadow-2xl overflow-hidden flex flex-col transition-opacity duration-300"
        style={{
          background: t.windowBg,
          border: `1px solid ${t.border}`,
          opacity: transitioning ? 0 : 1,
          transition: "opacity 0.28s ease, background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease",
          boxShadow: `0 8px 60px rgba(0,0,0,0.5), 0 0 0 1px ${t.border}, 0 0 40px ${t.accentGlow}`,
          height: minimized ? "48px" : showLog ? "538px" : "410px",
        }}
      >
        {/* ── Title Bar ──────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 h-12 z-10 absolute top-0 left-0 right-0"
          style={{ background: t.titlebarBg, WebkitAppRegion: "drag" } as any}
        >
          {/* Logo */}
          <div className="flex items-center gap-1 drop-shadow-lg">
            <img
              src={t.logo}
              alt="Logo"
              className="w-9 h-9 object-contain drop-shadow-md"
            />
            <span
              className="font-semibold text-sm tracking-wide drop-shadow transition-colors duration-500"
              style={{ color: t.textPrimary }}
            >
              <span
                className="font-bold transition-colors duration-500"
                style={{ color: t.nameAccent }}
              >
                Launcher
                <sup
                  className="text-[10px] ml-0.5 transition-colors duration-500"
                  style={{ color: t.accent }}
                >
                  v{appVersion || "…"}
                </sup>
              </span>
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" } as any}>
            <button
              onClick={sysMinimize}
              className="w-8 h-8 flex items-center justify-center text-lg leading-none transition-colors duration-150"
              style={{ color: t.controlText }}
              onMouseEnter={(e) => (e.currentTarget.style.background = t.minHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="Minimizar"
            >
              −
            </button>
            <button
              onClick={sysClose}
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

        {/* ── Update Notification ───────────────────────────── */}
        {!minimized && updateState !== "idle" && updateState !== "checking" && (
          <div
            className="absolute top-12 left-0 right-0 z-20 px-4 py-2 flex items-center justify-between"
            style={{
              background: updateState === "error" ? "#4a1515" : t.accentAlt,
              borderBottom: `1px solid ${t.border}`,
              transition: "all 0.3s ease",
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: updateState === "error" ? "#ff8888" : t.textPrimary }}>
                {updateState === "available" && "🔄 Nova versão disponível"}
                {updateState === "downloading" && `⬇️ Baixando update... ${updateProgress}%`}
                {updateState === "ready" && "✅ Update pronto para instalar"}
                {updateState === "error" && `❌ Erro: ${updateError}`}
              </span>
              {updateVersion && updateState === "available" && (
                <span style={{ color: t.textSecondary, fontSize: "12px" }}>
                  (v{updateVersion})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {updateState === "downloading" && (
                <div
                  className="w-24 h-1.5 rounded-full overflow-hidden"
                  style={{ background: t.progressBg }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${updateProgress}%`,
                      background: t.accent,
                    }}
                  />
                </div>
              )}
              {updateState === "ready" && (
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1 text-xs font-semibold rounded transition-all duration-200"
                  style={{
                    background: t.windowBg,
                    color: t.accent,
                    border: `1px solid ${t.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.accent;
                    e.currentTarget.style.color = t.windowBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.windowBg;
                    e.currentTarget.style.color = t.accent;
                  }}
                >
                  Reiniciar e Atualizar
                </button>
              )}
              {updateState === "error" && (
                <button
                  onClick={() => setUpdateState("idle")}
                  className="px-3 py-1 text-xs font-semibold rounded transition-all duration-200"
                  style={{
                    background: "transparent",
                    color: "#ff8888",
                    border: "1px solid #ff8888",
                  }}
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────── */}
        {!minimized && (
          <>
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
                  {t.modeSub} · Windows
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
              className="px-6 py-3 transition-colors duration-500"
              style={{
                background: t.progressSectionBg,
                borderTop: `1px solid ${t.border}`,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-xs truncate max-w-[500px] transition-colors duration-500"
                  style={{ color: installError ? "#ff8888" : t.stepColor }}
                  title={installError || undefined}
                >
                  {installError
                    ? `Erro: ${installError}`
                    : isRunning
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
              className="px-6 py-3 flex items-center justify-between transition-colors duration-500"
              style={{ background: t.footerBg }}
            >
              {/* Left: mode toggle + log */}
              <div className="flex flex-col gap-1.5 min-w-0 flex-1 max-w-[420px]">
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
                <div className="flex items-center gap-2 min-w-0 text-[10px] leading-tight" style={{ color: t.textLabel }}>
                  <span className="truncate min-w-0" title={installPath || ""}>
                    {installPath ? `Instalação: ${installPath}` : "Carregando pasta…"}
                  </span>
                  <button
                    type="button"
                    onClick={handlePickFolder}
                    disabled={isRunning}
                    className="shrink-0 px-2 py-0.5 rounded border text-[10px] transition-colors duration-150"
                    style={{
                      borderColor: t.cancelBorder,
                      color: isRunning ? t.textMuted : t.cancelText,
                      cursor: isRunning ? "not-allowed" : "pointer",
                      background: "transparent",
                    }}
                  >
                    Alterar pasta
                  </button>
                </div>
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
                      disabled={isRunning || launcherBlocksHub}
                      className="px-6 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                      style={{
                        background: isRunning || launcherBlocksHub ? t.disabledBg : t.accentGradient,
                        color: isRunning || launcherBlocksHub ? t.disabledText : "#fff",
                        cursor: isRunning || launcherBlocksHub ? "not-allowed" : "pointer",
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
                      {appUpdate.hasUpdate ? "Reinstalar do zero" : "Reinstalar"}
                    </button>
                    <button
                      onClick={appUpdate.hasUpdate ? handleInstall : handleLaunch}
                      disabled={launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning)}
                      className="px-6 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-lg inline-flex items-center justify-center gap-2 min-w-[9.5rem]"
                      style={{
                        background: launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning)
                          ? t.disabledBg
                          : appUpdate.hasUpdate
                            ? t.accentGradient
                            : t.doneGradient,
                        boxShadow: launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning)
                          ? "none"
                          : appUpdate.hasUpdate
                            ? `0 0 18px ${t.accentGlow}`
                            : `0 0 18px ${t.doneGlow}`,
                        color: launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning) ? t.disabledText : "#fff",
                        cursor: launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning) ? "not-allowed" : "pointer",
                        transition: "background 0.5s ease, box-shadow 0.5s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning)) return;
                        if (appUpdate.hasUpdate) {
                          e.currentTarget.style.background = t.accentGradientHover;
                          e.currentTarget.style.boxShadow = `0 0 28px ${t.accentGlow}`;
                        } else {
                          e.currentTarget.style.background = t.doneHover;
                          e.currentTarget.style.boxShadow = `0 0 28px ${t.doneGlow}`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (launcherBlocksHub || isLaunching || (appUpdate.hasUpdate && isRunning)) return;
                        if (appUpdate.hasUpdate) {
                          e.currentTarget.style.background = t.accentGradient;
                          e.currentTarget.style.boxShadow = `0 0 18px ${t.accentGlow}`;
                        } else {
                          e.currentTarget.style.background = t.doneGradient;
                          e.currentTarget.style.boxShadow = `0 0 18px ${t.doneGlow}`;
                        }
                      }}
                    >
                      {isLaunching ? (
                        <>
                          <ButtonSpinner />
                          Abrindo...
                        </>
                      ) : appUpdate.hasUpdate && isRunning ? (
                        <>
                          <ButtonSpinner />
                          Atualizando...
                        </>
                      ) : appUpdate.hasUpdate ? (
                        "Atualizar"
                      ) : (
                        "Executar App"
                      )}
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
          </>
        )}
      </div>
    </div>
  );
}
