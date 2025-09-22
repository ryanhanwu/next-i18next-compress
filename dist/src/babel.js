"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nextI18nextCompressBabelPlugin;
const astToKey_1 = require("./astToKey");
const compressKey_1 = require("./compressKey");
const options_1 = require("./options");
const processedNodes = new Set();
function nextI18nextCompressBabelPlugin(babel) {
    const t = babel.types;
    return {
        name: 'next-i18next-compress',
        visitor: {
            CallExpression(path, _state) {
                const state = _state;
                if (process.env.NODE_ENV === 'development') {
                    return;
                }
                if (state.file.opts.filename && state.file.opts.filename.includes('/node_modules/')) {
                    return;
                }
                const options = (0, options_1.mergeDefaultOptions)(state.opts);
                if (processedNodes.has(path.node))
                    return;
                if (!t.isIdentifier(path.node.callee, { name: 't' }))
                    return;
                if (path.node.arguments.length === 0)
                    return;
                const key = (0, astToKey_1.astToKey)([path.node.arguments[0]], {
                    code: state.file.code,
                });
                path.node.arguments[0] = t.stringLiteral((0, compressKey_1.compressKey)(key, options.hashLength));
                processedNodes.add(path.node);
            },
            JSXElement(path, _state) {
                const state = _state;
                if (process.env.NODE_ENV === 'development') {
                    return;
                }
                if (state.file.opts.filename && state.file.opts.filename.includes('/node_modules/')) {
                    return;
                }
                const options = (0, options_1.mergeDefaultOptions)(state.opts);
                if (processedNodes.has(path.node))
                    return;
                if (!t.isJSXIdentifier(path.node.openingElement.name, { name: 'Trans' }))
                    return;
                const elementMixedAttributes = path.node.openingElement.attributes;
                const spreadAttribute = elementMixedAttributes.find((x) => x.type === 'JSXSpreadAttribute');
                if (spreadAttribute) {
                    throw new astToKey_1.UnsupportedAstTypeError(spreadAttribute, state.file.code);
                }
                const elementJsxAttributes = elementMixedAttributes;
                let i18nKeyAttributeValue;
                const i18nKeyAttribute = elementJsxAttributes.find((x) => x.name.name === 'i18nKey');
                if (i18nKeyAttribute && i18nKeyAttribute.value) {
                    i18nKeyAttributeValue = (0, astToKey_1.astToKey)([i18nKeyAttribute.value], {
                        code: state.file.code,
                    });
                }
                const childrenKey = (0, astToKey_1.astToKey)(path.node.children, {
                    code: state.file.code,
                    jsx: true,
                });
                const key = (i18nKeyAttributeValue || childrenKey);
                path.node.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('i18nKey'), t.stringLiteral((0, compressKey_1.compressKey)(key, options.hashLength))));
                const canTurnIntoSelfClosing = path.node.children.every((childNode) => childNode.type === 'JSXText');
                if (canTurnIntoSelfClosing) {
                    path.node.children = [];
                    delete path.node.closingElement;
                    path.node.openingElement.selfClosing = true;
                }
                else {
                    compressChildTextNodes(path.node.children);
                }
                processedNodes.add(path.node);
            },
        },
    };
}
function compressChildTextNodes(children) {
    for (let i = 0; i !== children.length; i++) {
        const child = children[i];
        if (child.type === 'JSXElement') {
            compressChildTextNodes(child.children);
            continue;
        }
        if (child.type === 'JSXText' && child.value.trim() !== '') {
            child.value = '~';
            continue;
        }
    }
}
//# sourceMappingURL=babel.js.map