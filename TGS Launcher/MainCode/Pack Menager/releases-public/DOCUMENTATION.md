# TGS Pack Manager — User Guide

> **Languages:** [English](./DOCUMENTATION.md) · [Português (Brasil)](./DOCUMENTACAO.md)

---

## Table of contents

1. [How it works](#how-it-works)
2. [What you need](#what-you-need)
3. [Install and open the app](#install-and-open-the-app)
4. [Using Pack Manager step by step](#using-pack-manager-step-by-step)
5. [The main tabs](#the-main-tabs)
6. [Export your pack to the server](#export-your-pack-to-the-server)
7. [Updates](#updates)
8. [FAQ](#faq)
9. [Useful links](#useful-links)

---

## How it works

**TGS Pack Manager** helps you build **vehicle packs for FiveM** without organizing folders and files by hand.

In practice:

1. You **create a pack** and give it a name.
2. You add **brands** and **vehicles**, and upload the car files (drag & drop or file picker).
3. You set up **engine sounds** and **wheels** when needed.
4. You click **Export Pack** and the app generates ready-made folders for your server.
5. You copy those folders into your FiveM server **resources** and start using the pack.

Each export can include:

| Part | What it is for |
|------|----------------|
| **Vehicles** | Cars, models, and vehicle settings |
| **Sounds** | Custom engine audio |
| **Wheels** | Custom wheels and tuning |

> **Important:** TGS apps (including Pack Manager) must be opened through the **TGS Launcher** — use **Run App** after installing.

---

## What you need

- **Windows 10 or 11**
- **TGS Launcher** installed ([download](https://github.com/T1NG4/TGS-launcher-releases/releases/latest))
- Enough disk space for the app and the packs you export
- Internet to install, update, and export (when sponsorship is enabled)

---

## Install and open the app

1. Open **TGS Launcher**.
2. Select **Pack Manager**.
3. Choose where to install with **Change folder** if you want a custom location.
4. Click **Install** and wait for it to finish.
5. Click **Run App** to open Pack Manager.

Always open the app from the Launcher — do not run the portable file on its own.

---

## Using Pack Manager step by step

### 1. Create a pack

On the **Packs** tab, click **Create pack**, choose a name, and confirm. That pack is your workspace for one server project (or one collection of cars).

### 2. Add brands and vehicles

- Open the pack and go to **Brands** to organize manufacturers or groups.
- Add **vehicles** under each brand.
- Upload files by **drag & drop** or the file button.

### 3. Adjust sound and wheels (optional)

- **Sound** — link or configure engine audio for the pack.
- **Wheels** — manage shared wheels used by several vehicles.

### 4. Export

- Open the pack and click **Export Pack**.
- If asked, complete the **sponsorship step** (supports the project), then confirm export.
- When finished, the app shows where the exported folders are. You can change the output location in **Config** (*Packs directory*).

### 5. Use on your FiveM server

Copy the exported folders into your server’s **resources** directory and add them to your `server.cfg` like any other resource.

---

## The main tabs

| Tab | What you do here |
|-----|------------------|
| **Packs** | See all packs, create new ones, open one to work on |
| **Brands** | Brands and vehicles inside the current pack |
| **Wheels** | Wheels shared across vehicles |
| **Sound** | Engine sound settings |
| **Logs** | Recent actions and messages if something fails |
| **Config** | Language, where exports are saved, other preferences |

In the footer you can open **this guide** (TGS_Pack_Docs) or the **releases page** on GitHub.

---

## Export your pack to the server

After export you get separate folders for **vehicles**, **sounds**, and **wheels** (when you configured them). They are already organized for FiveM — you only need to copy them to the server.

**Tip:** Export again after changing vehicles or meta so the server always has the latest version.

If export fails:

- Check your internet connection and try **Retry**.
- Update Pack Manager through the **Launcher** if you are on an old version.
- Make sure the pack has the required files for the vehicles you added.

---

## Updates

The easiest way:

1. Open **TGS Launcher**.
2. If **Update** appears for Pack Manager, close the app completely first.
3. Click **Update** in the Launcher, then **Run App** again.

The Launcher keeps Pack Manager on the latest version. You can also check [Releases](https://github.com/T1NG4/TGS-pack-manager-releases/releases/latest) for release notes.

---

## FAQ

**Pack Manager does not open**  
Install or update it from the TGS Launcher. If **Update** is showing, update first, then use **Run App**.

**I closed the app but update says the file is in use**  
Fully close Pack Manager (including from the taskbar) and try again.

**Export stuck or “Could not load ads”**  
Check your internet, click **Retry**, and make sure you are on the latest version via the Launcher.

**Can I open the app without the Launcher?**  
No. Use **TGS Launcher** → **Run App**.

**Where do I get help?**  
[TGS Community Discord](https://discord.gg/cYv7W4XCXv) · [tgs.gamer.gd/pack-manager/](https://tgs.gamer.gd/pack-manager/)

---

## Useful links

| Resource | URL |
|----------|-----|
| TGS Launcher (install apps) | https://github.com/T1NG4/TGS-launcher-releases/releases/latest |
| Pack Manager releases | https://github.com/T1NG4/TGS-pack-manager-releases/releases |
| Documentation (English) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTATION.md |
| Documentation (PT-BR) | https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTACAO.md |
| TGS Community site | https://tgs.gamer.gd/pack-manager/ |

---

*User guide for TGS Pack Manager.*
