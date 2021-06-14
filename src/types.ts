interface MediaInfo {
    url: string;
    title: string;
    description: string;
}

export interface PotentialRootCause {
    symptomId: string;
    systemTypes?: string[];
    mustBeNo?: string[];
    mustBeYes?: string[];
}

export interface PotentialSolution {
    solutionId: string;
    systemTypes?: string[];
    mustBeNo?: string[];
    mustBeYes?: string[];
}

export interface Diagnostic {
    id: string;
    symptomId: string;
    name: string;
    photos?: MediaInfo[];
    videos?: MediaInfo[];
}

export interface Solution {
    id: string;
    symptomId: string;
    name: string;
    askForPhotoBefore?: boolean;
    askForPhotoAfter?: boolean;
    askDidItWork?: boolean;
    instructions?: string;
    photos?: MediaInfo[];
    videos?: MediaInfo[];
}

export interface Symptom {
    id: string;
    name: string;
    description?: string;
    rules: PotentialSolution[];
    rootCauses: PotentialRootCause[];
    photos?: MediaInfo[];
    videos?: MediaInfo[];
}