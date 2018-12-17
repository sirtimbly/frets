/* tslint:disable no-http-string */
var NAMESPACE_W3 = 'http://www.w3.org/';
/* tslint:enable no-http-string */
var NAMESPACE_SVG = NAMESPACE_W3 + "2000/svg";
var NAMESPACE_XLINK = NAMESPACE_W3 + "1999/xlink";
var emptyArray = [];
var extend = function (base, overrides) {
    var result = {};
    Object.keys(base).forEach(function (key) {
        result[key] = base[key];
    });
    if (overrides) {
        Object.keys(overrides).forEach(function (key) {
            result[key] = overrides[key];
        });
    }
    return result;
};
var same = function (vnode1, vnode2) {
    if (vnode1.vnodeSelector !== vnode2.vnodeSelector) {
        return false;
    }
    if (vnode1.properties && vnode2.properties) {
        if (vnode1.properties.key !== vnode2.properties.key) {
            return false;
        }
        return vnode1.properties.bind === vnode2.properties.bind;
    }
    return !vnode1.properties && !vnode2.properties;
};
var checkStyleValue = function (styleValue) {
    if (typeof styleValue !== 'string') {
        throw new Error('Style values must be strings');
    }
};
var findIndexOfChild = function (children, sameAs, start) {
    if (sameAs.vnodeSelector !== '') {
        // Never scan for text-nodes
        for (var i = start; i < children.length; i++) {
            if (same(children[i], sameAs)) {
                return i;
            }
        }
    }
    return -1;
};
var checkDistinguishable = function (childNodes, indexToCheck, parentVNode, operation) {
    var childNode = childNodes[indexToCheck];
    if (childNode.vnodeSelector === '') {
        return; // Text nodes need not be distinguishable
    }
    var properties = childNode.properties;
    var key = properties ? (properties.key === undefined ? properties.bind : properties.key) : undefined;
    if (!key) { // A key is just assumed to be unique
        for (var i = 0; i < childNodes.length; i++) {
            if (i !== indexToCheck) {
                var node = childNodes[i];
                if (same(node, childNode)) {
                    throw new Error(parentVNode.vnodeSelector + " had a " + childNode.vnodeSelector + " child " + (operation === 'added' ? operation : 'removed') + ", but there is now more than one. You must add unique key properties to make them distinguishable.");
                }
            }
        }
    }
};
var nodeAdded = function (vNode) {
    if (vNode.properties) {
        var enterAnimation = vNode.properties.enterAnimation;
        if (enterAnimation) {
            enterAnimation(vNode.domNode, vNode.properties);
        }
    }
};
var removedNodes = [];
var requestedIdleCallback = false;
var visitRemovedNode = function (node) {
    (node.children || []).forEach(visitRemovedNode);
    if (node.properties && node.properties.afterRemoved) {
        node.properties.afterRemoved.apply(node.properties.bind || node.properties, [node.domNode]);
    }
};
var processPendingNodeRemovals = function () {
    requestedIdleCallback = false;
    removedNodes.forEach(visitRemovedNode);
    removedNodes.length = 0;
};
var scheduleNodeRemoval = function (vNode) {
    removedNodes.push(vNode);
    if (!requestedIdleCallback) {
        requestedIdleCallback = true;
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(processPendingNodeRemovals, { timeout: 16 });
        }
        else {
            setTimeout(processPendingNodeRemovals, 16);
        }
    }
};
var nodeToRemove = function (vNode) {
    var domNode = vNode.domNode;
    if (vNode.properties) {
        var exitAnimation = vNode.properties.exitAnimation;
        if (exitAnimation) {
            domNode.style.pointerEvents = 'none';
            var removeDomNode = function () {
                if (domNode.parentNode) {
                    domNode.parentNode.removeChild(domNode);
                    scheduleNodeRemoval(vNode);
                }
            };
            exitAnimation(domNode, removeDomNode, vNode.properties);
            return;
        }
    }
    if (domNode.parentNode) {
        domNode.parentNode.removeChild(domNode);
        scheduleNodeRemoval(vNode);
    }
};
var setProperties = function (domNode, properties, projectionOptions) {
    if (!properties) {
        return;
    }
    var eventHandlerInterceptor = projectionOptions.eventHandlerInterceptor;
    var propNames = Object.keys(properties);
    var propCount = propNames.length;
    var _loop_1 = function (i) {
        var propName = propNames[i];
        var propValue = properties[propName];
        if (propName === 'className') {
            throw new Error('Property "className" is not supported, use "class".');
        }
        else if (propName === 'class') {
            toggleClasses(domNode, propValue, true);
        }
        else if (propName === 'classes') {
            // object with string keys and boolean values
            var classNames = Object.keys(propValue);
            var classNameCount = classNames.length;
            for (var j = 0; j < classNameCount; j++) {
                var className = classNames[j];
                if (propValue[className]) {
                    domNode.classList.add(className);
                }
            }
        }
        else if (propName === 'styles') {
            // object with string keys and string (!) values
            var styleNames = Object.keys(propValue);
            var styleCount = styleNames.length;
            for (var j = 0; j < styleCount; j++) {
                var styleName = styleNames[j];
                var styleValue = propValue[styleName];
                if (styleValue) {
                    checkStyleValue(styleValue);
                    projectionOptions.styleApplyer(domNode, styleName, styleValue);
                }
            }
        }
        else if (propName !== 'key' && propValue !== null && propValue !== undefined) {
            var type = typeof propValue;
            if (type === 'function') {
                if (propName.lastIndexOf('on', 0) === 0) { // lastIndexOf(,0)===0 -> startsWith
                    if (eventHandlerInterceptor) {
                        propValue = eventHandlerInterceptor(propName, propValue, domNode, properties); // intercept eventhandlers
                    }
                    if (propName === 'oninput') {
                        /* tslint:disable no-this-keyword no-invalid-this only-arrow-functions no-void-expression */
                        (function () {
                            // record the evt.target.value, because IE and Edge sometimes do a requestAnimationFrame between changing value and running oninput
                            var oldPropValue = propValue;
                            propValue = function (evt) {
                                oldPropValue.apply(this, [evt]);
                                evt.target['oninput-value'] = evt.target.value; // may be HTMLTextAreaElement as well
                            };
                        }());
                        /* tslint:enable */
                    }
                    domNode[propName] = propValue;
                }
            }
            else if (projectionOptions.namespace === NAMESPACE_SVG) {
                if (propName === 'href') {
                    domNode.setAttributeNS(NAMESPACE_XLINK, propName, propValue);
                }
                else {
                    // all SVG attributes are read-only in DOM, so...
                    domNode.setAttribute(propName, propValue);
                }
            }
            else if (type === 'string' && propName !== 'value' && propName !== 'innerHTML') {
                domNode.setAttribute(propName, propValue);
            }
            else {
                domNode[propName] = propValue;
            }
        }
    };
    for (var i = 0; i < propCount; i++) {
        _loop_1(i);
    }
};
var addChildren = function (domNode, children, projectionOptions) {
    if (!children) {
        return;
    }
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        createDom(child, domNode, undefined, projectionOptions);
    }
};
var initPropertiesAndChildren = function (domNode, vnode, projectionOptions) {
    addChildren(domNode, vnode.children, projectionOptions); // children before properties, needed for value property of <select>.
    if (vnode.text) {
        domNode.textContent = vnode.text;
    }
    setProperties(domNode, vnode.properties, projectionOptions);
    if (vnode.properties && vnode.properties.afterCreate) {
        vnode.properties.afterCreate.apply(vnode.properties.bind || vnode.properties, [domNode, projectionOptions, vnode.vnodeSelector, vnode.properties, vnode.children]);
    }
};
var createDom = function (vnode, parentNode, insertBefore, projectionOptions) {
    var domNode;
    var start = 0;
    var vnodeSelector = vnode.vnodeSelector;
    var doc = parentNode.ownerDocument;
    if (vnodeSelector === '') {
        domNode = vnode.domNode = doc.createTextNode(vnode.text);
        if (insertBefore !== undefined) {
            parentNode.insertBefore(domNode, insertBefore);
        }
        else {
            parentNode.appendChild(domNode);
        }
    }
    else {
        for (var i = 0; i <= vnodeSelector.length; ++i) {
            var c = vnodeSelector.charAt(i);
            if (i === vnodeSelector.length || c === '.' || c === '#') {
                var type = vnodeSelector.charAt(start - 1);
                var found = vnodeSelector.slice(start, i);
                if (type === '.') {
                    domNode.classList.add(found);
                }
                else if (type === '#') {
                    domNode.id = found;
                }
                else {
                    if (found === 'svg') {
                        projectionOptions = extend(projectionOptions, { namespace: NAMESPACE_SVG });
                    }
                    if (projectionOptions.namespace !== undefined) {
                        domNode = vnode.domNode = doc.createElementNS(projectionOptions.namespace, found);
                    }
                    else {
                        domNode = vnode.domNode = (vnode.domNode || doc.createElement(found));
                        if (found === 'input' && vnode.properties && vnode.properties.type !== undefined) {
                            // IE8 and older don't support setting input type after the DOM Node has been added to the document
                            domNode.setAttribute('type', vnode.properties.type);
                        }
                    }
                    if (insertBefore !== undefined) {
                        parentNode.insertBefore(domNode, insertBefore);
                    }
                    else if (domNode.parentNode !== parentNode) {
                        parentNode.appendChild(domNode);
                    }
                }
                start = i + 1;
            }
        }
        initPropertiesAndChildren(domNode, vnode, projectionOptions);
    }
};
var updateDom;
/**
 * Adds or removes classes from an Element
 * @param domNode the element
 * @param classes a string separated list of classes
 * @param on true means add classes, false means remove
 */
