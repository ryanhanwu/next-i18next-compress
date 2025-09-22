"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const options_1 = require("../src/options");
describe('mergeDefaultOptions', () => {
    test('returns the default options', () => {
        expect((0, options_1.mergeDefaultOptions)()).toMatchSnapshot();
    });
    test('returns the custom options', () => {
        expect((0, options_1.mergeDefaultOptions)({ hashLength: 16 })).toMatchSnapshot();
    });
    test('throws an error on hashLength misconfiguration', () => {
        expect(() => (0, options_1.mergeDefaultOptions)({ hashLength: 2 })).toThrowErrorMatchingSnapshot();
        expect(() => (0, options_1.mergeDefaultOptions)({ hashLength: 1000 })).toThrowErrorMatchingSnapshot();
    });
});
//# sourceMappingURL=options.spec.js.map