"use strict";
//
// INTERLOCK NETWORK & ALEPH ZERO
// PSP34 UNIVERSAL ACCESS NFT - CLIENT MINT TX
//
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
exports.__esModule = true;
// imports (anything polkadot with node-js must be required)
var _a = require('@polkadot/api'), ApiPromise = _a.ApiPromise, WsProvider = _a.WsProvider, Keyring = _a.Keyring;
var _b = require('@polkadot/api-contract'), ContractPromise = _b.ContractPromise, CodePromise = _b.CodePromise;
var WeightV2 = require('@polkadot/types/interfaces');
// utility functions
var utils_1 = require("./utils");
// specify color formatting
var color = require("cli-color");
var red = color.red.bold;
var green = color.green.bold;
var blue = color.blue.bold;
var cyan = color.cyan;
var yellow = color.yellow.bold;
var magenta = color.magenta;
// import package
var dotenv = require("dotenv");
dotenv.config();
// environment contstant
var OWNER_MNEMONIC = process.env.OWNER_MNEMONIC;
// constants
//
// null === no limit
// refTime and proofSize determined by contracts-ui estimation plus fudge-factor
var refTimeLimit = 8000000000;
var proofSizeLimit = 150000;
var storageDepositLimit = null;
function mint(recipient) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, api, contract, keyring, OWNER_PAIR, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, utils_1.setupSession)('mintTx')];
                case 1:
                    _a = _b.sent(), api = _a[0], contract = _a[1];
                    keyring = new Keyring({ type: 'sr25519' });
                    OWNER_PAIR = keyring.addFromUri(OWNER_MNEMONIC);
                    console.log(green("UA-NFT") + color.bold("|CLIENT-APP: ") +
                        color.bold("minting UA-NFT for"));
                    console.log(green("UA-NFT") + color.bold("|CLIENT-APP: ") +
                        magenta("".concat(recipient, "\n")));
                    // call mint tx using contract owner's keypair
                    return [4 /*yield*/, (0, utils_1.contractDoer)(api, contract, OWNER_PAIR, storageDepositLimit, refTimeLimit, proofSizeLimit, 'mintTx', 'mintTo', recipient)];
                case 2:
                    // call mint tx using contract owner's keypair
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    console.log(red("UA-NFT") + color.bold("|CLIENT-APP: ") + error_1);
                    process.send('program-error');
                    process.exit();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
process.on('message', function (recipient) {
    mint(recipient)["catch"](function (error) {
        console.error(error);
        process.exit(-1);
    });
});
