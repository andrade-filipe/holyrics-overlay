// ========== src/lyricService.ts ==========
export type Listener = (lyric: string) => void;

export class LyricService {
  private url = "http://localhost:8091/api/GetText?token=yNlmv4E7XdL6VIGI";  // API Server do Holyrics
 private intervalMs = 0; // polling a cada 300 ms
  private listeners: Listener[] = [];

  /** Inicia polling contínuo */
  start() {
    console.log(`LyricService polling iniciado: ${this.url} a cada ${this.intervalMs}ms`);
    setInterval(async () => {
      try {
        const res = await fetch(this.url);
        const json = await res.json();
        console.log('API GetText response:', json);
        if (json.status === 'ok' && json.data.show) {
          const lyric = (json.data.text as string).trim();
          console.log('Polled lyric via API:', lyric);
          this.listeners.forEach(fn => fn(lyric));
        } else {
          console.log('Nenhuma letra para exibir (data.show=false ou status != ok)');
        }
      } catch (err) {
        console.error('Polling API/GetText failed:', err);
      }
    }, this.intervalMs);
  }

  on(fn: Listener) {
    this.listeners.push(fn);
  }
}
