import {profilerInstance} from './profiler'
import {stringifyReduce} from "./StringifyReduce";
import {replyResult} from "../utils/test";

export interface NestedCounters {
}

type CounterMap = Map<string, CounterNode>

interface CounterNode {
    count: number
    subCounters: CounterMap
}

export let nestedCountersInstance: NestedCounters

export class NestedCounters {
    eventCounters: Map<string, CounterNode>
    rareEventCounters: Map<string, CounterNode>
    infLoopDebug: boolean
    handlers: any
    crypto: any

    constructor(crypto: any) {
        // this.sectionTimes = {}
        this.eventCounters = new Map()
        this.rareEventCounters = new Map()
        nestedCountersInstance = this
        this.infLoopDebug = false
        this.crypto = crypto
        this.handlers = {
            'counts': this.counts,
            'counts-reset': this.countsReset,
            'reare-counts-reset': this.rareCountReset,
            'debug-inf-loop': this.debugInfLoop
        }
    }

    counts = (req: any, res: any) => {
        profilerInstance.scopedProfileSectionStart('counts')
        let result = ''
        let arrayReport = this.arrayitizeAndSort(this.eventCounters)
        result += `${Date.now()}\n`

        result += this.printArrayReport(arrayReport, 0)
        replyResult(res, result)
        profilerInstance.scopedProfileSectionEnd('counts')
    }
    countsReset = (req: any, res: any) => {
        this.eventCounters = new Map()
        replyResult(res, `counts reset ${Date.now()}`)
    }
    rareCountReset = (req: any, res: any) => {
        this.rareEventCounters = new Map()
        replyResult(res, `Rare counts reset ${Date.now()}`)
    }
    debugInfLoop = (req: any, res: any) => {
        res.write('starting inf loop, goodbye')
        res.end()
        let counter = 1
        this.infLoopDebug = true
        while (this.infLoopDebug) {
            let s = "asdf"
            let s2 = stringifyReduce({test: [s, s, s, s, s, s, s]})
            let s3 = stringifyReduce({test: [s2, s2, s2, s2, s2, s2, s2]})
            if (this.crypto != null) {
                this.crypto.hash(s3)
            }
            counter++
        }
    }

    countEvent = (category1: string, category2: string, count: number = 1) => {
        let counterMap: CounterMap = this.eventCounters

        let nextNode: CounterNode

        if (!counterMap.has(category1)) {
            nextNode = {count: 0, subCounters: new Map()}
            counterMap.set(category1, nextNode)
        } else {
            nextNode = <CounterNode>counterMap.get(category1)
        }
        nextNode.count += count
        counterMap = nextNode.subCounters

        //unrolled loop to avoid memory alloc
        category1 = category2
        if (counterMap.has(category1) === false) {
            nextNode = {count: 0, subCounters: new Map()}
            counterMap.set(category1, nextNode)
        } else {
            nextNode = <CounterNode>counterMap.get(category1)
        }
        nextNode.count += count
        counterMap = nextNode.subCounters
    }

    countRareEvent = (category1: string, category2: string, count: number = 1) => {
        // trigger normal event counter
        this.countEvent(category1, category2, count)

        // start counting rare event
        let counterMap: CounterMap = this.rareEventCounters

        let nextNode: CounterNode
        if (counterMap.has(category1)) {
            nextNode = counterMap.get(category1)
        } else {
            nextNode = {count: 0, subCounters: new Map()}
            counterMap.set(category1, nextNode)
        }
        nextNode.count += count
        counterMap = nextNode.subCounters

        //unrolled loop to avoid memory alloc
        category1 = category2
        if (counterMap.has(category1) === false) {
            nextNode = {count: 0, subCounters: new Map()}
            counterMap.set(category1, nextNode)
        } else {
            nextNode = <CounterNode>counterMap.get(category1)
        }
        nextNode.count += count
        counterMap = nextNode.subCounters
    }

    arrayitizeAndSort = (counterMap: CounterMap) => {
        let array = []
        for (let key of counterMap.keys()) {
            let valueObj = counterMap.get(key)

            let newValueObj = {key, count: valueObj.count, subArray: null}
            // newValueObj.key = key
            array.push(newValueObj)

            let subArray = []
            if (valueObj.subCounters != null) {
                subArray = this.arrayitizeAndSort(valueObj.subCounters)
            }

            // if (valueObj.count != null && valueObj.logLen != null) {
            //   valueObj.avgLen = valueObj.logLen / valueObj.count
            // }

            newValueObj.subArray = subArray
            // delete valueObj['subCounters']
        }

        array.sort((a, b) => b.count - a.count)
        return array
    }

    printArrayReport = (arrayReport, indent = 0): string => {
        let outputStr = ''
        let indentText = '___'.repeat(indent)
        for (let item of arrayReport) {
            let {key, count, subArray, avgLen, logLen} = item
            let countStr = `${count}`
            // stream.write(
            //     //`${indentText}${key.padEnd(40)}\tcount:\t${countStr}\n`
            //     `${countStr.padStart(10)} ${indentText} ${key}\n`
            // )
            let newLine = `${countStr.padStart(10)} ${indentText} ${key}\n`
            outputStr += newLine
            if (subArray != null && subArray.length > 0) {
                outputStr += this.printArrayReport(subArray, indent + 1)
            }
        }
        return outputStr
    }
}
