"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swc_1 = require("../src/swc");
async function transform(input, options, filename) {
    return await (0, swc_1.transformCode)(input, { ...options, filename });
}
describe('swc', () => {
    describe('`t` function', () => {
        test('correctly compresses the string literal argument as the key', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the template string argument as the key', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(\`Email address\`)} />
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the interpolated variable argument as the key', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          const name = 'Sam'
          return <Input label={t(\`Happy birthday, {{name}}!\`, { name })} />
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the interpolated template string argument as the key', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t(\`Hello {{name}}!\`)} />
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses multiple t() calls', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return (
            <div>
              <Input label={t('Email address')} />
              <Input label={t('Password')} />
            </div>
          )
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('does not compress t() calls without arguments', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t()} />
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('does not compress non-t function calls', async () => {
            const input = `
        export function ReactComponent() {
          const translate = (key) => key
          return <Input label={translate('Email address')} />
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly handles custom hash length', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Input label={t('Email address')} />
        }
      `;
            const result = await transform(input, { hashLength: 4 });
            expect(result).toMatchSnapshot();
        });
    });
    describe('<Trans> component', () => {
        test('correctly compresses the child text node as the key', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans>Email address</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the child text node with interpolation as the key', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans>Hello {{name}}</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the child text node with nested components as the key', async () => {
            const input = `
        export function ReactComponent() {
          return (
            <Trans>
              Click <Link>here</Link> to continue
            </Trans>
          )
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the i18nKey attribute as the key', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans i18nKey="email-address">Email address</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the i18nKey template string attribute as the key', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans i18nKey={\`email-address\`}>Email address</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses the i18nKey variable attribute as the key', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans i18nKey="email-address">Email address</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses multiple <Trans> components', async () => {
            const input = `
        export function ReactComponent() {
          return (
            <div>
              <Trans>Email address</Trans>
              <Trans>Password</Trans>
            </div>
          )
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly turns <Trans> components with only text children into self-closing elements', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans>Email address</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly compresses text nodes in <Trans> components with mixed children', async () => {
            const input = `
        export function ReactComponent() {
          return (
            <Trans>
              Click <Link>here</Link> to continue
            </Trans>
          )
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly handles nested <Trans> components', async () => {
            const input = `
        export function ReactComponent() {
          return (
            <Trans>
              Outer text <Trans>Inner text</Trans> more outer text
            </Trans>
          )
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('does not compress non-Trans JSX elements', async () => {
            const input = `
        export function ReactComponent() {
          return <div>Email address</div>
        }
      `;
            const result = await transform(input);
            expect(result).toMatchSnapshot();
        });
        test('correctly handles custom hash length', async () => {
            const input = `
        export function ReactComponent() {
          return <Trans>Email address</Trans>
        }
      `;
            const result = await transform(input, { hashLength: 4 });
            expect(result).toMatchSnapshot();
        });
        test('throws error for spread attributes', async () => {
            const input = `
        export function ReactComponent() {
          const props = { i18nKey: 'test' }
          return <Trans {...props}>Email address</Trans>
        }
      `;
            await expect(transform(input)).rejects.toThrow();
        });
    });
    describe('development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });
        test('does not transform code in development mode', async () => {
            process.env.NODE_ENV = 'development';
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Trans>Email address</Trans>
        }
      `;
            const result = await transform(input);
            expect(result).toBe(input);
        });
    });
    describe('node_modules exclusion', () => {
        test('does not transform code in node_modules', async () => {
            const input = `
        export function ReactComponent() {
          const { t } = useTranslation('namespace')
          return <Trans>Email address</Trans>
        }
      `;
            const result = await transform(input, {}, '/path/to/node_modules/some-package/index.js');
            expect(result).toBe(input);
        });
    });
    describe('error handling', () => {
        test('returns original code when transformation fails', async () => {
            const input = 'invalid javascript syntax {';
            const result = await transform(input);
            expect(result).toBe(input);
        });
    });
});
//# sourceMappingURL=swc.spec.js.map