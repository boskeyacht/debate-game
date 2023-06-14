type Context = 'context';
type NoContext = 'no context';

interface Prompt {
    message: string;
    type: Context | NoContext;
    fillAttributes(attributes: { original: string, replacement: string }[]): string;
}

export class ScoreArgumentContext implements Prompt {
    message: string;
    type: Context;

    constructor() {
        this.message = `You are a judge in a debate between two opposing sides whose job is to return a score between 0 and 100 for the following argument: {{argument}}. Consider the previous argument: {{previous_argument}} along with following attributes: 
        relevance, clarity, evidence, and persuasiveness. Return your answer as a JSON object with the following format: { "score": 0 }. Do not include any other information in your response other than the JSON object.`;
        this.type = 'context';
    }

    fillAttributes(attributes: { original: string, replacement: string }[]): string {
        attributes.map(attribute => {
            this.message = this.message.replace(attribute.original, attribute.replacement);
        });

        return this.message;
    }
}

export class ScoreArgumentNoContext implements Prompt {
    message: string;
    type: NoContext;

    constructor() {
        this.message = `You are a judge in a debate between two opposing sides whose job is to return a score between 0 and 100 for the following argument: {{argument}}. Consider the following attributes: relevance, clarity, evidence, and persuasiveness.
        Return your answer as a JSON object with the following format: { "score": 0 }. Do not include any other information in your response other than the JSON object.`;
        this.type = 'no context';
    }

    fillAttributes(attributes: { original: string, replacement: string }[]): string {
        attributes.map(attribute => {
            this.message = this.message.replace(attribute.original, attribute.replacement);
        });

        return this.message;
    }
}

export type ScoreResponse = {
    score: number;
}