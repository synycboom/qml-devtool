class Dispatcher {
    constructor() {
        this.listeners = []
        this.ACTION = {
            TREE_CLICK: 'tree_click',
        }
    }

    dispatch(action, data) {
        this.listeners.forEach(listener => {
            if (listener.action === action) {
                listener.callback(data)
            }
        })
    }

    subscribe(action, callback) {
        this.listeners.push({ action, callback })
    }
}

const dispatcher = new Dispatcher()

class TreeElement {
    constructor(id, data) {
        this._onClick = this.onClick.bind(this)
        this._onMouseEnter = this.onMouseEnter.bind(this)
        this._onMouseLeave = this.onMouseLeave.bind(this)
        this._onDblClick = this.onDblClick.bind(this)
        this.node = document.createElement('li')
        this.childNode = document.createElement('ol')
        this.id = id
        this.data = data
        this.expanded = false
        this.children = []
        this.setupChildNode()
        this.bindEvents()

        if (id === null) {
            this.setupNode()
            this.createCloseHighlight()
        } else if (this.expandable) {
            this.setupExpandableNode()
            this.createExpandableHighlight()
        } else {
            this.setupNode()
            this.createHighlight()
        }
    }

    get expandable() {
        return !!this.data.children.length
    }

    bindEvents() {
        this.node.addEventListener('mouseenter', this._onMouseEnter)
        this.node.addEventListener('mouseleave', this._onMouseLeave)
        this.node.addEventListener('click', this._onClick)
        this.node.addEventListener('dblclick', this._onDblClick)
    }
    
    unbindEvents() {
        this.node.removeEventListener('mouseenter', this._onMouseEnter)
        this.node.removeEventListener('mouseleave', this._onMouseLeave)
        this.node.removeEventListener('click', this._onClick)
        this.node.addEventListener('dblclick', this._onDblClick)
    }

    onMouseEnter() {
        this.node.classList.add('hovered')
    }

    onMouseLeave() {
        this.node.classList.remove('hovered')
    }
    
    onDblClick() {
        this.expanded ? this.collapse() : this.expand()
    }

    onClick(event) {
        if (this.isEventWithinDisclosureTriangle(event)) {
            this.expanded ? this.collapse() : this.expand()
        } else {
            this.deselectAnotherElement()
            this.node.classList.add('selected')
            dispatcher.dispatch(dispatcher.ACTION.TREE_CLICK, this.data)
        }
    }

    deselectAnotherElement() {
        TreeElement.selectedTreeElement && TreeElement.selectedTreeElement.node.classList.remove('selected')
        TreeElement.selectedTreeElement = this
    }

    isEventWithinDisclosureTriangle(event) {
        const arrowToggleWidth = 10
        const paddingLeftValue = window.getComputedStyle(this.node).paddingLeft
        const computedLeftPadding = parseFloat(paddingLeftValue)
        const left = this.node.offsetLeft + computedLeftPadding
        return event.pageX >= left && event.pageX <= left + arrowToggleWidth && this.expandable
    }

    setupExpandableNode() {
        this.node.classList.add('parent')
        this.node.setAttribute('aria-expanded', 'false')
    }

    setupNode() {
        this.node.setAttribute('role', 'treeitem')
    }

    setupChildNode() {
        this.childNode.setAttribute('role', 'group')
        this.childNode.classList.add('children')
    }

    createHighlight() {
        let selectionNode = document.createElement('div')
        let highlightNode = document.createElement('span')
        let tagName = this.data.componentName
        let openTagNode = this.createHtmlTag(tagName)
        let closeTagNode = this.createHtmlTag(tagName, null, true)
        highlightNode.className = 'highlight'
        highlightNode.appendChild(openTagNode)
        highlightNode.appendChild(closeTagNode)
        selectionNode.className = 'selection fill'
        this.node.appendChild(selectionNode)
        this.node.appendChild(highlightNode)
    }

    createExpandableHighlight() {
        let selectionNode = document.createElement('div')
        let highlightNode = document.createElement('span')
        let bogusNode = document.createElement('span')
        let tagName = this.data.componentName
        let openTagNode = this.createHtmlTag(tagName)
        let closeTagNode = this.createHtmlTag(tagName, null, true)
        highlightNode.className = 'highlight'
        highlightNode.style.paddingLeft = '5px'
        highlightNode.appendChild(openTagNode)
        highlightNode.appendChild(bogusNode)
        highlightNode.appendChild(closeTagNode)
        bogusNode.className = 'webkit-html-text-node bogus'
        bogusNode.textContent = '...'
        selectionNode.className = 'selection fill'
        this.node.appendChild(highlightNode)
        this.node.appendChild(selectionNode)
    }
    
