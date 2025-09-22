import * as BabelTypes from '@babel/types';
export type AbstractSyntaxTree = Array<BabelTypes.Expression | BabelTypes.SpreadElement | BabelTypes.JSXNamespacedName | BabelTypes.ArgumentPlaceholder | BabelTypes.TemplateElement | BabelTypes.TSType | BabelTypes.JSXText | BabelTypes.JSXExpressionContainer | BabelTypes.JSXSpreadChild | BabelTypes.JSXElement | BabelTypes.JSXFragment | BabelTypes.JSXEmptyExpression>;
export interface AstToKeyOptions {
    code: string;
    jsx?: boolean;
}
export declare function astToKey(ast: AbstractSyntaxTree, options: AstToKeyOptions): string;
export declare class UnsupportedAstTypeError extends Error {
    constructor(astNode: {
        type: string;
        start?: number | null;
        end?: number | null;
    }, code: string);
}
