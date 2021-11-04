import {nestedCountersInstance} from './nestedCounters'
import {memoryReportingInstance} from './memoryReporting'
import {sleep, replyResult} from '../utils/test'

let profilerSelfReporting = false

export interface NodeLoad {
    internal: number
    external: number
}

export let profilerInstance: Profiler

export class Profiler {
    sectionTimes: any
    scopedSectionTimes: any
    eventCounters: Map<string, Map<string, number>>
    stackHeight: number
    netInternalStackHeight: number
    netExternalStackHeight: number
    statistics: any
    nodeInfo: any
    nodeType: string
    handlers: any

    constructor(nodeType: string) {
        this.sectionTimes = {}
        this.scopedSectionTimes = {}
        this.eventCounters = new Map()
        this.stackHeight = 0
        this.netInternalStackHeight = 0
        this.netExternalStackHeight = 0
        this.statistics = null
        this.nodeInfo = null
        this.nodeType = nodeType
        profilerInstance = this
        this.handlers = {
            'perf': this.perfHandler,
            'perf-scoped': this.perfScopedHandler,
            'combined-debug': this.combinedDebugHandler
        }
        this.profileSectionStart('_total', true)
        this.profileSectionStart('_internal_total', true)
    }

    setStatistics = (statistics: any) => {
        this.statistics = statistics
    }
    setNodeInfo = (nodeInfo: any) => {
        this.nodeInfo = nodeInfo
    }
    perfHandler = (req: any, res: any) => {
        let result = this.printAndClearReport(1)
        replyResult(res, result)
    }

    perfScopedHandler = (req: any, res: any) => {
        let result = this.printAndClearScopedReport(1)
        replyResult(res, result)
    }


    combinedDebugHandler = async (req: any, res: any) => {
        const waitTime = Number.parseInt(req.query.wait as string, 10) || 60

        let result = ''

        function writeToResult(str) {
            result += str
        }

        // hit "counts-reset" endpoint
        this.eventCounters = new Map()
        writeToResult(`counts reset at ${new Date()}\n`)

        // hit "perf" endpoint to clear perf stats
        this.printAndClearReport(1)

        if (this.statistics) this.statistics.clearRing('txProcessed')

        // wait X seconds
        await sleep(waitTime * 1000)
        writeToResult(`Results for ${waitTime} sec of sampling...`)
        writeToResult(`\n===========================\n`)

        // write nodeId, ip and port
        writeToResult(`\n=> NODE DETAIL\n`)
        writeToResult(`NODE ID: ${this.nodeInfo ? this.nodeInfo.nodeId : 'N/A'}\n`)
        writeToResult(`IP: ${this.nodeInfo ? this.nodeInfo.externalIp : 'N/A'}\n`)
        writeToResult(`PORT: ${this.nodeInfo ? this.nodeInfo.externalPort : 'N/A'}\n`)

        // write "memory" results
        let toMB = 1 / 1000000
        let report = process.memoryUsage()
        writeToResult(`\n=> MEMORY RESULTS\n`)
        writeToResult(`System Memory Report.  Timestamp: ${Date.now()}\n`)
        writeToResult(`rss: ${(report.rss * toMB).toFixed(2)} MB\n`)
        writeToResult(`heapTotal: ${(report.heapTotal * toMB).toFixed(2)} MB\n`)
        writeToResult(`heapUsed: ${(report.heapUsed * toMB).toFixed(2)} MB\n`)
        writeToResult(`external: ${(report.external * toMB).toFixed(2)} MB\n`)
        writeToResult(`arrayBuffers: ${(report.arrayBuffers * toMB).toFixed(2)} MB\n\n\n`)
        memoryReportingInstance.gatherReport()
        writeToResult(memoryReportingInstance.reportToStream(memoryReportingInstance.report, 0))

        if (this.nodeType === 'consensor' && this.statistics) {
            const injectedTpsReport = this.statistics.getMultiStatReport('txInjected')
            writeToResult('\n=> Node Injected TPS \n')
            writeToResult(`\n Avg: ${injectedTpsReport.avg} `)
            writeToResult(`\n Max: ${injectedTpsReport.max} `)
            writeToResult(`\n Vals: ${injectedTpsReport.allVals} `)
            this.statistics.clearRing('txInjected')

            const processedTpsReport = this.statistics.getMultiStatReport('txProcessed')
            writeToResult('\n=> Node Processed TPS \n')
            writeToResult(`\n Avg: ${processedTpsReport.avg} `)
            writeToResult(`\n Max: ${processedTpsReport.max} `)
            writeToResult(`\n Vals: ${processedTpsReport.allVals} `)
            this.statistics.clearRing('txProcessed')

            const rejectedTpsReport = this.statistics.getMultiStatReport('txRejected')
            writeToResult('\n=> Node Rejected TPS \n')
            writeToResult(`\n Avg: ${rejectedTpsReport.avg} `)
            writeToResult(`\n Max: ${rejectedTpsReport.max} `)
            writeToResult(`\n Vals: ${rejectedTpsReport.allVals} `)
            this.statistics.clearRing('txRejected')

            const networkTimeoutReport = this.statistics.getMultiStatReport('networkTimeout')
            writeToResult('\n=> Network Timeout / sec \n')
            writeToResult(`\n Avg: ${networkTimeoutReport.avg} `)
            writeToResult(`\n Max: ${networkTimeoutReport.max} `)
            writeToResult(`\n Vals: ${networkTimeoutReport.allVals} `)
            this.statistics.clearRing('networkTimeout')

            const lostNodeTimeoutReport = this.statistics.getMultiStatReport('lostNodeTimeout')
            writeToResult('\n=> LostNode Timeout / sec \n')
            writeToResult(`\n Avg: ${lostNodeTimeoutReport.avg} `)
            writeToResult(`\n Max: ${lostNodeTimeoutReport.max} `)
            writeToResult(`\n Vals: ${lostNodeTimeoutReport.allVals} `)
            this.statistics.clearRing('lostNodeTimeout')
        }

        // write "perf" results
        writeToResult(`\n=> PERF RESULTS\n`)
        writeToResult(this.printAndClearReport(1))
        writeToResult(`\n===========================\n`)

        // write scoped-perf results
        let scopedPerfResult = this.printAndClearScopedReport(1)
        writeToResult(`\n=> SCOPED PERF RESULTS\n`)
        writeToResult(scopedPerfResult)
        writeToResult(`\n===========================\n`)

        // write "counts" results
        let arrayReport = nestedCountersInstance.arrayitizeAndSort(nestedCountersInstance.eventCounters)
        writeToResult(`\n=> COUNTS RESULTS\n`)
        writeToResult(`${Date.now()}\n`)
        writeToResult(nestedCountersInstance.printArrayReport(arrayReport, 0))
        writeToResult(`\n===========================\n`)

        replyResult(res, result)
    }

