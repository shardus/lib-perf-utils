export interface NodeLoad {
    internal: number;
    external: number;
}
export declare let profilerInstance: Profiler;
export declare class Profiler {
    sectionTimes: any;
    scopedSectionTimes: any;
    eventCounters: Map<string, Map<string, number>>;
    stackHeight: number;
    netInternalStackHeight: number;
    netExternalStackHeight: number;
    statistics: any;
    nodeInfo: any;
    nodeType: string;
    handlers: any;
    constructor(nodeType: string);
    setStatistics: (statistics: any) => void;
    setNodeInfo: (nodeInfo: any) => void;
    perfHandler: (req: any, res: any) => void;
    perfScopedHandler: (req: any, res: any) => void;
    combinedDebugHandler: (req: any, res: any) => Promise<void>;
    setStatisticsInstance: (statistics: any) => void;
    profileSectionStart: (sectionName: string, internal?: boolean) => void;
    profileSectionEnd: (sectionName: string, internal?: boolean) => void;
    scopedProfileSectionStart: (sectionName: string, internal?: boolean) => void;
    scopedProfileSectionEnd: (sectionName: string, internal?: boolean) => void;
    cleanInt: (x: any) => number;
    getTotalBusyInternal: () => any;
    clearTimes: () => void;
    clearScopedTimes: () => void;
    printAndClearReport: (delta?: number) => string;
    printAndClearScopedReport: (delta?: number) => string;
}
