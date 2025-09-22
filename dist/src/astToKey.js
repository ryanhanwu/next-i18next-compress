"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedAstTypeError = void 0;
exports.astToKey = astToKey;
const safe_1 = __importDefault(require("colors/safe"));
function astToKey(ast, options) {
    let key = '';
    ast = ast.filter((astNode) => {
        if (astNode.type === 'JSXText' && astNode.value.trim() === '')
            return false;
        return true;
    });
    for (let i = 0; i !== ast.length; i++) {
        const astNode = ast[i];
        if (astNode.type === 'StringLiteral') {
            key += astNode.value;
            continue;
        }
        if (astNode.type === 'TemplateLiteral') {
            key += astToKey([...astNode.expressions, ...astNode.quasis], options);
            continue;
        }
        if (astNode.type === 'TemplateElement') {
            key += astNode.value.raw;
            continue;
        }
        if (astNode.type === 'JSXText') {
            let value = astNode.value;
            value = value.replace(/^\n */g, '').replace(/\n *$/g, '');
            value = value.replace(/\n */g, ' ');
            key += value;
            continue;
        }
        if (options.jsx && astNode.type === 'JSXElement') {
            const childNodesKey = astToKey(astNode.children, options);
            key += `<${i}>${childNodesKey}</${i}>`;
            continue;
        }
        if (astNode.type === 'JSXExpressionContainer') {
            key += astToKey([astNode.expression], options);
            continue;
        }
        if (astNode.type === 'JSXEmptyExpression') {
            continue;
        }
        if (options.jsx && astNode.type === 'ObjectExpression') {
            if (!astNode.start || !astNode.end) {
                throw new Error('Start or end of a AST node are missing, please file a bug report!');
            }
            const astNodeCode = options.code.slice(astNode.start, astNode.end);
            key += `{${astNodeCode}}`;
            continue;
        }
        throw new UnsupportedAstTypeError(astNode, options.code);
    }
    return key;
}
class UnsupportedAstTypeError extends Error {
    constructor(astNode, code) {
        let message = '[next-i18next-compress] Unsupported AST type: ' +
            `We do not know how to handle "${astNode.type}"`;
        if (code && astNode.start && astNode.end) {
            const codeRange = printCodeRange(code, astNode.start, astNode.end, 30);
            message += ` in this part of your code:\n${codeRange}`;
        }
        else {
            message += '.';
        }
        super(message);
    }
}
exports.UnsupportedAstTypeError = UnsupportedAstTypeError;
function printCodeRange(code, start, end, padding) {
    const slicedStartPadding = code.slice(Math.max(0, start - padding), start);
    const slicedCode = code.slice(start, end);
    const slicedEndPadding = code.slice(end, Math.min(code.length, end + padding));
    const format = process.env.NODE_ENV === 'test' ? (x) => x : safe_1.default.red;
    return slicedStartPadding + format(slicedCode) + slicedEndPadding;
}
//# sourceMappingURL=astToKey.js.map