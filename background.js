var connections = {}
var contentReady = false
var ACTION = {
    GET_ROOT: 'GetRoot',
    DEVTOOL_INIT: 'DevtoolInit',
    CONTENT_INIT: 'ContentInit',
    DEVTOOL_CONTENT_READY: 'DevtoolContentReady',
}

// Initial connections
chrome.runtime.onConnect.addListener(function (port) {
    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(onMessageFromDevTool.bind(null, port))

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener)
        var tabs = Object.keys(connections)
        for (var i=0, len=tabs.length; i < len; i++) {
          if (connections[tabs[i]] == port) {
            delete connections[tabs[i]]
            break
          }
        }
    })
})


// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(onMessageFromContentScript)

function onMessageFromDevTool(port, message, sender, sendResponse) {

    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    // ****** THIS MESSAGE WILL COME IF USER OPENS THE DEV TOOLS *****
    if (message.action === ACTION.DEVTOOL_INIT) {
        console.log('dev tool try to init', message.tabId)
        connections[message.tabId] = port
        notifyReady(message.tabId)
        return
    }

    // Send the message to ContentScript
    chrome.tabs.sendMessage(message.tabId, {message: message});
}

function onMessageFromContentScript(request, sender, sendResponse) {
    console.log('content try to init', sender.tab)
    // Messages from content scripts should have sender.tab set
    if (request.source !== 'injected-to-content' || !sender.tab) {
        return true
    }
    if (request.message.action === ACTION.CONTENT_INIT) {
        contentReady = true
        // try to initial connection for both sides
        notifyReady(sender.tab.id)
        return true
    }

    // try to send message
    if (sender.tab.id in connections) {
        connections[sender.tab.id].postMessage(request);
    } else {
        console.log("Tab not found in connection list.");
    }
    return true
}

function notifyReady(tabId) {
    if (connections[tabId] && contentReady) {
        connections[tabId].postMessage({
            message: {
                action: ACTION.DEVTOOL_CONTENT_READY
            }
        })
        chrome.tabs.sendMessage(tabId, {
            message: {
                action: ACTION.DEVTOOL_CONTENT_READY
            }
        });
    }
}