import { Visitor } from '@babel/traverse';
import * as BabelTypes from '@babel/types';
export interface Babel {
    types: typeof BabelTypes;
}
export default function nextI18nextCompressBabelPlugin(babel: Babel): {
    name: string;
    visitor: Visitor;
};
