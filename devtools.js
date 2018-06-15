
var ACTION = {
    GET_ROOT: 'GetRoot',
    DEVTOOL_INIT: 'DevtoolInit',
    CONTENT_INIT: 'ContentInit',
    DEVTOOL_CONTENT_READY: 'DevtoolContentReady',
}

let app = null
let isConnected = false

chrome.devtools.panels.create("DemoPanel", "toast.png", "main.html", function(panel) {
    panel.onShown.addListener(onPanelShown)
})


// Create a connection to the background page
let backgroundPageConnection = chrome.runtime.connect({
    name: "devtool"
})

function onPanelShown(extPanelWindow) {
    app = extPanelWindow.app

    // try to connect for every 1 second
    if (!isConnected) {
        let interval = setInterval(function() {
            console.log('dev tool postMessage to connect')
            backgroundPageConnection.postMessage({
                action: ACTION.DEVTOOL_INIT,
                tabId: chrome.devtools.inspectedWindow.tabId
            });

            if (isConnected) {
                clearInterval(interval)
                getRoot()
            }
        }, 1000)

        return
    }

    if (!app.hasRoot()) {
        getRoot()
    }
}

function getRoot() {
    backgroundPageConnection.postMessage({
        action: ACTION.GET_ROOT,
        tabId: chrome.devtools.inspectedWindow.tabId
    })
}

function onGetRoot(root) {
    app.setRoot(root)
}


backgroundPageConnection.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message.action === ACTION.DEVTOOL_CONTENT_READY) {
        isConnected = true
    }
    if (request.message.action === ACTION.GET_ROOT) {
        onGetRoot(request.message.content)
    }
})



