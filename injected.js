const childAttrs = ['children', '$children', 'north', 'east', 'west', 'middle', 'content']
const allowedTypes = ['number', 'string', 'boolean', 'undefined']
const excludedProperties = [
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

function DFSTree(node, tree) {
    const RestModel = QmlWeb.getConstructor('QmlWeb', '1.0', 'RestModel')
    tree.componentName = node.$class
    tree.properties = [{ id: node.id }]
    tree.children = []

    let acceptProperties = _.reject(
        _.keys(node.$properties), 
        attr => excludedProperties.includes(attr)
    )

    for (let prop of acceptProperties) {
        let propType = typeof node[prop]
        let value = node[prop]

        if (allowedTypes.includes(propType)) {
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
            DFSTree(child, childTree)
        })
    } else {
        let attrs = _.filter(childAttrs, attr => node.hasOwnProperty(attr))
        for (attr of attrs) {
            _.flatten(node[attr]).forEach(child => {
                // we will exclude AccordionContent if this node is a CardLayout 
                if (node.$class === 'Common.CardLayout' && child.$class === 'AccordionContent') {
                    return
                }
                let childTree = {from: attr}
                tree.children.push(childTree)
                DFSTree(child, childTree)    
            })
        }
        
        // We consider RestModel as a one of the childs
        _.filter(node.$tidyupList, item => item instanceof RestModel).forEach(child => {
            let childTree = {from: 'RestModel'}
            tree.children.push(childTree)
            DFSTree(child, childTree)    
        })
    }
}

setTimeout(() => {
    var tree = {}
    DFSTree(QmlWeb.engine.rootObject, tree)
    window.dispatchEvent(new CustomEvent('qmlweb-devtool-message', {
        detail: {tree}
    }));
}, 3000)