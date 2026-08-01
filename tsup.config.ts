import type { Format, Options } from 'tsup';
import { defineConfig } from 'tsup';
export { defineConfig } from 'tsup';

export type OnSuccess = Array<(options?: TsupOptions) => Promise<void>>;

export interface TsupOptions extends Omit<Options, 'onSuccess'> {
  onSuccess?: OnSuccess | Options['onSuccess'];
}

export type TsupReturnType = (options: TsupOptions) => Options;

function outExtension({
  format,
}: {
  options: Options;
  format: Format;
  pkgType?: string;
}): { js?: string; dts?: string } {
  const formats = {
    cjs: { js: '.cjs', dts: '.d.cts' },
    esm: { js: '.mjs', dts: '.d.mts' },
    iife: { js: '.js', dts: '.d.ts' },
  };

  const extensions = formats[format];

  return extensions ? extensions : formats.iife;
}

export const defaultConfig = defineConfig(
  async (config?: TsupOptions): Promise<Options> => {
    const env = process.env['NODE_ENV'];
    const isProd = env === 'production';

    return Promise.resolve({
      cjsInterop: true,
      shims: true,
      clean: true,
      splitting: false,
      dts: true, // generate dts files
      env: { NODE_ENV: env ?? 'development' },
      format: ['cjs', 'esm'], // generate cjs and esm files
      skipNodeModulesBundle: true,
      sourcemap: 'inline',
      target: 'es2022',
      outDir: './dist',
      treeshake: true,
      keepNames: true,
      entry: ['src/**/*.ts', '!src/**/*.d.ts'], //include all files under src,
      outExtension,
      ...config,
      minify: !config?.watch || isProd,
      bundle: !config?.watch || isProd,
      onSuccess: async () => {
        const isArray = Array.isArray(config?.onSuccess);

        const onSuccess = (
          isArray ? config?.onSuccess : [config?.onSuccess].filter((fn) => fn)
        ) as OnSuccess;

        await Promise.all(onSuccess.map((fn) => fn(config)));
      },
    });
  },
) as TsupReturnType;
