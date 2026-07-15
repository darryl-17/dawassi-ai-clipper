/**
 * DAWASSI AI Clipper — tiny i18n layer shared by the landing page and the app.
 *
 * Usage in HTML:  <span data-i18n="key">fallback</span>
 *                 <input data-i18n-ph="key">        (placeholder)
 *                 <button data-i18n-title="key">    (title/tooltip)
 * Usage in JS:    t('key')
 *
 * Everything is bundled — no network, works fully offline like the rest of the app.
 * Adding a language = add one entry to DICT. Missing keys fall back to English.
 */
const LANGS = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
];

const DICT = {
  en: {
    // ---- landing: nav + hero
    'nav.new': "What's new", 'nav.features': 'Features', 'nav.how': 'How it works', 'nav.pricing': 'Pricing',
    'hero.proof': 'FREE &amp; 100% LOCAL · OPEN SOURCE',
    'hero.h1': 'The <span class="mark">#1 Local</span><br>Clipping Tool For Streamers',
    'hero.sub': 'Buffer any Twitch or YouTube live stream on your own PC and turn its best moments into clips, GIFs and vertical Shorts — with AI hype detection. No subscriptions, no watermarks, nothing uploaded.',
    'hero.cta1': 'Launch DAWASSI Clipper', 'hero.cta2': 'See how it works',
    'hero.micro': 'Runs on your machine · Works on Windows, macOS &amp; Linux · No account needed',
    // ---- landing: features
    'feat.eyebrow': 'Everything a clipper needs', 'feat.h2': 'Built to catch the moment — instantly',
    'feat.1.t': 'Rolling 2-hour buffer', 'feat.1.d': 'Records the live stream in the background. Every “Clip last 30s / 1 / 2 / 5 min” button cuts instantly — no re-encoding, no waiting for the VOD.',
    'feat.2.t': 'AI captions &amp; auto-shorts', 'feat.2.d': 'Transcribe speech on-device into timed captions, and auto-cut a long video into the liveliest vertical shorts — in one click.',
    'feat.3.t': 'Caption designer', 'feat.3.d': '10 fonts, custom colours, size, alignment and effects (outline / shadow / box). Drag captions on screen or resize by the corner handle.',
    'feat.4.t': 'AI hype detection', 'feat.4.d': 'Listens for crowd pops and loudness spikes and flags hype moments automatically. One click grabs the whole reaction.',
    'feat.5.t': 'Vertical 9:16 export', 'feat.5.d': 'Turn any clip into a 1080×1920 short for TikTok, Reels and YouTube Shorts with auto centered cropping.',
    'feat.6.t': 'Enhance &amp; upscale', 'feat.6.d': 'Denoise and loudness-normalise speech, and upscale clips to crisp 1080p or 4K — all locally with ffmpeg.',
    'feat.7.t': 'One-click YouTube publish', 'feat.7.d': 'Connect your channel once, then upload finished clips straight from your library — title, description and privacy included.',
    'feat.8.t': '100% local &amp; private', 'feat.8.d': 'Everything runs on your computer. No cloud, no watermark, no account — your clips never leave your machine.',
    // ---- landing: what's new
    'new.eyebrow': "What's new", 'new.h2': 'A brand-new studio, packed with AI tools',
    'new.sub': 'We rebuilt DAWASSI from the ground up — a sleek dark workspace, one-click auto-shorts, on-device AI captions, a full caption designer and direct YouTube publishing. Still 100% local, free and watermark-free.',
    'new.cap1': 'The new dashboard — sidebar, one-click auto-shorts and a full local tool grid.',
    'new.cap2': 'The caption designer — 10 fonts, colours, effects &amp; drag-to-resize on screen.',
    'new.n1': '<b>Auto long→shorts.</b> Paste a link (or pick a clip) and DAWASSI finds the liveliest moments by loudness and cuts vertical 9:16 shorts in one click.',
    'new.n2': '<b>On-device AI captions.</b> Transcribe any clip with Whisper — right in your browser, offline after the first run — into timed, fully-editable caption layers.',
    'new.n3': '<b>Caption designer.</b> 10 fonts, custom colours, size, alignment and effects (outline / shadow / box) — drag captions on the preview or resize them by their corner handle.',
    'new.n4': '<b>Overlays, music &amp; transitions.</b> Drop image/video overlays and stickers, add a background music track, and fade clips in and out.',
    'new.n5': '<b>Enhance speech &amp; Upscale.</b> Clean up audio (denoise + broadcast loudness) and upscale clips to 1080p or 4K.',
    'new.n6': '<b>One-click YouTube publishing.</b> Connect your channel and upload finished clips straight from the library.',
    // ---- landing: how it works
    'how.eyebrow': 'How it works', 'how.h2': 'From live stream to posted clip in seconds',
    'how.1.t': 'Paste the stream', 'how.1.d': 'Drop any Twitch or YouTube live URL and hit Start buffering before the action begins.',
    'how.2.t': 'Catch the moment', 'how.2.d': 'When something pops, press one clip button — or let hype detection flag it for you.',
    'how.3.t': 'Make it vertical', 'how.3.d': 'One click exports a 9:16 short, a GIF, or a thumbnail — ready for any platform.',
    'how.4.t': 'Post &amp; grow', 'how.4.d': 'Your clip is a plain MP4 in your clips folder. Drag it into CapCut or upload it directly.',
    'how.demo1': 'Watch the 60-second demo', 'how.demo2': 'See DAWASSI AI Clipper in action on X →',
    // ---- landing: pricing / showcase / maker
    'price.eyebrow': 'Pricing', 'price.h2': 'Free. Forever. Open source.',
    'price.sub': 'Other clipping tools charge $20–30/month and stamp their logo on your content. DAWASSI AI Clipper is completely free, runs on your own machine, and the full code is on GitHub — fork it, tweak it, make it yours.',
    'price.cta': 'Launch it now',
    'show.h2': 'Full control with our<br>web editor. Feels like magic.', 'show.cta': 'Open the editor',
    'show.top': 'streamer clip · editing', 'show.export': 'Export Video',
    'maker.eyebrow': 'Meet the maker',
    'maker.q': '"I got tired of paying for clipping tools that watermark my content and upload my clips to their servers. So I built DAWASSI AI Clipper — fast, free, private, and made to catch the moment while the stream is still live."',
    'maker.role': 'Creator of DAWASSI AI Clipper',
    // ---- landing: faq / final / footer
    'faq.eyebrow': 'FAQs', 'faq.h2': 'Frequently asked questions',
    'faq.q1': 'Is DAWASSI AI Clipper really free?', 'faq.a1': "Yes — it's 100% free and open source under the MIT license. No subscription, no trial limits, no watermark. The full code is on GitHub for anyone to use or fork.",
    'faq.q2': 'Do my clips get uploaded anywhere?', 'faq.a2': 'Never. Everything runs locally on your own computer — the buffer, the clipping, and the editor. Your clips stay on your machine and are never sent to any server.',
    'faq.q3': 'Which platforms can I clip?', 'faq.a3': 'Twitch and YouTube — both live streams and VODs. Paste a live URL to buffer and clip in real time, or a VOD URL with timestamps to grab just a section.',
    'faq.q4': 'What is AI hype detection?', 'faq.a4': 'While buffering a live stream, DAWASSI listens for loudness spikes — crowd pops, screaming, chaos — and automatically flags those hype moments so you can clip the whole reaction with one click.',
    'faq.q5': 'Does it work on Windows?', 'faq.a5': "Yes. DAWASSI AI Clipper runs on Windows, macOS and Linux. There's a one-click setup script for each, and it installs everything it needs automatically.",
    'faq.q6': 'Can I edit clips into vertical Shorts?', 'faq.a6': 'Absolutely. The built-in web editor lets you trim, reframe to 9:16 / 1:1 / 16:9 with a draggable crop box, burn in captions, change speed, and export — all in the browser.',
    'final.h2': 'Ready to catch the next big moment?', 'final.p': 'Start buffering your favorite stream and never miss a clip again.',
    'foot.website': 'Website', 'foot.contact': 'Contact',
    'foot.copy': '© 2026 Darryl Wassi · DAWASSI AI CLIPPER — free &amp; open source · runs 100% on your machine',
    'lang.label': 'Language',
  },

  fr: {
    'nav.new': 'Nouveautés', 'nav.features': 'Fonctionnalités', 'nav.how': 'Comment ça marche', 'nav.pricing': 'Tarifs',
    'hero.proof': 'GRATUIT &amp; 100% LOCAL · OPEN SOURCE',
    'hero.h1': "L'outil de clipping <span class=\"mark\">local n°1</span><br>pour les streamers",
    'hero.sub': "Mettez en mémoire tampon n'importe quel live Twitch ou YouTube sur votre propre PC et transformez ses meilleurs moments en clips, GIFs et Shorts verticaux — avec détection des moments forts par IA. Sans abonnement, sans filigrane, rien n'est envoyé en ligne.",
    'hero.cta1': 'Lancer DAWASSI Clipper', 'hero.cta2': 'Voir comment ça marche',
    'hero.micro': 'Tourne sur votre machine · Windows, macOS &amp; Linux · Aucun compte requis',
    'feat.eyebrow': "Tout ce qu'il faut pour clipper", 'feat.h2': "Conçu pour capturer l'instant — immédiatement",
    'feat.1.t': 'Buffer glissant de 2 heures', 'feat.1.d': "Enregistre le live en arrière-plan. Chaque bouton « Clipper les 30 dernières s / 1 / 2 / 5 min » découpe instantanément — sans ré-encodage, sans attendre le VOD.",
    'feat.2.t': 'Sous-titres IA &amp; shorts auto', 'feat.2.d': "Transcrivez la parole en sous-titres synchronisés directement sur votre appareil, et découpez automatiquement une longue vidéo en shorts verticaux — en un clic.",
    'feat.3.t': 'Éditeur de textes', 'feat.3.d': "10 polices, couleurs personnalisées, taille, alignement et effets (contour / ombre / fond). Déplacez les textes à l'écran ou redimensionnez-les par la poignée d'angle.",
    'feat.4.t': 'Détection des moments forts', 'feat.4.d': "Écoute les pics de volume et les réactions du public, et signale automatiquement les moments forts. Un clic capture toute la réaction.",
    'feat.5.t': 'Export vertical 9:16', 'feat.5.d': "Transformez n'importe quel clip en short 1080×1920 pour TikTok, Reels et YouTube Shorts, avec recadrage centré automatique.",
    'feat.6.t': 'Amélioration &amp; upscale', 'feat.6.d': "Débruitez et normalisez le volume de la voix, et passez vos clips en 1080p ou 4K — le tout en local avec ffmpeg.",
    'feat.7.t': 'Publication YouTube en 1 clic', 'feat.7.d': "Connectez votre chaîne une fois, puis publiez vos clips finis directement depuis votre bibliothèque — titre, description et confidentialité inclus.",
    'feat.8.t': '100% local &amp; privé', 'feat.8.d': "Tout tourne sur votre ordinateur. Pas de cloud, pas de filigrane, pas de compte — vos clips ne quittent jamais votre machine.",
    'new.eyebrow': 'Nouveautés', 'new.h2': "Un studio entièrement repensé, bourré d'outils IA",
    'new.sub': "Nous avons reconstruit DAWASSI de zéro — un espace de travail sombre et élégant, des shorts automatiques en un clic, des sous-titres IA générés en local, un vrai éditeur de textes et la publication YouTube directe. Toujours 100% local, gratuit et sans filigrane.",
    'new.cap1': "Le nouveau tableau de bord — barre latérale, shorts auto en un clic et une grille d'outils entièrement locale.",
    'new.cap2': "L'éditeur de textes — 10 polices, couleurs, effets &amp; redimensionnement direct à l'écran.",
    'new.n1': "<b>Shorts automatiques.</b> Collez un lien (ou choisissez un clip) et DAWASSI repère les moments les plus intenses au volume et découpe des shorts verticaux 9:16 en un clic.",
    'new.n2': "<b>Sous-titres IA en local.</b> Transcrivez n'importe quel clip avec Whisper — directement dans votre navigateur, hors ligne après le premier lancement — en calques de texte synchronisés et modifiables.",
    'new.n3': "<b>Éditeur de textes.</b> 10 polices, couleurs personnalisées, taille, alignement et effets (contour / ombre / fond) — déplacez les textes sur l'aperçu ou redimensionnez-les par leur poignée d'angle.",
    'new.n4': "<b>Incrustations, musique &amp; transitions.</b> Ajoutez des images/vidéos et des stickers, une piste de musique de fond, et des fondus en entrée et en sortie.",
    'new.n5': "<b>Amélioration de la voix &amp; upscale.</b> Nettoyez l'audio (débruitage + volume broadcast) et passez vos clips en 1080p ou 4K.",
    'new.n6': "<b>Publication YouTube en un clic.</b> Connectez votre chaîne et publiez vos clips finis directement depuis la bibliothèque.",
    'how.eyebrow': 'Comment ça marche', 'how.h2': 'Du live au clip publié en quelques secondes',
    'how.1.t': 'Collez le live', 'how.1.d': "Déposez n'importe quelle URL de live Twitch ou YouTube et lancez le buffer avant que l'action commence.",
    'how.2.t': "Capturez l'instant", 'how.2.d': "Quand ça part en vrille, appuyez sur un bouton — ou laissez la détection des moments forts le signaler pour vous.",
    'how.3.t': 'Passez en vertical', 'how.3.d': "Un clic exporte un short 9:16, un GIF ou une miniature — prêt pour toutes les plateformes.",
    'how.4.t': 'Publiez &amp; grandissez', 'how.4.d': "Votre clip est un simple MP4 dans votre dossier clips. Glissez-le dans CapCut ou publiez-le directement.",
    'how.demo1': 'Regardez la démo de 60 secondes', 'how.demo2': 'DAWASSI AI Clipper en action sur X →',
    'price.eyebrow': 'Tarifs', 'price.h2': 'Gratuit. Pour toujours. Open source.',
    'price.sub': "Les autres outils de clipping facturent 20–30 $/mois et apposent leur logo sur votre contenu. DAWASSI AI Clipper est entièrement gratuit, tourne sur votre propre machine, et tout le code est sur GitHub — forkez-le, modifiez-le, faites-en le vôtre.",
    'price.cta': 'Lancez-le maintenant',
    'show.h2': 'Le contrôle total avec notre<br>éditeur web. Presque magique.', 'show.cta': "Ouvrir l'éditeur",
    'show.top': 'clip streamer · édition', 'show.export': 'Exporter la vidéo',
    'maker.eyebrow': 'Le créateur',
    'maker.q': "« J'en avais assez de payer des outils de clipping qui mettent un filigrane sur mon contenu et envoient mes clips sur leurs serveurs. Alors j'ai créé DAWASSI AI Clipper — rapide, gratuit, privé, et fait pour capturer l'instant pendant que le live est encore en cours. »",
    'maker.role': 'Créateur de DAWASSI AI Clipper',
    'faq.eyebrow': 'FAQ', 'faq.h2': 'Questions fréquentes',
    'faq.q1': 'DAWASSI AI Clipper est-il vraiment gratuit ?', 'faq.a1': "Oui — 100% gratuit et open source sous licence MIT. Pas d'abonnement, pas de limite d'essai, pas de filigrane. Tout le code est sur GitHub, libre d'utilisation.",
    'faq.q2': 'Mes clips sont-ils envoyés quelque part ?', 'faq.a2': "Jamais. Tout tourne en local sur votre ordinateur — le buffer, le découpage et l'éditeur. Vos clips restent sur votre machine et ne sont jamais envoyés à un serveur.",
    'faq.q3': 'Quelles plateformes puis-je clipper ?', 'faq.a3': "Twitch et YouTube — lives et VODs. Collez une URL de live pour bufferiser et clipper en temps réel, ou une URL de VOD avec des timestamps pour n'extraire qu'une section.",
    'faq.q4': 'Quest-ce que la détection des moments forts ?', 'faq.a4': "Pendant la mise en mémoire tampon d'un live, DAWASSI écoute les pics de volume — cris, réactions du public, chaos — et signale automatiquement ces moments forts pour que vous puissiez clipper toute la réaction en un clic.",
    'faq.q5': 'Est-ce que ça marche sur Windows ?', 'faq.a5': "Oui. DAWASSI AI Clipper tourne sur Windows, macOS et Linux. Un script d'installation en un clic existe pour chaque système et installe automatiquement tout le nécessaire.",
    'faq.q6': 'Puis-je transformer mes clips en Shorts verticaux ?', 'faq.a6': "Absolument. L'éditeur web intégré permet de rogner, recadrer en 9:16 / 1:1 / 16:9 avec une zone déplaçable, incruster des sous-titres, changer la vitesse et exporter — le tout dans le navigateur.",
    'final.h2': 'Prêt à capturer le prochain grand moment ?', 'final.p': 'Lancez le buffer sur votre stream préféré et ne ratez plus jamais un clip.',
    'foot.website': 'Site web', 'foot.contact': 'Contact',
    'foot.copy': '© 2026 Darryl Wassi · DAWASSI AI CLIPPER — gratuit &amp; open source · tourne 100% sur votre machine',
    'lang.label': 'Langue',
  },

  es: {
    'nav.new': 'Novedades', 'nav.features': 'Funciones', 'nav.how': 'Cómo funciona', 'nav.pricing': 'Precios',
    'hero.proof': 'GRATIS &amp; 100% LOCAL · CÓDIGO ABIERTO',
    'hero.h1': 'La herramienta de clips <span class="mark">local n.º 1</span><br>para streamers',
    'hero.sub': 'Guarda en búfer cualquier directo de Twitch o YouTube en tu propio PC y convierte sus mejores momentos en clips, GIFs y Shorts verticales — con detección de momentos épicos por IA. Sin suscripciones, sin marcas de agua, nada se sube.',
    'hero.cta1': 'Abrir DAWASSI Clipper', 'hero.cta2': 'Ver cómo funciona',
    'hero.micro': 'Funciona en tu equipo · Windows, macOS &amp; Linux · Sin cuenta',
    'feat.eyebrow': 'Todo lo que necesita un clipper', 'feat.h2': 'Creado para capturar el momento — al instante',
    'feat.1.t': 'Búfer continuo de 2 horas', 'feat.1.d': 'Graba el directo en segundo plano. Cada botón «Clip de los últimos 30s / 1 / 2 / 5 min» corta al instante — sin recodificar, sin esperar al VOD.',
    'feat.2.t': 'Subtítulos IA &amp; shorts automáticos', 'feat.2.d': 'Transcribe la voz en tu dispositivo a subtítulos sincronizados y corta automáticamente un vídeo largo en los shorts verticales más intensos — en un clic.',
    'feat.3.t': 'Editor de textos', 'feat.3.d': '10 fuentes, colores personalizados, tamaño, alineación y efectos (contorno / sombra / caja). Arrastra los textos en pantalla o redimensiónalos por la esquina.',
    'feat.4.t': 'Detección de momentos épicos', 'feat.4.d': 'Escucha los picos de volumen y las reacciones del público y marca los momentos épicos automáticamente. Un clic captura toda la reacción.',
    'feat.5.t': 'Exportación vertical 9:16', 'feat.5.d': 'Convierte cualquier clip en un short de 1080×1920 para TikTok, Reels y YouTube Shorts con recorte centrado automático.',
    'feat.6.t': 'Mejora &amp; escalado', 'feat.6.d': 'Elimina ruido y normaliza el volumen de la voz, y escala tus clips a 1080p o 4K — todo en local con ffmpeg.',
    'feat.7.t': 'Publicación en YouTube en 1 clic', 'feat.7.d': 'Conecta tu canal una vez y sube los clips terminados directamente desde tu biblioteca — título, descripción y privacidad incluidos.',
    'feat.8.t': '100% local &amp; privado', 'feat.8.d': 'Todo funciona en tu ordenador. Sin nube, sin marca de agua, sin cuenta — tus clips nunca salen de tu máquina.',
    'new.eyebrow': 'Novedades', 'new.h2': 'Un estudio totalmente nuevo, lleno de herramientas de IA',
    'new.sub': 'Hemos reconstruido DAWASSI desde cero — un espacio de trabajo oscuro y elegante, shorts automáticos en un clic, subtítulos IA en local, un editor de textos completo y publicación directa en YouTube. Sigue siendo 100% local, gratis y sin marca de agua.',
    'new.cap1': 'El nuevo panel — barra lateral, shorts automáticos en un clic y una rejilla de herramientas totalmente local.',
    'new.cap2': 'El editor de textos — 10 fuentes, colores, efectos &amp; redimensionado en pantalla.',
    'new.n1': '<b>Shorts automáticos.</b> Pega un enlace (o elige un clip) y DAWASSI encuentra los momentos más intensos por volumen y corta shorts verticales 9:16 en un clic.',
    'new.n2': '<b>Subtítulos IA en local.</b> Transcribe cualquier clip con Whisper — en tu navegador, sin conexión tras el primer uso — en capas de texto sincronizadas y totalmente editables.',
    'new.n3': '<b>Editor de textos.</b> 10 fuentes, colores personalizados, tamaño, alineación y efectos (contorno / sombra / caja) — arrastra los textos en la vista previa o redimensiónalos por la esquina.',
    'new.n4': '<b>Superposiciones, música &amp; transiciones.</b> Añade imágenes/vídeos y stickers, una pista de música de fondo y fundidos de entrada y salida.',
    'new.n5': '<b>Mejora de voz &amp; escalado.</b> Limpia el audio (sin ruido + volumen broadcast) y escala tus clips a 1080p o 4K.',
    'new.n6': '<b>Publicación en YouTube en un clic.</b> Conecta tu canal y sube los clips terminados directamente desde la biblioteca.',
    'how.eyebrow': 'Cómo funciona', 'how.h2': 'Del directo al clip publicado en segundos',
    'how.1.t': 'Pega el directo', 'how.1.d': 'Suelta cualquier URL de directo de Twitch o YouTube e inicia el búfer antes de que empiece la acción.',
    'how.2.t': 'Captura el momento', 'how.2.d': 'Cuando pase algo, pulsa un botón — o deja que la detección de momentos épicos lo marque por ti.',
    'how.3.t': 'Hazlo vertical', 'how.3.d': 'Un clic exporta un short 9:16, un GIF o una miniatura — listo para cualquier plataforma.',
    'how.4.t': 'Publica &amp; crece', 'how.4.d': 'Tu clip es un MP4 normal en tu carpeta de clips. Arrástralo a CapCut o súbelo directamente.',
    'how.demo1': 'Mira la demo de 60 segundos', 'how.demo2': 'DAWASSI AI Clipper en acción en X →',
    'price.eyebrow': 'Precios', 'price.h2': 'Gratis. Para siempre. Código abierto.',
    'price.sub': 'Otras herramientas de clips cobran 20–30 $/mes y ponen su logo en tu contenido. DAWASSI AI Clipper es totalmente gratis, funciona en tu propia máquina y todo el código está en GitHub — bifúrcalo, ajústalo, hazlo tuyo.',
    'price.cta': 'Ábrelo ahora',
    'show.h2': 'Control total con nuestro<br>editor web. Parece magia.', 'show.cta': 'Abrir el editor',
    'show.top': 'clip de streamer · edición', 'show.export': 'Exportar vídeo',
    'maker.eyebrow': 'Conoce al creador',
    'maker.q': '«Me cansé de pagar por herramientas de clips que ponen marca de agua en mi contenido y suben mis clips a sus servidores. Así que creé DAWASSI AI Clipper — rápido, gratis, privado y hecho para capturar el momento mientras el directo sigue en marcha.»',
    'maker.role': 'Creador de DAWASSI AI Clipper',
    'faq.eyebrow': 'Preguntas', 'faq.h2': 'Preguntas frecuentes',
    'faq.q1': '¿DAWASSI AI Clipper es realmente gratis?', 'faq.a1': 'Sí — es 100% gratis y de código abierto bajo licencia MIT. Sin suscripción, sin límites de prueba, sin marca de agua. Todo el código está en GitHub para usar o bifurcar.',
    'faq.q2': '¿Mis clips se suben a algún sitio?', 'faq.a2': 'Nunca. Todo funciona en local en tu propio ordenador — el búfer, el corte y el editor. Tus clips se quedan en tu máquina y nunca se envían a ningún servidor.',
    'faq.q3': '¿Qué plataformas puedo clipear?', 'faq.a3': 'Twitch y YouTube — directos y VODs. Pega una URL de directo para bufferear y clipear en tiempo real, o una URL de VOD con marcas de tiempo para extraer solo una sección.',
    'faq.q4': '¿Qué es la detección de momentos épicos?', 'faq.a4': 'Mientras bufferea un directo, DAWASSI escucha los picos de volumen — gritos, reacciones, caos — y marca automáticamente esos momentos para que puedas clipear toda la reacción en un clic.',
    'faq.q5': '¿Funciona en Windows?', 'faq.a5': 'Sí. DAWASSI AI Clipper funciona en Windows, macOS y Linux. Hay un script de instalación en un clic para cada uno que instala todo lo necesario automáticamente.',
    'faq.q6': '¿Puedo editar clips como Shorts verticales?', 'faq.a6': 'Por supuesto. El editor web integrado te permite recortar, reencuadrar a 9:16 / 1:1 / 16:9 con una caja arrastrable, incrustar subtítulos, cambiar la velocidad y exportar — todo en el navegador.',
    'final.h2': '¿Listo para capturar el próximo gran momento?', 'final.p': 'Empieza a bufferear tu stream favorito y no pierdas ni un clip más.',
    'foot.website': 'Sitio web', 'foot.contact': 'Contacto',
    'foot.copy': '© 2026 Darryl Wassi · DAWASSI AI CLIPPER — gratis &amp; código abierto · funciona 100% en tu máquina',
    'lang.label': 'Idioma',
  },

  pt: {
    'nav.new': 'Novidades', 'nav.features': 'Recursos', 'nav.how': 'Como funciona', 'nav.pricing': 'Preços',
    'hero.proof': 'GRÁTIS &amp; 100% LOCAL · CÓDIGO ABERTO',
    'hero.h1': 'A ferramenta de clipes <span class="mark">local n.º 1</span><br>para streamers',
    'hero.sub': 'Faça buffer de qualquer live da Twitch ou do YouTube no seu próprio PC e transforme os melhores momentos em clipes, GIFs e Shorts verticais — com detecção de momentos épicos por IA. Sem assinatura, sem marca d\'água, nada é enviado.',
    'hero.cta1': 'Abrir o DAWASSI Clipper', 'hero.cta2': 'Ver como funciona',
    'hero.micro': 'Roda na sua máquina · Windows, macOS &amp; Linux · Sem conta',
    'feat.eyebrow': 'Tudo o que um clipador precisa', 'feat.h2': 'Feito para capturar o momento — na hora',
    'feat.1.t': 'Buffer contínuo de 2 horas', 'feat.1.d': 'Grava a live em segundo plano. Cada botão «Clipar os últimos 30s / 1 / 2 / 5 min» corta na hora — sem recodificar, sem esperar o VOD.',
    'feat.2.t': 'Legendas IA &amp; shorts automáticos', 'feat.2.d': 'Transcreva a fala no seu próprio aparelho em legendas sincronizadas e corte automaticamente um vídeo longo nos shorts verticais mais intensos — em um clique.',
    'feat.3.t': 'Editor de textos', 'feat.3.d': '10 fontes, cores personalizadas, tamanho, alinhamento e efeitos (contorno / sombra / caixa). Arraste os textos na tela ou redimensione pela alça de canto.',
    'feat.4.t': 'Detecção de momentos épicos', 'feat.4.d': 'Escuta picos de volume e reações do público e marca os momentos épicos automaticamente. Um clique captura a reação inteira.',
    'feat.5.t': 'Exportação vertical 9:16', 'feat.5.d': 'Transforme qualquer clipe num short 1080×1920 para TikTok, Reels e YouTube Shorts com corte centralizado automático.',
    'feat.6.t': 'Melhoria &amp; upscale', 'feat.6.d': 'Remova ruído e normalize o volume da voz, e aumente seus clipes para 1080p ou 4K — tudo local com ffmpeg.',
    'feat.7.t': 'Publicação no YouTube em 1 clique', 'feat.7.d': 'Conecte seu canal uma vez e envie os clipes prontos direto da sua biblioteca — título, descrição e privacidade incluídos.',
    'feat.8.t': '100% local &amp; privado', 'feat.8.d': 'Tudo roda no seu computador. Sem nuvem, sem marca d\'água, sem conta — seus clipes nunca saem da sua máquina.',
    'new.eyebrow': 'Novidades', 'new.h2': 'Um estúdio totalmente novo, cheio de ferramentas de IA',
    'new.sub': 'Reconstruímos o DAWASSI do zero — um espaço de trabalho escuro e elegante, shorts automáticos em um clique, legendas IA locais, um editor de textos completo e publicação direta no YouTube. Continua 100% local, grátis e sem marca d\'água.',
    'new.cap1': 'O novo painel — barra lateral, shorts automáticos em um clique e uma grade de ferramentas totalmente local.',
    'new.cap2': 'O editor de textos — 10 fontes, cores, efeitos &amp; redimensionar na tela.',
    'new.n1': '<b>Shorts automáticos.</b> Cole um link (ou escolha um clipe) e o DAWASSI encontra os momentos mais intensos pelo volume e corta shorts verticais 9:16 em um clique.',
    'new.n2': '<b>Legendas IA locais.</b> Transcreva qualquer clipe com o Whisper — direto no navegador, offline após a primeira vez — em camadas de texto sincronizadas e totalmente editáveis.',
    'new.n3': '<b>Editor de textos.</b> 10 fontes, cores personalizadas, tamanho, alinhamento e efeitos (contorno / sombra / caixa) — arraste os textos na prévia ou redimensione pela alça de canto.',
    'new.n4': '<b>Sobreposições, música &amp; transições.</b> Adicione imagens/vídeos e stickers, uma trilha de fundo, e fades de entrada e saída.',
    'new.n5': '<b>Melhoria de voz &amp; upscale.</b> Limpe o áudio (sem ruído + volume broadcast) e aumente seus clipes para 1080p ou 4K.',
    'new.n6': '<b>Publicação no YouTube em um clique.</b> Conecte seu canal e envie os clipes prontos direto da biblioteca.',
    'how.eyebrow': 'Como funciona', 'how.h2': 'Da live ao clipe publicado em segundos',
    'how.1.t': 'Cole a live', 'how.1.d': 'Solte qualquer URL de live da Twitch ou do YouTube e inicie o buffer antes da ação começar.',
    'how.2.t': 'Capture o momento', 'how.2.d': 'Quando algo acontecer, aperte um botão — ou deixe a detecção de momentos épicos marcar para você.',
    'how.3.t': 'Deixe vertical', 'how.3.d': 'Um clique exporta um short 9:16, um GIF ou uma miniatura — pronto para qualquer plataforma.',
    'how.4.t': 'Publique &amp; cresça', 'how.4.d': 'Seu clipe é um MP4 comum na sua pasta de clipes. Arraste para o CapCut ou publique direto.',
    'how.demo1': 'Assista à demo de 60 segundos', 'how.demo2': 'DAWASSI AI Clipper em ação no X →',
    'price.eyebrow': 'Preços', 'price.h2': 'Grátis. Para sempre. Código aberto.',
    'price.sub': 'Outras ferramentas de clipes cobram US$ 20–30/mês e colocam a logo delas no seu conteúdo. O DAWASSI AI Clipper é totalmente grátis, roda na sua própria máquina e todo o código está no GitHub — faça um fork, ajuste, deixe do seu jeito.',
    'price.cta': 'Abrir agora',
    'show.h2': 'Controle total com nosso<br>editor web. Parece mágica.', 'show.cta': 'Abrir o editor',
    'show.top': 'clipe de streamer · edição', 'show.export': 'Exportar vídeo',
    'maker.eyebrow': 'Conheça o criador',
    'maker.q': '«Cansei de pagar por ferramentas de clipes que colocam marca d\'água no meu conteúdo e enviam meus clipes para os servidores delas. Então criei o DAWASSI AI Clipper — rápido, grátis, privado e feito para capturar o momento enquanto a live ainda está rolando.»',
    'maker.role': 'Criador do DAWASSI AI Clipper',
    'faq.eyebrow': 'Perguntas', 'faq.h2': 'Perguntas frequentes',
    'faq.q1': 'O DAWASSI AI Clipper é mesmo grátis?', 'faq.a1': 'Sim — é 100% grátis e de código aberto sob a licença MIT. Sem assinatura, sem limite de teste, sem marca d\'água. Todo o código está no GitHub para usar ou bifurcar.',
    'faq.q2': 'Meus clipes são enviados para algum lugar?', 'faq.a2': 'Nunca. Tudo roda localmente no seu computador — o buffer, o corte e o editor. Seus clipes ficam na sua máquina e nunca são enviados a nenhum servidor.',
    'faq.q3': 'Quais plataformas posso clipar?', 'faq.a3': 'Twitch e YouTube — lives e VODs. Cole uma URL de live para bufferizar e clipar em tempo real, ou uma URL de VOD com marcações para pegar só um trecho.',
    'faq.q4': 'O que é a detecção de momentos épicos?', 'faq.a4': 'Enquanto faz o buffer de uma live, o DAWASSI escuta picos de volume — gritos, reações, caos — e marca automaticamente esses momentos para você clipar a reação inteira em um clique.',
    'faq.q5': 'Funciona no Windows?', 'faq.a5': 'Sim. O DAWASSI AI Clipper roda no Windows, macOS e Linux. Há um script de instalação em um clique para cada um, que instala tudo automaticamente.',
    'faq.q6': 'Posso editar clipes como Shorts verticais?', 'faq.a6': 'Com certeza. O editor web integrado permite cortar, reenquadrar em 9:16 / 1:1 / 16:9 com uma caixa arrastável, gravar legendas, mudar a velocidade e exportar — tudo no navegador.',
    'final.h2': 'Pronto para capturar o próximo grande momento?', 'final.p': 'Comece a bufferizar sua stream favorita e nunca mais perca um clipe.',
    'foot.website': 'Site', 'foot.contact': 'Contato',
    'foot.copy': '© 2026 Darryl Wassi · DAWASSI AI CLIPPER — grátis &amp; código aberto · roda 100% na sua máquina',
    'lang.label': 'Idioma',
  },

  de: {
    'nav.new': 'Neu', 'nav.features': 'Funktionen', 'nav.how': 'So funktioniert’s', 'nav.pricing': 'Preise',
    'hero.proof': 'KOSTENLOS &amp; 100% LOKAL · OPEN SOURCE',
    'hero.h1': 'Das <span class="mark">lokale Clipping-Tool Nr. 1</span><br>für Streamer',
    'hero.sub': 'Puffere jeden Twitch- oder YouTube-Livestream auf deinem eigenen PC und mach aus den besten Momenten Clips, GIFs und vertikale Shorts — mit KI-Hype-Erkennung. Kein Abo, kein Wasserzeichen, nichts wird hochgeladen.',
    'hero.cta1': 'DAWASSI Clipper starten', 'hero.cta2': 'So funktioniert’s',
    'hero.micro': 'Läuft auf deinem Rechner · Windows, macOS &amp; Linux · Kein Konto nötig',
    'feat.eyebrow': 'Alles, was ein Clipper braucht', 'feat.h2': 'Gebaut, um den Moment zu erwischen — sofort',
    'feat.1.t': 'Rollender 2-Stunden-Puffer', 'feat.1.d': 'Nimmt den Livestream im Hintergrund auf. Jeder „Letzte 30s / 1 / 2 / 5 Min clippen“-Button schneidet sofort — ohne Neukodierung, ohne aufs VOD zu warten.',
    'feat.2.t': 'KI-Untertitel &amp; Auto-Shorts', 'feat.2.d': 'Transkribiere Sprache direkt auf deinem Gerät in getimte Untertitel und schneide ein langes Video automatisch in die stärksten vertikalen Shorts — mit einem Klick.',
    'feat.3.t': 'Text-Designer', 'feat.3.d': '10 Schriftarten, eigene Farben, Größe, Ausrichtung und Effekte (Kontur / Schatten / Box). Ziehe Texte auf dem Bild oder skaliere sie am Eckgriff.',
    'feat.4.t': 'KI-Hype-Erkennung', 'feat.4.d': 'Achtet auf Lautstärkespitzen und Publikumsreaktionen und markiert Hype-Momente automatisch. Ein Klick schnappt die ganze Reaktion.',
    'feat.5.t': 'Vertikaler 9:16-Export', 'feat.5.d': 'Mach aus jedem Clip einen 1080×1920-Short für TikTok, Reels und YouTube Shorts mit automatisch zentriertem Zuschnitt.',
    'feat.6.t': 'Verbessern &amp; hochskalieren', 'feat.6.d': 'Entrausche und normalisiere die Sprache und skaliere Clips auf knackige 1080p oder 4K — alles lokal mit ffmpeg.',
    'feat.7.t': 'YouTube-Upload mit 1 Klick', 'feat.7.d': 'Verbinde deinen Kanal einmal und lade fertige Clips direkt aus deiner Bibliothek hoch — inklusive Titel, Beschreibung und Sichtbarkeit.',
    'feat.8.t': '100% lokal &amp; privat', 'feat.8.d': 'Alles läuft auf deinem Computer. Keine Cloud, kein Wasserzeichen, kein Konto — deine Clips verlassen nie deine Maschine.',
    'new.eyebrow': 'Neu', 'new.h2': 'Ein völlig neues Studio, voller KI-Werkzeuge',
    'new.sub': 'Wir haben DAWASSI von Grund auf neu gebaut — ein elegantes dunkles Studio, Auto-Shorts mit einem Klick, KI-Untertitel auf dem Gerät, ein vollwertiger Text-Designer und direktes Veröffentlichen auf YouTube. Weiterhin 100% lokal, kostenlos und ohne Wasserzeichen.',
    'new.cap1': 'Das neue Dashboard — Seitenleiste, Auto-Shorts mit einem Klick und ein komplett lokales Werkzeugraster.',
    'new.cap2': 'Der Text-Designer — 10 Schriftarten, Farben, Effekte &amp; Skalieren direkt im Bild.',
    'new.n1': '<b>Auto-Shorts.</b> Füge einen Link ein (oder wähle einen Clip) und DAWASSI findet über die Lautstärke die stärksten Momente und schneidet vertikale 9:16-Shorts mit einem Klick.',
    'new.n2': '<b>KI-Untertitel auf dem Gerät.</b> Transkribiere jeden Clip mit Whisper — direkt im Browser, nach dem ersten Mal offline — in getimte, voll bearbeitbare Textebenen.',
    'new.n3': '<b>Text-Designer.</b> 10 Schriftarten, eigene Farben, Größe, Ausrichtung und Effekte (Kontur / Schatten / Box) — ziehe Texte in der Vorschau oder skaliere sie am Eckgriff.',
    'new.n4': '<b>Overlays, Musik &amp; Übergänge.</b> Füge Bild-/Video-Overlays und Sticker hinzu, eine Hintergrundmusik-Spur und Ein- und Ausblendungen.',
    'new.n5': '<b>Sprache verbessern &amp; hochskalieren.</b> Säubere den Ton (Entrauschen + Broadcast-Lautheit) und skaliere Clips auf 1080p oder 4K.',
    'new.n6': '<b>YouTube-Upload mit einem Klick.</b> Verbinde deinen Kanal und lade fertige Clips direkt aus der Bibliothek hoch.',
    'how.eyebrow': 'So funktioniert’s', 'how.h2': 'Vom Livestream zum veröffentlichten Clip in Sekunden',
    'how.1.t': 'Stream einfügen', 'how.1.d': 'Wirf eine beliebige Twitch- oder YouTube-Live-URL rein und starte den Puffer, bevor die Action losgeht.',
    'how.2.t': 'Moment erwischen', 'how.2.d': 'Wenn etwas passiert, drücke einen Clip-Button — oder lass die Hype-Erkennung ihn für dich markieren.',
    'how.3.t': 'Vertikal machen', 'how.3.d': 'Ein Klick exportiert einen 9:16-Short, ein GIF oder ein Thumbnail — bereit für jede Plattform.',
    'how.4.t': 'Posten &amp; wachsen', 'how.4.d': 'Dein Clip ist eine ganz normale MP4 in deinem Clips-Ordner. Zieh sie in CapCut oder lade sie direkt hoch.',
    'how.demo1': 'Sieh dir die 60-Sekunden-Demo an', 'how.demo2': 'DAWASSI AI Clipper in Aktion auf X →',
    'price.eyebrow': 'Preise', 'price.h2': 'Kostenlos. Für immer. Open Source.',
    'price.sub': 'Andere Clipping-Tools verlangen 20–30 $/Monat und stempeln ihr Logo auf deinen Content. DAWASSI AI Clipper ist komplett kostenlos, läuft auf deiner eigenen Maschine, und der ganze Code liegt auf GitHub — forke ihn, pass ihn an, mach ihn zu deinem.',
    'price.cta': 'Jetzt starten',
    'show.h2': 'Volle Kontrolle mit unserem<br>Web-Editor. Fühlt sich magisch an.', 'show.cta': 'Editor öffnen',
    'show.top': 'Streamer-Clip · Bearbeitung', 'show.export': 'Video exportieren',
    'maker.eyebrow': 'Der Macher',
    'maker.q': '„Ich hatte keine Lust mehr, für Clipping-Tools zu zahlen, die mein Material mit Wasserzeichen versehen und meine Clips auf ihre Server laden. Also habe ich DAWASSI AI Clipper gebaut — schnell, kostenlos, privat und dafür gemacht, den Moment zu erwischen, während der Stream noch läuft.“',
    'maker.role': 'Erfinder von DAWASSI AI Clipper',
    'faq.eyebrow': 'FAQ', 'faq.h2': 'Häufige Fragen',
    'faq.q1': 'Ist DAWASSI AI Clipper wirklich kostenlos?', 'faq.a1': 'Ja — 100% kostenlos und Open Source unter der MIT-Lizenz. Kein Abo, keine Testlimits, kein Wasserzeichen. Der ganze Code liegt auf GitHub, zum Nutzen oder Forken.',
    'faq.q2': 'Werden meine Clips irgendwohin hochgeladen?', 'faq.a2': 'Niemals. Alles läuft lokal auf deinem eigenen Computer — der Puffer, das Schneiden und der Editor. Deine Clips bleiben auf deiner Maschine und werden nie an einen Server geschickt.',
    'faq.q3': 'Welche Plattformen kann ich clippen?', 'faq.a3': 'Twitch und YouTube — Livestreams und VODs. Füge eine Live-URL ein, um zu puffern und in Echtzeit zu clippen, oder eine VOD-URL mit Zeitstempeln, um nur einen Abschnitt zu holen.',
    'faq.q4': 'Was ist KI-Hype-Erkennung?', 'faq.a4': 'Während des Pufferns eines Livestreams achtet DAWASSI auf Lautstärkespitzen — Jubel, Schreie, Chaos — und markiert diese Hype-Momente automatisch, damit du die ganze Reaktion mit einem Klick clippen kannst.',
    'faq.q5': 'Läuft es unter Windows?', 'faq.a5': 'Ja. DAWASSI AI Clipper läuft unter Windows, macOS und Linux. Für jedes System gibt es ein Ein-Klick-Setup-Skript, das alles Nötige automatisch installiert.',
    'faq.q6': 'Kann ich Clips zu vertikalen Shorts bearbeiten?', 'faq.a6': 'Auf jeden Fall. Mit dem eingebauten Web-Editor kannst du kürzen, auf 9:16 / 1:1 / 16:9 umrahmen (mit ziehbarem Zuschnitt), Untertitel einbrennen, das Tempo ändern und exportieren — alles im Browser.',
    'final.h2': 'Bereit für den nächsten großen Moment?', 'final.p': 'Puffere deinen Lieblingsstream und verpasse nie wieder einen Clip.',
    'foot.website': 'Website', 'foot.contact': 'Kontakt',
    'foot.copy': '© 2026 Darryl Wassi · DAWASSI AI CLIPPER — kostenlos &amp; Open Source · läuft 100% auf deiner Maschine',
    'lang.label': 'Sprache',
  },
};

