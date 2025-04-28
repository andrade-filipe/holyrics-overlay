type TemplateName = string;
const root = document.getElementById('app')!;

// Carrega template inicial
let currentTpl: TemplateName = new URL(location.href).hash.replace('#template=', '') || 'big';
loadTemplate(currentTpl);

// Debug: log hot support
console.log('HMR available:', import.meta.hot ? true : false);

// Ouve eventos de letra via HMR
if (import.meta.hot) {
  import.meta.hot.on('lyricChange', (lyricLine: string) => {
    console.log('[client] Received lyricChange via HMR:', lyricLine);
    render(lyricLine);
  });
}

/**
 * Carrega e renderiza o template especificado
 */
function loadTemplate(name: TemplateName) {
  console.log(`loadTemplate chamado com: ${name}`);
  fetch(`/templates/${name}.html`)
    .then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status}`))
    .then(html => {
      root.innerHTML = html;
      console.log(`Template '${name}' carregado`);
      // Pronto para renderizar novas letras
    })
    .catch(err => console.error(`Erro ao carregar template '${name}':`, err));
}

/**
 * Renderiza a letra no elemento #lyric do template
 */
function render(text: string) {
  console.log('[client] Renderizando letra:', text);
  const bg  = document.getElementById('bg') as HTMLImageElement | null;
  const lyr = document.getElementById('lyric');
  if (!lyr) {
    console.error('[client] #lyric não encontrado');
    return;
  }
  lyr.textContent = text;
  if (bg && text.includes('[alt]')) {
    bg.src = '/assets/bg/alt.jpg';
  }
}

// Torna loadTemplate global para o selector no index.html
;(window as any).loadTemplate = loadTemplate;