    createCloseHighlight() {
        let selectionNode = document.createElement('div')
        let highlightNode = document.createElement('span')
        let tagName = this.data.componentName
        let closeTagNode = this.createHtmlTag(tagName, null, true)
        highlightNode.className = 'highlight'
        highlightNode.appendChild(closeTagNode)
        selectionNode.className = 'selection fill'
        this.node.appendChild(selectionNode)
        this.node.appendChild(highlightNode)
    }

    createHtmlTag(name, attributes, isCloseTag) {
        if (typeof name !== 'string') {
           throw new Error('name is not string') 
        }
        if (attributes && !attributes instanceof Array) {
           throw new Error('attributes is not Array') 
        }

        let tag = document.createElement('span')
        let tagName = document.createElement('span')
        let startTagSymbol = document.createTextNode('<')
        let endTagSymbol = document.createTextNode('>')
        
        tag.className = 'webkit-html-tag'
        tagName.className = isCloseTag ? 'webkit-html-close-tag-name' : 'webkit-html-tag-name'
        tagName.textContent = isCloseTag ? '/' + name : name
        tag.appendChild(startTagSymbol)
        tag.appendChild(tagName)
        tag.appendChild(endTagSymbol)
        
        // if (attributes.length) {
            // let tagAttribute = document.createElement('span')
            // tagAttribute.className = 'webkit-html-attribute'
        // }
        return tag
    }
    
    expand() {
        if (!this.expandable)
            return

        let nextSiblingNode = this.getNextSiblingNode()
        let parent = this.getParentNode()
        this.expanded = true
        this.node.classList.add('expanded')
        this.childNode.classList.add('expanded')
        this.node.setAttribute('aria-expanded', 'true')
        
        this.data.children.forEach(child => {
            let childElement = new TreeElement(child.treeId, child)
            childElement.appendTo(this.childNode)
            this.children.push(childElement)
        })
        
        // create close tag element
        this.closeTagElement = new TreeElement(null, this.data)

        if (nextSiblingNode) { // if this node is the last child, we will append closeTagElement to the parent
            this.closeTagElement.appendBefore(parent, nextSiblingNode)
        } else {
            this.closeTagElement.appendTo(parent)
        }
    }
    
    collapse() {
        this.node.classList.remove('expanded')
        this.node.setAttribute('aria-expanded', 'false')
        this.childNode.classList.remove('expanded')
        this.expanded = false
        this.destroyChild()
    }

    destroyChild() {
        this.children.forEach(child => {
            child.destroy()
        })

        this.children = []

        if (this.closeTagElement) {
            this.closeTagElement.destroy()
            this.closeTagElement = null
        }
    }

    destroy() {
        let parentNode = this.getParentNode()
        this.destroyChild()
        this.unbindEvents()
        parentNode.removeChild(this.node)
        parentNode.removeChild(this.childNode)
    }

    getNextSiblingNode() {
        return this.childNode.nextSibling || null
    }

    getParentNode() {
        return this.node.parentNode
    }

    appendTo(node) {
        node.appendChild(this.node)
        node.appendChild(this.childNode)
    }

    appendBefore(node, beforeNode) {
        node.insertBefore(this.node, beforeNode)
        node.insertBefore(this.childNode, beforeNode)
    }
}

class TreeProperty {
    constructor(key, value) {
        this._onClick = this.onClick.bind(this)
        this._onDblClick = this.onDblClick.bind(this)
        this.node = document.createElement('li')
        this.childNode = document.createElement('ol')
        this.key = key
        this.value = value
        this.expanded = false
        this.children = []
        this.bindEvents()
        this.expandable ? this.setupExpandableNode() : this.setupNode()
        this.setupChildNode()
        this.attachPropertyTag()
    }

    get expandable() {
        return typeof this.value === 'object' || this.value instanceof Array
    }

    bindEvents() {
        this.node.addEventListener('click', this._onClick)
        this.node.addEventListener('dblclick', this._onDblClick)
    }
    
