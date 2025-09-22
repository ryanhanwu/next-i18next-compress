import { Options } from './options';
export interface SwcTransformOptions extends Partial<Options> {
    filename?: string;
}
export declare function transformCode(code: string, options?: SwcTransformOptions): Promise<string>;
