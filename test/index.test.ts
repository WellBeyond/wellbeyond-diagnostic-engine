// @ts-ignore
import {
    Diagnostics,
    IFactQuestion,
    ISolution,
    ISymptom,
} from '../src/index';

let symptoms:ISymptom[] = [
    {
        id: 'Symptom1',
        name: 'Water tastes bad',
        solutions: [
            {solutionId: 'Solution1'}
        ],
        causes: []
    }
];

let solutions:ISolution[] = [
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
        instructions: []
    },
    {
        id: 'Solution2',
        name: 'Change the filter',
        conditions: [
            {
                factId: 'Question1',
                relationship: '==',
                value: 'yes'
            }
        ],
        instructions: []
    }
];

let questions:IFactQuestion[] = [
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

const answerYes = async function (_question:IFactQuestion) {
    const promise = new Promise<string>((resolve, _reject) => {
        setTimeout(() => {
            resolve('yes');
        }, 1000);
    });
    return promise;
}

const answerNo = async function (_question:IFactQuestion) {
    const promise = new Promise<string>((resolve, _reject) => {
        setTimeout(() => {
            resolve('no');
        }, 1000);
    });
    return promise;
}


describe('Test diagnostics', () => {
    it('can run a simple rulebase that succeeds', async() => {
        const diagnostics = new Diagnostics(symptoms, solutions, questions, answerYes);
        await diagnostics.run(['Symptom1'])
    });
    it('can run a simple rulebase that fails', async() => {
        const diagnostics = new Diagnostics(symptoms, solutions, questions, answerNo);
        await diagnostics.run(['Symptom1'])
    });
});


