"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDefaultOptions = mergeDefaultOptions;
function mergeDefaultOptions(pOptions = {}) {
    if (pOptions.hashLength && (pOptions.hashLength < 4 || pOptions.hashLength > 64)) {
        const message = '[next-i18next-compress] Misconfiguration: ' +
            'The "hashLength" option has to be between 4 and 64.';
        throw new Error(message);
    }
    return {
        hashLength: pOptions.hashLength || 6,
    };
}
//# sourceMappingURL=options.js.map