    setStatisticsInstance = (statistics: any) => {
        this.statistics = statistics
    }

    profileSectionStart = (sectionName: string, internal = false) => {
        let section = this.sectionTimes[sectionName]

        if (section != null && section.started === true) {
            if (profilerSelfReporting)
                nestedCountersInstance.countEvent('profiler-start-error', sectionName)
            return
        }

        if (section == null) {
            let t = BigInt(0)
            section = {name: sectionName, total: t, c: 0, internal}
            this.sectionTimes[sectionName] = section
        }

        section.start = process.hrtime.bigint()
        section.started = true
        section.c++

        if (internal === false) {
            nestedCountersInstance.countEvent('profiler', sectionName)

            this.stackHeight++
            if (this.stackHeight === 1) {
                this.profileSectionStart('_totalBusy', true)
                this.profileSectionStart('_internal_totalBusy', true)
            }
            if (sectionName === 'net-internl') {
                this.netInternalStackHeight++
                if (this.netInternalStackHeight === 1) {
                    this.profileSectionStart('_internal_net-internl', true)
                }
            }
            if (sectionName === 'net-externl') {
                this.netExternalStackHeight++
                if (this.netExternalStackHeight === 1) {
                    this.profileSectionStart('_internal_net-externl', true)
                }
            }
        }
    }

    profileSectionEnd = (sectionName: string, internal = false) => {
        let section = this.sectionTimes[sectionName]
        if (section == null || section.started === false) {
            if (profilerSelfReporting)
                nestedCountersInstance.countEvent('profiler-end-error', sectionName)
            return
        }

        section.end = process.hrtime.bigint()
        section.total += section.end - section.start
        section.started = false

        if (internal === false) {
            if (profilerSelfReporting)
                nestedCountersInstance.countEvent('profiler-end', sectionName)

            this.stackHeight--
            if (this.stackHeight === 0) {
                this.profileSectionEnd('_totalBusy', true)
                this.profileSectionEnd('_internal_totalBusy', true)
            }
            if (sectionName === 'net-internl') {
                this.netInternalStackHeight--
                if (this.netInternalStackHeight === 0) {
                    this.profileSectionEnd('_internal_net-internl', true)
                }
            }
            if (sectionName === 'net-externl') {
                this.netExternalStackHeight--
                if (this.netExternalStackHeight === 0) {
                    this.profileSectionEnd('_internal_net-externl', true)
                }
            }
        }
    }

    scopedProfileSectionStart = (sectionName: string, internal = false) => {
        let section = this.scopedSectionTimes[sectionName]

        if (section != null && section.started === true) {
            return
        }

        if (section == null) {
            const t = BigInt(0)
            const max = BigInt(0)
            const min = BigInt(0)
            const avg = BigInt(0)
            section = {name: sectionName, total: t, max, min, avg, c: 0, internal}
            this.scopedSectionTimes[sectionName] = section
        }

        section.start = process.hrtime.bigint()
        section.started = true
        section.c++
    }

    scopedProfileSectionEnd = (sectionName: string, internal = false) => {
        const section = this.scopedSectionTimes[sectionName]
        if (section == null || section.started === false) {
            if (profilerSelfReporting) return
        }

        section.end = process.hrtime.bigint()

        const duration = section.end - section.start
        section.total += duration
        section.c += 1
        if (duration > section.max) section.max = duration
        if (duration < section.min) section.min = duration
        section.avg = section.total / BigInt(section.c)
        section.started = false
    }

