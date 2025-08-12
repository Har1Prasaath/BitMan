document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const els = {
    openaiKey: document.getElementById('openaiKey'),
    geminiKey: document.getElementById('geminiKey'),
    modelOpenAI: document.getElementById('modelOpenAI'),
    modelGemini: document.getElementById('modelGemini'),
    openaiOrg: document.getElementById('openaiOrg'),
    openaiProject: document.getElementById('openaiProject'),
    parseStrategy: document.getElementById('parseStrategy'),
    status: document.getElementById('status')
  };

  chrome.storage.sync.get(['openaiKey','geminiKey','modelOpenAI','modelGemini','parseStrategy','openaiOrg','openaiProject'], data => {
    if(data.openaiKey) els.openaiKey.value = data.openaiKey;
    if(data.geminiKey) els.geminiKey.value = data.geminiKey;
    els.modelOpenAI.value = data.modelOpenAI || 'gpt-4o-mini';
    els.modelGemini.value = data.modelGemini || 'gemini-1.5-flash';
    els.parseStrategy.value = data.parseStrategy || 'auto';
    if(data.openaiOrg) els.openaiOrg.value = data.openaiOrg;
    if(data.openaiProject) els.openaiProject.value = data.openaiProject;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    chrome.storage.sync.set({
      openaiKey: els.openaiKey.value.trim(),
      geminiKey: els.geminiKey.value.trim(),
      modelOpenAI: els.modelOpenAI.value.trim(),
      modelGemini: els.modelGemini.value.trim(),
      parseStrategy: els.parseStrategy.value,
      openaiOrg: (els.openaiOrg.value||'').trim(),
      openaiProject: (els.openaiProject.value||'').trim()
    }, () => {
      els.status.textContent = 'Saved!';
      setTimeout(()=> els.status.textContent='', 2000);
    });
  });
});
