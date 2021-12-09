import * as xorshift from 'xorshift';

export const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

export const currentTimestamp = () => { return new Date().getTime(); };

export class Randomizer {
    private xorshift: any;
    constructor(seed: number[]) {
        this.xorshift = new xorshift.XorShift(seed);
    }
    public randomInt(min: number, max: number): number {
        return Math.floor(min + this.xorshift.random() * (max - min));
    }
}