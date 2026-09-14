"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
exports.VERSION = readVersion();
function readVersion() {
    try {
        const raw = (0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, "..", "package.json"), "utf8");
        const parsed = JSON.parse(raw);
        return parsed.version ?? "0.0.0";
    }
    catch {
        return "0.0.0";
    }
}
