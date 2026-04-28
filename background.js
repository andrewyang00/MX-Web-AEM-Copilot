// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Keep side panel available on all tabs
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: true });
});