var toggleClasses = function (domNode, classes, on) {
    if (!classes) {
        return;
    }
    classes.split(' ').forEach(function (c) { return domNode.classList.toggle(c, on); });
};
var updateProperties = function (domNode, previousProperties, properties, projectionOptions) {
    if (!properties) {
        return;
    }
    var propertiesUpdated = false;
    var propNames = Object.keys(properties);
    var propCount = propNames.length;
    for (var i = 0; i < propCount; i++) {
        var propName = propNames[i];
        // assuming that properties will be nullified instead of missing is by design
        var propValue = properties[propName];
        var previousValue = previousProperties[propName];
        if (propName === 'class') {
            if (previousValue !== propValue) {
                toggleClasses(domNode, previousValue, false);
                toggleClasses(domNode, propValue, true);
            }
        }
        else if (propName === 'classes') {
            var classList = domNode.classList;
            var classNames = Object.keys(propValue);
            var classNameCount = classNames.length;
            for (var j = 0; j < classNameCount; j++) {
                var className = classNames[j];
                var on = !!propValue[className];
                var previousOn = !!previousValue[className];
                if (on === previousOn) {
                    continue;
                }
                propertiesUpdated = true;
                if (on) {
                    classList.add(className);
                }
                else {
                    classList.remove(className);
                }
            }
        }
        else if (propName === 'styles') {
            var styleNames = Object.keys(propValue);
            var styleCount = styleNames.length;
            for (var j = 0; j < styleCount; j++) {
                var styleName = styleNames[j];
                var newStyleValue = propValue[styleName];
                var oldStyleValue = previousValue[styleName];
                if (newStyleValue === oldStyleValue) {
                    continue;
                }
                propertiesUpdated = true;
                if (newStyleValue) {
                    checkStyleValue(newStyleValue);
                    projectionOptions.styleApplyer(domNode, styleName, newStyleValue);
                }
                else {
                    projectionOptions.styleApplyer(domNode, styleName, '');
                }
            }
        }
        else {
            if (!propValue && typeof previousValue === 'string') {
                propValue = '';
            }
            if (propName === 'value') { // value can be manipulated by the user directly and using event.preventDefault() is not an option
                var domValue = domNode[propName];
                if (domValue !== propValue // The 'value' in the DOM tree !== newValue
                    && (domNode['oninput-value']
                        ? domValue === domNode['oninput-value'] // If the last reported value to 'oninput' does not match domValue, do nothing and wait for oninput
                        : propValue !== previousValue // Only update the value if the vdom changed
                    )) {
                    // The edge cases are described in the tests
                    domNode[propName] = propValue; // Reset the value, even if the virtual DOM did not change
                    domNode['oninput-value'] = undefined;
                } // else do not update the domNode, otherwise the cursor position would be changed
                if (propValue !== previousValue) {
                    propertiesUpdated = true;
                }
            }
            else if (propValue !== previousValue) {
                var type = typeof propValue;
                if (type !== 'function' || !projectionOptions.eventHandlerInterceptor) { // Function updates are expected to be handled by the EventHandlerInterceptor
                    if (projectionOptions.namespace === NAMESPACE_SVG) {
                        if (propName === 'href') {
                            domNode.setAttributeNS(NAMESPACE_XLINK, propName, propValue);
                        }
                        else {
                            // all SVG attributes are read-only in DOM, so...
                            domNode.setAttribute(propName, propValue);
                        }
                    }
                    else if (type === 'string' && propName !== 'innerHTML') {
                        if (propName === 'role' && propValue === '') {
                            domNode.removeAttribute(propName);
                        }
                        else {
                            domNode.setAttribute(propName, propValue);
                        }
                    }
                    else if (domNode[propName] !== propValue) { // Comparison is here for side-effects in Edge with scrollLeft and scrollTop
                        domNode[propName] = propValue;
                    }
                    propertiesUpdated = true;
                }
            }
        }
    }
    return propertiesUpdated;
};
var updateChildren = function (vnode, domNode, oldChildren, newChildren, projectionOptions) {
    if (oldChildren === newChildren) {
        return false;
    }
    oldChildren = oldChildren || emptyArray;
    newChildren = newChildren || emptyArray;
    var oldChildrenLength = oldChildren.length;
    var newChildrenLength = newChildren.length;
    var oldIndex = 0;
    var newIndex = 0;
    var i;
    var textUpdated = false;
    while (newIndex < newChildrenLength) {
        var oldChild = (oldIndex < oldChildrenLength) ? oldChildren[oldIndex] : undefined;
        var newChild = newChildren[newIndex];
        if (oldChild !== undefined && same(oldChild, newChild)) {
            textUpdated = updateDom(oldChild, newChild, projectionOptions) || textUpdated;
            oldIndex++;
        }
        else {
            var findOldIndex = findIndexOfChild(oldChildren, newChild, oldIndex + 1);
            if (findOldIndex >= 0) {
                // Remove preceding missing children
                for (i = oldIndex; i < findOldIndex; i++) {
                    nodeToRemove(oldChildren[i]);
                    checkDistinguishable(oldChildren, i, vnode, 'removed');
                }
                textUpdated = updateDom(oldChildren[findOldIndex], newChild, projectionOptions) || textUpdated;
                oldIndex = findOldIndex + 1;
            }
            else {
                // New child
                createDom(newChild, domNode, (oldIndex < oldChildrenLength) ? oldChildren[oldIndex].domNode : undefined, projectionOptions);
                nodeAdded(newChild);
                checkDistinguishable(newChildren, newIndex, vnode, 'added');
            }
        }
        newIndex++;
    }
    if (oldChildrenLength > oldIndex) {
        // Remove child fragments
        for (i = oldIndex; i < oldChildrenLength; i++) {
            nodeToRemove(oldChildren[i]);
            checkDistinguishable(oldChildren, i, vnode, 'removed');
        }
    }
    return textUpdated;
};
updateDom = function (previous, vnode, projectionOptions) {
    var domNode = previous.domNode;
    var textUpdated = false;
    if (previous === vnode) {
        return false; // By contract, VNode objects may not be modified anymore after passing them to maquette
    }
    var updated = false;
    if (vnode.vnodeSelector === '') {
        if (vnode.text !== previous.text) {
            var newTextNode = domNode.ownerDocument.createTextNode(vnode.text);
            domNode.parentNode.replaceChild(newTextNode, domNode);
            vnode.domNode = newTextNode;
            textUpdated = true;
            return textUpdated;
        }
        vnode.domNode = domNode;
    }
    else {
        if (vnode.vnodeSelector.lastIndexOf('svg', 0) === 0) { // lastIndexOf(needle,0)===0 means StartsWith
            projectionOptions = extend(projectionOptions, { namespace: NAMESPACE_SVG });
        }
        if (previous.text !== vnode.text) {
            updated = true;
            if (vnode.text === undefined) {
                domNode.removeChild(domNode.firstChild); // the only textnode presumably
            }
            else {
                domNode.textContent = vnode.text;
            }
        }
        vnode.domNode = domNode;
        updated = updateChildren(vnode, domNode, previous.children, vnode.children, projectionOptions) || updated;
        updated = updateProperties(domNode, previous.properties, vnode.properties, projectionOptions) || updated;
        if (vnode.properties && vnode.properties.afterUpdate) {
            vnode.properties.afterUpdate.apply(vnode.properties.bind || vnode.properties, [domNode, projectionOptions, vnode.vnodeSelector, vnode.properties, vnode.children]);
        }
    }
    if (updated && vnode.properties && vnode.properties.updateAnimation) {
        vnode.properties.updateAnimation(domNode, vnode.properties, previous.properties);
    }
    return textUpdated;
};
var createProjection = function (vnode, projectionOptions) {
    return {
        getLastRender: function () { return vnode; },
        update: function (updatedVnode) {
            if (vnode.vnodeSelector !== updatedVnode.vnodeSelector) {
                throw new Error('The selector for the root VNode may not be changed. (consider using dom.merge and add one extra level to the virtual DOM)');
            }
            var previousVNode = vnode;
            vnode = updatedVnode;
            updateDom(previousVNode, updatedVnode, projectionOptions);
        },
        domNode: vnode.domNode
    };
};

