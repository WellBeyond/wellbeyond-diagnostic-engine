import { Engine, Rule, Fact, Almanac, RuleResult, EngineResult } from 'json-rules-engine';
import { Diagnostic, Solution, Symptom } from "./types";
export declare type DiagnosticCallback = {
    (diagnostic: Diagnostic): Promise<string | number>;
};
export declare type SolutionCallback = {
    (solution: Solution): Promise<string>;
};
declare class DiagnosticEngine {
    private readonly engine;
    private symptoms;
    private solutions;
    private diagnostics;
    private factCreated;
    private currentSymptoms;
    private rules;
    private diagnosticCallback?;
    private solutionCallback?;
    private factPriority;
    initialized: boolean;
    constructor();
    initialize(symptoms: Symptom[], solutions: Solution[], diagnostics: Diagnostic[], diagnosticCallback: DiagnosticCallback, solutionCallback: SolutionCallback): DiagnosticEngine;
    run(symptoms: string[], systemTypes: string[]): Promise<EngineResult>;
    private parse;
    private createDiagnosticFact;
    private createRuleForSolution;
    private createRuleForRootCause;
    private addConditions;
    private addRules;
    getEngine(): Engine;
}
export { DiagnosticEngine, EngineResult, Engine, Rule, Fact, Almanac, RuleResult, Diagnostic, Solution, Symptom };
