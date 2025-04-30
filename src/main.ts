// src/main.ts
// mantém todas as funcionalidades originais e adiciona WebSocket
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

//--------------------------------------
async function loadTemplate(name: string) {
  console.log(`[Template] Carregando "${name}"…`);
  try {
    const res = await fetch(`/${name}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    document.getElementById('template-container')!.innerHTML = html;
    console.log(`[Template] "${name}" carregado com sucesso`);
  } catch (e) {
    console.error('[Template] Falha ao carregar template:', e);
  }
}

function initListeners() {
  if (!import.meta.hot) return;
  import.meta.hot.on('lyricChange',      handleLyricChange);
  import.meta.hot.on('backgroundChange', handleBackgroundChange);
  import.meta.hot.on('themeChange',      handleBackgroundChange);
  import.meta.hot.on('verseChange',      handleVerseChange);
}

async function handleLyricChange(payload: any) {
  console.log('[Lyric] lyricChange recebido:', payload.content.lyricLine);
  const { lyricLine, template, template_slide } = payload.content;
  const tpl = template_slide?.trim() ? template_slide : template;
  await loadTemplate(tpl);
  const el = document.getElementById('lyric');
  if (el) {
    el.textContent = lyricLine;
    console.log('[Lyric] Texto da letra atualizado');
  } else {
    console.warn('[Lyric] Elemento #lyric não encontrado');
  }
}

function handleBackgroundChange(payload: any) {
  console.log('[Background] recebido:', payload.content.type);
  const bg      = document.querySelector('.bg') as HTMLElement | null;
  const bgImg   = document.getElementById('bg-img') as HTMLElement | null;
  const bgVideo = document.getElementById('bg-video') as HTMLVideoElement | null;
  if (!bg) return console.warn('.bg não encontrado');

  bgImg && (bgImg.style.display = 'none');
  bgVideo && (bgVideo.style.display = 'none');

  const { type, name, url, color_map } = payload.content;
  if (type === 'MY_IMAGE' || type === 'IMAGE') {
    const src = type === 'MY_IMAGE'
      ? `/holyrics-images/${encodeURIComponent(name)}.png`
      : url;
    console.log('[Background] imagem local/API →', src);
    if (bgImg) { bgImg.style.backgroundImage = `url('${src}')`; bgImg.style.display = 'block'; }
  } else if (type === 'VIDEO' && bgVideo) {
    const src = `/holyrics-images/${encodeURIComponent(name)}.mp4`;
    console.log('[Background] vídeo local →', src);
    bgVideo.src = src; bgVideo.style.display = 'block';
  } else if (type === 'THEME' && Array.isArray(color_map)) {
    const [start, end] = color_map.map((c: any) => c.hex || c[0]);
    console.log('[Background] tema →', start, end);
    bg.style.background = `linear-gradient(180deg, ${start}, ${end||start})`;
  } else {
    console.warn('[Background] tipo não suportado:', type);
  }
}

async function handleVerseChange(payload: any) {
  console.log('[Verse] verseChange recebido:', payload.content.reference);
  try {
    await loadTemplate('bible');
    const url = buildBibleApiUrl(payload);
    console.log('[Verse] Buscando versículo em:', url);
    const res = await fetch(url, { headers: { Accept: 'application/json' }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const container = document.getElementById('template-container');
    if (!container) throw new Error('#template-container não encontrado');
    const el = container.querySelector<HTMLParagraphElement>('#verse');
    if (!el) throw new Error('<p id="verse"> não existe no template');
    el.innerHTML = `<strong>${json.reference}</strong><br>${json.text.trim()}`;
    console.log('[Verse] Versículo atualizado');
  } catch (err) {
    console.error('[Verse] Erro ao processar verseChange:', err);
  }
}

function buildBibleApiUrl(evt: { content: { reference: string } }): string {
  const refRaw = evt.content.reference;
  const noAcc = refRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const plused = noAcc.split(' ').join('+');
  const encoded = encodeURI(plused);
  return `https://bible-api.com/${encoded}?translation=almeida`;
}
