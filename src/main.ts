initListeners();

async function loadTemplate(name: string) {
  try {
    const res = await fetch(`src/templates/${name}.html`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const html = await res.text();
    document.getElementById('template-container')!.innerHTML = html;
  } catch (e) {
    console.error('Failed to load template:', e);
  }
}

function initListeners() {
  if (!import.meta.hot) return;

  import.meta.hot.on('lyricChange', handleLyricChange);
  import.meta.hot.on('backgroundChange', handleBackgroundChange);
  import.meta.hot.on('themeChange',      handleBackgroundChange);
  import.meta.hot.on('verseChange',      handleVerseChange);
}

async function handleLyricChange(payload: any) {
  const { lyricLine, template, template_slide } = payload.content;
  const tpl = template_slide?.trim() ? template_slide : template;
  await loadTemplate(tpl);
  const el = document.getElementById('lyric');
  if (el) el.textContent = lyricLine;
}

function handleBackgroundChange(payload: any) {
  const content = payload.content;
  const bg = document.querySelector('.bg') as HTMLElement;
  if (!bg) return;

  if (content.type === 'IMAGE' && content.url) {
    bg.style.backgroundImage = `url(${content.url})`;
    bg.style.backgroundSize = 'cover';
  } else if (content.type === 'THEME' && content.colors) {
    // exemplo: altera variáveis CSS definidas no tema
    document.documentElement.style.setProperty('--gradient-start', content.colors[0]);
    document.documentElement.style.setProperty('--gradient-end',   content.colors[1]);
    document.documentElement.style.setProperty('--bg-color',       content.colors[0]);
    document.documentElement.style.setProperty('--text-color',     content.colors[2]);
  }
}

async function handleVerseChange(payload: any) {
  try {
    // 1) carrega o template
    await loadTemplate('bible');
    console.log('[Verse] Template "bible" carregado');

    // 2) monta URL e fetch
    const url = buildBibleApiUrl(payload);
    console.log('[Verse] Fetching', url);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log('[Verse] JSON recebido:', json);

    // 3) extrai referência e texto
    const reference = json.reference as string;      // ex.: "1 Coríntios 1:5"
    const text      = json.text as string;           // texto completo do versículo

    // 4) injeta no <p id="verse"> dentro de #template-container
    const container = document.getElementById('template-container');
    if (!container) throw new Error('#template-container não encontrado');

    const el = container.querySelector<HTMLParagraphElement>('#verse');
    if (!el) throw new Error('<p id="verse"> não existe no template');

    el.innerHTML = `<strong>${reference}</strong><br>${text.trim()}`;
    console.log('[Verse] Versículo injetado com sucesso');
  } catch (err) {
    console.error('Erro ao buscar ou injetar versículo:', err);
  }
}

function buildBibleApiUrl(evt: { content: { reference: string } }): string {
  // Ex.: "1 Coríntios 1:5" → "1+Coríntios+1:5"
  const ref = evt.content.reference.split(' ').join('+');
  return `https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`;
}