// @ts-ignore
import { Engine, Rule, Fact, Almanac, RuleResult, Event } from 'json-rules-engine';
import {FactQuestion, Solution, Symptom, RootCause} from "./types";

const OPERATORS:{[key:string]:string} = {
    '==': 'equal',
    '<': 'lessThan',
    '<=': 'lessThanInclusive',
    '>': 'greaterThan',
    '>=': 'greaterThanInclusive',
}

export type QuestionCallback = {
    (question:FactQuestion): Promise<string|number>;
}

export type SolutionCallback = {
    (solution:Solution): Promise<string>;
}

class Diagnostics {
    private readonly engine: Engine;
    private readonly symptoms: Symptom[];
    private readonly questions: {
        [factId:string]: FactQuestion
    }
    private factCreated: {
        [factId:string]: boolean
    }
    private readonly solutions: {
        [solutionId:string]: Solution
    }
    private rules: Rule[];
    private questionCallback:QuestionCallback;
    private areYouAbleCallback:SolutionCallback;
    private didItWorkCallback:SolutionCallback;
    private factPriority:number;

    public constructor (symptoms:Symptom[], solutions:Solution[], questions:FactQuestion[],
                        questionCallback:QuestionCallback, areYouAbleCallback:SolutionCallback, didItWorkCallback:SolutionCallback) {
        this.engine = new Engine([], {allowUndefinedFacts: false});
        this.symptoms = symptoms || [];
        this.solutions = {};
        this.questions = {};
        this.factCreated = {};
        this.rules = [];
        this.questionCallback = questionCallback;
        this.areYouAbleCallback = areYouAbleCallback;
        this.didItWorkCallback = didItWorkCallback;
        solutions.forEach((solution) => {
            this.solutions[solution.id] = solution;
        });
        questions.forEach((question) => {
            this.questions[question.id] = question;
        });
        this.factPriority = Object.keys(this.questions).length + (2 * Object.keys(this.solutions).length);
        this.parse();
    }

    public async run(symptoms:[string]): Promise<void> {
        this.engine.addFact('symptoms', symptoms);

        this.engine
            .on('success', event => {
                console.log('success', event)
            })
            .on('failure', event => {
                console.log('failure', event)
            });

        try {
            await this.engine.run();
        }
        catch (e) {
            console.log(e);
        }

    }

    private parse ():void {
        const self = this;
        self.symptoms.forEach((symptom) => {
            symptom.solutions && symptom.solutions.forEach((potential) => {
                const solution = this.solutions[potential.solutionId];
                if (solution) {
                    const rule = this.createRuleForSolution(symptom, solution);
                    this.rules.push(rule);
                }
            });
            symptom.causes && symptom.causes.forEach((cause) => {
                const root = this.symptoms.find(s => s.id === cause.symptomId);
                if (root) {
                    const rule = this.createRuleForRootCause(symptom, cause, root);
                    this.rules.push(rule);
                }
            });
        });
        self.addRules(self.rules);
    }

    private createFact(factId:string) {
        const self = this;
        if (factId && !self.factCreated[factId]) {
            self.factCreated[factId] = true;
            // @ts-ignore
            this.engine.addFact('fact:' + factId, function (params, almanac) {
                return new Promise<any>((resolve, reject) => {
                    const question = self.questions[factId];
                    if (question) {
                        return self.questionCallback(question).then((answer) => {
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

    private createRuleForSolution(symptom:Symptom, solution:Solution):Rule {
        const self = this;
        const rule: any = {};
        rule.name = symptom.name + ': ' + solution.name;
        rule.event = {
            type: 'solved',
            params: {
                symptomId: symptom.id,
                solutionId: solution.id,
                message: solution.name
            }
        }
        rule.conditions = {
            all: [
                {
                    fact: 'symptoms',
                    operator: 'contains',
                    value: symptom.id
                }
            ]
        };
        solution.conditions && solution.conditions.forEach((condition) => {
            rule.conditions.all.push({
                fact: 'fact:' + condition.factId,
                operator: OPERATORS[condition.relationship] || condition.relationship,
                value: condition.value
            });
            self.createFact(condition.factId);
        });
        if (solution.askAreYouAble) {
            rule.conditions.all.push({fact: 'able:' + solution.id, operator: 'equal', value: 'yes'});
            if (!self.factCreated['able:' + solution.id]) {
                self.factCreated['able:' + solution.id] = true;
                // @ts-ignore
                this.engine.addFact('able:' + solution.id, function (params, almanac) {
                    return new Promise<any>((resolve, reject) => {
                        return self.areYouAbleCallback(solution).then((answer) => {
                            resolve(answer);
                        }, (reason) => {
                            reject(reason);
                        });
                    });
                }, {cache: false, priority: self.factPriority--});
            }
        }
        if (solution.askDidItWork) {
            rule.conditions.all.push({fact: 'worked:' + solution.id, operator: 'equal', value: 'yes'});
            if (!self.factCreated['worked:' + solution.id]) {
                self.factCreated['worked:' + solution.id] = true;
                // @ts-ignore
                this.engine.addFact('worked:' + solution.id, function (params, almanac) {
                    return new Promise<any>((resolve, reject) => {
                        return self.didItWorkCallback(solution).then((answer) => {
                            resolve(answer);
                        }, (reason) => {
                            reject(reason);
                        });
                    });
                }, {cache: false, priority: self.factPriority--});
            }
        }
        return new Rule(rule);
    }

    private createRuleForRootCause(symptom:Symptom, cause:RootCause, root:Symptom):Rule {
        const self = this;
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
        rule.conditions = {
            all: [
                {
                    fact: 'symptoms',
                    operator: 'contains',
                    value: symptom.id
                }
            ]
        };
        cause.conditions && cause.conditions.forEach((condition) => {
            rule.conditions.all.push({
                fact: 'ask:' + condition.factId,
                operator: OPERATORS[condition.relationship] || condition.relationship,
                value: condition.value
            });
            self.createFact(condition.factId);
        });
        return new Rule(rule);
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
    Diagnostics,
    Engine,
    Rule,
    Fact,
    Almanac,
    RuleResult,
    FactQuestion,
    Solution,
    Symptom,
    RootCause
}