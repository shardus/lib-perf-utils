"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryReporting = exports.memoryReportingInstance = void 0;
const nestedCounters_1 = require("./nestedCounters");
const process_1 = require("process");
const StringifyReduce_1 = require("./StringifyReduce");
const os = require('os');
const process = require('process');
const { makeShortHash, replyResult } = require('../utils/test');
class MemoryReporting {
    constructor(shardus, statistics, stateManager, cycleCreator, nodeList) {
        this.setStatistics = (statistics) => {
            this.statistics = statistics;
        };
        this.memoryHandler = async (req, res) => {
            let toMB = 1 / 1000000;
            let report = process.memoryUsage();
            let result = '';
            result += `System Memory Report.  Timestamp: ${Date.now()}\n`;
            result += `rss: ${(report.rss * toMB).toFixed(2)} MB\n`;
            result += `heapTotal: ${(report.heapTotal * toMB).toFixed(2)} MB\n`;
            result += `heapUsed: ${(report.heapUsed * toMB).toFixed(2)} MB\n`;
            result += `external: ${(report.external * toMB).toFixed(2)} MB\n`;
            result += `arrayBuffers: ${(report.arrayBuffers * toMB).toFixed(2)} MB\n\n\n`;
            this.gatherReport();
            result += this.reportToStream(this.report, 0);
            replyResult(res, result);
        };
        this.memoryShortHandler = async (req, res) => {
            nestedCounters_1.nestedCountersInstance.countRareEvent('test', `memory-short`); // only here to so we can test the rare event counter system
            let toMB = 1 / 1000000;
            let report = process.memoryUsage();
            let result = '';
            result += `System Memory Report.  Timestamp: ${Date.now()}\n`;
            result += `rss: ${(report.rss * toMB).toFixed(2)} MB\n`;
            result += `heapTotal: ${(report.heapTotal * toMB).toFixed(2)} MB\n`;
            result += `heapUsed: ${(report.heapUsed * toMB).toFixed(2)} MB\n`;
            result += `external: ${(report.external * toMB).toFixed(2)} MB\n`;
            result += `arrayBuffers: ${(report.arrayBuffers * toMB).toFixed(2)} MB\n`;
            replyResult(res, result);
        };
        this.memoryGcHandler = (req, res) => {
            let result = '';
            result += `System Memory Report.  Timestamp: ${Date.now()}\n`;
            try {
                if (global.gc) {
                    global.gc();
                    result += 'garbage collected!';
                }
                else {
                    result += 'No access to global.gc.  run with node --expose-gc';
                }
            }
            catch (e) {
                result += 'ex:No access to global.gc.  run with node --expose-gc';
            }
            replyResult(res, result);
        };
        this.scaleFactorHandler = (req, res) => {
            let result = '';
            result += `Scale debug  Timestamp: ${Date.now()}\n`;
            try {
                if (this.cycleCreator)
                    result += `CycleAutoScale.  ${this.cycleCreator.scaleFactor}`;
            }
            catch (e) {
                result += JSON.stringify(e);
            }
            replyResult(res, result);
        };
        this.nodeListHandler = (req, res) => {
            let result = '';
            this.report = [];
            this.addNodesToReport();
            result += '\n';
            result += this.reportToStream(this.report, 0);
            result += '\n';
            replyResult(res, result);
        };
        this.addNodesToReport = () => {
            if (this.nodeList && this.nodeList.activeByIdOrder) {
                let allNodeIds = [];
                for (let node of this.nodeList.activeByIdOrder) {
                    allNodeIds.push(makeShortHash(node.id));
                }
                this.addToReport('P2P', 'Nodelist', `${StringifyReduce_1.stringifyReduce(allNodeIds)}`, 1);
            }
        };
        this.getMemoryStringBasic = () => {
            let toMB = 1 / 1000000;
            let report = process.memoryUsage();
            let outStr = `rss: ${(report.rss * toMB).toFixed(2)} MB`;
            //todo integrate this into the main stats tsv
            if (this.shardus && this.shardus.stateManager) {
                let numActiveNodes = this.nodeList.activeByIdOrder.length;
                let queueCount = this.shardus.stateManager.transactionQueue.newAcceptedTxQueue.length;
                let archiveQueueCount = this.shardus.stateManager.transactionQueue.archivedQueueEntries.length;
                outStr += ` nds:${numActiveNodes} qCt:${queueCount} aAr:${archiveQueueCount}`;
            }
            outStr += '\n';
            return outStr;
        };
        this.updateCpuPercent = () => {
            let cpuPercent = exports.memoryReportingInstance.cpuPercent();
            this.statistics.setManualStat('cpuPercent', cpuPercent);
        };
        this.addToReport = (category, subcat, itemKey, count) => {
            let obj = { category, subcat, itemKey, count };
            this.report.push(obj);
        };
        this.reportToStream = (report, indent) => {
            let outputStr = '';
            let indentText = '___'.repeat(indent);
            for (let item of report) {
                let { category, subcat, itemKey, count } = item;
                let countStr = `${count}`;
                outputStr += `${countStr.padStart(10)} ${category} ${subcat} ${itemKey}\n`;
            }
            return outputStr;
        };
        this.gatherReport = () => {
            this.report = [];
            this.gatherStateManagerReport();
            this.systemProcessReport();
        };
        this.gatherStateManagerReport = () => {
            if (this.shardus && this.shardus.stateManager) {
                if (this.nodeList.activeByIdOrder) {
                    let numActiveNodes = this.nodeList.activeByIdOrder.length;
                    this.addToReport('P2P', 'Nodelist', 'numActiveNodes', numActiveNodes);
                }
                let cacheCount = this.shardus.stateManager.accountCache.accountsHashCache3.workingHistoryList.accountIDs.length;
                this.addToReport('StateManager', 'AccountsCache', 'workingAccounts', cacheCount);
                let cacheCount2 = this.shardus.stateManager.accountCache.accountsHashCache3.accountHashMap.size;
                this.addToReport('StateManager', 'AccountsCache', 'mainMap', cacheCount2);
                let queueCount = this.shardus.stateManager.transactionQueue.newAcceptedTxQueue.length;
                this.addToReport('StateManager', 'TXQueue', 'queueCount', queueCount);
                let pendingQueueCount = this.shardus.stateManager.transactionQueue.newAcceptedTxQueueTempInjest.length;
                this.addToReport('StateManager', 'TXQueue', 'pendingQueueCount', pendingQueueCount);
                let archiveQueueCount = this.shardus.stateManager.transactionQueue.archivedQueueEntries.length;
                this.addToReport('StateManager', 'TXQueue', 'archiveQueueCount', archiveQueueCount);
                for (let syncTracker of this.shardus.stateManager.accountSync.syncTrackers) {
                    let partition = `${StringifyReduce_1.stringifyReduce(syncTracker.range.low)} - ${StringifyReduce_1.stringifyReduce(syncTracker.range.high)}`;
                    this.addToReport('StateManager', 'SyncTracker', `isGlobal:${syncTracker.isGlobalSyncTracker} started:${syncTracker.syncStarted} finished:${syncTracker.syncFinished} partition:${partition}`, 1);
                }
                let inSync = !this.shardus.stateManager.accountPatcher.failedLastTrieSync;
                this.addToReport('Patcher', 'insync', `${inSync}`, 1);
                this.addToReport('Patcher', 'history', JSON.stringify(this.shardus.stateManager.accountPatcher.syncFailHistory), 1);
                this.addToReport('Patcher', 'insync', `${inSync}`, 1);
            }
        };
        this.getCPUTimes = () => {
            const cpus = os.cpus();
            let times = [];
            for (let cpu of cpus) {
                let timeObj = {};
                let total = 0;
                for (const [key, value] of Object.entries(cpu.times)) {
                    let time = Number(value);
                    total += time;
                    timeObj[key] = value;
                }
                timeObj['total'] = total;
                times.push(timeObj);
            }
            return times;
        };
        this.cpuPercent = () => {
            let currentTimes = this.getCPUTimes();
            let deltaTimes = [];
            let percentTimes = [];
            let percentTotal = 0;
            for (let i = 0; i < currentTimes.length; i++) {
                const currentTimeEntry = currentTimes[i];
                const lastTimeEntry = this.lastCPUTimes[i];
                let deltaTimeObj = {};
                for (const [key, value] of Object.entries(currentTimeEntry)) {
                    deltaTimeObj[key] = currentTimeEntry[key] - lastTimeEntry[key];
                }
                deltaTimes.push(deltaTimeObj);
                for (const [key, value] of Object.entries(currentTimeEntry)) {
                    percentTimes[key] = deltaTimeObj[key] / deltaTimeObj['total'];
                }
                percentTotal += (percentTimes['user'] || 0);
                percentTotal += (percentTimes['nice'] || 0);
                percentTotal += (percentTimes['sys'] || 0);
            }
            this.lastCPUTimes = currentTimes;
            return percentTotal / currentTimes.length;
        };
        this.roundTo3decimals = (num) => {
            return Math.round((num + Number.EPSILON) * 1000) / 1000;
        };
        this.systemProcessReport = () => {
            this.addToReport('Process', 'CPU', 'cpuPercent', this.roundTo3decimals(this.cpuPercent() * 100));
            let avgCPU = this.statistics.getAverage('cpuPercent');
            this.addToReport('Process', 'CPU', 'cpuAVGPercent', this.roundTo3decimals(avgCPU * 100));
            let multiStats = this.statistics.getMultiStatReport('cpuPercent');
            multiStats.allVals.forEach(function (val, index) {
                multiStats.allVals[index] = Math.round(val * 100);
            });
            multiStats.min = this.roundTo3decimals(multiStats.min * 100);
            multiStats.max = this.roundTo3decimals(multiStats.max * 100);
            multiStats.avg = this.roundTo3decimals(multiStats.avg * 100);
            this.addToReport('Process', 'CPU', `cpu: ${JSON.stringify(multiStats)}`, 1);
            let report = process_1.resourceUsage();
            for (const [key, value] of Object.entries(report)) {
                this.addToReport('Process', 'Details', key, value);
            }
        };
        exports.memoryReportingInstance = this;
        this.report = [];
        this.shardus = shardus;
        this.statistics = statistics;
        this.lastCPUTimes = this.getCPUTimes();
        this.stateManager = stateManager;
        this.cycleCreator = cycleCreator;
        this.nodeList = nodeList;
        this.handlers = {
            'memory': this.memoryHandler,
            'memory-short': this.memoryShortHandler,
            'memory-gc': this.memoryGcHandler,
            'scale-factor': this.scaleFactorHandler
        };
    }
}
exports.MemoryReporting = MemoryReporting;
//# sourceMappingURL=memoryReporting.js.map