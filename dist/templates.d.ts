import type { WaveLevel } from "./types";
export type TemplateType = "good-first-issue" | "soroban" | "feature" | "docs" | "bug" | "qa";
export declare const TEMPLATE_TYPES: readonly TemplateType[];
export interface RenderTemplateOptions {
    complexity?: WaveLevel;
    waveLabel?: string;
}
export declare function renderTemplate(type: TemplateType, options?: RenderTemplateOptions): string;
export declare function renderTemplatesConfig(): string;
export interface WriteTemplatesOptions {
    complexityByType?: Partial<Record<TemplateType, WaveLevel>>;
    waveLabel?: string;
}
export declare function writeIssueTemplates(directory: string, options?: WriteTemplatesOptions): string[];
export declare function templateTypeFromName(name: string): TemplateType | undefined;
//# sourceMappingURL=templates.d.ts.map