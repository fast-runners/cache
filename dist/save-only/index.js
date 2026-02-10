/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 242:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RefKey = exports.Events = exports.State = exports.Outputs = exports.Inputs = void 0;
var Inputs;
(function (Inputs) {
    Inputs["Key"] = "key";
    Inputs["Path"] = "path";
    Inputs["RestoreKeys"] = "restore-keys";
    Inputs["UploadChunkSize"] = "upload-chunk-size";
    Inputs["EnableCrossOsArchive"] = "enableCrossOsArchive";
    Inputs["FailOnCacheMiss"] = "fail-on-cache-miss";
    Inputs["LookupOnly"] = "lookup-only";
    Inputs["CacheFormat"] = "format"; // Format of the cache blob
})(Inputs || (exports.Inputs = Inputs = {}));
var Outputs;
(function (Outputs) {
    Outputs["CacheHit"] = "cache-hit";
    Outputs["CachePrimaryKey"] = "cache-primary-key";
    Outputs["CacheMatchedKey"] = "cache-matched-key"; // Output from restore action
})(Outputs || (exports.Outputs = Outputs = {}));
var State;
(function (State) {
    State["CachePrimaryKey"] = "CACHE_KEY";
    State["CacheMatchedKey"] = "CACHE_RESULT";
})(State || (exports.State = State = {}));
var Events;
(function (Events) {
    Events["Key"] = "GITHUB_EVENT_NAME";
    Events["Push"] = "push";
    Events["PullRequest"] = "pull_request";
})(Events || (exports.Events = Events = {}));
exports.RefKey = "GITHUB_REF";


/***/ }),

