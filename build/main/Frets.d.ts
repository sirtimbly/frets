import { FunFrets, Mountable, SetupOptions } from './Frets.types';
import { PropsWithFields } from './props-field-registry';
/**
 * Creates a Frets application, it takes initial modelProps for your data model, and a function to be called when first run
 * @param  {T} modelProps
 * @param  {(fretsApp:FunFrets<T>)=>void} setupFn
 * @param  {SetupOptions} options?
 * @returns Mountable
 */
export declare function setup<T extends PropsWithFields>(modelProps: T, setupFn: (fretsApp: FunFrets<T>) => void, options?: SetupOptions): Mountable<T>;
