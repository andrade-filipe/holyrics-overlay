// src/main.ts

/* ---------------- estado & cache ---------------- */
let currentTemplate = "";                               // nome do template em uso
let currentRoot: HTMLElement | null = null;             // raiz do template wrapper
const TEMPLATE_CACHE = new Map<string, string>();       // path → HTML

/* ---------------- boot listeners ---------------- */
initListeners();

// HMR e WebSocket
const socket = new WebSocket(`ws://${location.host}`);
socket.addEventListener('open', () => console.log('WebSocket conectado'));
socket.addEventListener('message', (ev) => {
  const { event: evt, data: payload } = JSON.parse(ev.data);
  switch (evt) {
    case 'lyricChange':      handleLyricChange(payload);      break;
    case 'backgroundChange': handleBackgroundChange(payload); break;
    case 'themeChange':      handleBackgroundChange(payload); break;
    case 'verseChange':      handleVerseChange(payload);      break;
  }
});

/* =========================================================================== */
/*  CARREGAMENTO DE TEMPLATE – cache in-mem                                    */
/* =========================================================================== */
async function loadTemplate(name: string): Promise<HTMLElement> {
  const tplPath = name.replace(/\\/g, "/") + (name.endsWith(".html") ? "" : ".html");

  let html: string;
  if (TEMPLATE_CACHE.has(tplPath)) {
    html = TEMPLATE_CACHE.get(tplPath)!;
  } else {
    const res = await fetch(`/${tplPath}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${tplPath}`);
    html = await res.text();
    TEMPLATE_CACHE.set(tplPath, html);
  }

  const container = document.getElementById("template-container")!;
  container.innerHTML = html;

  // Busca especificamente pelo wrapper para evitar pegar <style> ou <head>
  const root = container.querySelector<HTMLElement>(".template-wrapper");
  if (!root) throw new Error(`"${tplPath}" não possui um wrapper principal`);
  return root;
}

/* =========================================================================== */
/*  HANDLERS DO HOLYRICS                                                       */
/* =========================================================================== */
async function handleLyricChange(payload: any) {
  const { lyricLine, template, template_slide } = payload.content;
  const tplName = (template_slide?.trim() || template).trim();

  try {
    if (tplName !== currentTemplate) {
      currentRoot = await loadTemplate(tplName);
      currentTemplate = tplName;
      console.log(`[Lyric] Template trocado para "${tplName}"`);
    }

    const lyricEl = currentRoot?.querySelector<HTMLElement>("#lyric");
    if (lyricEl) {
      lyricEl.textContent = lyricLine.replace(/\n/g, "\n");
      console.log("[Lyric] Texto da letra atualizado");
    } else {
      console.warn('[Lyric] "#lyric" não encontrado');
    }
  } catch (err) {
    console.error("[Lyric] Erro:", err);
  }
}

function handleBackgroundChange(payload: any) {
  console.log("[Background] recebido:", payload.content.type);

  const bg      = document.querySelector(".bg")       as HTMLElement | null;
  const bgImg   = document.getElementById("bg-img")   as HTMLElement | null;
  const bgVideo = document.getElementById("bg-video") as HTMLVideoElement | null;
  if (!bg) return console.warn(".bg não encontrado");

  bgImg   && (bgImg.style.display   = "none");
  bgVideo && (bgVideo.style.display = "none");

  const { type, name, url, color_map } = payload.content;

  if (type === "MY_IMAGE" || type === "IMAGE") {
    const src = `/${encodeURIComponent(name)}.png`;
    console.log("[Background] imagem →", src);
    if (bgImg) {
      bgImg.style.backgroundImage = `url('${src}')`;
      bgImg.style.display = "block";
    }

  } else if (type === "VIDEO" && bgVideo) {
    const src = `/${encodeURIComponent(name)}.mp4`;
    console.log("[Background] vídeo →", src);
    bgVideo.src = src;
    bgVideo.style.display = "block";

  } else if (type === "THEME" && Array.isArray(color_map)) {
    const [start, end] = color_map.map((c: any) => c.hex || c[0]);
    bg.style.background = `linear-gradient(180deg, ${start}, ${end || start})`;
  } else {
    console.warn("[Background] tipo não suportado:", type);
  }
}

async function handleVerseChange(payload: any) {
  console.log("[Verse] verseChange recebido:", payload.content.reference);

  try {
    currentRoot = await loadTemplate("bible");
    currentTemplate = "bible";

    const url = buildBibleApiUrl(payload);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const verseEl = currentRoot.querySelector<HTMLParagraphElement>("#verse");
    if (!verseEl) throw new Error('<p id="verse"> ausente em bible.html');

    verseEl.innerHTML = `<strong>${json.reference}</strong><br>${json.text.trim()}`;
  } catch (err) {
    console.error("[Verse] Erro:", err);
  }
}

/* ---------------- helpers ---------------- */
function buildBibleApiUrl(evt: { content: { reference: string } }): string {
  const refRaw  = evt.content.reference;
  const noAcc   = refRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const plused  = noAcc.split(" ").join("+");
  return `https://bible-api.com/${encodeURI(plused)}?translation=almeida`;
}

/* ---------------- HMR (Vite) ---------------- */
function initListeners() {
  if (!import.meta.hot) return;
  import.meta.hot.on("lyricChange",      handleLyricChange);
  import.meta.hot.on("backgroundChange", handleBackgroundChange);
  import.meta.hot.on("themeChange",      handleBackgroundChange);
  import.meta.hot.on("verseChange",      handleVerseChange);
}
