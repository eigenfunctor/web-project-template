"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var R = __importStar(require("ramda"));
var v4_1 = __importDefault(require("uuid/v4"));
var validation_1 = require("../validation");
function hasNamespaceFilter(db, namespace) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                return [2 /*return*/, !!db.get("_design/filter_" + namespace)];
            }
            catch (_) {
                return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    });
}
function defineDocSpec(db, spec) {
    return __awaiter(this, void 0, void 0, function () {
        function traverseSpec(db, spec, visited) {
            if (visited === void 0) { visited = []; }
            return __awaiter(this, void 0, void 0, function () {
                var validationDDoc, filterDDoc, nextVisited;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, hasNamespaceFilter(db, spec.namespace)];
                        case 1:
                            if (!!(_a.sent())) return [3 /*break*/, 4];
                            validationDDoc = {
                                _id: "_design/validate_" + spec.namespace,
                                validate_doc_update: validation_1.createValidator(spec)
                            };
                            filterDDoc = {
                                _id: "_design/filter_" + spec.namespace,
                                filters: {
                                    _: "\n        function (doc, req) {\n          return doc.namespace === '" + spec.namespace + "') {\n        }\n      "
                                }
                            };
                            return [4 /*yield*/, db.put(validationDDoc)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, db.put(filterDDoc)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            nextVisited = R.clone(visited);
                            R.toPairs(spec.schema).forEach(function (_a) {
                                var key = _a[0], spec = _a[1];
                                return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (nextVisited.includes(key)) {
                                                    return [2 /*return*/];
                                                }
                                                nextVisited.push(key);
                                                return [4 /*yield*/, traverseSpec(db, spec, nextVisited)];
                                            case 1:
                                                nextVisited = _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            });
                            return [2 /*return*/, nextVisited];
                    }
                });
            });
        }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, traverseSpec(db, spec)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.defineDocSpec = defineDocSpec;
function useRecordSpec(db, spec) {
    return __awaiter(this, void 0, void 0, function () {
        function resolve(doc, options) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _id, namespace, content;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, db.get(doc.id, options)];
                        case 1:
                            _a = _b.sent(), _id = _a._id, namespace = _a.namespace, content = _a.content;
                            return [2 /*return*/, { _id: _id, namespace: namespace, content: content }];
                    }
                });
            });
        }
        function put(doc) {
            return __awaiter(this, void 0, void 0, function () {
                var _id, namespace, content, keysWithDocSpecs, pairs, literals, childDocs, childDocRefs;
                return __generator(this, function (_a) {
                    _id = doc._id, namespace = doc.namespace, content = doc.content;
                    if (!content) {
                        return [2 /*return*/, db.put({
                                _id: _id,
                                namespace: spec.namespace
                            })];
                    }
                    keysWithDocSpecs = R.toPairs(spec.schema)
                        .filter(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "spec" in v;
                    })
                        .map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return k;
                    });
                    pairs = R.toPairs(content);
                    literals = pairs.filter(function (_a) {
                        var k = _a[0], v = _a[1];
                        return !keysWithDocSpecs.includes(k);
                    });
                    childDocs = pairs.filter(function (_a) {
                        var key = _a[0], val = _a[1];
                        return keysWithDocSpecs.includes(key);
                    });
                    childDocRefs = childDocs.map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return [
                            k,
                            { _id: v._id, namespace: spec.schema[k].namespace }
                        ];
                    });
                    return [2 /*return*/, db.put({
                            _id: _id,
                            namespace: spec.namespace,
                            content: R.fromPairs(literals.concat(childDocRefs))
                        })];
                });
            });
        }
        function create(content) {
            return __awaiter(this, void 0, void 0, function () {
                var doc;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            doc = {
                                _id: spec.namespace + ":" + v4_1.default(),
                                namespace: spec.namespace,
                                content: content
                            };
                            return [4 /*yield*/, put(doc)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, doc];
                    }
                });
            });
        }
        function find(selector) {
            return __awaiter(this, void 0, void 0, function () {
                var baseSelector;
                return __generator(this, function (_a) {
                    baseSelector = { selector: { namespace: { $eq: spec.namespace } } };
                    return [2 /*return*/, db.find(R.mergeDeepLeft(baseSelector, selector))];
                });
            });
        }
        var keys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hasNamespaceFilter(db, spec.namespace)];
                case 1:
                    if (!(_a.sent())) {
                        throw new Error("Cannot find namespace in database: '" + spec.namespace + "'");
                    }
                    keys = R.fromPairs(R.toPairs(spec.schema)
                        .filter(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "spec" in v;
                    })
                        .map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return [k, function () { return useRecordSpec(db, v.spec); }];
                    }));
                    return [2 /*return*/, {
                            db: db,
                            spec: spec,
                            keys: keys,
                            resolve: resolve,
                            put: put,
                            create: create,
                            find: find
                        }];
            }
        });
    });
}
exports.useRecordSpec = useRecordSpec;
function replicate(scope, target, options) {
    var baseOptions = {
        filter: "filter_" + scope.spec.namespace + "/_"
    };
    return scope.db.replicate.to(target, R.mergeDeepLeft(baseOptions, options || {}));
}
exports.replicate = replicate;
//# sourceMappingURL=index.js.map