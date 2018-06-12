let port = chrome.runtime.connect({name: 'content-to-background'})

function injectScript(file_path, tag) {
    let node = document.getElementsByTagName(tag)[0];
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}

window.addEventListener('qmlweb-devtool-message', function(e) {
    // Send message from content script to background script
    console.log('SEND MESSAGE FROM CONTENT SCRIPT TO BACKGROUND SCRIPT')
    port.postMessage({tree: e.detail})
});

port.onMessage.addListener(function(msg) {
  console.log('GET MESSAGE FROM BACKGROUND SCRIPT')
  console.log(msg)
})

injectScript(chrome.extension.getURL('injected.js'), 'body');