"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Statistics = exports.statisticsInstance = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const stream_1 = require("stream");
const events_1 = require("events");
const utils = __importStar(require("../utils/test"));
const nestedCounters_1 = require("../profiler/nestedCounters");
class Statistics extends events_1.EventEmitter {
    constructor(baseDir, config, { counters = [], watchers = {}, timers = [], manualStats = [], }, context) {
        super();
        this.initialize = () => {
            this.counters = this._initializeCounters(this.counterDefs);
            this.watchers = this._initializeWatchers(this.watcherDefs, this.context);
            this.timers = this._initializeTimers(this.timerDefs);
            this.manualStats = this._initializeManualStats(this.manualStatDefs);
        };
        this.getStream = () => {
            this.stream = new stream_1.Readable();
            this.stream._read = () => {
                this.streamIsPushable = true;
            };
            return this.stream;
        };
        this.writeOnSnapshot = (writeFn, context) => {
            this.snapshotWriteFns.push(writeFn.bind(context));
        };
        this.startSnapshots = () => {
            const tabSeperatedHeaders = 'Name\tValue\tTime\n';
            this._pushToStream(tabSeperatedHeaders);
            if (!this.interval)
                this.interval = setInterval(this._takeSnapshot.bind(this), this.intervalDuration);
        };
        this.stopSnapshots = () => {
            if (this.interval)
                clearInterval(this.interval);
            this.interval = null;
        };
        // Increments the given CounterRing's count
        this.incrementCounter = (counterName) => {
            const counter = this.counters[counterName];
            if (!counter)
                throw new Error(`Counter '${counterName}' is undefined.`);
            counter.increment();
            nestedCounters_1.nestedCountersInstance.countEvent('statistics', counterName);
        };
        this.setManualStat = (manualStatName, value) => {
            const ring = this.manualStats[manualStatName];
            if (!ring)
                throw new Error(`manualStat '${manualStatName}' is undefined.`);
            ring.manualSetValue(value);
            //nestedCountersInstance.countEvent('statistics', manualStatName)
        };
        // Returns the current count of the given CounterRing
        this.getCurrentCount = (counterName) => {
            const counter = this.counters[counterName];
            if (!counter)
                throw new Error(`Counter '${counterName}' is undefined.`);
            return counter.count;
        };
        // Returns the current total of the given CounterRing
        this.getCounterTotal = (counterName) => {
            const counter = this.counters[counterName];
            if (!counter)
                throw new Error(`Counter '${counterName}' is undefined.`);
            return counter.total;
        };
        // Returns the result of the given WatcherRings watchFn
        this.getWatcherValue = (watcherName) => {
            const watcher = this.watchers[watcherName];
            if (!watcher)
                throw new Error(`Watcher '${watcherName}' is undefined.`);
            return watcher.watchFn();
        };
        // Starts an entry for the given id in the given TimerRing
        this.startTimer = (timerName, id) => {
            const timer = this.timers[timerName];
            if (!timer)
                throw new Error(`Timer '${timerName}' is undefined.`);
            timer.start(id);
        };
        // Stops an entry for the given id in the given TimerRing
        this.stopTimer = (timerName, id) => {
            const timer = this.timers[timerName];
            if (!timer)
                throw new Error(`Timer '${timerName}' is undefined.`);
            timer.stop(id);
        };
        // Returns the current average of all elements in the given WatcherRing, CounterRing, or TimerRing
        this.getAverage = (name) => {
            const ringHolder = this.counters[name] || this.watchers[name] || this.timers[name] || this.manualStats[name];
            if (!ringHolder.ring)
                throw new Error(`Ring holder '${name}' is undefined.`);
            return ringHolder.ring.average();
        };
        this.getMultiStatReport = (name) => {
            const ringHolder = this.counters[name] || this.watchers[name] || this.timers[name] || this.manualStats[name];
            if (!ringHolder.ring)
                throw new Error(`Ring holder '${name}' is undefined.`);
            return ringHolder.ring.multiStats();
        };
        this.clearRing = (name) => {
            const ringHolder = this.counters[name] ||
                this.watchers[name] ||
                this.timers[name] ||
                this.manualStats[name];
            if (!ringHolder.ring)
                throw new Error(`Ring holder '${name}' is undefined.`);
            return ringHolder.ring.clear();
        };
        // Returns the value of the last element of the given WatcherRing, CounterRing, or TimerRing
        this.getPreviousElement = (name) => {
            const ringHolder = this.counters[name] || this.watchers[name] || this.timers[name];
            if (!ringHolder.ring)
                throw new Error(`Ring holder '${name}' is undefined.`);
            return ringHolder.ring.previous();
        };
        this._initializeCounters = (counterDefs = []) => {
            const counters = {};
            for (const name of counterDefs) {
                counters[name] = new CounterRing(60);
            }
            return counters;
        };
        this._initializeWatchers = (watcherDefs = {}, context) => {
            const watchers = {};
            for (const name in watcherDefs) {
                const watchFn = watcherDefs[name];
                watchers[name] = new WatcherRing(60, watchFn, context);
            }
            return watchers;
        };
        this._initializeTimers = (timerDefs = []) => {
            const timers = {};
            for (const name of timerDefs) {
                timers[name] = new TimerRing(60);
            }
            return timers;
        };
        this._initializeManualStats = (counterDefs = []) => {
            const manualStats = {};
            for (const name of counterDefs) {
                manualStats[name] = new ManualRing(60); //should it be a config
            }
            return manualStats;
        };
        this._takeSnapshot = () => {
            const time = new Date().toISOString();
            let tabSeperatedValues = '';
            for (const counter in this.counters) {
                this.counters[counter].snapshot();
                tabSeperatedValues += `${counter}-average\t${this.getAverage(counter)}\t${time}\n`;
                tabSeperatedValues += `${counter}-total\t${this.getCounterTotal(counter)}\t${time}\n`;
            }
            for (const watcher in this.watchers) {
                this.watchers[watcher].snapshot();
                tabSeperatedValues += `${watcher}-average\t${this.getAverage(watcher)}\t${time}\n`;
                tabSeperatedValues += `${watcher}-value\t${this.getWatcherValue(watcher)}\t${time}\n`;
            }
            for (const timer in this.timers) {
                this.timers[timer].snapshot();
                tabSeperatedValues += `${timer}-average\t${this.getAverage(timer) /
                    1000}\t${time}\n`;
            }
            for (const writeFn of this.snapshotWriteFns) {
                tabSeperatedValues += writeFn();
            }
            this._pushToStream(tabSeperatedValues);
            this.emit('snapshot');
        };
        this._pushToStream = (data) => {
            if (this.stream && this.streamIsPushable) {
                this.streamIsPushable = this.stream.push(data);
            }
        };
        this.intervalDuration = config.interval || 1;
        this.intervalDuration = this.intervalDuration * 1000;
        this.context = context;
        this.counterDefs = counters;
        this.watcherDefs = watchers;
        this.timerDefs = timers;
        this.manualStatDefs = manualStats;
        this.initialize();
        this.interval = null;
        this.snapshotWriteFns = [];
        this.stream = null;
        this.streamIsPushable = false;
        exports.statisticsInstance = this;
        if (config.save) {
            // Pipe stream to file
            const file = path.join(baseDir, 'statistics.tsv');
            const fileWriteStream = fs.createWriteStream(file);
            const statsReadStream = this.getStream();
            statsReadStream.pipe(fileWriteStream);
        }
    }
}
exports.Statistics = Statistics;
class Ring {
    constructor(length) {
        this.multiStats = () => {
            let sum = 0;
            let total = 0;
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;
            let allVals = [];
            for (const element of this.elements) {
                if (_exists(element)) {
                    let val = Number(element);
                    sum += val;
                    total++;
                    if (val < min) {
                        min = val;
                    }
                    if (val > max) {
                        max = val;
                    }
                    allVals.push(val);
                }
            }
            let avg = total > 0 ? sum / total : 0;
            return { min, max, avg, allVals };
        };
        this.save = (value) => {
            this.elements[this.index] = value;
            this.index = ++this.index % this.elements.length;
        };
        this.average = () => {
            let sum = 0;
            let total = 0;
            for (const element of this.elements) {
                if (_exists(element)) {
                    sum += Number(element);
                    total++;
                }
            }
            return total > 0 ? sum / total : 0;
        };
        this.previous = () => {
            const prevIndex = (this.index < 1 ? this.elements.length : this.index) - 1;
            return this.elements[prevIndex] || 0;
        };
        this.elements = new Array(length);
        this.index = 0;
        this.length = length;
    }
    clear() {
        this.elements = new Array(this.length);
        this.index = 0;
    }
}
class CounterRing {
    constructor(length) {
        this.increment = () => {
            ++this.count;
            ++this.total;
        };
        this.snapshot = () => {
            this.ring.save(this.count);
            this.count = 0;
        };
        this.count = 0;
        this.total = 0;
        this.ring = new Ring(length);
    }
}
class WatcherRing {
    constructor(length, watchFn, context) {
        this.snapshot = () => {
            const value = this.watchFn();
            this.ring.save(value);
        };
        this.watchFn = watchFn.bind(context);
        this.ring = new Ring(length);
    }
}
class TimerRing {
    constructor(length) {
        this.start = (id) => {
            if (!this.ids[id]) {
                this.ids[id] = Date.now();
            }
        };
        this.stop = (id) => {
            const entry = this.ids[id];
            if (entry) {
                delete this.ids[id];
            }
        };
        this.snapshot = () => {
            // Calc median duration of all entries in ids
            const durations = [];
            for (const id in this.ids) {
                const startTime = this.ids[id];
                const duration = Date.now() - startTime;
                utils.insertSorted(durations, duration, (a, b) => a - b);
            }
            const median = utils.computeMedian(durations, false);
            // Save median
            this.ring.save(median);
        };
        this.ids = {};
        this.ring = new Ring(length);
    }
}
class ManualRing {
    constructor(length) {
        this.manualSetValue = (value) => {
            this.ring.save(value);
        };
        this.snapshot = () => {
        };
        this.ring = new Ring(length);
    }
}
/**
 * Check for a variable that is not undefined or null
 * @param thing The parameter to check
 */
function _exists(thing) {
    return typeof thing !== 'undefined' && thing !== null;
}
//# sourceMappingURL=index.js.map