var DEFAULT_PROJECTION_OPTIONS = {
    namespace: undefined,
    performanceLogger: function () { return undefined; },
    eventHandlerInterceptor: undefined,
    styleApplyer: function (domNode, styleName, value) {
        // Provides a hook to add vendor prefixes for browsers that still need it.
        domNode.style[styleName] = value;
    }
};
var applyDefaultProjectionOptions = function (projectorOptions) {
    return extend(DEFAULT_PROJECTION_OPTIONS, projectorOptions);
};
var dom = {
    /**
     * Creates a real DOM tree from `vnode`. The [[Projection]] object returned will contain the resulting DOM Node in
     * its [[Projection.domNode|domNode]] property.
     * This is a low-level method. Users will typically use a [[Projector]] instead.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]]
     * objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the projection.
     * @returns The [[Projection]] which also contains the DOM Node that was created.
     */
    create: function (vnode, projectionOptions) {
        projectionOptions = applyDefaultProjectionOptions(projectionOptions);
        createDom(vnode, document.createElement('div'), undefined, projectionOptions);
        return createProjection(vnode, projectionOptions);
    },
    /**
     * Appends a new child node to the DOM which is generated from a [[VNode]].
     * This is a low-level method. Users will typically use a [[Projector]] instead.
     * @param parentNode - The parent node for the new child node.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]]
     * objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the [[Projection]].
     * @returns The [[Projection]] that was created.
     */
    append: function (parentNode, vnode, projectionOptions) {
        projectionOptions = applyDefaultProjectionOptions(projectionOptions);
        createDom(vnode, parentNode, undefined, projectionOptions);
        return createProjection(vnode, projectionOptions);
    },
    /**
     * Inserts a new DOM node which is generated from a [[VNode]].
     * This is a low-level method. Users wil typically use a [[Projector]] instead.
     * @param beforeNode - The node that the DOM Node is inserted before.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function.
     * NOTE: [[VNode]] objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the projection, see [[createProjector]].
     * @returns The [[Projection]] that was created.
     */
    insertBefore: function (beforeNode, vnode, projectionOptions) {
        projectionOptions = applyDefaultProjectionOptions(projectionOptions);
        createDom(vnode, beforeNode.parentNode, beforeNode, projectionOptions);
        return createProjection(vnode, projectionOptions);
    },
    /**
     * Merges a new DOM node which is generated from a [[VNode]] with an existing DOM Node.
     * This means that the virtual DOM and the real DOM will have one overlapping element.
     * Therefore the selector for the root [[VNode]] will be ignored, but its properties and children will be applied to the Element provided.
     * This is a low-level method. Users wil typically use a [[Projector]] instead.
     * @param element - The existing element to adopt as the root of the new virtual DOM. Existing attributes and child nodes are preserved.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]] objects
     * may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the projection, see [[createProjector]].
     * @returns The [[Projection]] that was created.
     */
    merge: function (element, vnode, projectionOptions) {
        projectionOptions = applyDefaultProjectionOptions(projectionOptions);
        vnode.domNode = element;
        initPropertiesAndChildren(element, vnode, projectionOptions);
        return createProjection(vnode, projectionOptions);
    },
    /**
     * Replaces an existing DOM node with a node generated from a [[VNode]].
     * This is a low-level method. Users will typically use a [[Projector]] instead.
     * @param element - The node for the [[VNode]] to replace.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]]
     * objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the [[Projection]].
     * @returns The [[Projection]] that was created.
     */
    replace: function (element, vnode, projectionOptions) {
        projectionOptions = applyDefaultProjectionOptions(projectionOptions);
        createDom(vnode, element.parentNode, element, projectionOptions);
        element.parentNode.removeChild(element);
        return createProjection(vnode, projectionOptions);
    }
};

