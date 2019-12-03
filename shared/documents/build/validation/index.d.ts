interface ValidationLib {
    failIf(condition: boolean, message: string): void;
    JSON: typeof JSON;
    isArray(obj: object): boolean;
    log(message: string): void;
    sum(arr: number[]): number;
    toJSON(obj: object): string;
}
export declare type Validation<T> = (lib: ValidationLib, content: T) => void;
export interface DocSpec<T> {
    namespace: string;
    schema: DocSchema<T>;
}
export declare type DocSchema<T> = {
    readonly [K in keyof T]?: {
        spec?: DocSpec<T[K]>;
        default?: T[K];
        required?: boolean;
        validations?: Validation<T>[];
    };
};
export declare function createValidator<T>(spec: DocSpec<T>): string;
export {};
