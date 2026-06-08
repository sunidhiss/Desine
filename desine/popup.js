document.getElementById('scrape').addEventListener('click', async ()=>{
  setStatus('Requesting page analysis...', false);
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab){ setStatus('No active tab found', true); return; }
  chrome.tabs.sendMessage(tab.id, {action:'scrape'}, (resp)=>{
    if(chrome.runtime.lastError || !resp){
      setStatus('Injecting content script and retrying...', false);
      chrome.scripting.executeScript({target:{tabId: tab.id}, files: ['content.js']})
        .then(()=>{
          chrome.tabs.sendMessage(tab.id, {action:'scrape'}, (resp2)=>{
            if(chrome.runtime.lastError || !resp2){
              setStatus('No response after injection: page may block scripts.', true);
              return;
            }
            if(resp2.ok){ render(resp2.data); setStatus('Done', false); }
            else { setStatus('Error analyzing page', true); }
          });
        })
        .catch(err=>{
          setStatus('Failed to inject content script: ' + (err && err.message ? err.message : err), true);
        });
      return;
    }
    if(resp.ok){ render(resp.data); setStatus('Done', false); }
    else { setStatus('Error analyzing page', true); }
  });
});

function setStatus(msg, isError){
  const s = document.getElementById('status');
  if(!s) return;
  s.textContent = msg;
  s.style.color = isError? '#dc2626' : '';
}

function render(data){
  document.getElementById('results').style.display = 'flex';
  document.getElementById('fonts-count').textContent = `${data.fonts.length} found`;
  document.getElementById('colors-count').textContent = `${data.colors.length} found`;

  // Fonts: show sample and a relative bar
  const fontsEl = document.getElementById('fonts');
  fontsEl.innerHTML = '';
  const maxFontCount = data.fonts.length ? Math.max(...data.fonts.map(f=>f.count)) : 1;
  data.fonts.forEach(f=>{
    const li = document.createElement('li');
    li.className = 'item';

    const left = document.createElement('div');
    left.className = 'font-info';

    const sample = document.createElement('div');
    sample.className = 'font-sample';
    sample.textContent = 'Aa The quick brown fox';
    sample.style.fontFamily = fontFamilyValue(f.family);

    const meta = document.createElement('div');
    meta.className = 'font-meta';

    const family = document.createElement('div');
    family.className = 'font-family';
    family.textContent = f.family;

    const count = document.createElement('div');
    count.className = 'font-count';
    count.textContent = `${f.count} elements`;

    meta.appendChild(family);
    meta.appendChild(count);

    left.appendChild(sample);
    left.appendChild(meta);

    const right = document.createElement('div');
    right.className = 'usage';
    const barWrap = document.createElement('div');
    barWrap.className = 'bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'bar';
    const pct = Math.round((f.count / maxFontCount) * 100);
    bar.style.width = pct + '%';
    barWrap.appendChild(bar);
    right.appendChild(barWrap);

    li.appendChild(left);
    li.appendChild(right);
    fontsEl.appendChild(li);
  });

  // Colors
  const colorsEl = document.getElementById('colors');
  colorsEl.innerHTML = '';
  const maxColorCount = data.colors.length ? Math.max(...data.colors.map(c=>c.count)) : 1;
  data.colors.forEach(c=>{
    const tile = document.createElement('div');
    tile.className = 'color-tile';
    tile.style.background = c.hex;
    const hex = document.createElement('div');
    hex.className = 'color-hex';
    hex.textContent = c.hex;
    const cnt = document.createElement('div');
    cnt.style.fontSize = '11px';
    cnt.style.color = 'rgba(0,0,0,0.6)';
    cnt.textContent = c.count;
    tile.appendChild(hex);
    tile.appendChild(cnt);
    const barBack = document.createElement('div');
    barBack.style.position = 'absolute';
    barBack.style.left = '0';
    barBack.style.right = '0';
    barBack.style.bottom = '0';
    barBack.style.height = '6px';
    barBack.style.background = 'rgba(255,255,255,0.4)';
    const inner = document.createElement('div');
    const pct = Math.round((c.count / maxColorCount) * 100);
    inner.style.width = pct + '%';
    inner.style.height = '100%';
    inner.style.background = 'rgba(0,0,0,0.12)';
    barBack.appendChild(inner);
    tile.style.position = 'relative';
    tile.appendChild(barBack);

    colorsEl.appendChild(tile);
  });

  // Letter spacing
  const spacingEl = document.getElementById('spacing');
  spacingEl.innerHTML = '';
  const avg = document.createElement('div');
  avg.className = 'avg';
  avg.textContent = `Average px: ${data.letterSpacing.averagePx}`;
  spacingEl.appendChild(avg);
  const summary = document.createElement('div');
  summary.style.color = 'var(--muted)';
  summary.textContent = `Summary: ${Object.keys(data.letterSpacing.summary).slice(0,6).map(k=>k+':'+data.letterSpacing.summary[k]).join(', ')}`;
  spacingEl.appendChild(summary);
}

function fontFamilyValue(family){
  if(!family || family === 'unknown') return 'inherit';
  const genericFamilies = new Set([
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
    'emoji',
    'math',
    'fangsong'
  ]);
  const normalized = family.trim();
  const escaped = normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return genericFamilies.has(normalized.toLowerCase()) ? normalized : `"${escaped}", ${fallbackForFont(normalized)}`;
}

function fallbackForFont(family){
  const lower = family.toLowerCase();
  if(lower.includes('mono') || lower.includes('code') || lower.includes('console')) return 'monospace';
  if(lower.includes('serif') || lower.includes('times') || lower.includes('georgia')) return 'serif';
  return 'sans-serif';
}