/* tslint:disable function-name */
var toTextVNode = function (data) {
    return {
        vnodeSelector: '',
        properties: undefined,
        children: undefined,
        text: data.toString(),
        domNode: null
    };
};
var appendChildren = function (parentSelector, insertions, main) {
    for (var i = 0, length_1 = insertions.length; i < length_1; i++) {
        var item = insertions[i];
        if (Array.isArray(item)) {
            appendChildren(parentSelector, item, main);
        }
        else {
            if (item !== null && item !== undefined && item !== false) {
                if (typeof item === 'string') {
                    item = toTextVNode(item);
                }
                main.push(item);
            }
        }
    }
};
function h(selector, properties, children) {
    if (Array.isArray(properties)) {
        children = properties;
        properties = undefined;
    }
    else if ((properties && (typeof properties === 'string' || properties.hasOwnProperty('vnodeSelector'))) ||
        (children && (typeof children === 'string' || children.hasOwnProperty('vnodeSelector')))) {
        throw new Error('h called with invalid arguments');
    }
    var text;
    var flattenedChildren;
    // Recognize a common special case where there is only a single text node
    if (children && children.length === 1 && typeof children[0] === 'string') {
        text = children[0];
    }
    else if (children) {
        flattenedChildren = [];
        appendChildren(selector, children, flattenedChildren);
        if (flattenedChildren.length === 0) {
            flattenedChildren = undefined;
        }
    }
    return {
        vnodeSelector: selector,
        properties: properties,
        children: flattenedChildren,
        text: (text === '') ? undefined : text,
        domNode: null
    };
}

var createParentNodePath = function (node, rootNode) {
    var parentNodePath = [];
    while (node !== rootNode) {
        parentNodePath.push(node);
        node = node.parentNode;
    }
    return parentNodePath;
};
var find;
if (Array.prototype.find) {
    find = function (items, predicate) { return items.find(predicate); };
}
else {
    find = function (items, predicate) { return items.filter(predicate)[0]; };
}
var findVNodeByParentNodePath = function (vnode, parentNodePath) {
    var result = vnode;
    parentNodePath.forEach(function (node) {
        result = (result && result.children) ? find(result.children, function (child) { return child.domNode === node; }) : undefined;
    });
    return result;
};
var createEventHandlerInterceptor = function (projector, getProjection, performanceLogger) {
    var modifiedEventHandler = function (evt) {
        performanceLogger('domEvent', evt);
        var projection = getProjection();
        var parentNodePath = createParentNodePath(evt.currentTarget, projection.domNode);
        parentNodePath.reverse();
        var matchingVNode = findVNodeByParentNodePath(projection.getLastRender(), parentNodePath);
        projector.scheduleRender();
        var result;
        if (matchingVNode) {
            /* tslint:disable no-invalid-this */
            result = matchingVNode.properties["on" + evt.type].apply(matchingVNode.properties.bind || this, arguments);
            /* tslint:enable no-invalid-this */
        }
        performanceLogger('domEventProcessed', evt);
        return result;
    };
    return function (propertyName, eventHandler, domNode, properties) { return modifiedEventHandler; };
};
/**
 * Creates a [[Projector]] instance using the provided projectionOptions.
 *
 * For more information, see [[Projector]].
 *
 * @param projectorOptions   Options that influence how the DOM is rendered and updated.
 */
var createProjector = function (projectorOptions) {
    var projector;
    var projectionOptions = applyDefaultProjectionOptions(projectorOptions);
    var performanceLogger = projectionOptions.performanceLogger;
    var renderCompleted = true;
    var scheduled;
    var stopped = false;
    var projections = [];
    var renderFunctions = []; // matches the projections array
    var addProjection = function (
    /* one of: dom.append, dom.insertBefore, dom.replace, dom.merge */
    domFunction, 
    /* the parameter of the domFunction */
    node, renderFunction) {
        var projection;
        var getProjection = function () { return projection; };
        projectionOptions.eventHandlerInterceptor = createEventHandlerInterceptor(projector, getProjection, performanceLogger);
        projection = domFunction(node, renderFunction(), projectionOptions);
        projections.push(projection);
        renderFunctions.push(renderFunction);
    };
    var doRender = function () {
        scheduled = undefined;
        if (!renderCompleted) {
            return; // The last render threw an error, it should have been logged in the browser console.
        }
        renderCompleted = false;
        performanceLogger('renderStart', undefined);
        for (var i = 0; i < projections.length; i++) {
            var updatedVnode = renderFunctions[i]();
            performanceLogger('rendered', undefined);
            projections[i].update(updatedVnode);
            performanceLogger('patched', undefined);
        }
        performanceLogger('renderDone', undefined);
        renderCompleted = true;
    };
    projector = {
        renderNow: doRender,
        scheduleRender: function () {
            if (!scheduled && !stopped) {
                scheduled = requestAnimationFrame(doRender);
            }
        },
        stop: function () {
            if (scheduled) {
                cancelAnimationFrame(scheduled);
                scheduled = undefined;
            }
            stopped = true;
        },
        resume: function () {
            stopped = false;
            renderCompleted = true;
            projector.scheduleRender();
        },
        append: function (parentNode, renderFunction) {
            addProjection(dom.append, parentNode, renderFunction);
        },
        insertBefore: function (beforeNode, renderFunction) {
            addProjection(dom.insertBefore, beforeNode, renderFunction);
        },
        merge: function (domNode, renderFunction) {
            addProjection(dom.merge, domNode, renderFunction);
        },
        replace: function (domNode, renderFunction) {
            addProjection(dom.replace, domNode, renderFunction);
        },
        detach: function (renderFunction) {
            for (var i = 0; i < renderFunctions.length; i++) {
                if (renderFunctions[i] === renderFunction) {
                    renderFunctions.splice(i, 1);
                    return projections.splice(i, 1)[0];
                }
            }
            throw new Error('renderFunction was not found');
        }
    };
    return projector;
};

