chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg.type === 'OPEN_OPTIONS'){
    chrome.runtime.openOptionsPage();
  }
});
