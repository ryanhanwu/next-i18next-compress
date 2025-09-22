"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCode = transformCode;
const swc = __importStar(require("@swc/core"));
const compressKey_1 = require("./compressKey");
const options_1 = require("./options");
const astToKey_1 = require("./astToKey");
const processedNodes = new Set();
async function transformCode(code, options = {}) {
    if (process.env.NODE_ENV === 'development') {
        return code;
    }
    if (options.filename && options.filename.includes('/node_modules/')) {
        return code;
    }
    const mergedOptions = (0, options_1.mergeDefaultOptions)(options);
    try {
        processedNodes.clear();
        const ast = await swc.parse(code, {
            syntax: 'typescript',
            tsx: true,
            decorators: false,
            dynamicImport: false,
        });
        const transformedAst = transformAst(ast, code, mergedOptions);
        const result = await swc.print(transformedAst);
        return result.code;
    }
    catch (error) {
        if (error instanceof astToKey_1.UnsupportedAstTypeError) {
            throw error;
        }
        console.warn('SWC transformation failed:', error);
        return code;
    }
}
function transformAst(ast, sourceCode, options) {
    function visitNode(node) {
        if (!node || typeof node !== 'object') {
            return node;
        }
        if (node.type === 'CallExpression') {
            node = visitCallExpression(node, sourceCode, options);
        }
        if (node.type === 'JSXElement') {
            node = visitJSXElement(node, sourceCode, options);
        }
        for (const key in node) {
            if (node.hasOwnProperty(key) && node[key] !== null && typeof node[key] === 'object') {
                if (Array.isArray(node[key])) {
                    node[key] = node[key].map(visitNode);
                }
                else {
                    node[key] = visitNode(node[key]);
                }
            }
        }
        return node;
    }
    return visitNode(ast);
}
function isSimpleTranslatablePattern(node) {
    if (!node)
        return false;
    const supportedTypes = [
        'StringLiteral',
        'TemplateLiteral',
        'JSXText',
        'JSXElement',
        'JSXExpressionContainer'
    ];
    const unsupportedTypes = [
        'Identifier',
        'MemberExpression',
        'ConditionalExpression',
        'CallExpression',
        'BinaryExpression',
        'ArrayExpression',
        'ObjectExpression'
    ];
    if (unsupportedTypes.includes(node.type)) {
        return false;
    }
    return supportedTypes.includes(node.type);
}
function visitCallExpression(node, sourceCode, options) {
    if (processedNodes.has(node)) {
        return node;
    }
    if (!node.callee ||
        node.callee.type !== 'Identifier' ||
        node.callee.value !== 't' ||
        !node.arguments ||
        node.arguments.length === 0) {
        return node;
    }
    try {
        const firstArg = node.arguments[0];
        if (!firstArg || !firstArg.expression) {
            return node;
        }
        const babelAstNode = convertSwcToBabelAst(firstArg.expression);
        if (!isSimpleTranslatablePattern(babelAstNode)) {
            return node;
        }
        if (babelAstNode.type === 'Identifier') {
            return node;
        }
        const key = (0, astToKey_1.astToKey)([babelAstNode], {
            code: sourceCode,
        });
        const compressedKey = (0, compressKey_1.compressKey)(key, options.hashLength);
        node.arguments[0] = {
            spread: null,
            expression: {
                type: 'StringLiteral',
                value: compressedKey,
                span: firstArg.expression.span || { start: 0, end: 0, ctxt: 0 },
            },
        };
        processedNodes.add(node);
    }
    catch (error) {
        if (error instanceof astToKey_1.UnsupportedAstTypeError && process.env.NODE_ENV === 'test') {
            throw error;
        }
        return node;
    }
    return node;
}
function visitJSXElement(node, sourceCode, options) {
    if (processedNodes.has(node)) {
        return node;
    }
    if (!node.opening ||
        !node.opening.name ||
        node.opening.name.type !== 'Identifier' ||
        node.opening.name.value !== 'Trans') {
        return node;
    }
    try {
        const spreadAttribute = node.opening.attributes?.find((x) => x.type === 'SpreadElement');
        if (spreadAttribute) {
            throw new astToKey_1.UnsupportedAstTypeError(spreadAttribute, sourceCode);
        }
        let i18nKeyAttributeValue;
        const i18nKeyAttribute = node.opening.attributes?.find((x) => x.type === 'JSXAttribute' && x.name?.type === 'Identifier' && x.name?.value === 'i18nKey');
        if (i18nKeyAttribute && i18nKeyAttribute.value) {
            const babelAstNode = convertSwcToBabelAst(i18nKeyAttribute.value);
            i18nKeyAttributeValue = (0, astToKey_1.astToKey)([babelAstNode], {
                code: sourceCode,
            });
        }
        let childrenKey = '';
        if (node.children && node.children.length > 0) {
            const babelAstNodes = node.children.map((child) => convertSwcToBabelAst(child));
            const hasComplexChildren = babelAstNodes.some((child) => child && !isSimpleTranslatablePattern(child) && child.type !== 'JSXText');
            if (hasComplexChildren) {
                return node;
            }
            childrenKey = (0, astToKey_1.astToKey)(babelAstNodes, {
                code: sourceCode,
                jsx: true,
            });
        }
        const key = i18nKeyAttributeValue || childrenKey;
        const compressedKey = (0, compressKey_1.compressKey)(key, options.hashLength);
        const i18nKeyAttr = {
            type: 'JSXAttribute',
            name: {
                type: 'Identifier',
                value: 'i18nKey',
                optional: false,
                span: { start: 0, end: 0, ctxt: 0 },
            },
            value: {
                type: 'StringLiteral',
                value: compressedKey,
                span: { start: 0, end: 0, ctxt: 0 },
            },
            span: { start: 0, end: 0, ctxt: 0 },
        };
        if (!node.opening.attributes) {
            node.opening.attributes = [];
        }
        node.opening.attributes = node.opening.attributes.filter((attr) => !(attr.type === 'JSXAttribute' &&
            attr.name?.type === 'Identifier' &&
            attr.name?.value === 'i18nKey'));
        node.opening.attributes.push(i18nKeyAttr);
        const canTurnIntoSelfClosing = node.children?.every((childNode) => childNode.type === 'JSXText');
        if (canTurnIntoSelfClosing) {
            node.children = [];
            node.closing = undefined;
            node.opening.selfClosing = true;
        }
        else {
            compressChildTextNodes(node.children || []);
        }
        processedNodes.add(node);
    }
    catch (error) {
        if (error instanceof astToKey_1.UnsupportedAstTypeError && process.env.NODE_ENV === 'test') {
            throw error;
        }
        return node;
    }
    return node;
}
function compressChildTextNodes(children) {
    for (let i = 0; i !== children.length; i++) {
        const child = children[i];
        if (child.type === 'JSXElement') {
            compressChildTextNodes(child.children || []);
            continue;
        }
        if (child.type === 'JSXText' && child.value?.trim() !== '') {
            child.value = '~';
            continue;
        }
    }
}
function convertSwcToBabelAst(node) {
    if (!node)
        return node;
    switch (node.type) {
        case 'StringLiteral':
            return {
                type: 'StringLiteral',
                value: node.value,
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'TemplateLiteral':
            return {
                type: 'TemplateLiteral',
                quasis: node.quasis?.map((quasi) => ({
                    type: 'TemplateElement',
                    value: {
                        raw: quasi.raw,
                        cooked: quasi.cooked,
                    },
                    tail: quasi.tail,
                })),
                expressions: node.expressions?.map((expr) => convertSwcToBabelAst(expr)),
            };
        case 'Identifier':
            return {
                type: 'Identifier',
                name: node.value || node.sym,
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'JSXText':
            return {
                type: 'JSXText',
                value: node.value,
            };
        case 'JSXElement':
            return {
                type: 'JSXElement',
                openingElement: {
                    type: 'JSXOpeningElement',
                    name: convertSwcToBabelAst(node.opening?.name),
                    attributes: node.opening?.attributes?.map((attr) => convertSwcToBabelAst(attr)),
                    selfClosing: node.opening?.selfClosing,
                },
                closingElement: node.closing
                    ? {
                        type: 'JSXClosingElement',
                        name: convertSwcToBabelAst(node.closing.name),
                    }
                    : null,
                children: node.children?.map((child) => convertSwcToBabelAst(child)),
            };
        case 'JSXExpressionContainer':
            return {
                type: 'JSXExpressionContainer',
                expression: convertSwcToBabelAst(node.expression),
            };
        case 'JSXAttribute':
            return {
                type: 'JSXAttribute',
                name: convertSwcToBabelAst(node.name),
                value: node.value ? convertSwcToBabelAst(node.value) : null,
            };
        case 'BinaryExpression':
            return {
                type: 'BinaryExpression',
                left: convertSwcToBabelAst(node.left),
                operator: node.op,
                right: convertSwcToBabelAst(node.right),
            };
        case 'MemberExpression':
            return {
                type: 'MemberExpression',
                object: convertSwcToBabelAst(node.object),
                property: convertSwcToBabelAst(node.property),
                computed: node.computed,
            };
        case 'CallExpression':
            return {
                type: 'CallExpression',
                callee: convertSwcToBabelAst(node.callee),
                arguments: node.arguments?.map((arg) => convertSwcToBabelAst(arg.expression || arg)),
            };
        case 'NumericLiteral':
        case 'NumberLiteral':
            return {
                type: 'NumericLiteral',
                value: node.value,
            };
        case 'BooleanLiteral':
            return {
                type: 'BooleanLiteral',
                value: node.value,
            };
        case 'NullLiteral':
            return {
                type: 'NullLiteral',
            };
        case 'ObjectExpression':
            return {
                type: 'ObjectExpression',
                properties: node.properties?.map((prop) => convertSwcToBabelAst(prop)),
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'ObjectProperty':
        case 'Property':
            return {
                type: 'ObjectProperty',
                key: convertSwcToBabelAst(node.key),
                value: convertSwcToBabelAst(node.value),
                computed: node.computed,
                shorthand: node.shorthand,
            };
        case 'ConditionalExpression':
            return {
                type: 'ConditionalExpression',
                test: convertSwcToBabelAst(node.test),
                consequent: convertSwcToBabelAst(node.consequent),
                alternate: convertSwcToBabelAst(node.alternate),
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'ArrayExpression':
            return {
                type: 'ArrayExpression',
                elements: node.elements?.map((elem) => elem ? convertSwcToBabelAst(elem) : null),
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'ThisExpression':
            return {
                type: 'ThisExpression',
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'UpdateExpression':
            return {
                type: 'UpdateExpression',
                operator: node.op,
                argument: convertSwcToBabelAst(node.arg),
                prefix: node.prefix,
                start: node.span?.start,
                end: node.span?.end,
            };
        case 'UnaryExpression':
            return {
                type: 'UnaryExpression',
                operator: node.op,
                argument: convertSwcToBabelAst(node.arg),
                prefix: true,
                start: node.span?.start,
                end: node.span?.end,
            };
        default:
            const commonUnsupportedTypes = [
                'ArrowFunctionExpression',
                'FunctionExpression',
                'AssignmentExpression',
                'ConditionalExpression',
                'LogicalExpression',
                'SequenceExpression',
                'NewExpression',
                'AwaitExpression',
                'YieldExpression',
                'SpreadElement',
                'RestElement',
                'AssignmentPattern',
                'VariableDeclarator',
                'ImportDeclaration',
                'ExportDeclaration'
            ];
            if (!commonUnsupportedTypes.includes(node.type)) {
                console.warn(`Unhandled SWC AST node type: ${node.type}`);
            }
            return {
                type: node.type,
                start: node.span?.start,
                end: node.span?.end,
                ...node,
            };
    }
}
//# sourceMappingURL=swc.js.map