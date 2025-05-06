# Holyrics Overlay

**Holyrics Overlay** é um pequeno servidor HTTP + WebSocket que substitui a projeção nativa do Holyrics™ por _qualquer_ template **HTML/CSS** escolhido dinamicamente nos campos **Anotação** ou **Descrição** das músicas/slides.  
Ele foi criado para a comunidade, sem fins lucrativos, permitindo animações, tipografia avançada e total liberdade visual – algo que normalmente só existe em soluções pagas.

---

## ✨ Recursos

* **Templates dinâmicos** – basta colocar `<template>.html` em `dist/` e informar o nome no Holyrics.  
* **WebSocket integrado** – mudanças de slide, música ou versículo chegam instantaneamente ao navegador/projetor.  
* **Empacotamento “1-click”** – comando `npm run serve:exe` gera `holyrics-server.exe` (Windows x64).  
* **Extensível** – qualquer sistema que fale HTTP ou WS pode consumir os mesmos eventos.

---

## ⚙️ Pré-requisitos

| Ferramenta | Versão recomendada | Observação                                   |
|------------|-------------------|----------------------------------------------|
| **Node.js**| ≥ 18 LTS          | Necessário para compilar e empacotar         |
| **Git**    | qualquer          | Para clonar o repositório                    |

O servidor embarcado escuta, por padrão, em **`5173`** (veja `serve.js`).

---

## 🚀 Instalação

```bash
git clone https://github.com/andrade-filipe/holyrics-overlay.git
cd holyrics-overlay

# 1. Instalar dependências
npm install

# 2. Gerar o bundle de produção
npm run build

# 3. Empacotar em um executável Windows
npm run serve:exe          # gera holyrics-server.exe na raiz
```

Execute holyrics-server.exe; o console mostrará algo como:

[Server] running at http://192.168.0.42:5173/

Anote o endereço IP e a porta.

## 🎛️ Configurando o Holyrics
Ativar o API Server
Configurações → Avançado → API Server (porta padrão 8091).

### Criar gatilho
Ferramentas → Diversos → Gatilhos
Tipo: Ao exibir Filtro: Slide (Música) → Qualquer item.

### Novo receptor
Nome: NotificarMudancaLetra Tipo: JavaScript
URL do WebSocket: http://<IP-do-servidor>:5173

### Código do gatilho
Cole o snippet abaixo no editor do Holyrics:

```javascript
function getUrl(obj) {
  return {
    type      : 'POST',
    url_suffix: '/onLyricChange',
    headers   : { 'Content-Type': 'application/json' },
    data      : {
      action : 'onLyricChange',
      content: {
        songId         : obj.id,
        template       : obj.note,
        lyricLine      : obj.text,
        template_slide : obj.slide_description
      }
    }
  };
}
```

Pronto! Cada troca de linha na música envia um POST para http://<IP>:5173/onLyricChange; o servidor reencaminha via WebSocket aos navegadores.

## 🖌️ Usando templates
Coloque arquivos <nome>.html em dist/.

Anotação da música → aplica o template a todos os slides.

Descrição do slide → aplica ao slide selecionado e os seguintes (feature do holyrics), esse tem prioridade em cima do tema global da música.

> Durante a criação de templates use npm run dev para hot-reload.