    unbindEvents() {
        this.node.removeEventListener('click', this._onClick)
        this.node.addEventListener('dblclick', this._onDblClick)
    }

    onDblClick() {
        this.expanded ? this.collapse() : this.expand()
    }

    onClick(event) {
        if (this.isEventWithinDisclosureTriangle(event)) {
            this.expanded ? this.collapse() : this.expand()
        } else {
        }
    }

    isEventWithinDisclosureTriangle(event) {
        const arrowToggleWidth = 10
        const paddingLeftValue = window.getComputedStyle(this.node).paddingLeft
        const computedLeftPadding = parseFloat(paddingLeftValue)
        const left = computedLeftPadding
        return event.offsetX >= left && event.offsetX <= left + arrowToggleWidth && this.expandable
    }

    setupExpandableNode() {
        this.node.classList.add('parent')
        this.node.setAttribute('aria-expanded', 'false')
    }

    setupNode() {
        this.node.setAttribute('role', 'treeitem')
    }

    setupChildNode() {
        this.childNode.setAttribute('role', 'group')
        this.childNode.classList.add('children')
    }

    getTagValue() {
        let value = null
        let tagValue = document.createElement('span')

        if (this.value instanceof Array) {
            value = `Array[${this.value.length}]`
            tagValue.className = 'webkit-html-tag-name array-tag'

        } else if (typeof this.value === 'object') {
            value = '{...}'
            tagValue.className = 'webkit-html-tag-name object-tag'

        } else if (typeof this.value === 'number') {
            tagValue.className = 'webkit-html-tag-name number-tag'

        } else if (typeof this.value === 'boolean') {
            tagValue.className = 'webkit-html-tag-name boolean-tag'

        } else if (typeof this.value === 'string') {
            value = `"${this.value}"`
            tagValue.className = 'webkit-html-tag-name string-tag'

        }

        tagValue.textContent = value || this.value
        return tagValue
    }

    attachPropertyTag() {
        if (typeof this.key !== 'string') {
           throw new Error('name is not string') 
        }

        let tag = document.createElement('span')
        let tagKey = document.createElement('span')
        let tagValue = this.getTagValue()
        let colonSymbol = document.createTextNode(': ')
        let selectionNode = document.createElement('div')
        
        tag.className = 'webkit-html-tag'
        tagKey.className = 'webkit-html-tag-name key-tag'
        tagKey.textContent = this.key
        selectionNode.className = 'selection fill'
        
        tag.appendChild(tagKey)
        tag.appendChild(colonSymbol)
        tag.appendChild(tagValue)
        
        let containerNode = document.createElement('span')
        containerNode.className = 'highlight'
        containerNode.appendChild(tag)
        this.node.appendChild(selectionNode)
        this.node.appendChild(containerNode)
    }

    getIterableValue() {
        let arr = []

        if (this.value instanceof Array) {
            this.value.forEach((val, inx) => {
                arr.push({ [inx]: val }) 
            })
        } else if (typeof this.value === 'object') {
            for (let key in this.value) {
                if (this.value.hasOwnProperty(key)) {
                    arr.push({ [key]: this.value[key] })
                }
            }
        }
        return arr
    }

    expand() {
        if (!this.expandable)
            return

        this.expanded = true
        this.node.classList.add('expanded')
        this.childNode.classList.add('expanded')
        this.node.setAttribute('aria-expanded', 'true')
        
        this.getIterableValue().forEach(child => {
            let key = Object.keys(child)[0]
            let value = child[key]
            let treeProperty = new TreeProperty(key, value)
            treeProperty.appendTo(this.childNode)
            this.children.push(treeProperty)
        })
    }
    
    collapse() {
        this.node.classList.remove('expanded')
        this.node.setAttribute('aria-expanded', 'false')
        this.childNode.classList.remove('expanded')
        this.expanded = false
        this.destroyChild()
    }

    destroyChild() {
        this.children.forEach(child => {
            child.destroy()
        })
        this.children = []
    }

    destroy() {
        let parentNode = this.getParentNode()
        this.destroyChild()
        this.unbindEvents()
        parentNode.removeChild(this.node)
        parentNode.removeChild(this.childNode)
    }

    getNextSiblingNode() {
        return this.childNode.nextSibling || null
    }

    getParentNode() {
        return this.node.parentNode
    }

    appendTo(node) {
        node.appendChild(this.node)
        node.appendChild(this.childNode)
    }

