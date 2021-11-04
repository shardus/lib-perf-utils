export interface MemoryReporting {
}
export declare let memoryReportingInstance: MemoryReporting;
declare type MemItem = {
    category: string;
    subcat: string;
    itemKey: string;
    count: number;
};
export declare class MemoryReporting {
    report: MemItem[];
    shardus: any;
    lastCPUTimes: any[];
    statistics: any;
    stateManager: any;
    cycleCreator: any;
    nodeList: any;
    handlers: any;
    constructor(shardus: any, statistics: any, stateManager: any, cycleCreator: any, nodeList: any);
    setStatistics: (statistics: any) => void;
    memoryHandler: (req: any, res: any) => Promise<void>;
    memoryShortHandler: (req: any, res: any) => Promise<void>;
    memoryGcHandler: (req: any, res: any) => void;
    scaleFactorHandler: (req: any, res: any) => void;
    nodeListHandler: (req: any, res: any) => void;
    addNodesToReport: () => void;
    getMemoryStringBasic: () => string;
    updateCpuPercent: () => void;
    addToReport: (category: string, subcat: string, itemKey: string, count: number) => void;
    reportToStream: (report: MemItem[], indent: any) => string;
    gatherReport: () => void;
    gatherStateManagerReport: () => void;
    getCPUTimes: () => any[];
    cpuPercent: () => number;
    roundTo3decimals: (num: any) => number;
    systemProcessReport: () => void;
}
export {};
