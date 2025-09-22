"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const plugin_syntax_jsx_1 = __importDefault(require("@babel/plugin-syntax-jsx"));
const babel_1 = __importDefault(require("../src/babel"));
function transform(input, options, babelOptions) {
    const output = (0, core_1.transformSync)(input, {
        plugins: [plugin_syntax_jsx_1.default, options ? [babel_1.default, options] : [babel_1.default]],
        filename: 'client/src/test.jsx',
        cwd: '/tests/',
        ...babelOptions,
    });
    return output?.code;
}
describe('babel', () => {
    describe('`t` function', () => {
        test('correctly compresses the string literal argument as the key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the template string argument as the key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(\`Email address\`)} />
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the interpolated variable argument as the key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const name = 'Sam'
          return <Input label={t(\`Happy birthday, {{name}}!\`, { name })} />
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('can configure the length of the compressed key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `;
            expect(transform(input, { hashLength: 16 })).toMatchSnapshot();
        });
        test('ignores function calls with no arguments', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t()} />
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('errors for function calls with a variable as the argument', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const variable = 'Email address'
          return <Input label={t(variable)} />
        }
      `;
            expect(() => transform(input)).toThrowErrorMatchingSnapshot();
        });
        test('errors for function calls with a member expression as the argument', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(foo.bar)} />
        }
      `;
            expect(() => transform(input)).toThrowErrorMatchingSnapshot();
        });
    });
    describe('`<Trans>` component', () => {
        test('correctly compresses the child text node as the key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>Forgot password</Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the string literal i18nKey attribute as the key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password'>
                This child text node should be completely ignored.
              </Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the string literal i18nKey attribute as the key without child nodes', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password' />
              <Trans t={t} i18nKey='Forgot password'></Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the template string i18nKey attribute as the key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey={\`Forgot password\`}>
                This child text node should be completely ignored.
              </Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('can configure the length of the compressed key', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>Forgot password</Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input, { hashLength: 16 })).toMatchSnapshot();
        });
        test('correctly compresses the interpolated React component (overarching)', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}><Link>Forgot password</Link></Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the interpolated React component (inline)', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                Forgot <Link>password</Link>
              </Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the interpolated React component (self-closing)', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                <Link/> Forgot password
              </Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the string literal i18nKey attribute as the key with interpolated child nodes', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey='Forgot password'>
                Forgot <Link>password</Link>
              </Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('correctly compresses the interpolated variable', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const name = 'Sam'
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t}>
                Happy birthday, {{ name }}!
              </Trans>
            </Headline>
          )
        }
      `;
            expect(transform(input)).toMatchSnapshot();
        });
        test('errors for components with variable spreads', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const variable = { i18nKey: 'Forgot password' }
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} {...variable} />
            </Headline>
          )
        }
      `;
            expect(() => transform(input)).toThrowErrorMatchingSnapshot();
        });
        test('errors for components with a variable as the i18nKey attribute', () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const variable = 'Forgot password'
          return (
            <Headline as='h1' size='xl' textAlign='center'>
              <Trans t={t} i18nKey={variable} />
            </Headline>
          )
        }
      `;
            expect(() => transform(input)).toThrowErrorMatchingSnapshot();
        });
    });
    test('does nothing if the file is in node_modules', () => {
        const input = `
      export function ReactComponent() {
        const { t } = useTranslation('namespace')
        return (
          <Box>
            <Input label={t('Email address')} />
            <Trans t={t}>Forgot password</Trans>
          </Box>
        )
      }
    `;
        expect(transform(input, undefined, { filename: 'client/node_modules/lodash/index.js' })).toMatchSnapshot();
    });
    test('does nothing if running in development', () => {
        process.env.NODE_ENV = 'development';
        const input = `
      export function ReactComponent() {
        const { t } = useTranslation('namespace')
        return (
          <Box>
            <Input label={t('Email address')} />
            <Trans t={t}>Forgot password</Trans>
          </Box>
        )
      }
    `;
        expect(transform(input)).toMatchSnapshot();
    });
});
//# sourceMappingURL=babel.spec.js.map