    appendBefore(node, beforeNode) {
        node.insertBefore(this.node, beforeNode)
        node.insertBefore(this.childNode, beforeNode)
    }
}

class Attachable {
    attachTo(attachable) {
        attachable.node.appendChild(this.node)
    }

    getWidth() {
        return this.node.offsetWidth
    }

    setWidth(width) {
        this.node.style.width = width + 'px' 
    }
}

class TreePane extends Attachable {
    constructor() {
        super()
        this.node = document.createElement('div')
        this.elementDisclosureNode = document.createElement('div')
        this.elementTreeOutlineNode = document.createElement('ol')
        this.elementDisclosureNode.classList.add('elements-disclosure')
        this.elementTreeOutlineNode.classList.add('elements-tree-outline')
        this.elementDisclosureNode.appendChild(this.elementTreeOutlineNode)
        this.node.appendChild(this.elementDisclosureNode)
        this.root = null
        this.node.className = 'tree-pane'
        this.node.style.overflow = 'auto'
        this.node.style.minWidth = '50%'
        this.node.style.minHeight = '50%'
        this.node.style.display = 'flex'
        this.node.style.flex = '1 1 0%'
    }

    setRoot(data) {
        if (this.root) {
            this.root.destroy()
        }
        this.root = new TreeElement(data.treeId, data)
        this.root.appendTo(this.elementTreeOutlineNode)
    }

    hasRoot() {
        return !!this.root
    }
}

class PropertyPane extends Attachable {
    constructor() {
        super()
        this.node = document.createElement('div')
        this.node.className = 'property-pane'
        this.titleNode = document.createElement('div')
        this.titleNode.className = 'title'
        this.titleNode.style.display = 'none'
        this.node.appendChild(this.titleNode)

        this.elementDisclosureNode = document.createElement('div')
        this.elementTreeOutlineNode = document.createElement('ol')
        this.elementDisclosureNode.classList.add('elements-disclosure')
        this.elementTreeOutlineNode.classList.add('elements-tree-outline')
        this.elementDisclosureNode.appendChild(this.elementTreeOutlineNode)
        this.node.appendChild(this.elementDisclosureNode)
        this.children = []

        this._showProperty = this.showProperty.bind(this)
        dispatcher.subscribe(dispatcher.ACTION.TREE_CLICK, this._showProperty)
    }
    
    showProperty(data) {
        if (this.children.length) {
            this.children.forEach(child => child.destroy())
        }

        this.children = []
        this.titleNode.textContent = data.componentName
        this.titleNode.style.display = ''
        data.properties.forEach(property => {
            let key = Object.keys(property)[0]
            let value = property[key]
            let treeProperty = new TreeProperty(key, value)
            treeProperty.appendTo(this.elementTreeOutlineNode)
            this.children.push(treeProperty)
        })
    }
}

class App {
    constructor() {
        this.node = document.createElement('div')
        this.resizerNode = document.createElement('div')
        this.treePane = new TreePane()
        this.propertyPane = new PropertyPane()
        this.treePane.attachTo(this)
        this.propertyPane.attachTo(this)
        this.node.style.display = 'flex'
        this.node.style.flex = '1 1 0%'
        this.node.style.height = '100%'

        this.resizerNode.style.cursor = 'ew-resize'
        this.resizerNode.style.position = 'absolute'
        this.resizerNode.style.width = '6px'
        this.resizerNode.style.top = '0px'
        this.resizerNode.style.bottom = '0px'
        
        document.body.appendChild(this.node)
        this.resizerNode.style.left = `${this.treePane.getWidth() - 3}px`
        this.node.appendChild(this.resizerNode)

        let mouseDown = false

        this.resizerNode.onmousedown = e => {
            mouseDown = true
        }
        this.node.onmouseup = e => {
            mouseDown = false
        }
        this.node.onmousemove = e => {
            if (mouseDown) {
                this.resizePane(e)
            }
        }
    }

    resizePane(event) {
        let width = document.body.offsetWidth - event.screenX
        let minOffset = Math.max(document.body.offsetWidth / 2, event.screenX)
        this.propertyPane.setWidth(width)
        this.resizerNode.style.left = `${minOffset - 3}px`
    }

    setRoot(data) {
        this.treePane.setRoot(data)
    }

    hasRoot() {
        return this.treePane.hasRoot()
    }
}

window.app = new App()