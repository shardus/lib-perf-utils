/// <reference types="node" />
import { Readable } from 'stream';
import { EventEmitter } from 'events';
export declare let statisticsInstance: Statistics;
export interface Statistics {
    intervalDuration: number;
    context: any;
    counterDefs: any[];
    watcherDefs: any;
    timerDefs: {
        [name: string]: TimerRing;
    };
    manualStatDefs: any[];
    interval: NodeJS.Timeout | null;
    snapshotWriteFns: any[];
    stream: Readable | null;
    streamIsPushable: boolean;
    counters: any;
    watchers: any;
    timers: any;
    manualStats: {
        [name: string]: ManualRing;
    };
}
export declare class Statistics extends EventEmitter {
    constructor(baseDir: string, config: any, { counters, watchers, timers, manualStats, }: {
        counters: string[];
        watchers: any;
        timers: any;
        manualStats: string[];
    }, context: any);
    initialize: () => void;
    getStream: () => Readable;
    writeOnSnapshot: (writeFn: Function, context: any) => void;
    startSnapshots: () => void;
    stopSnapshots: () => void;
    incrementCounter: (counterName: string) => void;
    setManualStat: (manualStatName: string, value: number) => void;
    getCurrentCount: (counterName: string) => any;
    getCounterTotal: (counterName: string) => any;
    getWatcherValue: (watcherName: string) => any;
    startTimer: (timerName: string, id: string) => void;
    stopTimer: (timerName: string, id: string) => void;
    getAverage: (name: string) => any;
    getMultiStatReport: (name: string) => any;
    clearRing: (name: any) => any;
    getPreviousElement: (name: string) => any;
    _initializeCounters: (counterDefs?: string[]) => {
        [key: string]: any;
    };
    _initializeWatchers: (watcherDefs: {
        [key: string]: Function;
    }, context: any) => {
        [key: string]: any;
    };
    _initializeTimers: (timerDefs?: any) => any;
    _initializeManualStats: (counterDefs?: any[]) => {
        [key: string]: any;
    };
    _takeSnapshot: () => void;
    _pushToStream: (data: any) => void;
}
interface Ring {
    elements: any[];
    index: number;
    length: number;
}
declare class Ring {
    constructor(length: number);
    multiStats: () => {
        min: number;
        max: number;
        avg: number;
        allVals: any[];
    };
    save: (value: any) => void;
    average: () => number;
    previous: () => any;
    clear(): void;
}
interface TimerRing {
    ids: any;
    ring: Ring;
}
declare class TimerRing {
    constructor(length: number);
    start: (id: string) => void;
    stop: (id: string) => void;
    snapshot: () => void;
}
interface ManualRing {
    ring: Ring;
}
declare class ManualRing {
    constructor(length: number);
    manualSetValue: (value: any) => void;
    snapshot: () => void;
}
export {};
