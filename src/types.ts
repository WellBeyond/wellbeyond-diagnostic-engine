interface MediaInfo {
    url: string;
    title: string;
    description: string;
}
interface SolutionStep {
    step: string;
}
export interface Condition {
    factId: string;
    relationship: string;
    value: string|boolean|number;
}
export interface RootCause {
    symptomId: string;
    conditions: Condition[];
}
export interface PotentialSolution {
    solutionId: string;
}

export interface FactQuestion {
    id: string;
    name: string;
    description?: string;
    questionType: 'yes-no'|'choose-one'|'number';
    questionText: string;
    photos?: MediaInfo[];
    videos?: MediaInfo[];
}

export interface Solution {
    id: string;
    name: string;
    description?: string;
    askAreYouAble?: boolean;
    askForPhotoBefore?: boolean;
    askForPhotoAfter?: boolean;
    askDidItWork?: boolean;
    conditions: Condition[];
    instructions: SolutionStep[];
    photos?: MediaInfo[];
    videos?: MediaInfo[];
}

export interface Symptom {
    id: string;
    name: string;
    description?: string;
    solutions: PotentialSolution[];
    causes: RootCause[];
    photos?: MediaInfo[];
    videos?: MediaInfo[];
}