/**
 * Creates a [[CalculationCache]] object, useful for caching [[VNode]] trees.
 * In practice, caching of [[VNode]] trees is not needed, because achieving 60 frames per second is almost never a problem.
 * For more information, see [[CalculationCache]].
 *
 * @param <Result> The type of the value that is cached.
 */
var createCache = function () {
    var cachedInputs;
    var cachedOutcome;
    return {
        invalidate: function () {
            cachedOutcome = undefined;
            cachedInputs = undefined;
        },
        result: function (inputs, calculation) {
            if (cachedInputs) {
                for (var i = 0; i < inputs.length; i++) {
                    if (cachedInputs[i] !== inputs[i]) {
                        cachedOutcome = undefined;
                    }
                }
            }
            if (!cachedOutcome) {
                cachedOutcome = calculation();
                cachedInputs = inputs;
            }
            return cachedOutcome;
        }
    };
};

/**
 * Creates a {@link Mapping} instance that keeps an array of result objects synchronized with an array of source objects.
 * See {@link http://maquettejs.org/docs/arrays.html|Working with arrays}.
 *
 * @param <Source>       The type of source items. A database-record for instance.
 * @param <Target>       The type of target items. A [[MaquetteComponent]] for instance.
 * @param getSourceKey   `function(source)` that must return a key to identify each source object. The result must either be a string or a number.
 * @param createResult   `function(source, index)` that must create a new result object from a given source. This function is identical
 *                       to the `callback` argument in `Array.map(callback)`.
 * @param updateResult   `function(source, target, index)` that updates a result to an updated source.
 */

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var cjs = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

var makeOptions = function (opts) {
    if (opts === void 0) { opts = {}; }
    return ({
        arrayFormat: opts.arrayFormat || 'none',
        booleanFormat: opts.booleanFormat || 'none',
        nullFormat: opts.nullFormat || 'default'
    });
};
var encodeValue = function (value) { return encodeURIComponent(value); };
var decodeValue = function (value) { return decodeURIComponent(value); };
var encodeBoolean = function (name, value, opts) {
    if (opts.booleanFormat === 'empty-true' && value) {
        return name;
    }
    var encodedValue;
    if (opts.booleanFormat === 'unicode') {
        encodedValue = value ? '✓' : '✗';
    }
    else {
        encodedValue = value.toString();
    }
    return name + "=" + encodedValue;
};
var encodeNull = function (name, opts) {
    if (opts.nullFormat === 'hidden') {
        return '';
    }
    if (opts.nullFormat === 'string') {
        return name + "=null";
    }
    return name;
};
var getNameEncoder = function (opts) {
    if (opts.arrayFormat === 'index') {
        return function (name, index) { return name + "[" + index + "]"; };
    }
    if (opts.arrayFormat === 'brackets') {
        return function (name) { return name + "[]"; };
    }
    return function (name) { return name; };
};
var encodeArray = function (name, arr, opts) {
    var encodeName = getNameEncoder(opts);
    return arr
        .map(function (val, index) { return encodeName(name, index) + "=" + encodeValue(val); })
        .join('&');
};
var encode = function (name, value, opts) {
    if (value === null) {
        return encodeNull(name, opts);
    }
    if (typeof value === 'boolean') {
        return encodeBoolean(name, value, opts);
    }
    if (Array.isArray(value)) {
        return encodeArray(name, value, opts);
    }
    return name + "=" + encodeValue(value);
};
var decode = function (value, opts) {
    if (value === undefined) {
        return opts.booleanFormat === 'empty-true' ? true : null;
    }
    if (opts.booleanFormat === 'string') {
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
    }
    else if (opts.booleanFormat === 'unicode') {
        if (decodeValue(value) === '✓') {
            return true;
        }
        if (decodeValue(value) === '✗') {
            return false;
        }
    }
    else if (opts.nullFormat === 'string') {
        if (value === 'null') {
            return null;
        }
    }
    return decodeValue(value);
};

var getSearch = function (path) {
    var pos = path.indexOf('?');
    if (pos === -1) {
        return path;
    }
    return path.slice(pos + 1);
};
var isSerialisable = function (val) { return val !== undefined; };
var parseName = function (name) {
    var bracketPosition = name.indexOf('[');
    var hasBrackets = bracketPosition !== -1;
    return {
        hasBrackets: hasBrackets,
        name: hasBrackets ? name.slice(0, bracketPosition) : name
    };
};

/**
 * Parse a querystring and return an object of parameters
 */
var parse = function (path, opts) {
    var options = makeOptions(opts);
    return getSearch(path)
        .split('&')
        .reduce(function (params, param) {
        var _a = param.split('='), rawName = _a[0], value = _a[1];
        var _b = parseName(rawName), hasBrackets = _b.hasBrackets, name = _b.name;
        var currentValue = params[name];
        var decodedValue = decode(value, options);
        if (currentValue === undefined) {
            params[name] = hasBrackets ? [decodedValue] : decodedValue;
        }
        else {
            params[name] = [].concat(currentValue, decodedValue);
        }
        return params;
    }, {});
};
/**
 * Build a querystring from an object of parameters
 */
var build = function (params, opts) {
    var options = makeOptions(opts);
    return Object.keys(params)
        .filter(function (paramName) { return isSerialisable(params[paramName]); })
        .map(function (paramName) { return encode(paramName, params[paramName], options); })
        .filter(Boolean)
        .join('&');
};
/**
 * Remove a list of parameters from a querystring
 */
var omit = function (path, paramsToOmit, opts) {
    var options = makeOptions(opts);
    var searchPart = getSearch(path);
    if (searchPart === '') {
        return {
            querystring: '',
            removedParams: {}
        };
    }
    var _a = path.split('&').reduce(function (_a, chunk) {
        var left = _a[0], right = _a[1];
        var rawName = chunk.split('=')[0];
        var name = parseName(rawName).name;
        return paramsToOmit.indexOf(name) === -1
            ? [left.concat(chunk), right]
            : [left, right.concat(chunk)];
    }, [[], []]), kept = _a[0], removed = _a[1];
    return {
        querystring: kept.join('&'),
        removedParams: parse(removed.join('&'), options)
    };
};
/**
 * Remove a list of parameters from a querystring
 */
var keep = function (path, paramsToKeep, opts) {
    var options = makeOptions(opts);
    var searchPart = getSearch(path);
    if (searchPart === '') {
        return {
            keptParams: {},
            querystring: ''
        };
    }
    var _a = path.split('&').reduce(function (_a, chunk) {
        var left = _a[0], right = _a[1];
        var rawName = chunk.split('=')[0];
        var name = parseName(rawName).name;
        return paramsToKeep.indexOf(name) >= 0
            ? [left.concat(chunk), right]
            : [left, right.concat(chunk)];
    }, [[], []]), kept = _a[0], removed = _a[1];
    return {
        keptParams: parse(kept.join('&'), options),
        querystring: kept.join('&')
    };
};

