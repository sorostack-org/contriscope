"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasStellarContent = hasStellarContent;
exports.checkStellar = checkStellar;
const text_1 = require("../text");
const helpers_1 = require("./helpers");
const STELLAR_MARKERS = [
    "stellar",
    "soroban",
    "xlm",
    "lumens",
    "friendbot",
    "claimable balance",
    "trustline",
    "anchor",
    "testnet",
    "mainnet",
    "stellar-sdk",
    "soroban-rpc",
    "seps",
    "transaction",
    "horizon",
    "memo",
    "sequence",
    "sign",
    "account",
    "payment",
    "transfer",
    "asset",
    "usdc",
    "contract",
    "wasm",
    "smart contract",
];
const KNOWN_SES = [
    1, 5, 6, 7, 8, 10, 12, 18, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31, 35, 38, 40, 41, 42, 43, 44, 45,
    46, 49, 52, 64,
];
const EXAMPLE_CONTEXT_TERMS = [
    "example",
    "placeholder",
    "replace",
    "e.g.",
    "for example",
    "sample",
];
function hasStellarContent(input) {
    const haystack = `${input.title} ${input.body}`.toLowerCase();
    return STELLAR_MARKERS.some((marker) => haystack.includes(marker));
}
function checkStellar(input) {
    const { title, body } = input;
    const haystack = `${title} ${body}`;
    const findings = [];
    if (!hasStellarContent({ title, body })) {
        return { active: false, score: 100, findings };
    }
    let penalty = 0;
    const add = (finding) => {
        findings.push(finding);
        penalty += (0, helpers_1.severityPenalty)(finding.severity);
    };
    const mentionsNetwork = (0, text_1.hasAny)(haystack, ["testnet", "mainnet", "public network"]);
    if (!mentionsNetwork) {
        add((0, helpers_1.makeFinding)("stellar.network-missing", "stellar", "warning", "Network not specified", "Stellar work should state which network it targets (Testnet or Mainnet).", 'Add a line such as "Target: Testnet" or "Target: Mainnet" near the requirements.'));
    }
    const mentionsTestnet = (0, text_1.hasAny)(haystack, ["testnet"]);
    const mentionsFriendbot = (0, text_1.hasAny)(haystack, ["friendbot"]);
    if (mentionsTestnet && !mentionsFriendbot) {
        add((0, helpers_1.makeFinding)("stellar.friendbot", "stellar", "info", "Testnet funding not mentioned", "Contributors building on Testnet need free XLM to sign transactions.", "Mention Friendbot for funding a Testnet account, e.g. `https://friendbot.stellar.org`."));
    }
    const publicKeyMatches = haystack.match(/\bG[A-Z2-7]{55}\b/g);
    if (publicKeyMatches && publicKeyMatches.length > 0) {
        const exampleContext = EXAMPLE_CONTEXT_TERMS.some((term) => haystack.toLowerCase().includes(term));
        add((0, helpers_1.makeFinding)("stellar.public-key", "stellar", exampleContext ? "info" : "warning", "Stellar public key referenced", `${publicKeyMatches.length} Stellar public key(s) (G...) appear in the issue.`, "Ensure these are example addresses, not real accounts. Use placeholders like `G...` if possible."));
    }
    const secretKeyMatches = haystack.match(/\bS[A-Z2-7]{55}\b/g);
    if (secretKeyMatches && secretKeyMatches.length > 0) {
        add((0, helpers_1.makeFinding)("stellar.secret-key", "stellar", "error", "Possible Stellar secret key detected", `${secretKeyMatches.length} string(s) match the Stellar secret-key format (S...).`, "Never share secret keys. Replace with placeholders and rotate any key that may have been exposed."));
    }
    const sepMatches = haystack.match(/\bSEP-(\d+)\b/g);
    if (sepMatches && sepMatches.length > 0) {
        const unknown = sepMatches.filter((match) => {
            const number = Number.parseInt(match.split("-")[1], 10);
            return !KNOWN_SES.includes(number);
        });
        if (unknown.length > 0) {
            add((0, helpers_1.makeFinding)("stellar.sep-unknown", "stellar", "warning", "Unrecognised SEP reference", `The issue references ${unknown.join(", ")}, which are not standard Stellar SEP numbers.`, "Double-check the SEP number or link the exact specification being referenced."));
        }
    }
    const mentionsSoroban = (0, text_1.hasAny)(haystack, ["soroban", "contract", "wasm", "smart contract"]);
    if (mentionsSoroban) {
        add((0, helpers_1.makeFinding)("stellar.soroban-context", "stellar", "info", "Soroban contract work", "Contract work benefits from extra context for contributors.", "Include the contract ID (CA...), relevant storage keys, and the admin/authority account where relevant."));
    }
    const assetCodeMatches = haystack.match(/\b([A-Z0-9]{2,12})\b/g);
    if (assetCodeMatches && (0, text_1.hasAny)(haystack, ["asset", "xlm", "trustline", "issuer"])) {
        add((0, helpers_1.makeFinding)("stellar.asset-context", "stellar", "info", "Asset references present", "The issue mentions assets; contributors need the asset code and issuer to build correctly.", "State the asset code (e.g. `USDC`) and its issuer, or confirm native XLM."));
    }
    return { active: true, score: (0, helpers_1.clampScore)(100 - penalty), findings };
}
