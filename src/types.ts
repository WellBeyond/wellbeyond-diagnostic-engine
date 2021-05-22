interface IMediaInfo {
    url: string;
    title: string;
    description: string;
}
interface ISolutionStep {
    step: string;
}
export interface ICondition {
    factId: string;
    relationship: string;
    value: string|boolean|number;
}
export interface IRootCause {
    symptomId: string;
    conditions: ICondition[];
}
export interface IPotentialSolution {
    solutionId: string;
}

export interface IFactQuestion {
    id: string;
    name: string;
    description?: string;
    questionType: 'yes-no'|'choose-one'|'number';
    questionText: string;
    photos?: IMediaInfo[];
    videos?: IMediaInfo[];
}

export interface ISolution {
    id: string;
    name: string;
    description?: string;
    askAreYouAble?: boolean;
    askForPhotoBefore?: boolean;
    askForPhotoAfter?: boolean;
    askDidItWork?: boolean;
    conditions: ICondition[];
    instructions: ISolutionStep[];
    photos?: IMediaInfo[];
    videos?: IMediaInfo[];
}

export interface ISymptom {
    id: string;
    name: string;
    description?: string;
    solutions: IPotentialSolution[];
    causes: IRootCause[];
    photos?: IMediaInfo[];
    videos?: IMediaInfo[];
}