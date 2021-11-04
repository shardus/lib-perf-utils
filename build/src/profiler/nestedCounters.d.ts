export interface NestedCounters {
}
declare type CounterMap = Map<string, CounterNode>;
interface CounterNode {
    count: number;
    subCounters: CounterMap;
}
export declare let nestedCountersInstance: NestedCounters;
export declare class NestedCounters {
    eventCounters: Map<string, CounterNode>;
    rareEventCounters: Map<string, CounterNode>;
    infLoopDebug: boolean;
    handlers: any;
    crypto: any;
    constructor(crypto: any);
    counts: (req: any, res: any) => void;
    countsReset: (req: any, res: any) => void;
    rareCountReset: (req: any, res: any) => void;
    debugInfLoop: (req: any, res: any) => void;
    countEvent: (category1: string, category2: string, count?: number) => void;
    countRareEvent: (category1: string, category2: string, count?: number) => void;
    arrayitizeAndSort: (counterMap: CounterMap) => any[];
    printArrayReport: (arrayReport: any, indent?: number) => string;
}
export {};
