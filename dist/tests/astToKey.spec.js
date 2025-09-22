"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const plugin_syntax_jsx_1 = __importDefault(require("@babel/plugin-syntax-jsx"));
const astToKey_1 = require("../src/astToKey");
function astToKeyFromCode(code) {
    let key;
    function fakePlugin(babel) {
        const t = babel.types;
        return {
            visitor: {
                CallExpression(path) {
                    if (!t.isIdentifier(path.node.callee, { name: 't' }))
                        return;
                    key = (0, astToKey_1.astToKey)([path.node.arguments[0]], { code });
                },
                JSXElement(path) {
                    if (!t.isJSXIdentifier(path.node.openingElement.name, { name: 'Trans' }))
                        return;
                    key = (0, astToKey_1.astToKey)(path.node.children, { code, jsx: true });
                },
            },
        };
    }
    (0, core_1.transformSync)(code, {
        plugins: [plugin_syntax_jsx_1.default, fakePlugin],
        filename: 'client/src/test.jsx',
        cwd: '/tests/',
    });
    return key;
}
describe('astToKey (functional)', () => {
    test('handles basic text', () => {
        const key = astToKeyFromCode(`
      t('Sign in to your account')
    `);
        expect(key).toEqual('Sign in to your account');
    });
    test('handles template literal', () => {
        const key = astToKeyFromCode(`
      t(\`Sign in to your account\`)
    `);
        expect(key).toEqual('Sign in to your account');
    });
    test('handles interpolated variable', () => {
        const key = astToKeyFromCode(`
      const name = 'Sam'
      t(\`Happy birthday, {{name}}!\`, { name })
    `);
        expect(key).toEqual('Happy birthday, {{name}}!');
    });
    test('handles multiple interpolated variables', () => {
        const key = astToKeyFromCode(`
      t(\`Big thanks to {{a}} and {{ b }}.\`)
    `);
        expect(key).toEqual('Big thanks to {{a}} and {{ b }}.');
    });
});
describe('astToKey (JSX)', () => {
    test('handles basic text', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        Sign in to your account
      </Trans>
    `);
        expect(key).toEqual('Sign in to your account');
    });
    test('handles basic text and a comment', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        Sign in to your account
        {/* but with a hidden comment */}
      </Trans>
    `);
        expect(key).toEqual('Sign in to your account');
    });
    test('handles basic text and explicit whitespace', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        Sign in to{'  '}your account{' '}
      </Trans>
    `);
        expect(key).toEqual('Sign in to  your account ');
    });
    test('handles basic text and stripped whitespace', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        Lorem ipsum dolor sit amet,
        consectetur adipiscing elit.
      </Trans>
    `);
        expect(key).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    });
    test('handles interpolated component', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        Or <NextLink href='/register'>start your 30-day free trial</NextLink>
      </Trans>
    `);
        expect(key).toEqual('Or <1>start your 30-day free trial</1>');
    });
    test('handles multiple interpolated components', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        You have read and acknowledge the{' '}
        <Link>Terms of Service</Link> and <Link>Privacy Notice</Link>.
      </Trans>
    `);
        expect(key).toEqual('You have read and acknowledge the <2>Terms of Service</2> and <4>Privacy Notice</4>.');
    });
    test('handles self-closing interpolated component', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        <Iceberg /> There's something in the water.
      </Trans>
    `);
        expect(key).toEqual("<0></0> There's something in the water.");
    });
    test('handles interpolated variable', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>Happy birthday, {{name}}!</Trans>
    `);
        expect(key).toEqual('Happy birthday, {{name}}!');
    });
    test('handles multiple interpolated variables', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>Big thanks to {{a}} and {{ b }}.</Trans>
    `);
        expect(key).toEqual('Big thanks to {{a}} and {{ b }}.');
    });
    test('handles interpolated variable inside of an interpolated component', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>Happy birthday, <Bold>birthday person {{name}}</Bold>!</Trans>
    `);
        expect(key).toEqual('Happy birthday, <1>birthday person {{name}}</1>!');
    });
    test('(regression) correctly handles whitespace for trailing string literals', () => {
        const key = astToKeyFromCode(`
      <Trans t={t}>
        We did not recognize your email and/or password. Please try again or{' '}
        <a href='/sign-in/request-reset-password'>
          recover your password
        </a>
        .
      </Trans>
    `);
        expect(key).toEqual('We did not recognize your email and/or password. Please try again or <2>recover your password</2>.');
    });
    test('errors on interpolated expression', () => {
        expect(() => astToKeyFromCode(`
        <Trans t={t}>They do travel in herds: {array.join(', ')}</Trans>
      `)).toThrowErrorMatchingSnapshot();
    });
    test('errors on spread children', () => {
        expect(() => astToKeyFromCode(`
        <Trans>Foo {...variable}</Trans>
      `)).toThrowErrorMatchingSnapshot();
    });
    test('errors on fragment', () => {
        expect(() => astToKeyFromCode(`
        <Trans>Foo <>bar</></Trans>
      `)).toThrowErrorMatchingSnapshot();
    });
    test('errors on unknown AST type', () => {
        expect(() => (0, astToKey_1.astToKey)([{ type: 'Foobar' }], {})).toThrowErrorMatchingSnapshot();
    });
});
//# sourceMappingURL=astToKey.spec.js.map