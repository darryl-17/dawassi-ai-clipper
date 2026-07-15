# DAWASSI AI CLIPPER

**Turn any Twitch or YouTube stream into viral shorts — free, open source, and running 100% on your own machine.**
No subscription. No watermark. No account. Nothing is uploaded to a cloud.

[![Latest release](https://img.shields.io/github/v/release/darryl-17/dawassi-ai-clipper?label=download&color=E4571E)](https://github.com/darryl-17/dawassi-ai-clipper/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-E4571E)](LICENSE)

**English** · [Français](#français)

---

## English

### What it is

DAWASSI AI Clipper buffers a live stream on your own computer so you can clip a moment *the second it happens* — no waiting for the VOD, no re-encoding. Then it gives you a full editor: AI captions, auto-shorts, a caption designer, overlays, music, and one-click publishing to YouTube.

The app runs in your browser at `http://localhost:3547`, but every byte stays on your machine.

### Features

**Capture**
- Rolling **2-hour live buffer** for Twitch & YouTube — clip the last 30s / 1 / 2 / 5 min instantly
- Buffer **up to 5 streams at once**, each with its own controls
- **Mark → clip from mark** for exact-length clips
- **Hype detection** — flags loudness spikes automatically so you can grab the whole reaction
- **VOD section download** — grab just the part you need, by timestamp
- Import your own video files

**AI tools (all on-device)**
- **Auto long → shorts** — finds the liveliest moments by loudness analysis and cuts vertical 9:16 shorts in one click
- **AI captions** — transcribes with Whisper right in your browser. The model downloads once (~145 MB), then works fully offline. Captions land as timed, editable layers
- **Enhance speech** — denoise, de-hum, compress and normalise to broadcast loudness
- **Upscale** — 1080p or 4K

**Editor**
- **Caption designer** — 10 fonts, custom colours, size slider, alignment, and 4 effects (outline / shadow / box / none). **Drag captions on the video to move them, or drag the corner handle to resize**
- **Multiple text layers**, each with its own style and on-screen timing
- **Overlays & stickers** (image/video), **background music**, **fade transitions**
- **Reframe** to 9:16 / 1:1 / 16:9 with a draggable crop box
- Trim, speed, mute, GIF export, thumbnail grab

**Publish**
- **One-click YouTube publishing** — connect your channel once, then upload any clip straight from your library (title, description, tags, privacy)

**Interface**
- Available in **English, Français, Español, Português, Deutsch** — auto-detected from your browser
- Dark theme by default, light theme available

### Quick start

**Requirements:** [Node.js 18+](https://nodejs.org) and [Python 3](https://python.org). On Windows, tick *"Add python.exe to PATH"* during install.

**Easiest — download the release**

1. Download **`DAWASSI-AI-Clipper.zip`** from the [latest release](https://github.com/darryl-17/dawassi-ai-clipper/releases/latest) and extract it
2. **Windows:** double-click `setup.bat`, then `Start DAWASSI AI CLIPPER.bat`
   **macOS / Linux:** run `./setup.sh`, then double-click `Start DAWASSI AI CLIPPER.command` (or `node server.js`)
3. Open **http://localhost:3547**

**From source**

```bash
git clone https://github.com/darryl-17/dawassi-ai-clipper
cd dawassi-ai-clipper
./setup.sh        # installs node deps + yt-dlp + ffmpeg (no Homebrew needed)
node server.js
```

### The main workflow

1. Paste a live URL (e.g. `https://twitch.tv/someone`) and press **Add & buffer** — do this *before* the moments happen.
2. The app records a rolling buffer on disk (up to 2 hours).
3. When something pops, press **Clip last 30s / 1 / 2 / 5 min** — cut instantly and saved to `clips/`.
4. Or press **Mark** when a moment starts and **from mark** when it ends.
5. Hit **Edit** on any clip for captions, shorts, overlays and export.

Clips are ordinary MP4 files in the `clips/` folder — open them, drag them into CapCut/Premiere, or publish straight from the app.

### Good to know

- Live clips are ~10–30 s behind real time (normal HLS delay), so "last 60 s" means the last 60 s *you saw*.
- Choose **480p or 720p** for live buffering on a slower connection — "Best quality" may download slower than real time and leave gaps.
- The live buffer uses roughly **2–3 GB per hour at 1080p**. Keep some free disk space.
- If the connection drops, the recorder reconnects and re-resolves the stream automatically.
- On Twitch, if you're not subscribed to the channel, ad breaks may appear inside the recording.
- Under the hood: `ffmpeg` and `yt-dlp`. To update yt-dlp when sites change formats: `./bin/yt-dlp -U`.
- YouTube publishing needs a free, one-time Google OAuth setup — the app walks you through it.

### Fair use

Clipping for commentary and reaction content is common practice, but the content still belongs to its creator. Follow the streamer's rules and the platform's terms, credit the original channel, and don't rebroadcast entire streams.

### License

[MIT](LICENSE) — fork it, tweak it, make it yours.

---

## Français

### C'est quoi

DAWASSI AI Clipper met un live en mémoire tampon sur **votre propre ordinateur** pour que vous puissiez clipper un moment *à la seconde où il arrive* — sans attendre le VOD, sans ré-encodage. Ensuite, un éditeur complet : sous-titres IA, shorts automatiques, éditeur de textes, incrustations, musique, et publication YouTube en un clic.

L'application s'ouvre dans votre navigateur sur `http://localhost:3547`, mais **rien ne quitte votre machine**.

### Fonctionnalités

**Capture**
- **Buffer live glissant de 2 heures** pour Twitch & YouTube — clippez les 30 dernières s / 1 / 2 / 5 min instantanément
- Bufferisez **jusqu'à 5 lives en même temps**, chacun avec ses propres commandes
- **Marquer → clipper depuis la marque** pour des clips de durée exacte
- **Détection des moments forts** — repère automatiquement les pics de volume pour capturer toute la réaction
- **Téléchargement d'une section de VOD** — seulement la partie voulue, par timestamp
- Importez vos propres fichiers vidéo

**Outils IA (100% en local)**
- **Shorts automatiques** — repère les moments les plus intenses au volume et découpe des shorts verticaux 9:16 en un clic
- **Sous-titres IA** — transcription avec Whisper directement dans votre navigateur. Le modèle se télécharge une seule fois (~145 Mo), puis tout fonctionne hors ligne. Les sous-titres deviennent des calques synchronisés et modifiables
- **Amélioration de la voix** — débruitage, compression et normalisation du volume
- **Upscale** — 1080p ou 4K

**Éditeur**
- **Éditeur de textes** — 10 polices, couleurs personnalisées, curseur de taille, alignement et 4 effets (contour / ombre / fond / aucun). **Faites glisser les textes sur la vidéo pour les déplacer, ou tirez la poignée d'angle pour les redimensionner**
- **Calques de texte multiples**, chacun avec son style et son timing
- **Incrustations & stickers** (image/vidéo), **musique de fond**, **fondus**
- **Recadrage** en 9:16 / 1:1 / 16:9 avec une zone déplaçable
- Rognage, vitesse, muet, export GIF, capture de miniature

**Publication**
- **Publication YouTube en un clic** — connectez votre chaîne une fois, puis publiez n'importe quel clip depuis votre bibliothèque (titre, description, tags, confidentialité)

**Interface**
- Disponible en **anglais, français, espagnol, portugais et allemand** — détecté automatiquement selon votre navigateur
- Thème sombre par défaut, thème clair disponible

### Démarrage rapide

**Prérequis :** [Node.js 18+](https://nodejs.org) et [Python 3](https://python.org). Sous Windows, cochez *« Add python.exe to PATH »* pendant l'installation.

**Le plus simple — téléchargez la release**

1. Téléchargez **`DAWASSI-AI-Clipper.zip`** depuis la [dernière release](https://github.com/darryl-17/dawassi-ai-clipper/releases/latest) et décompressez-la
2. **Windows :** double-cliquez sur `setup.bat`, puis sur `Start DAWASSI AI CLIPPER.bat`
   **macOS / Linux :** lancez `./setup.sh`, puis double-cliquez sur `Start DAWASSI AI CLIPPER.command` (ou `node server.js`)
3. Ouvrez **http://localhost:3547**

**Depuis les sources**

```bash
git clone https://github.com/darryl-17/dawassi-ai-clipper
cd dawassi-ai-clipper
./setup.sh        # installe les dépendances node + yt-dlp + ffmpeg (pas besoin de Homebrew)
node server.js
```

### Le workflow principal

1. Collez l'URL d'un live (ex. `https://twitch.tv/quelquun`) et appuyez sur **Ajouter & bufferiser** — faites-le *avant* que les moments arrivent.
2. L'application enregistre un buffer glissant sur le disque (jusqu'à 2 heures).
3. Quand ça part en vrille, appuyez sur **Clipper les 30 dernières s / 1 / 2 / 5 min** — le clip est découpé instantanément et enregistré dans `clips/`.
4. Ou appuyez sur **Marquer** au début du moment et **depuis la marque** à la fin.
5. Cliquez sur **Éditer** sur n'importe quel clip pour les sous-titres, les shorts, les incrustations et l'export.

Les clips sont de simples fichiers MP4 dans le dossier `clips/` — ouvrez-les, glissez-les dans CapCut/Premiere, ou publiez-les directement depuis l'application.

### Bon à savoir

- Les clips live ont ~10–30 s de retard sur le temps réel (délai HLS normal) : « les 60 dernières s » = les 60 s *que vous avez vues*.
- Choisissez **480p ou 720p** pour le buffer live sur une connexion lente — « Meilleure qualité » peut télécharger moins vite que le temps réel et créer des trous.
- Le buffer live consomme environ **2–3 Go par heure en 1080p**. Gardez de l'espace disque libre.
- Si la connexion tombe, l'enregistreur se reconnecte et re-résout le flux automatiquement.
- Sur Twitch, si vous n'êtes pas abonné à la chaîne, des pubs peuvent apparaître dans l'enregistrement.
- Sous le capot : `ffmpeg` et `yt-dlp`. Pour mettre à jour yt-dlp quand les sites changent de format : `./bin/yt-dlp -U`.
- La publication YouTube nécessite une configuration Google OAuth gratuite et unique — l'application vous guide.

### Usage responsable

Clipper pour du commentaire ou de la réaction est une pratique courante, mais le contenu appartient toujours à son créateur. Respectez les règles du streamer et les conditions de la plateforme, créditez la chaîne d'origine, et ne rediffusez pas des lives entiers.

### Licence

[MIT](LICENSE) — forkez-le, modifiez-le, faites-en le vôtre.