/***/ 56:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.saveImpl = saveImpl;
exports.saveOnlyRun = saveOnlyRun;
exports.saveRun = saveRun;
const cache = __importStar(__nccwpck_require__(167));
const core = __importStar(__nccwpck_require__(746));
const constants_1 = __nccwpck_require__(242);
const stateProvider_1 = __nccwpck_require__(879);
const utils = __importStar(__nccwpck_require__(270));
// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on("uncaughtException", e => utils.logWarning(e.message));
function saveImpl(stateProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        let cacheId = -1;
        try {
            if (!utils.isCacheFeatureAvailable()) {
                return;
            }
            if (!utils.isValidEvent()) {
                utils.logWarning(`Event Validation Error: The event type ${process.env[constants_1.Events.Key]} is not supported because it's not tied to a branch or tag ref.`);
                return;
            }
            // If restore has stored a primary key in state, reuse that
            // Else re-evaluate from inputs
            const primaryKey = stateProvider.getState(constants_1.State.CachePrimaryKey) ||
                core.getInput(constants_1.Inputs.Key);
            if (!primaryKey) {
                utils.logWarning(`Key is not specified.`);
                return;
            }
            // If matched restore key is same as primary key, then do not save cache
            // NO-OP in case of SaveOnly action
            const restoredKey = stateProvider.getCacheState();
            if (utils.isExactKeyMatch(primaryKey, restoredKey)) {
                core.info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`);
                return;
            }
            const cachePaths = utils.getInputAsArray(constants_1.Inputs.Path, {
                required: true
            });
            const enableCrossOsArchive = utils.getInputAsBool(constants_1.Inputs.EnableCrossOsArchive);
            const format = core.getInput(constants_1.Inputs.CacheFormat);
            cacheId = yield cache.saveCache(cachePaths, primaryKey, { uploadChunkSize: utils.getInputAsInt(constants_1.Inputs.UploadChunkSize) }, enableCrossOsArchive, format);
            if (cacheId != -1) {
                core.info(`Cache saved with key: ${primaryKey}`);
            }
        }
        catch (error) {
            utils.logWarning(error.message);
        }
        return cacheId;
    });
}
function saveOnlyRun(earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cacheId = yield saveImpl(new stateProvider_1.NullStateProvider());
            if (cacheId === -1) {
                core.warning(`Cache save failed.`);
            }
        }
        catch (err) {
            console.error(err);
            if (earlyExit) {
                process.exit(1);
            }
        }
        // node will stay alive if any promises are not resolved,
        // which is a possibility if HTTP requests are dangling
        // due to retries or timeouts. We know that if we got here
        // that all promises that we care about have successfully
        // resolved, so simply exit with success.
        if (earlyExit) {
            process.exit(0);
        }
    });
}
function saveRun(earlyExit) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield saveImpl(new stateProvider_1.StateProvider());
        }
        catch (err) {
            console.error(err);
            if (earlyExit) {
                process.exit(1);
            }
        }
        // node will stay alive if any promises are not resolved,
        // which is a possibility if HTTP requests are dangling
        // due to retries or timeouts. We know that if we got here
        // that all promises that we care about have successfully
        // resolved, so simply exit with success.
        if (earlyExit) {
            process.exit(0);
        }
    });
}


/***/ }),

/***/ 879:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NullStateProvider = exports.StateProvider = void 0;
const core = __importStar(__nccwpck_require__(746));
const constants_1 = __nccwpck_require__(242);
class StateProviderBase {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        this.setState = (key, value) => { };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.getState = (key) => "";
    }
    getCacheState() {
        const cacheKey = this.getState(constants_1.State.CacheMatchedKey);
        if (cacheKey) {
            core.debug(`Cache state/key: ${cacheKey}`);
            return cacheKey;
        }
        return undefined;
    }
}
class StateProvider extends StateProviderBase {
    constructor() {
        super(...arguments);
        this.setState = core.saveState;
        this.getState = core.getState;
    }
}
exports.StateProvider = StateProvider;
class NullStateProvider extends StateProviderBase {
    constructor() {
        super(...arguments);
        this.stateToOutputMap = new Map([
            [constants_1.State.CacheMatchedKey, constants_1.Outputs.CacheMatchedKey],
            [constants_1.State.CachePrimaryKey, constants_1.Outputs.CachePrimaryKey]
        ]);
        this.setState = (key, value) => {
            core.setOutput(this.stateToOutputMap.get(key), value);
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.getState = (key) => "";
    }
}
exports.NullStateProvider = NullStateProvider;


/***/ }),

/***/ 270:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isGhes = isGhes;
exports.isExactKeyMatch = isExactKeyMatch;
exports.logWarning = logWarning;
exports.isValidEvent = isValidEvent;
exports.getInputAsArray = getInputAsArray;
exports.getInputAsInt = getInputAsInt;
exports.getInputAsBool = getInputAsBool;
exports.isCacheFeatureAvailable = isCacheFeatureAvailable;
const cache = __importStar(__nccwpck_require__(167));
const core = __importStar(__nccwpck_require__(746));
const constants_1 = __nccwpck_require__(242);
function isGhes() {
    const ghUrl = new URL(process.env["GITHUB_SERVER_URL"] || "https://github.com");
    const hostname = ghUrl.hostname.trimEnd().toUpperCase();
    const isGitHubHost = hostname === "GITHUB.COM";
    const isGitHubEnterpriseCloudHost = hostname.endsWith(".GHE.COM");
    const isLocalHost = hostname.endsWith(".LOCALHOST");
    return !isGitHubHost && !isGitHubEnterpriseCloudHost && !isLocalHost;
}
function isExactKeyMatch(key, cacheKey) {
    return !!(cacheKey &&
        cacheKey.localeCompare(key, undefined, {
            sensitivity: "accent"
        }) === 0);
}
function logWarning(message) {
    const warningPrefix = "[warning]";
    core.info(`${warningPrefix}${message}`);
}
// Cache token authorized for all events that are tied to a ref
// See GitHub Context https://help.github.com/actions/automating-your-workflow-with-github-actions/contexts-and-expression-syntax-for-github-actions#github-context
function isValidEvent() {
    return constants_1.RefKey in process.env && Boolean(process.env[constants_1.RefKey]);
}
function getInputAsArray(name, options) {
    return core
        .getInput(name, options)
        .split("\n")
        .map(s => s.replace(/^!\s+/, "!").trim())
        .filter(x => x !== "");
}
function getInputAsInt(name, options) {
    const value = parseInt(core.getInput(name, options));
    if (isNaN(value) || value < 0) {
        return undefined;
    }
    return value;
}
function getInputAsBool(name, options) {
    const result = core.getInput(name, options);
    return result.toLowerCase() === "true";
}
function isCacheFeatureAvailable() {
    if (cache.isFeatureAvailable()) {
        return true;
    }
    if (isGhes()) {
        logWarning(`Cache action is only supported on GHES version >= 3.5. If you are on version >=3.5 Please check with GHES admin if Actions cache service is enabled or not.
Otherwise please upgrade to GHES version >= 3.5 and If you are also using Github Connect, please unretire the actions/cache namespace before upgrade (see https://docs.github.com/en/enterprise-server@3.5/admin/github-actions/managing-access-to-actions-from-githubcom/enabling-automatic-access-to-githubcom-actions-using-github-connect#automatic-retirement-of-namespaces-for-actions-accessed-on-githubcom)`);
        return false;
    }
    logWarning("An internal error has occurred in cache backend. Please check https://www.githubstatus.com/ for any ongoing issue in actions.");
    return false;
}


/***/ }),

/***/ 167:
/***/ ((module) => {

module.exports = eval("require")("@actions/cache");


/***/ }),

/***/ 746:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const saveImpl_1 = __nccwpck_require__(56);
(0, saveImpl_1.saveOnlyRun)(true);

})();

module.exports = __webpack_exports__;
/******/ })()
;