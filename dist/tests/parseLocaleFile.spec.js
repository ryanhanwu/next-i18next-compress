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
const compressKeyModule = __importStar(require("../src/compressKey"));
const parseLocaleFile_1 = require("../src/parseLocaleFile");
jest.mock('../src/compressKey');
const mockCompressKey = jest
    .mocked(compressKeyModule.compressKey)
    .mockImplementation(jest.requireActual('../src/compressKey').compressKey);
const localeFileString = JSON.stringify({
    'Email address': 'E-Mail Adresse',
    'Forgot password': 'Passwort vergessen',
    'Or <1>start your 30-day free trial</1>': 'Oder <1>beginne deine 30-Tage kostenlose Probephase</1>',
    'Your sign in credentials were incorrect.': 'Deine Anmeldedaten waren inkorrekt.',
    'Happy birthday, {{name}}!': 'Alles Gute zum Geburtstag, {{name}}!',
});
describe('parseLocaleFile', () => {
    test('correctly compresses the keys of the locale file', () => {
        expect((0, parseLocaleFile_1.parseLocaleFile)(localeFileString)).toMatchSnapshot();
    });
    test('can configure the length of the compressed key', () => {
        expect((0, parseLocaleFile_1.parseLocaleFile)(localeFileString, { hashLength: 16 })).toMatchSnapshot();
    });
    test('throws an error if there are any compression collisions', () => {
        mockCompressKey.mockImplementation(() => 'foobar');
        expect(() => (0, parseLocaleFile_1.parseLocaleFile)(localeFileString)).toThrowErrorMatchingSnapshot();
    });
    test('does nothing if running in development', () => {
        process.env.NODE_ENV = 'development';
        expect((0, parseLocaleFile_1.parseLocaleFile)(localeFileString)).toEqual(JSON.parse(localeFileString));
    });
});
//# sourceMappingURL=parseLocaleFile.spec.js.map