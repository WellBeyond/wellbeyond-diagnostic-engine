// @ts-ignore
import { Engine, Rule, Fact, Almanac, RuleResult, Event, EngineResult } from 'json-rules-engine';
import {Diagnostic, Solution, Symptom, PotentialSolution, PotentialRootCause} from "./types";

export type DiagnosticCallback = {
    (diagnostic:Diagnostic): Promise<string|number>;
}

export type SolutionCallback = {
    (solution:Solution): Promise<string>;
}

class DiagnosticEngine {
    private readonly engine: Engine;
    private symptoms: Symptom[] = [];
    private solutions: {
        [solutionId:string]: Solution
    } = {};
    private diagnostics: {
        [diagnosticId:string]: Diagnostic
    } = {};
    private factCreated: {
        [diagnosticId:string]: boolean
    } = {};
    private currentSymptoms: string[] = [];
    private rules: Rule[] = [];
    private diagnosticCallback?:DiagnosticCallback;
    private solutionCallback?:SolutionCallback;
    private factPriority:number = 1000;
    public initialized = false;

    public constructor () {
        this.engine = new Engine([], {allowUndefinedFacts: false});
    }

    public initialize (symptoms:Symptom[], solutions:Solution[], diagnostics:Diagnostic[],
                        diagnosticCallback:DiagnosticCallback, solutionCallback:SolutionCallback): DiagnosticEngine {
        this.symptoms = symptoms || [];
        solutions.forEach((solution) => {
            this.solutions[solution.id] = solution;
        });
        diagnostics.forEach((diagnostic) => {
            this.diagnostics[diagnostic.id] = diagnostic;
        });
        this.diagnosticCallback = diagnosticCallback;
        this.solutionCallback = solutionCallback;
        this.parse();
        this.initialized = true;
        return this;
    }

    public async run(symptoms:string[], systemTypes:string[]): Promise<EngineResult> {
        const self = this;
        self.currentSymptoms = symptoms;
        self.engine.addFact('symptoms', (_params, _almanac) => {
            return self.currentSymptoms;
        }, { cache: false, priority: 99999 });
        self.engine.addFact('systemTypes', systemTypes, { cache: true, priority: 99999 });

        self.engine
            .on('solved', (event:any) => {
                console.log('solved', event);
                if (event.symptomId) {
                    const index = self.currentSymptoms.indexOf(event.symptomId);
                    if (index > -1) {
                        self.currentSymptoms.splice(index, 1);
                    }
                }
            })
            .on('addSymptom', (event:any) => {
                console.log('addSymptom', event);
                if (event.causeId) {
                    const index = self.currentSymptoms.indexOf(event.causeId);
                    if (index == -1) {
                        self.currentSymptoms.push(event.causeId);
                    }
                }
            })
            .on('success', event => {
                console.log('success', event);
            })
            .on('failure', event => {
                console.log('failure', event);
            });

        return this.engine.run();

    }

    private parse ():void {
        const self = this;
        self.engine.addOperator('containsOneOf', (factValue:string[], jsonValue:string[]) => {
            if (!factValue || !factValue.length) return false;
            if (!jsonValue || !jsonValue.length) return false;
            let contains:boolean = false;
            jsonValue.forEach(val => {
                if (factValue.includes(val)) contains = true;
            });
            return contains;
        })
        self.symptoms.forEach((symptom) => {
            symptom.rules && symptom.rules.forEach((potential) => {
                const solution = this.solutions[potential.solutionId];
                if (solution) {
                    const rule = this.createRuleForSolution(symptom, potential, solution);
                    this.rules.push(rule);
                }
            });
            symptom.rootCauses && symptom.rootCauses.forEach((cause) => {
                const root = this.symptoms.find(s => s.id === cause.symptomId);
                if (root) {
                    const rule = this.createRuleForRootCause(symptom, cause, root);
                    this.rules.push(rule);
                }
            });
        });
        self.addRules(self.rules);
    }

