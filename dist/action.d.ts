interface ActionInputs {
    mode: "issue" | "report";
    comment: boolean;
    owner?: string;
    repo?: string;
    issueNumber?: number;
    token?: string;
    failBelow?: number;
    stellar: boolean;
    wave: boolean;
    grantfox: boolean;
}
export declare function readActionInputs(): ActionInputs;
export declare function runAction(inputs: ActionInputs): Promise<number>;
export declare function main(): Promise<void>;
export {};
//# sourceMappingURL=action.d.ts.map