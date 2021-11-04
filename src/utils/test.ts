type Comparator<T, E = T> = (a: E, b: T) => number

export const sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export function insertSorted<T>(arr: T[], item: T, comparator?: Comparator<T>) {
    let i = binarySearch(arr, item, comparator)
    if (i < 0) {
        i = -1 - i
    }
    arr.splice(i, 0, item)
}

export const computeMedian = (arr = [], sort = true) => {
    if (sort) {
        arr.sort((a, b) => a - b)
    }
    const len = arr.length
    switch (len) {
        case 0: {
            return 0
        }
        case 1: {
            return arr[0]
        }
        default: {
            const mid = len / 2
            if (len % 2 === 0) {
                return arr[mid]
            } else {
                return (arr[Math.floor(mid)] + arr[Math.ceil(mid)]) / 2
            }
        }
    }
}

export function binarySearch<T, E = Partial<T>>(
    arr: T[],
    el: E,
    comparator?: Comparator<T, typeof el>
) {
    if (comparator == null) {
        // Emulate the default Array.sort() comparator
        comparator = (a, b) => {
            return a.toString() > b.toString()
                ? 1
                : a.toString() < b.toString()
                    ? -1
                    : 0
        }
    }
    let m = 0
    let n = arr.length - 1
    while (m <= n) {
        const k = (n + m) >> 1
        const cmp = comparator(el, arr[k])
        if (cmp > 0) {
            m = k + 1
        } else if (cmp < 0) {
            n = k - 1
        } else {
            return k
        }
    }
    return -m - 1
}

export const makeShortHash = (x, n = 4) => {
    if (x) {
        if (x.length > 63) {
            if (x.length === 64) {
                return x.slice(0, n) + 'x' + x.slice(63 - n)
            } else if (x.length === 128) {
                return x.slice(0, n) + 'xx' + x.slice(127 - n)
            } else if (x.length === 192) {
                return x.slice(0, n) + 'xx' + x.slice(191 - n)
            }
        }
        return x
    } else {
        return x
    }
}

export const replyResult = (res, result) => {
    if (res.setHeader) res.setHeader('content-type', 'text/plain')
    else if (res.header) res.header('content-type', 'text/plain')
    res.send(result)
}
