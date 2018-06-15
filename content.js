var ACTION = {
    GET_ROOT: 'GetRoot',
    DEVTOOL_INIT: 'DevtoolInit',
    CONTENT_INIT: 'ContentInit',
    DEVTOOL_CONTENT_READY: 'DevtoolContentReady',
}

function injectScript(file_path, tag) {
    let node = document.getElementsByTagName(tag)[0];
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}

// Messages from background.js
chrome.runtime.onMessage.addListener(onMessageFromDevTool)

// Messages from injected.js
window.addEventListener('message', onMessageFromInjected)


function onMessageFromDevTool(request, sender, sendResponse) {
    console.log('messageeee', request)
    // get tree
    if (request.message.action === ACTION.DEVTOOL_CONTENT_READY) {
        console.log('content is ready')
        window.postMessage({
            message: {
                action: ACTION.DEVTOOL_CONTENT_READY
            },
            source: 'content-to-injected'
        }, '*')
    }
    if (request.message.action === ACTION.GET_ROOT) {
        console.log('call get root')
        window.postMessage({
            message: {
                action: ACTION.GET_ROOT
            },
            source: 'content-to-injected'
        }, '*')
    }
}

function onMessageFromInjected(event) {
    var message = event.data

    // Only accept messages from the same frame
    if (event.source !== window) {
        return
    }
    
    // Only accept messages that we know are ours
    if (typeof message === 'object' && message.source === 'injected-to-content') {
        chrome.runtime.sendMessage(message)
    }
}

injectScript(chrome.extension.getURL('injected.js'), 'body')