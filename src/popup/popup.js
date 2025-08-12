document.addEventListener('DOMContentLoaded', async () => {
  const els = {
    openaiKey: document.getElementById('openaiKey'),
    geminiKey: document.getElementById('geminiKey'),
    modelOpenAI: document.getElementById('modelOpenAI'),
    modelGemini: document.getElementById('modelGemini'),
    openaiOrg: document.getElementById('openaiOrg'),
    openaiProject: document.getElementById('openaiProject'),
    save: document.getElementById('save')
  };

  chrome.storage.sync.get(['openaiKey','geminiKey','modelOpenAI','modelGemini','openaiOrg','openaiProject'], (data) => {
    if(data.openaiKey) els.openaiKey.value = data.openaiKey;
    if(data.geminiKey) els.geminiKey.value = data.geminiKey;
    els.modelOpenAI.value = data.modelOpenAI || 'gpt-4o-mini';
    els.modelGemini.value = data.modelGemini || 'gemini-1.5-flash';
    if(data.openaiOrg) els.openaiOrg.value = data.openaiOrg;
    if(data.openaiProject) els.openaiProject.value = data.openaiProject;
  });

  els.save.addEventListener('click', () => {
    chrome.storage.sync.set({
      openaiKey: els.openaiKey.value.trim(),
      geminiKey: els.geminiKey.value.trim(),
      modelOpenAI: els.modelOpenAI.value.trim(),
      modelGemini: els.modelGemini.value.trim(),
      openaiOrg: (els.openaiOrg.value||'').trim(),
      openaiProject: (els.openaiProject.value||'').trim()
    }, () => {
      els.save.textContent = 'Saved';
      setTimeout(()=> els.save.textContent='Save', 1500);
    });
  });
});
