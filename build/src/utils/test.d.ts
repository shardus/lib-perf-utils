declare type Comparator<T, E = T> = (a: E, b: T) => number;
export declare const sleep: (ms: number) => Promise<unknown>;
export declare function insertSorted<T>(arr: T[], item: T, comparator?: Comparator<T>): void;
export declare const computeMedian: (arr?: any[], sort?: boolean) => any;
export declare function binarySearch<T, E = Partial<T>>(arr: T[], el: E, comparator?: Comparator<T, typeof el>): number;
export declare const makeShortHash: (x: any, n?: number) => any;
export declare const replyResult: (res: any, result: any) => void;
export {};
