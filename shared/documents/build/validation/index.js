"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var R = __importStar(require("ramda"));
function createValidator(spec) {
    var validator = "\n    function (newDoc, savedDoc, userCtx) {\n      var errors = [];\n\n      var failIf = function(condition, message) {\n        if (condition) {\n          errors.push(message);\n        }\n      }\n      \n      var lib = {\n        failIf: failIf,\n        JSON: JSON;\n        isArray: isArray;\n        log: log;\n        sum: sum;\n        toJSON: toJSON;\n      }\n\n      var namespaceFound = false;\n\n      " + genValidationsFromSpec(spec) + "\n\n      if (!namespaceFound) {\n        throw new Error({ forbidden: [\"This document does not match any known specifications.\"] });\n      }\n\n      if (errors.length > 0) {\n        throw new Error({ forbidden: JSON.stringify(errors) });\n      }\n    }\n  ";
    function genValidationsFromSpec(spec) {
        function reducer(code, _a) {
            var key = _a[0], schema = _a[1];
            return "\n        " + code + "\n\n        if ((" + schema.required + " && !newDoc.key) {\n          errors.push(\"'" + key + "' is a required field\");\n        }\n\n        " + genValidations(key, schema.validations) + "\n      ";
        }
        return R.toPairs(spec).reduce(reducer, "");
    }
    function genValidations(key, validations) {
        function reducer(code, validation, index) {
            var name = key + "_validation" + index;
            return "\n        " + code + "\n\n        var " + name + " = " + validation.toString() + ";\n\n        if('" + spec.namespace + "' === newDoc.namespace) {\n          namespaceFound = true;\n          " + name + "(lib, newDoc.content)\n        }\n      ";
        }
        return validations.reduce(reducer, "");
    }
    return validator;
}
exports.createValidator = createValidator;
//# sourceMappingURL=index.js.map