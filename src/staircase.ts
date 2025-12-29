export interface StaircaseStep {
    x: number;
    y: number;
}

export interface CombinedStep {
    x: number;
    y_top: number;
    y_bot: number;
}

export class Staircase {
    private steps: StaircaseStep[] = [];

    constructor(steps: StaircaseStep[] = []) {
        this.steps = steps;
    }

    addStep(x: number, y: number) {
        this.steps.push({ x, y });
    }

    getSteps(): ReadonlyArray<StaircaseStep> {
        return this.steps;
    }

    get size(): number {
        return this.steps.length;
    }

    at(index: number): StaircaseStep | undefined {
        return this.steps[index];
    }
}
