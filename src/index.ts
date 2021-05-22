// @ts-ignore
import { Engine, Rule, Fact, Almanac, RuleResult, Event } from 'json-rules-engine';
import {IFactQuestion, ISolution, ISymptom, IRootCause} from "./types";

const OPERATORS:{[key:string]:string} = {
    '==': 'equal',
    '<': 'lessThan',
    '<=': 'lessThanInclusive',
    '>': 'greaterThan',
    '>=': 'greaterThanInclusive',
}

export type QuestionCallback = {
    (question:IFactQuestion): Promise<string|number>;
}

class Diagnostics {
    private readonly engine: Engine;
    private readonly symptoms: ISymptom[];
    private readonly questions: {
        [factId:string]: IFactQuestion
    }
    private readonly solutions: {
        [solutionId:string]: ISolution
    }
    private rules: Rule[];
    private questionCallback:QuestionCallback;

    public constructor (symptoms:ISymptom[], solutions:ISolution[], questions:IFactQuestion[], questionCallback:QuestionCallback) {
        this.engine = new Engine([], {allowUndefinedFacts: false});
        this.symptoms = symptoms || [];
        this.solutions = {};
        this.questions = {};
        this.rules = [];
        this.questionCallback = questionCallback;
        solutions.forEach((solution) => {
            this.solutions[solution.id] = solution;
        });
        questions.forEach((question) => {
            this.questions[question.id] = question;
        });
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
        this.symptoms.forEach((symptom) => {
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
        this.addRules(this.rules);

        for (let key in this.questions) {
            const self = this;
            // @ts-ignore
            this.engine.addFact('fact:'+key, function (params, almanac) {
                return new Promise<any> ((resolve, reject) => {
                    const question = self.questions[key];
                    if (question) {
                        return self.questionCallback(question).then((answer) => {
                            resolve(answer);
                        }, (reason) => {
                            reject(reason);
                        })
                    }
                    else {
                        return reject();
                    }
                })
            })
        }
    }

    private createRuleForSolution(symptom:ISymptom, solution:ISolution):Rule {
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
        });
        if (solution.askAreYouAble) {
            rule.conditions.all.push({fact: 'able:' + solution.id, operator: 'equal', value: 'yes'})
        }
        if (solution.askDidItWork) {
            rule.conditions.all.push({fact: 'worked:' + solution.id, operator: 'equal', value: 'yes'})
        }
        return new Rule(rule);
    }

    private createRuleForRootCause(symptom:ISymptom, cause:IRootCause, root:ISymptom):Rule {
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
    IFactQuestion,
    ISolution,
    ISymptom,
    IRootCause
}