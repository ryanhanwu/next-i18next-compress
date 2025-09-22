"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressKey = compressKey;
const crypto_1 = __importDefault(require("crypto"));
function compressKey(string, hashLength) {
    string = string.replace(/\{\{\s*([^}]*?)\s*\}\}/g, '{{$1}}');
    return crypto_1.default.createHash('sha256').update(string).digest('hex').slice(0, hashLength);
}
//# sourceMappingURL=compressKey.js.map