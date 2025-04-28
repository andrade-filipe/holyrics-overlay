initLyricListener();

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

function initLyricListener() {
  if (import.meta.hot) {
    import.meta.hot.on('lyricChange', async (payload: any) => {
      // verifica template_slide antes de template
      const { lyricLine, template, template_slide } = payload.content;
      const tpl = template_slide && template_slide.trim() ? template_slide : template;
      await loadTemplate(tpl);
      const el = document.getElementById('lyric');
      if (el) el.textContent = lyricLine;
    });
  }
}

