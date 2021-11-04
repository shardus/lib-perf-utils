"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestedCounters = exports.nestedCountersInstance = void 0;
const profiler_1 = require("./profiler");
const StringifyReduce_1 = require("./StringifyReduce");
const test_1 = require("../utils/test");
class NestedCounters {
    constructor(crypto) {
        this.counts = (req, res) => {
            profiler_1.profilerInstance.scopedProfileSectionStart('counts');
            let result = '';
            let arrayReport = this.arrayitizeAndSort(this.eventCounters);
            result += `${Date.now()}\n`;
            result += this.printArrayReport(arrayReport, 0);
            test_1.replyResult(res, result);
            profiler_1.profilerInstance.scopedProfileSectionEnd('counts');
        };
        this.countsReset = (req, res) => {
            this.eventCounters = new Map();
            test_1.replyResult(res, `counts reset ${Date.now()}`);
        };
        this.rareCountReset = (req, res) => {
            this.rareEventCounters = new Map();
            test_1.replyResult(res, `Rare counts reset ${Date.now()}`);
        };
        this.debugInfLoop = (req, res) => {
            res.write('starting inf loop, goodbye');
            res.end();
            let counter = 1;
            this.infLoopDebug = true;
            while (this.infLoopDebug) {
                let s = "asdf";
                let s2 = StringifyReduce_1.stringifyReduce({ test: [s, s, s, s, s, s, s] });
                let s3 = StringifyReduce_1.stringifyReduce({ test: [s2, s2, s2, s2, s2, s2, s2] });
                if (this.crypto != null) {
                    this.crypto.hash(s3);
                }
                counter++;
            }
        };
        this.countEvent = (category1, category2, count = 1) => {
            let counterMap = this.eventCounters;
            let nextNode;
            if (!counterMap.has(category1)) {
                nextNode = { count: 0, subCounters: new Map() };
                counterMap.set(category1, nextNode);
            }
            else {
                nextNode = counterMap.get(category1);
            }
            nextNode.count += count;
            counterMap = nextNode.subCounters;
            //unrolled loop to avoid memory alloc
            category1 = category2;
            if (counterMap.has(category1) === false) {
                nextNode = { count: 0, subCounters: new Map() };
                counterMap.set(category1, nextNode);
            }
            else {
                nextNode = counterMap.get(category1);
            }
            nextNode.count += count;
            counterMap = nextNode.subCounters;
        };
        this.countRareEvent = (category1, category2, count = 1) => {
            // trigger normal event counter
            this.countEvent(category1, category2, count);
            // start counting rare event
            let counterMap = this.rareEventCounters;
            let nextNode;
            if (counterMap.has(category1)) {
                nextNode = counterMap.get(category1);
            }
            else {
                nextNode = { count: 0, subCounters: new Map() };
                counterMap.set(category1, nextNode);
            }
            nextNode.count += count;
            counterMap = nextNode.subCounters;
            //unrolled loop to avoid memory alloc
            category1 = category2;
            if (counterMap.has(category1) === false) {
                nextNode = { count: 0, subCounters: new Map() };
                counterMap.set(category1, nextNode);
            }
            else {
                nextNode = counterMap.get(category1);
            }
            nextNode.count += count;
            counterMap = nextNode.subCounters;
        };
        this.arrayitizeAndSort = (counterMap) => {
            let array = [];
            for (let key of counterMap.keys()) {
                let valueObj = counterMap.get(key);
                let newValueObj = { key, count: valueObj.count, subArray: null };
                // newValueObj.key = key
                array.push(newValueObj);
                let subArray = [];
                if (valueObj.subCounters != null) {
                    subArray = this.arrayitizeAndSort(valueObj.subCounters);
                }
                // if (valueObj.count != null && valueObj.logLen != null) {
                //   valueObj.avgLen = valueObj.logLen / valueObj.count
                // }
                newValueObj.subArray = subArray;
                // delete valueObj['subCounters']
            }
            array.sort((a, b) => b.count - a.count);
            return array;
        };
        this.printArrayReport = (arrayReport, indent = 0) => {
            let outputStr = '';
            let indentText = '___'.repeat(indent);
            for (let item of arrayReport) {
                let { key, count, subArray, avgLen, logLen } = item;
                let countStr = `${count}`;
                // stream.write(
                //     //`${indentText}${key.padEnd(40)}\tcount:\t${countStr}\n`
                //     `${countStr.padStart(10)} ${indentText} ${key}\n`
                // )
                let newLine = `${countStr.padStart(10)} ${indentText} ${key}\n`;
                outputStr += newLine;
                if (subArray != null && subArray.length > 0) {
                    outputStr += this.printArrayReport(subArray, indent + 1);
                }
            }
            return outputStr;
        };
        // this.sectionTimes = {}
        this.eventCounters = new Map();
        this.rareEventCounters = new Map();
        exports.nestedCountersInstance = this;
        this.infLoopDebug = false;
        this.crypto = crypto;
        this.handlers = {
            'counts': this.counts,
            'counts-reset': this.countsReset,
            'reare-counts-reset': this.rareCountReset,
            'debug-inf-loop': this.debugInfLoop
        };
    }
}
exports.NestedCounters = NestedCounters;
//# sourceMappingURL=nestedCounters.js.map