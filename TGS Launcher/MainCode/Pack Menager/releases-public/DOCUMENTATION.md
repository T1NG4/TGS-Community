# TGS Pack Manager — User Guide

Public documentation for the **TGS FiveM Pack Manager**.  
Releases repository: [T1NG4/TGS-pack-manager-releases](https://github.com/T1NG4/TGS-pack-manager-releases)

> **Languages:** [English](./DOCUMENTATION.md) · [Português (Brasil)](./DOCUMENTACAO.md)

---

## Table of contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Installation and first run](#installation-and-first-run)
4. [Updates](#updates)
5. [Main interface](#main-interface)
6. [Creating and managing packs](#creating-and-managing-packs)
7. [Exporting packs](#exporting-packs)
8. [Output folder](#output-folder)
9. [FAQ](#faq)
10. [Useful links](#useful-links)

---

## Overview

**TGS Pack Manager** automates car pack creation for **FiveM** servers using the TGS-optimized structure:

| Exported resource | Contents |
|-------------------|----------|
| **VehiclesPack** | Models, textures, handling, vehicles.meta |
| **SoundsPack** | Engine audio (`.awc`, manifests) |
| **WheelsPack** | Custom wheels, `carcols.meta`, tuning |

The app must be launched through **TGS Launcher** (security token). Opening the `.exe` directly without the Launcher shows access denied on the installed build.

---

## Requirements

- **Windows 10/11** (64-bit)
- **~500 MB** free in the install folder (+ space for exported packs)
- **TGS Launcher** installed ([download](https://github.com/T1NG4/TGS-launcher-releases/releases/latest))
- Internet connection to install, update, and load sponsorship config during export

---

## Installation and first run

### Step by step

1. Open **TGS Launcher**.
2. Select **Pack Manager** mode (dark theme).
3. Set the install folder with **Change folder** (e.g. `C:\TGS`).
4. Click **Install** and wait for the portable download.
5. When **Run App** appears, click to open Pack Manager.

### Where files are stored

```
<chosen folder>/
  data/
    apps/
      packManager/
        TGS-Pack-Manager-Portable.exe
        version.json
```

The `output/` folder (generated packs) lives next to the app runtime according to the **Config** tab settings.

---

## Updates

### Via Launcher (recommended)

- The Launcher compares the installed version (`version.json`) with the latest release in this repository.
- If a newer version exists, **you cannot open** the app until you click **Update**.
- **Close Pack Manager** before updating (the `.exe` must not be in use).

### Inside the app

- With `latest.yml` on the release, the app can notify about updates and restart after download.
- When in doubt, always use the **Launcher** to ensure the correct version.

### Manual download

1. Open [Releases](https://github.com/T1NG4/TGS-pack-manager-releases/releases/latest).
2. Download `TGS-Pack-Manager-Portable.exe`.
3. Replace the file in `data\apps\packManager\` (app closed).

---

## Main interface

| Tab | Purpose |
|-----|---------|
| **Packs** | List, create, and edit packs |
| **Brands** | Brands within the current pack |
| **Wheels** | Shared wheels / carcols |
| **Sound** | Audio settings |
| **Logs** | Operation diagnostics |
| **Config** | Language, packs folder, preferences |

**Footer**

- Connection / update indicator (version vs GitHub)
- **TGS_Pack_Docs** — opens this guide in the browser
- **GitHub** — opens this public repository (releases + documentation)

---

## Creating and managing packs

1. **Create pack** — name and TGS base structure.
2. Add **brands** and **vehicles**.
3. Upload files (`.yft`, `.ytd`, `.meta`, etc.) via drag & drop or file picker.
4. Use the built-in meta XML editor when needed.
5. Configure sound and wheels in the dedicated tabs.

Work data stays in local staging until export.

---

## Exporting packs

1. Open the desired pack.
2. Click **Export Pack**.
3. **Sponsorship (ads):** before export, you may need to watch a full ad (supports the project).
   - If you see an error loading ads, check your internet connection and try **Retry**.
   - Remote config managed by TGS (`TGS-ads`).
4. After completing the ad, confirm **Export Pack**.
5. Resources are generated in `output/` (Vehicles, Sounds, Wheels).

---

## Output folder

- Configurable in the **Config** tab (*Packs directory*).
- Typical structure after export:

```
output/
  <pack-name>/
    TGS-VehiclesPack/
    TGS-SoundsPack/
    TGS-WheelsPack/
```

Copy these folders into your FiveM server `resources` directory.

---

## FAQ

**The app won't open from the Launcher**  
Check that installation finished and no update is pending. Review the Launcher log (**View log**).

**Update error — file in use**  
Fully close Pack Manager and try again.

**Export blocked — “Could not load ads”**  
Update to the latest version (v2.0.4+). Requires internet on the first export after opening the modal.

**Access denied when opening the .exe alone**  
Always use **TGS Launcher** → Run App.

**Where is the source code?**  
[github.com/T1NG4/TGS-pack-manager](https://github.com/T1NG4/TGS-pack-manager)

---

## Useful links

| Resource | URL |
|----------|-----|
| Releases (download) | https://github.com/T1NG4/TGS-pack-manager-releases/releases |
| Documentation (English) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTATION.md |
| Documentation (PT-BR) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTACAO.md |
| TGS Launcher | https://github.com/T1NG4/TGS-launcher-releases/releases |
| Pack Manager source | https://github.com/T1NG4/TGS-pack-manager |
| TGS Community site | https://tgs.gamer.gd/pack-manager/ |

---

*Last documentation update: aligned with release **v2.1.0**.*
