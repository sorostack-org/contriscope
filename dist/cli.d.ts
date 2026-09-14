#!/usr/bin/env node
import { type ContriscopeConfig } from "./config";
interface CliOptions {
    [key: string]: string | boolean;
}
interface ParsedCli {
    command: string;
    positional: string[];
    options: CliOptions;
}
export declare function parseArgs(argv: string[]): ParsedCli;
export declare function run(argv: string[]): Promise<number>;
export declare function resolveConfig(options: CliOptions): ContriscopeConfig;
export declare function main(): Promise<void>;
export {};
//# sourceMappingURL=cli.d.ts.map