exports.parse = parse;
exports.build = build;
exports.omit = omit;
exports.keep = keep;
});

unwrapExports(cjs);
var cjs_1 = cjs.parse;
var cjs_2 = cjs.build;
var cjs_3 = cjs.omit;
var cjs_4 = cjs.keep;

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var defaultOrConstrained = function (match) {
    return '(' +
        (match ? match.replace(/(^<|>$)/g, '') : "[a-zA-Z0-9-_.~%':|=+\\*@]+") +
        ')';
};
var rules = [
    {
        name: 'url-parameter',
        pattern: /^:([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(<(.+?)>)?/,
        regex: function (match) {
            return new RegExp(defaultOrConstrained(match[2]));
        }
    },
    {
        name: 'url-parameter-splat',
        pattern: /^\*([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})/,
        regex: /([^?]*)/
    },
    {
        name: 'url-parameter-matrix',
        pattern: /^;([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(<(.+?)>)?/,
        regex: function (match) {
            return new RegExp(';' + match[1] + '=' + defaultOrConstrained(match[2]));
        }
    },
    {
        name: 'query-parameter',
        pattern: /^(?:\?|&)(?::)?([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})/
    },
    {
        name: 'delimiter',
        pattern: /^(\/|\?)/,
        regex: function (match) { return new RegExp('\\' + match[0]); }
    },
    {
        name: 'sub-delimiter',
        pattern: /^(!|&|-|_|\.|;)/,
        regex: function (match) { return new RegExp(match[0]); }
    },
    {
        name: 'fragment',
        pattern: /^([0-9a-zA-Z]+)/,
        regex: function (match) { return new RegExp(match[0]); }
    }
];

var tokenise = function (str, tokens) {
    if (tokens === void 0) { tokens = []; }
    // Look for a matching rule
    var matched = rules.some(function (rule) {
        var match = str.match(rule.pattern);
        if (!match) {
            return false;
        }
        tokens.push({
            type: rule.name,
            match: match[0],
            val: match.slice(1, 2),
            otherVal: match.slice(2),
            regex: rule.regex instanceof Function ? rule.regex(match) : rule.regex
        });
        if (match[0].length < str.length) {
            tokens = tokenise(str.substr(match[0].length), tokens);
        }
        return true;
    });
    // If no rules matched, throw an error (possible malformed path)
    if (!matched) {
        throw new Error("Could not parse path '" + str + "'");
    }
    return tokens;
};

var identity = function (_) { return _; };
var exists = function (val) { return val !== undefined && val !== null; };
var optTrailingSlash = function (source, strictTrailingSlash) {
    if (strictTrailingSlash) {
        return source;
    }
    if (source === '\\/') {
        return source;
    }
    return source.replace(/\\\/$/, '') + '(?:\\/)?';
};
var upToDelimiter = function (source, delimiter) {
    if (!delimiter) {
        return source;
    }
    return /(\/)$/.test(source) ? source : source + '(\\/|\\?|\\.|;|$)';
};
var appendQueryParam = function (params, param, val) {
    if (val === void 0) { val = ''; }
    var existingVal = params[param];
    if (existingVal === undefined) {
        params[param] = val;
    }
    else {
        params[param] = Array.isArray(existingVal)
            ? existingVal.concat(val)
            : [existingVal, val];
    }
    return params;
};
var Path = /** @class */ (function () {
    function Path(path) {
        if (!path) {
            throw new Error('Missing path in Path constructor');
        }
        this.path = path;
        this.tokens = tokenise(path);
        this.hasUrlParams =
            this.tokens.filter(function (t) { return /^url-parameter/.test(t.type); }).length > 0;
        this.hasSpatParam =
            this.tokens.filter(function (t) { return /splat$/.test(t.type); }).length > 0;
        this.hasMatrixParams =
            this.tokens.filter(function (t) { return /matrix$/.test(t.type); }).length > 0;
        this.hasQueryParams =
            this.tokens.filter(function (t) { return /^query-parameter/.test(t.type); }).length > 0;
        // Extract named parameters from tokens
        this.spatParams = this.getParams('url-parameter-splat');
        this.urlParams = this.getParams(/^url-parameter/);
        // Query params
        this.queryParams = this.getParams('query-parameter');
        // All params
        this.params = this.urlParams.concat(this.queryParams);
        // Check if hasQueryParams
        // Regular expressions for url part only (full and partial match)
        this.source = this.tokens
            .filter(function (t) { return t.regex !== undefined; })
            .map(function (r) { return r.regex.source; })
            .join('');
    }
    Path.createPath = function (path) {
        return new Path(path);
    };
    Path.prototype.isQueryParam = function (name) {
        return this.queryParams.indexOf(name) !== -1;
    };
    Path.prototype.test = function (path, opts) {
        var _this = this;
        var options = __assign({ strictTrailingSlash: false, queryParams: {} }, opts);
        // trailingSlash: falsy => non optional, truthy => optional
        var source = optTrailingSlash(this.source, options.strictTrailingSlash);
        // Check if exact match
        var match = this.urlTest(path, source + (this.hasQueryParams ? '(\\?.*$|$)' : '$'), opts);
        // If no match, or no query params, no need to go further
        if (!match || !this.hasQueryParams) {
            return match;
        }
        // Extract query params
        var queryParams = cjs_1(path, options.queryParams);
        var unexpectedQueryParams = Object.keys(queryParams).filter(function (p) { return !_this.isQueryParam(p); });
        if (unexpectedQueryParams.length === 0) {
            // Extend url match
            Object.keys(queryParams).forEach(function (p) { return (match[p] = queryParams[p]); });
            return match;
        }
        return null;
    };
    Path.prototype.partialTest = function (path, opts) {
        var _this = this;
        var options = __assign({ delimited: true, queryParams: {} }, opts);
        // Check if partial match (start of given path matches regex)
        // trailingSlash: falsy => non optional, truthy => optional
        var source = upToDelimiter(this.source, options.delimited);
        var match = this.urlTest(path, source, options);
        if (!match) {
            return match;
        }
        if (!this.hasQueryParams) {
            return match;
        }
        var queryParams = cjs_1(path, options.queryParams);
        Object.keys(queryParams)
            .filter(function (p) { return _this.isQueryParam(p); })
            .forEach(function (p) { return appendQueryParam(match, p, queryParams[p]); });
        return match;
    };
    Path.prototype.build = function (params, opts) {
        var _this = this;
        if (params === void 0) { params = {}; }
        var options = __assign({ ignoreConstraints: false, ignoreSearch: false, queryParams: {} }, opts);
        var encodedUrlParams = Object.keys(params)
            .filter(function (p) { return !_this.isQueryParam(p); })
            .reduce(function (acc, key) {
            if (!exists(params[key])) {
                return acc;
            }
            var val = params[key];
            var encode = _this.isQueryParam(key) ? identity : encodeURI;
            if (typeof val === 'boolean') {
                acc[key] = val;
            }
            else if (Array.isArray(val)) {
                acc[key] = val.map(encode);
            }
            else {
                acc[key] = encode(val);
            }
            return acc;
        }, {});
        // Check all params are provided (not search parameters which are optional)
        if (this.urlParams.some(function (p) { return !exists(params[p]); })) {
            var missingParameters = this.urlParams.filter(function (p) { return !exists(params[p]); });
            throw new Error("Cannot build path: '" +
                this.path +
                "' requires missing parameters { " +
                missingParameters.join(', ') +
                ' }');
        }
        // Check constraints
        if (!options.ignoreConstraints) {
            var constraintsPassed = this.tokens
                .filter(function (t) {
                return /^url-parameter/.test(t.type) && !/-splat$/.test(t.type);
            })
                .every(function (t) {
                return new RegExp('^' + defaultOrConstrained(t.otherVal[0]) + '$').test(encodedUrlParams[t.val]);
            });
            if (!constraintsPassed) {
                throw new Error("Some parameters of '" + this.path + "' are of invalid format");
            }
        }
        var base = this.tokens
            .filter(function (t) { return /^query-parameter/.test(t.type) === false; })
            .map(function (t) {
            if (t.type === 'url-parameter-matrix') {
                return ";" + t.val + "=" + encodedUrlParams[t.val[0]];
            }
            return /^url-parameter/.test(t.type)
                ? encodedUrlParams[t.val[0]]
                : t.match;
        })
            .join('');
        if (options.ignoreSearch) {
            return base;
        }
        var searchParams = this.queryParams
            .filter(function (p) { return Object.keys(params).indexOf(p) !== -1; })
            .reduce(function (sparams, paramName) {
            sparams[paramName] = params[paramName];
            return sparams;
        }, {});
        var searchPart = cjs_2(searchParams, options.queryParams);
        return searchPart ? base + '?' + searchPart : base;
    };
    Path.prototype.getParams = function (type) {
        var predicate = type instanceof RegExp
            ? function (t) { return type.test(t.type); }
            : function (t) { return t.type === type; };
        return this.tokens.filter(predicate).map(function (t) { return t.val[0]; });
    };
    Path.prototype.urlTest = function (path, source, _a) {
        var _this = this;
        var _b = (_a === void 0 ? {} : _a).caseSensitive, caseSensitive = _b === void 0 ? false : _b;
        var regex = new RegExp('^' + source, caseSensitive ? '' : 'i');
        var match = path.match(regex);
        if (!match) {
            return null;
        }
        else if (!this.urlParams.length) {
            return {};
        }
        // Reduce named params to key-value pairs
        return match
            .slice(1, this.urlParams.length + 1)
            .reduce(function (params, m, i) {
            params[_this.urlParams[i]] = decodeURIComponent(m);
            return params;
        }, {});
    };
    return Path;
}());

// copied from https://github.com/remix/simple-deep-freeze
function deepFreeze(object) {
    if (Object.isFrozen(object)) {
        return object;
    }
    Object.freeze(object);
    // tslint:disable-next-line:only-arrow-functions
    Object.getOwnPropertyNames(object).forEach(function (prop) {
        if (object.hasOwnProperty(prop)
            && object[prop] !== null
            && (typeof object[prop] === "object" || typeof object[prop] === "function")
            && !Object.isFrozen(object[prop])) {
            deepFreeze(object[prop]);
        }
    });
    return object;
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * FRETS class is the main way to instantiate a new application and hang your models, actions, and state off it
 * @template T, U
 */
class FRETS {
    /**
     * @param  {T} modelProps A required initial instance of the application Props(Model)
     * @param  {U} actions A required instance of an actions class
     *  (which will be registered later with registerAction `App.actions.X = App.registerAction(fn)`)
     */
    constructor(modelProps, actions) {
        this.actions = actions;
        this.routes = {};
        this.cachedNode = h("div#default");
        this.allowAsyncRender = true;
        this.stateIsMutated = false;
        /**
         * The function used to render VNodes for insertion into the page DOM.
         * This method should be configured by calling FRETS.registerView(...)
         * @param  {string} id?
         */
        this.stateRenderer = (id = "default") => h(`div#${id}`, ["Default FRETS: assign a render method using `.registerView()`"]);
        /**
         * Sets up a render function for the app
         * @param  {(props:T,actions:U)=>VNode} renderFn
         */
        this.registerView = (renderFn) => {
            this.stateRenderer = () => h(`div#${this.rootId}`, [renderFn(this)]);
        };
        /**
         * Regisers a function that returns a promise of a VNode - this will be called and the UI
         * will be rerendered upon the resolution of that function. This allows for lazy loading
         * of UI modules that aren't needed right away.
         * @param  {(props:T,actions:U)=>Promise<VNode>} renderFn
         */
        this.registerViewAsync = (renderFn) => __awaiter(this, void 0, void 0, function* () {
            this.stateRenderer = () => {
                // console.log("Async state render function executing. allow async render: " + this.allowAsyncRender);
                if (this.allowAsyncRender) {
                    renderFn(this).then((n) => {
                        // at this point the lazy loading should be complete so let's invalidate the cache and render again once
                        this.cache.invalidate();
                        this.allowAsyncRender = false;
                        // console.log("loaded view code, scheduling render with new VNode");
                        this.cachedNode = n;
                        this.render(this.modelProps);
                    });
                }
                return h(`div#${this.rootId}`, [this.cachedNode]);
            };
        });
        /**
         * The Render function is useful for when an async promise resolves (like from a network request) - and you need
         *  to update the props and re-render the app with the new data.
         * @param  {Readonly<T>} props
         */
        this.render = (props, recalculate = true) => {
            // console.log("Render: checking the cache");
            this.cache.result([JSON.stringify(props)], () => {
                // console.log("Render: props have changed. ", JSON.stringify(this.mutableProps));
                if (!this.stateIsMutated || recalculate) {
                    this.mutate(props);
                }
                this.projector.scheduleRender();
                this.stateIsMutated = false;
                return props;
            });
        };
        /**
         * Mount the application to the DOM.
         * @param  {string} id The id of the dom element to replace
         */
        this.mountTo = (id) => {
            // console.log("Mount To");
            this.mutate(this.modelProps);
            this.projector.merge(document.getElementById(id), this.stateRenderer);
        };
        /**
         * Returns a function that accepts an action function, Wraps the action with our necessary hooks, and returns a
         * funtion compatible with the standard Maquette event handler signature.
         * @param  {(props:T)=>void} presenterFn A reference to the main FRETS render function for this instance.
         * @param  {T} data
         */
        this.makeActionStately = (presenterFn, data) => {
            // this function will return functions that can be used as actions in a view
            return (actionFn) => {
                return (e) => {
                    // since state has probably changed lets allow async rendering once
                    // console.log("event handled: action " + actionFn.name + " event.target = " + (e.target as HTMLElement).id);
                    this.allowAsyncRender = true;
                    const newData = actionFn(e, this.modelProps);
                    this.mutate(newData);
                    presenterFn(this.modelProps);
                };
            };
        };
        // the following methods should be overwritten by the Dev during setup, but its ok to work with these defaults
        /**
         * Check for any properties that are invalid or out of bounds and either reset them or add validation/warning messages
         *  somewhere on the props for display. Please make this function idempotent. Overwrite this with your own specifc
         *  implementation. It can return an updated state object containing validation error messages as well as returning
         *  false in the tuple to make mutation stop early and show errors to the user. The calculate method and route methods
         * will not be called when your validate method returns false in the second parameter of the return tuple.
         * @param  {Readonly<T>} newProps
         * @param  {Readonly<T>} oldProps
         */
        this.validator = (p, o) => [p, true];
        /**
         * The primary state calculation method, looks at all the properties and updates any derived values based on changes.
         * Please make this function idempotent. Overwrite this with your own specific implementation.
         * @param  {Readonly<T>} newProps
         * @param  {Readonly<T>} oldProps
         */
        this.calculator = (p, o) => p;
        const context = this;
        this.mutateProps(modelProps);
        this.projector = createProjector();
        this.cache = createCache();
        this.registerAction = this.makeActionStately(function stateUpdater(props) {
            context.render(props, false);
        }, this.modelProps);
        window.onpopstate = function (evt) {
            // console.log("PopState handler called", this.location.href);
            context.render(context.modelProps);
        };
    }
    /**
     * Get a deep-frozen copy of the current state. For immutability it's not a reference to the actual internal state.
     * @returns T
     */
    get modelProps() {
        return this.externalModelProps;
    }
    /**
     * Returns a path when given the key of a route that was previously registered.
     * @param  {string} key
     * @param  {any} data? A route data object
     * @returns string
     */
    getRouteLink(key, data) {
        if (!this.routes || !this.routes[key]) {
            return false;
        }
        return this.routes[key].spec.build(data || {});
    }
    /**
     * Change the browser location to match the path configured in the route with the
     * provided key. You still need to call an action to udpate state before the UI will re-render.
     * @param  {string} key
     * @param  {any} data?
     */
    navToRoute(key, data) {
        const r = this.getRouteLink(key, data);
        if (r) {
            this.navToPath(r);
        }
    }
    /**
     * Update the browser location with the provided raw string path.
     * @param  {string} path
     */
    navToPath(path) {
        try {
            window.history.pushState(this.mutateProps, "", path);
        }
        catch (error) {
            window.location.pathname = path;
        }
    }
    /**
     * Registers simple form fields on the property model, and on the actions to update it. If the field key hasn't been
     * registered yet, it initializes that value on the properties with the value passed in. This makes it so that UI
     * functions can register themselves on the props and the actions without the root app needing to know about it.
     * @param  {string} key
     * @param  {S} initialValue?
     * @returns IRegisteredField
     */
    registerField(key, initialValue) {
        if (!this.modelProps.registeredFieldsValues[key]) {
            const props = Object.assign({}, this.modelProps, { registeredFieldValidationErrors: Object.assign({
                    [key]: [],
                }, this.modelProps.registeredFieldValidationErrors), registeredFieldsValues: Object.assign({
                    [key]: initialValue || "",
                }, this.modelProps.registeredFieldsValues) });
            this.mutateProps(props);
        }
        if (!this.actions.registeredFieldActions[key]) {
            this.actions.registeredFieldActions[key] = this.registerAction((evt, data) => {
                const props = Object.assign({}, data, { registeredFieldsValues: Object.assign({}, data.registeredFieldsValues) });
                props.registeredFieldsValues[key] = evt.target.value;
                return props;
            });
        }
        return this.getField(key);
    }
    /**
     * Returns the field object that was previously registered with the given key.
     * Including an event handler that will update the field. Any validation errors on the field,
     * and whatever the current value is.
     * @param  {string} key
     * @returns IRegisteredField
     */
    getField(key) {
        return {
            handler: this.actions.registeredFieldActions[key],
            validationErrors: this.modelProps.registeredFieldValidationErrors[key],
            value: this.modelProps.registeredFieldsValues[key],
        };
    }
    /**
     * Register a new route that will execute the given function whenever the provided path
     *  is matched during the model mutation step. This function should update the app state
     * properties to reflect the status that is indicated by the given route. The keys are useful for
     * navigation methods that need to refer to a route programmatically later.
     * (see path-parser documentation at https://github.com/troch/path-parser).
     * @param  {string} routeName
     * @param  {string} path
     * @param  {(routeName:string,routeParams:any,props:T)=>T} fn
     */
    registerRoute(routeName, path, fn) {
        this.routes[routeName] = {
            calculator: fn,
            spec: new Path(path),
        };
    }
    // private get mutableProps(): T {
    //   return this.internalModelProps;
    // }
    mutateProps(v) {
        // console.log("Setting mutable props", v);
        // this.internalModelProps = JSON.parse(JSON.stringify(v));
        this.externalModelProps = deepFreeze(v);
    }
    /**
     * The one and only place that this application model state is updated, first it runs the validation method,
     * then it runs any route functions, and finally runs the real state calculation method.
     * @param  {Readonly<T>} props
     */
    mutate(props) {
        let isValid = true;
        let data = props;
        this.stateIsMutated = true;
        [data, isValid] = this.validator(data, this.modelProps);
        if (!isValid) {
            this.mutateProps(data);
            return;
        }
        data = this.applyRouteFunction(data);
        data = this.calculator(data, this.modelProps);
        this.mutateProps(data);
    }
    /**
     * Checks to see if any of the registerd routes are matched and then updates the app state using
     * the provided transformation function.
     * @param  {Readonly<T>} props
     * @returns T
     */
    applyRouteFunction(props) {
        let data = Object.assign({}, props); // is this necessary?
        for (const key in this.routes) {
            if (this.routes.hasOwnProperty(key)) {
                const entry = this.routes[key];
                const res = entry.spec.test(window.location.pathname);
                // console.log("Looking for Route", key, res);
                if (res) {
                    data = entry.calculator(key, res, data);
                    return data; // only apply the first route that matches for now
                }
            }
        }
        return data; // fall through to default
    }
}

class PropsWithFields {
    constructor() {
        this.registeredFieldsValues = {};
        this.registeredFieldValidationErrors = {};
    }
}

class ActionsWithFields {
    constructor() {
        this.registeredFieldActions = {};
    }
}

export { FRETS, PropsWithFields, ActionsWithFields };
//# sourceMappingURL=frets.js.map