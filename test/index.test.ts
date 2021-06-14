// @ts-ignore
import {
    DiagnosticEngine,
    Diagnostic,
    Solution,
    Symptom,
} from '../src/index';

let symptoms:Symptom[] = [
    {
        id: 'Symptom1',
        name: 'Water tastes bad',
        rules: [
            {
                solutionId: 'Solution1',
                systemTypes: [
                    'Type1',
                    'Type2'
                ],
                mustBeYes: [
                    'Question1'
                ],
                mustBeNo: [

                ]
            }
        ],
        rootCauses: []
    }
];

let solutions:Solution[] = [
    {
        id: 'Solution1',
        symptomId: 'Symptom1',
        name: 'Change the filter',
        instructions: 'Take out the old and put in the new',
        askDidItWork: true
    },
    {
        id: 'Solution2',
        symptomId: 'Symptom1',
        name: 'Do something else',
        instructions: 'Just try anything',
        askDidItWork: false
    }
];

let diagnostics:Diagnostic[] = [
    {
        id: 'Question1',
        symptomId: 'Symptom1',
        name: 'Do you have spare filters?'
    },
    {
        id: 'Question2',
        symptomId: 'Symptom1',
        name: 'Is this question relevant?'
    }
];

const answerYes = async function (_question:Diagnostic|Solution) {
    const promise = new Promise<string>((resolve, _reject) => {
        setTimeout(() => {
            resolve('yes');
        }, 1000);
    });
    return promise;
}

const answerNo = async function (_question:Diagnostic|Solution) {
    const promise = new Promise<string>((resolve, _reject) => {
        setTimeout(() => {
            resolve('no');
        }, 1000);
    });
    return promise;
}


describe('Test diagnostics', () => {
    it('can run a simple rulebase that succeeds', async() => {
        const engine = new DiagnosticEngine().initialize(symptoms, solutions, diagnostics, answerYes, answerYes);
        await engine.run(['Symptom1'], ['Type1']);
    });
    it('can run a simple rulebase that fails', async() => {
        const engine = new DiagnosticEngine().initialize(symptoms, solutions, diagnostics, answerNo, answerYes);
        await engine.run(['Symptom1'], ['Type1']);
    });
    it('can run another simple rulebase that fails', async() => {
        const engine = new DiagnosticEngine().initialize(symptoms, solutions, diagnostics, answerYes, answerNo);
        await engine.run(['Symptom1'], ['Type1']);
    });
    it('can run yet another simple rulebase that fails', async() => {
        const engine = new DiagnosticEngine().initialize(symptoms, solutions, diagnostics, answerYes, answerYes);
        await engine.run(['Symptom1'], ['TypeB']);
    });
});


