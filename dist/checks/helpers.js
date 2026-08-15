"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.severityPenalty = severityPenalty;
exports.clampScore = clampScore;
exports.makeFinding = makeFinding;
function severityPenalty(severity) {
    switch (severity) {
        case "error":
            return 25;
        case "warning":
            return 12;
        case "info":
            return 0;
    }
}
function clampScore(score) {
    return Math.max(0, Math.min(100, Math.round(score)));
}
function makeFinding(id, dimension, severity, title, message, suggestion) {
    return { id, dimension, severity, title, message, suggestion };
}