    private createDiagnosticFact(factId:string) {
        const self = this;
        if (factId && !self.factCreated[factId]) {
            self.factCreated[factId] = true;
            // @ts-ignore
            this.engine.addFact(factId, function (params, almanac) {
                return new Promise<any>((resolve, reject) => {
                    const diagnostic = self.diagnostics[factId];
                    console.log('Asking question ...', diagnostic);
                    if (diagnostic && self.diagnosticCallback) {
                        return self.diagnosticCallback(diagnostic).then((answer) => {
                            resolve(answer);
                        }, (reason) => {
                            reject(reason);
                        });
                    } else {
                        return reject();
                    }
                });
            }, {cache: true, priority: self.factPriority--});
        }
    }

    private createRuleForSolution(symptom:Symptom, potential:PotentialSolution, solution:Solution):Rule {
        const self = this;
        const rule: any = {};
        rule.name = symptom.name + ': ' + solution.name;
        rule.event = {
            type: solution.askDidItWork ? 'solved' : 'deferred',
            params: {
                symptomId: symptom.id,
                solutionId: solution.id,
                message: solution.name
            }
        }
        this.addConditions(rule, symptom, potential);
        if (solution.askDidItWork) {
            rule.conditions.all.push({fact: solution.id, operator: 'equal', value: 'yes'});
            // @ts-ignore
            this.engine.addFact(solution.id, function (params, almanac) {
                return new Promise<any>((resolve, reject) => {
                    if (self.solutionCallback) {
                        console.log('Checking to see if this worked...', solution);
                        return self.solutionCallback(solution).then((answer) => {
                            resolve(answer);
                        }, (reason) => {
                            reject(reason);
                        });
                    }
                    else {
                        return reject();
                    }
                });
            }, {cache: false, priority: self.factPriority--});
        }
        return new Rule(rule);
    }

    private createRuleForRootCause(symptom:Symptom, potential:PotentialRootCause, root:Symptom):Rule {
        const rule: any = {};
        rule.name = symptom.name + ': ' + root.name;
        rule.event = {
            type: 'addSymptom',
            params: {
                symptomId: symptom.id,
                causeId: root.id,
                message: root.name
            }
        }
        this.addConditions(rule, symptom, potential);
        return new Rule(rule);
    }

    private addConditions (rule:any, symptom:Symptom, potential:PotentialRootCause|PotentialSolution):void {
        const self = this;
        rule.conditions = {
            all: [
                {
                    fact: 'symptoms',
                    operator: 'contains',
                    value: symptom.id
                }
            ]
        };
        if (potential.systemTypes && potential.systemTypes.length) {
            rule.conditions.all.push(
                {
                    fact: 'systemTypes',
                    operator: 'containsOneOf',
                    value: potential.systemTypes
                });
        }
        if (potential.mustBeYes) {
            potential.mustBeYes.forEach((diagnosticId) => {
                rule.conditions.all.push(
                    {
                        fact: diagnosticId,
                        operator: 'equal',
                        value: 'yes'
                    });
                self.createDiagnosticFact(diagnosticId);
            });
        }
        potential.mustBeNo && potential.mustBeNo.forEach((diagnosticId) => {
            rule.conditions.all.push(
                {
                    fact: diagnosticId,
                    operator: 'equal',
                    value: 'no'
                });
            self.createDiagnosticFact(diagnosticId);
        });
    }

    private addRules (rules:Rule[] = []):void {
        let priority = rules.length + 1;
        rules.forEach((rule) => {
            rule.setPriority(priority--);
            this.engine.addRule(rule);
        });
    }

    public getEngine ():Engine {
        return this.engine;
    }

}

export {
    DiagnosticEngine,
    EngineResult,
    Engine,
    Rule,
    Fact,
    Almanac,
    RuleResult,
    Diagnostic,
    Solution,
    Symptom
}