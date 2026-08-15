"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = escapeRegExp;
exports.wordPattern = wordPattern;
exports.countWords = countWords;
exports.countOccurrences = countOccurrences;
exports.hasAny = hasAny;
exports.extractCodeBlocks = extractCodeBlocks;
exports.stripCodeBlocks = stripCodeBlocks;
exports.extractUrls = extractUrls;
exports.extractIssueReferences = extractIssueReferences;
exports.hasSection = hasSection;
exports.containsCheckboxes = containsCheckboxes;
exports.countCheckboxes = countCheckboxes;
exports.extractFileReferences = extractFileReferences;
exports.titleLooksLikeQuestion = titleLooksLikeQuestion;
exports.trimToSentence = trimToSentence;
const WORD_PATTERN_CACHE = new Map();
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function wordPattern(word) {
    const cached = WORD_PATTERN_CACHE.get(word);
    if (cached) {
        return cached;
    }
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
    WORD_PATTERN_CACHE.set(word, pattern);
    return pattern;
}
function countWords(value) {
    const matches = value.match(/[\p{L}\p{N}]+/gu);
    return matches ? matches.length : 0;
}
function countOccurrences(haystack, needles) {
    let count = 0;
    for (const needle of needles) {
        const matches = haystack.match(wordPattern(needle));
        count += matches ? matches.length : 0;
    }
    return count;
}
function hasAny(haystack, needles) {
    for (const needle of needles) {
        if (wordPattern(needle).test(haystack)) {
            return true;
        }
    }
    return false;
}
function extractCodeBlocks(value) {
    const blocks = [];
    const pattern = /```[\s\S]*?```/g;
    let match;
    while ((match = pattern.exec(value)) !== null) {
        blocks.push(match[0]);
    }
    return blocks;
}
function stripCodeBlocks(value) {
    return value.replace(/```[\s\S]*?```/g, " ");
}
function extractUrls(value) {
    const matches = value.match(/https?:\/\/[^\s<>)]+/g);
    return matches ? matches.map((m) => m.replace(/[.,;:!?]+$/, "")) : [];
}
function extractIssueReferences(value) {
    const matches = value.match(/(?:closes?|fixes?|resolves?|refs?|related to)\s+#(\d+)/gi);
    return matches ? matches : [];
}
function hasSection(value, headings) {
    const lower = value.toLowerCase();
    return headings.some((heading) => {
        const pattern = new RegExp(`^\\s{0,3}#{1,6}\\s*${escapeRegExp(heading.toLowerCase())}`, "m");
        return pattern.test(lower) || lower.includes(heading.toLowerCase());
    });
}
function containsCheckboxes(value) {
    return /-\s*\[[\sxX]\]/.test(value);
}
function countCheckboxes(value) {
    const matches = value.match(/-\s*\[[\sxX]\]/g);
    return matches ? matches.length : 0;
}
function extractFileReferences(value) {
    const matches = value.match(/(?:\b[\w./-]+\.(?:ts|tsx|js|jsx|rs|py|sol|json|md|yml|yaml|toml|css|html|vue|svelte)\b|`[^`]+`)/g);
    if (!matches) {
        return [];
    }
    return [...new Set(matches.map((m) => m.replace(/^`|`$/g, "")))];
}
function titleLooksLikeQuestion(title) {
    return /\?\s*$/.test(title.trim());
}
function trimToSentence(value, maxLength) {
    const trimmed = value.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }
    return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
}
