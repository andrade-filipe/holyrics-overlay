import './quadro-referencia.css';

export function setupQuadroReferencia() {
  const quadro = document.createElement('div');
  quadro.id = 'quadro-referencia';
  document.body.appendChild(quadro);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'q' && event.ctrlKey) {
      quadro.classList.toggle('visible');
    }
  });
}