    cleanInt = (x: any) => {
        x = Number(x)
        return x >= 0 ? Math.floor(x) : Math.ceil(x)
    }

    getTotalBusyInternal = (): any => {
        if (profilerSelfReporting)
            nestedCountersInstance.countEvent('profiler-note', 'getTotalBusyInternal')

        this.profileSectionEnd('_internal_total', true)
        let internalTotalBusy = this.sectionTimes['_internal_totalBusy']
        let internalTotal = this.sectionTimes['_internal_total']
        let internalNetInternl = this.sectionTimes['_internal_net-internl']
        let internalNetExternl = this.sectionTimes['_internal_net-externl']
        let duty = BigInt(0)
        let netInternlDuty = BigInt(0)
        let netExternlDuty = BigInt(0)
        if (internalTotalBusy != null && internalTotal != null) {
            if (internalTotal.total > BigInt(0)) {
                duty = (BigInt(100) * internalTotalBusy.total) / internalTotal.total
            }
        }
        if (internalNetInternl != null && internalTotal != null) {
            if (internalTotal.total > BigInt(0)) {
                netInternlDuty =
                    (BigInt(100) * internalNetInternl.total) / internalTotal.total
            }
        }
        if (internalNetExternl != null && internalTotal != null) {
            if (internalTotal.total > BigInt(0)) {
                netExternlDuty =
                    (BigInt(100) * internalNetExternl.total) / internalTotal.total
            }
        }
        this.profileSectionStart('_internal_total', true)

//clear these timers
        internalTotal.total = BigInt(0)
        internalTotalBusy.total = BigInt(0)
        if (internalNetInternl) internalNetInternl.total = BigInt(0)
        if (internalNetExternl) internalNetExternl.total = BigInt(0)

        return {
            duty: Number(duty) * 0.01,
            netInternlDuty: Number(netInternlDuty) * 0.01,
            netExternlDuty: Number(netExternlDuty) * 0.01,
        }
    }

    clearTimes = () => {
        for (let key in this.sectionTimes) {
            if (key.startsWith('_internal')) continue

            if (this.sectionTimes.hasOwnProperty(key)) {
                let section = this.sectionTimes[key]
                section.total = BigInt(0)
            }
        }
    }
    clearScopedTimes = () => {
        for (let key in this.scopedSectionTimes) {
            if (this.scopedSectionTimes.hasOwnProperty(key)) {
                let section = this.scopedSectionTimes[key]
                section.total = BigInt(0)
                section.max = BigInt(0)
                section.min = BigInt(0)
                section.avg = BigInt(0)
                section.c = 0
            }
        }
    }

    printAndClearReport = (delta?: number): string => {
        this.profileSectionEnd('_total', true)

        let result = 'Profile Sections:\n'
        let d1 = this.cleanInt(1e6) // will get us ms
        let divider = BigInt(d1)

        let totalSection = this.sectionTimes['_total']
        let totalBusySection = this.sectionTimes['_totalBusy']

        let lines = []
        for (let key in this.sectionTimes) {
            if (key.startsWith('_internal')) continue

            if (this.sectionTimes.hasOwnProperty(key)) {
                let section = this.sectionTimes[key]

                let duty = BigInt(0)
                if (totalSection.total > BigInt(0)) {
                    duty = (BigInt(100) * section.total) / totalSection.total
                }
                let totalMs = section.total / divider
                let dutyStr = `${duty}`.padStart(4)
                let totalStr = `${totalMs}`.padStart(13)
                let line = `${dutyStr}% ${section.name.padEnd(30)}, ${totalStr}ms, #:${
                    section.c
                }`
                //section.total = BigInt(0)

                lines.push({line, totalMs})
            }
        }

        lines.sort((l1, l2) => Number(l2.totalMs - l1.totalMs))

        result = result + lines.map((line) => line.line).join('\n')

        this.clearTimes()

        this.profileSectionStart('_total', true)
        return result
    }

    printAndClearScopedReport = (delta?: number): string => {
        let result = 'Scoped Profile Sections:\n'
        let d1 = this.cleanInt(1e6) // will get us ms
        let divider = BigInt(d1)

        let lines = []
        for (let key in this.scopedSectionTimes) {
            if (this.scopedSectionTimes.hasOwnProperty(key)) {
                let section = this.scopedSectionTimes[key]
                const percent = BigInt(100)
                const avgMs = Number((section.avg * percent) / divider) / 100
                const maxMs = Number((section.max * percent) / divider) / 100
                const minMs = Number((section.min * percent) / divider) / 100
                const totalMs = Number((section.total * percent) / divider) / 100
                let line = `Avg: ${avgMs}ms ${section.name.padEnd(30)}, Max: ${maxMs}ms,  Min: ${minMs}ms,  Total: ${totalMs}ms, #:${
                    section.c
                }`
                lines.push({line, avgMs})
            }
        }
        lines.sort((l1, l2) => Number(l2.avgMs - l1.avgMs))
        result = result + lines.map((line) => line.line).join('\n')

        this.clearScopedTimes()
        return result
    }
}
