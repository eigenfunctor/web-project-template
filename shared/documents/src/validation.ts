import * as R from "ramda";
import uuid from "uuid/v4";

interface ValidationLib {
  failIf(condition: boolean, message: string): void;
  JSON: typeof JSON;
  isArray(obj: object): boolean;
  log(message: string): void;
  sum(arr: number[]): number;
  toJSON(obj: object): string;
}

/* NOTE: Validations cannot close over variables outside the function's scope as all scope
 * information is lost after function serialization.
 */
export type Validation<T> = (lib: ValidationLib, content: T[]) => void;

export interface ValidationSpec<T> {
  namespace: string;
  schema: ValidationSchema<T>;
}

export type ValidationSchema<T> = {
  readonly [K in keyof T]?: {
    required?: boolean;
    validations?: Validation<T[K]>[];
  };
};

export function createValidator<T>(spec: () => ValidationSpec<T>): string {
  const validator = `
    function (newDoc, savedDoc, userCtx) {
      var errors = [];

      var failIf = function(condition, message) {
        if (condition) {
          errors.push(message);
        }
      }
      
      var lib = {
        failIf: failIf,
        JSON: JSON;
        isArray: isArray;
        log: log;
        sum: sum;
        toJSON: toJSON;
      }

      var namespaceFound = false;

      ${genValidationsFromSpec(spec)}

      if (!namespaceFound) {
        throw new Error({ forbidden: ["This document does not match any known specifications."] });
      }

      if (errors.length > 0) {
        throw new Error({ forbidden: JSON.stringify(errors) });
      }
    }
  `;

  function genValidationsFromSpec(spec: () => ValidationSpec<T>): string {
    function reducer(code, [key, schema]) {
      return `
        ${code}

        if ((${schema.required} && !newDoc.key) {
          errors.push("'${key}' is a required field");
        }

        ${genValidations(key, schema.validations || [])}
      `;
    }

    return R.toPairs(spec).reduce(reducer, "");
  }

  function genValidations(key: string, validations: Validation<T>[]): string {
    function reducer(code, validation, index) {
      const name = `${key}_validation${index}`;

      return `
        ${code}

        var ${name} = ${validation.toString()};

        if('${spec().namespace}' === newDoc.namespace) {
          namespaceFound = true;
          ${name}(lib, newDoc.content['${key}'])
        }
      `;
    }

    return validations.reduce(reducer, "");
  }

  return validator;
}
