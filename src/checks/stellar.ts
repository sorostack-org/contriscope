import { extractFileReferences, hasAny } from "../text";
import type { ContriscopeConfig } from "../config";
import type { Finding } from "../types";
import { clampScore, makeFinding, severityPenalty } from "./helpers";

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
];

const KNOWN_SES = [
  1, 5, 6, 7, 8, 10, 12, 18, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31, 35, 38, 40, 41, 42, 43, 44,
  45, 46, 49, 52, 64,
];

const EXAMPLE_CONTEXT_TERMS = ["example", "placeholder", "replace", "e.g.", "for example", "sample"];

export interface StellarInput {
  config: ContriscopeConfig;
  title: string;
  body: string;
}

export interface StellarResult {
  active: boolean;
  score: number;
  findings: Finding[];
}

export function hasStellarContent(input: { title: string; body: string }): boolean {
  const haystack = `${input.title} ${input.body}`.toLowerCase();
  return STELLAR_MARKERS.some((marker) => haystack.includes(marker));
}

export function checkStellar(input: StellarInput): StellarResult {
  const { title, body } = input;
  const haystack = `${title} ${body}`;
  const findings: Finding[] = [];

  if (!hasStellarContent({ title, body })) {
    return { active: false, score: 100, findings };
  }

  let penalty = 0;
  const add = (finding: Finding): void => {
    findings.push(finding);
    penalty += severityPenalty(finding.severity);
  };

  const mentionsNetwork = hasAny(haystack, ["testnet", "mainnet", "public network"]);
  if (!mentionsNetwork) {
    add(
      makeFinding(
        "stellar.network-missing",
        "stellar",
        "warning",
        "Network not specified",
        "Stellar work should state which network it targets (Testnet or Mainnet).",
        'Add a line such as "Target: Testnet" or "Target: Mainnet" near the requirements.',
      ),
    );
  }

  const mentionsTestnet = hasAny(haystack, ["testnet"]);
  const mentionsFriendbot = hasAny(haystack, ["friendbot"]);
  if (mentionsTestnet && !mentionsFriendbot) {
    add(
      makeFinding(
        "stellar.friendbot",
        "stellar",
        "info",
        "Testnet funding not mentioned",
        "Contributors building on Testnet need free XLM to sign transactions.",
        'Mention Friendbot for funding a Testnet account, e.g. `https://friendbot.stellar.org`.',
      ),
    );
  }

  const publicKeyMatches = haystack.match(/\bG[A-Z2-7]{55}\b/g);
  if (publicKeyMatches && publicKeyMatches.length > 0) {
    const exampleContext = EXAMPLE_CONTEXT_TERMS.some((term) => haystack.toLowerCase().includes(term));
    add(
      makeFinding(
        "stellar.public-key",
        "stellar",
        exampleContext ? "info" : "warning",
        "Stellar public key referenced",
        `${publicKeyMatches.length} Stellar public key(s) (G...) appear in the issue.`,
        "Ensure these are example addresses, not real accounts. Use placeholders like `G...` if possible.",
      ),
    );
  }

  const sepMatches = haystack.match(/\bSEP-(\d+)\b/g);
  if (sepMatches && sepMatches.length > 0) {
    const unknown = sepMatches.filter((match) => {
      const number = Number.parseInt(match.split("-")[1], 10);
      return !KNOWN_SES.includes(number);
    });
    if (unknown.length > 0) {
      add(
        makeFinding(
          "stellar.sep-unknown",
          "stellar",
          "warning",
          "Unrecognised SEP reference",
          `The issue references ${unknown.join(", ")}, which are not standard Stellar SEP numbers.`,
          "Double-check the SEP number or link the exact specification being referenced.",
        ),
      );
    }
  }

  return { active: true, score: clampScore(100 - penalty), findings };
}

export function countStellarFiles(input: { body: string }): number {
  return extractFileReferences(input.body).length;
}
