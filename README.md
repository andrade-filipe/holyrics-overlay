# Exemplo de como configurar o gatilho
> function getUrl(obj) {
  return {
    type      : 'POST',
    url_suffix: '/onLyricChange',                 
    headers   : { 'Content-Type': 'application/json' },
    data      : {                                 
      action : 'onLyricChange',
      content: {
        songId   : obj.id,
        template : obj.note,
        lyricLine: obj.text,
        template_slide : obj.slide_description
      }
    }
  };
}
