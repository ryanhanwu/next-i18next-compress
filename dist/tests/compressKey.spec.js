"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compressKey_1 = require("../src/compressKey");
describe('compressKey', () => {
    test('compresses the key', () => {
        expect((0, compressKey_1.compressKey)('Email address', 6)).toEqual('f2488f');
        expect((0, compressKey_1.compressKey)('Sign up <1>here</1>', 6)).toEqual('6e4c86');
    });
});
//# sourceMappingURL=compressKey.spec.js.map