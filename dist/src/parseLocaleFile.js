"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocaleFile = parseLocaleFile;
const compressKey_1 = require("./compressKey");
const options_1 = require("./options");
function parseLocaleFile(string, pOptions) {
    const options = (0, options_1.mergeDefaultOptions)(pOptions);
    const json = JSON.parse(string);
    if (process.env.NODE_ENV === 'development') {
        return json;
    }
    const compressedKeys = {};
    const compressedJson = {};
    Object.keys(json).forEach((key) => {
        const compressedKey = (0, compressKey_1.compressKey)(key, options.hashLength);
        if (compressedKeys[compressedKey]) {
            const message = '[next-i18next-compress] Compression collision: ' +
                `"${compressedKeys[compressedKey]}" and "${key}" compress to the same hash "${compressedKey}".` +
                'Try increasing the "hashLength" option or splitting your locale file into multiple namespaces.';
            throw new Error(message);
        }
        compressedKeys[compressedKey] = key;
        compressedJson[compressedKey] = json[key];
    });
    return compressedJson;
}
//# sourceMappingURL=parseLocaleFile.js.map