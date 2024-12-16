export function openOrActivateTab(relativePath: string): void {
    let url = chrome.runtime.getURL(relativePath);
    chrome.tabs.query({ url: url }, function (tabs) {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
            chrome.tabs.get(tabs[0].id, function (tab) {
                chrome.windows.get(tab.windowId, function (win) {
                    chrome.windows.update(win.id, { focused: true });
                });
            });
        } else {
            chrome.tabs.create({ url: relativePath });
        }
    });
}