// ---------------------------------------------------------------- engine
function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved && DICT[saved]) return saved;
  for (const l of (navigator.languages || [navigator.language || 'en'])) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (DICT[code]) return code;
  }
  return 'en';
}
let LANG = detectLang();

function t(key, fallback) {
  const d = DICT[LANG] || {};
  if (d[key] != null) return d[key];
  if (DICT.en[key] != null) return DICT.en[key];
  return fallback != null ? fallback : key;
}
function getLang() { return LANG; }

function applyI18n(root) {
  const r = root || document;
  r.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t(el.getAttribute('data-i18n'), null);
    if (v != null) el.innerHTML = v;
  });
  r.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const v = t(el.getAttribute('data-i18n-ph'), null);
    if (v != null) el.placeholder = v;
  });
  r.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const v = t(el.getAttribute('data-i18n-title'), null);
    if (v != null) el.title = v;
  });
  document.documentElement.lang = LANG;
}

function setLang(code) {
  if (!DICT[code]) return;
  LANG = code;
  localStorage.setItem('lang', code);
  applyI18n();
  // let each page re-render its JS-built UI (clip cards, feature tiles, …)
  if (typeof window.onLangChange === 'function') window.onLangChange();
  document.querySelectorAll('select.langsel').forEach((s) => { s.value = code; });
}

/** Fill a <select class="langsel"> with the language list and wire it up. */
function initLangSelect(sel) {
  if (!sel) return;
  sel.innerHTML = LANGS.map((l) => `<option value="${l.code}">${l.name}</option>`).join('');
  sel.value = LANG;
  sel.addEventListener('change', () => setLang(sel.value));
}

function initI18n() {
  document.querySelectorAll('select.langsel').forEach(initLangSelect);
  applyI18n();
}
