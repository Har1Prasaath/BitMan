// Inject selection listener and floating action button
(function() {
  let button; let panel; let lastSelection = '';
  let lastPos = { x: 0, y: 0 };
  const DEBUG = true; // set false to silence logs
  const log = (...a)=>{ if(DEBUG) console.log('[BitMan]', ...a); };

  document.addEventListener('mouseup', handleSelection, true);
  document.addEventListener('keyup', handleSelection, true);
  document.addEventListener('selectionchange', debounce(()=>{
    const sel = window.getSelection();
    if(!sel || sel.isCollapsed) return; // don't spam
    lastSelection = sel.toString().trim() || lastSelection;
  }, 250));

  function handleSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      hideButton();
      return;
    }
    const text = sel.toString().trim();
    if (!text) { hideButton(); return; }
    lastSelection = text;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
  const bx = rect.right + window.scrollX;
  const by = rect.top + window.scrollY;
  lastPos = { x: bx, y: by };
  showButton(bx, by);
    log('Selection captured length', text.length);
  }

  function showButton(x,y){
    if(!button){
      button = document.createElement('div');
      button.id = 'bitman-fab';
      button.textContent = '🤖';
      button.title = 'Ask BitMan';
      button.addEventListener('mousedown', e=>{ e.preventDefault(); e.stopPropagation(); });
  button.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); log('FAB click'); openPanel(); });
      document.body.appendChild(button);
      log('FAB created');
    }
    button.style.display = 'flex';
    button.style.left = x + 'px';
    button.style.top = (y - 30) + 'px';
  }
  function hideButton(){ if(button) button.style.display='none'; }

  function openPanel(){
    try {
      if(!lastSelection){
        const sel = window.getSelection();
        if(sel && !sel.isCollapsed) lastSelection = sel.toString();
      }
      if(panel){ panel.remove(); }
  panel = document.createElement('div');
  panel.id = 'bitman-panel';
  panel.setAttribute('data-bitman','panel');
      const safe = escapeHtml(lastSelection);
      panel.innerHTML = `
        <div class="bitman-header">
          <span>BitMan Answers</span>
          <button id="bitman-close" aria-label="Close">×</button>
        </div>
        <div class="bitman-question">
          <textarea id="bitman-question" rows="3">${safe}</textarea>
        </div>
        <div class="bitman-actions">
          <button id="bitman-ask">Ask</button>
          <a id="bitman-options-link">Settings</a>
        </div>
        <div class="bitman-results">
          <div class="model-answer" id="openai-answer"><strong>OpenAI:</strong> <span class="ans-value">-</span></div>
          <div class="model-answer" id="gemini-answer"><strong>Gemini:</strong> <span class="ans-value">-</span></div>
        </div>
        <div class="bitman-footer">Options parsed: <span id="bitman-options"></span></div>
      `;
      document.body.appendChild(panel);
      // Dynamic positioning near selection/FAB
      try {
        const vpW = window.innerWidth; const vpH = window.innerHeight;
        const panelW = 340; const panelH = 260; // approximate before paint
        let left = lastPos.x + 10; let top = lastPos.y + 10;
        if(left + panelW > window.scrollX + vpW) left = lastPos.x - panelW - 10;
        if(top + panelH > window.scrollY + vpH) top = lastPos.y - panelH - 10;
        if(left < 0) left = 10; if(top < 0) top = 10;
        panel.style.position = 'absolute';
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
      } catch(posErr){ log('Position calc failed', posErr); }
      panel.querySelector('#bitman-close').addEventListener('click', ()=>panel.remove());
      panel.querySelector('#bitman-ask').addEventListener('click', askModels);
      panel.querySelector('#bitman-options-link').addEventListener('click', ()=>{
        chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
      });
      const options = extractOptionsFromText(lastSelection);
      const optEl = panel.querySelector('#bitman-options');
      if(optEl) optEl.textContent = options.join(' | ');
  log('Panel opened with options', options, 'at', panel.style.left, panel.style.top);
    } catch(e){
      log('Failed to open panel', e);
    }
  }

  function extractOptionsFromText(text){
    // Basic pattern: lines starting with a), b), A., 1)
    const lines = text.split(/\n|\r/).map(l=>l.trim()).filter(Boolean);
    const optionRegex = /^([A-Da-d0-9])[\).\-]\s*(.+)$/;
    const options = [];
    for(const line of lines){
      const m = line.match(optionRegex);
      if(m) options.push(m[2]);
    }
    return options.length ? options : [];
  }

  async function askModels(){
    const qEl = panel && panel.querySelector('#bitman-question');
    const question = qEl ? qEl.value.trim() : '';
    if(!question){ log('No question to send'); return; }
    setAnswer('#openai-answer','...');
    setAnswer('#gemini-answer','...');
    log('Sending ask message');
    chrome.runtime.sendMessage({ type: 'BITMAN_ASK', payload: { question, rawSelection: lastSelection } }, (resp)=>{
      if(chrome.runtime.lastError){
        setAnswer('#openai-answer','Err');
        setAnswer('#gemini-answer','Err');
        log('Runtime error', chrome.runtime.lastError.message);
        return;
      }
      if(!resp){ setAnswer('#openai-answer','Err'); setAnswer('#gemini-answer','Err'); log('No response'); return; }
      if(resp.error){ setAnswer('#openai-answer',resp.error); setAnswer('#gemini-answer',resp.error); log('Error response', resp.error); return; }
      if(resp.openaiAnswer) setAnswer('#openai-answer', resp.openaiAnswer);
      if(resp.geminiAnswer) setAnswer('#gemini-answer', resp.geminiAnswer);
      if(resp.options && panel){ const o = panel.querySelector('#bitman-options'); if(o) o.textContent = resp.options.join(' | '); }
      log('Answers received');
    });
  }

  function setAnswer(sel,value){
    const el = panel.querySelector(sel+' .ans-value');
    if(el) el.textContent = value;
  }
  // Utility helpers
  function escapeHtml(str){
    return (str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
  }

  function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms);}; }

  chrome.runtime.onMessage.addListener((msg)=>{
    if(msg && msg.type === 'BITMAN_FORCE_PANEL') {
      log('Forced panel open message received');
      openPanel();
    }
  });

  log('Content script initialized');
})();
