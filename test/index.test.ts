// @ts-ignore
import {
    Diagnostics,
    FactQuestion,
    Solution,
    Symptom,
} from '../src/index';

let symptoms:Symptom[] = [
    {
        id: 'Symptom1',
        name: 'Water tastes bad',
        solutions: [
            {solutionId: 'Solution1'}
        ],
        causes: []
    }
];

let solutions:Solution[] = [
    {
        id: 'Solution1',
        name: 'Change the filter',
        conditions: [
            {
                factId: 'Question1',
                relationship: '==',
                value: 'yes'
            }
        ],
        instructions: [],
        askAreYouAble: true,
        askDidItWork: true
    },
    {
        id: 'Solution2',
        name: 'Do something else',
        conditions: [
            {
                factId: 'Question1',
                relationship: '==',
                value: 'no'
            }
        ],
        instructions: [],
        askAreYouAble: false,
        askDidItWork: false
    }
];

let questions:FactQuestion[] = [
    {
        id: 'Question1',
        name: 'Spare filters',
        questionText: 'Do you have spare filters?',
        questionType: 'yes-no'
    },
    {
        id: 'Question2',
        name: 'Irrelevant',
        questionText: 'Is this question relevant?',
        questionType: 'yes-no'
    }
];

const answerYes = async function (_question:FactQuestion|Solution) {
    const promise = new Promise<string>((resolve, _reject) => {
        setTimeout(() => {
            resolve('yes');
        }, 1000);
    });
    return promise;
}

const answerNo = async function (_question:FactQuestion|Solution) {
    const promise = new Promise<string>((resolve, _reject) => {
        setTimeout(() => {
            resolve('no');
        }, 1000);
    });
    return promise;
}


describe('Test diagnostics', () => {
    it('can run a simple rulebase that succeeds', async() => {
        const diagnostics = new Diagnostics().initialize(symptoms, solutions, questions, answerYes, answerYes, answerYes);
        await diagnostics.run(['Symptom1'])
    });
    it('can run a simple rulebase that fails', async() => {
        const diagnostics = new Diagnostics().initialize(symptoms, solutions, questions, answerNo, answerYes, answerYes);
        await diagnostics.run(['Symptom1'])
    });
});


