(function() {

    var ACTION = {
        GET_ROOT: 'GetRoot',
        DEVTOOL_INIT: 'DevtoolInit',
        CONTENT_INIT: 'ContentInit',
        DEVTOOL_CONTENT_READY: 'DevtoolContentReady',
    }

    new (class {
        constructor() {
            this.isConnected = false
            this.childAttrs = ['children', '$children', 'north', 'east', 'west', 'middle', 'content']
            this.allowedTypes = ['number', 'string', 'boolean', 'undefined']
            this.excludedProperties = [
                'style',
                'parent',
                'htmlID',
                'htmlAttr',
                'data',
                'tagName',
                'baseClassName',
                'suffixClassName',
                'className',
                'customClass',
                'doc_label',
                'doc_mandatory',
                'doc_auto_input',
                'doc_condition',
                'doc_remark',
                'doc_read_only',
                'doc_skip',
                'doc_type',
                'north',
                'west',
                'east',
                'middle',
                '$children',
                'children',
                '$opacity',
                'resources',
                'delegate',
            ]
            this.checkReadyState()
            window.addEventListener('message', this.onMessage.bind(this));
        }
    
        // **************************** Initialise ************************************
    
        checkReadyState() {
            // check ready state by looping for every 2 seconds
            let interval = setInterval(() => {
                let engineReady = typeof QmlWeb !== 'undefined'
                let lodashReady = typeof QmlWeb !== 'undefined'
                
                if (engineReady && lodashReady) {
                    this.ready = true
                    clearInterval(interval)
                }
            }, 2000)
    
            // clear interval after one minute
            setTimeout(() => {
                !this.ready && console.log('QmlWeb and Lodash are not found.')
                clearInterval(interval)
            }, 30 * 1000)
        }
    
        get ready() {
            return this._ready || false
        }
        
        set ready(value) {
            value && this.onReady()
            this._ready = value
        }
    
        // **************************** Event ************************************
    
        onReady() {
            this.sendMessage({
                action: ACTION.CONTENT_INIT
            })
        }
    
        onMessage(event) {
            var message = event.data
            
            // Only accept messages from the same frame
            if (event.source !== window) {
                return
            }
            
            // Only accept messages that we know are ours
            if (typeof message === 'object' && message.source === 'content-to-injected') {
                if (typeof this['on' + message.message.action] === 'function') {
                    this['on' + message.message.action]()
                }
            }
        }
        
        onDevtoolContentReady() {
            // setInterval(() => {
            //     this.onGetRoot()
            // }, 3000)
        }

        onGetRoot() {
            this.sendMessage({
                action: ACTION.GET_ROOT,
                content: this.getTree()
            })
        }
        
        // **************************** Method ************************************
        getTree() {
            let tree = {}
            this.traverse(QmlWeb.engine.rootObject, tree)
            console.log(tree)
            return tree
        }
    
        sendMessage(message) {
            window.postMessage({
                message: message,
                source: 'injected-to-content'
            }, '*');
        }
    
        traverse(node, tree) {
            if (!this.ready) return
    
            const RestModel = QmlWeb.getConstructor('QmlWeb', '1.0', 'RestModel')
            tree.componentName = node.$class
            tree.properties = [{ id: node.id }]
            tree.children = []
            tree.treeId = node.objectId
    
            let acceptProperties = _.reject(
                _.keys(node.$properties), 
                attr => this.excludedProperties.includes(attr)
            )
    
            for (let prop of acceptProperties) {
                let propType = typeof node[prop]
                let value = node[prop]
    
                if (this.allowedTypes.includes(propType)) {
                    tree.properties.push({ [prop]: value })
                } else if (value === null) {
                    tree.properties.push({ [prop]: value })
                } else {
                    console.log(`found another type of ${node.$class}: ${prop}=${value} -> ${propType}`)
                }
            }
    
            if (node.$class == 'Repeater') {
                var children = []
                if (_.get(node, 'delegate.$metaObject.$children')) {
                    children = _.flatten(node.delegate.$metaObject.$children)
                }
                _.each(children, child => {
                    let childTree = {from: 'Repeater'}
                    tree.children.push(childTree)
                    this.traverse(child, childTree)
                })
            } else {
                let attrs = _.filter(this.childAttrs, attr => node.hasOwnProperty(attr))
                for (let attr of attrs) {
                    _.flatten(node[attr]).forEach(child => {
                        // we will exclude AccordionContent if this node is a CardLayout 
                        if (node.$class === 'Common.CardLayout' && child.$class === 'AccordionContent') {
                            return
                        }
                        let childTree = {from: attr}
                        tree.children.push(childTree)
                        this.traverse(child, childTree)    
                    })
                }
                
                // We consider RestModel as a one of the childs
                _.filter(node.$tidyupList, item => item instanceof RestModel).forEach(child => {
                    let childTree = {from: 'RestModel'}
                    tree.children.push(childTree)
                    this.traverse(child, childTree)    
                })
            }
        }
    })
})()
