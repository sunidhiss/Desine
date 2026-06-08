// Content script: collects fonts, colors, and letter-spacing
(function(){
  function rgbToHex(str){
    if(!str) return null;
    if(str[0]==='#') return str;
    const m = str.match(/rgba?\(([^)]+)\)/);
    if(!m) return null;
    const parts = m[1].split(',').map(p=>p.trim());
    const r = parseInt(parts[0]);
    const g = parseInt(parts[1]);
    const b = parseInt(parts[2]);
    function toHex(n){
      const h = n.toString(16);
      return h.length===1? '0'+h : h;
    }
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function getFirstFontFamily(fontFamily){
    if(!fontFamily) return 'unknown';
    // split on comma, remove quotes
    const first = fontFamily.split(',')[0].trim();
    return first.replace(/^['"]|['"]$/g, '');
  }

  function gather(){
    const fonts = {};
    const colors = {};
    const letterSpacings = {counts:{}, values:[]};

    const all = document.querySelectorAll('*');
    for(const el of all){
      try{
        const cs = window.getComputedStyle(el);
        // fonts
        const ff = getFirstFontFamily(cs.fontFamily);
        fonts[ff] = (fonts[ff]||0)+1;

        // colors
        const color = rgbToHex(cs.color);
        if(color) colors[color] = (colors[color]||0)+1;

        const bg = cs.backgroundColor;
        if(bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)'){
          const bghex = rgbToHex(bg);
          if(bghex) colors[bghex] = (colors[bghex]||0)+1;
        }

        // letter spacing
        const ls = cs.letterSpacing;
        if(ls === 'normal'){
          letterSpacings.counts['normal'] = (letterSpacings.counts['normal']||0)+1;
        } else {
          // parse px or number
          const m = ls.match(/([-0-9.]+)px/);
          if(m){
            const v = parseFloat(m[1]);
            letterSpacings.values.push(v);
            letterSpacings.counts[ls] = (letterSpacings.counts[ls]||0)+1;
          }
        }
      }catch(e){/* ignore */}
    }

    // also include document.fonts (loaded faces) if available
    try{
      if(document.fonts && document.fonts.size){
        for(const f of document.fonts){
          const family = f.family || f.familyName || null;
          if(family){
            fonts[family] = (fonts[family]||0)+1;
          }
        }
      }
    }catch(e){}

    // convert to sorted arrays
    const fontsArr = Object.keys(fonts).map(k=>({family:k,count:fonts[k]})).sort((a,b)=>b.count-a.count);
    const colorsArr = Object.keys(colors).map(k=>({hex:k,count:colors[k]})).sort((a,b)=>b.count-a.count);

    const avgLetterSpacing = letterSpacings.values.length ? (letterSpacings.values.reduce((a,b)=>a+b,0)/letterSpacings.values.length) : 0;

    return {
      fonts: fontsArr.slice(0,20),
      colors: colorsArr.slice(0,30),
      letterSpacing: {
        summary: letterSpacings.counts,
        averagePx: Math.round(avgLetterSpacing*100)/100,
        samples: letterSpacings.values.slice(0,50)
      }
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    if(msg && msg.action === 'scrape'){
      const result = gather();
      sendResponse({ok:true, data:result});
    }
    // return true to indicate async if needed
  });
})();
