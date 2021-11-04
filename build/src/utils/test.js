"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyResult = exports.makeShortHash = exports.binarySearch = exports.computeMedian = exports.insertSorted = exports.sleep = void 0;
exports.sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
function insertSorted(arr, item, comparator) {
    let i = binarySearch(arr, item, comparator);
    if (i < 0) {
        i = -1 - i;
    }
    arr.splice(i, 0, item);
}
exports.insertSorted = insertSorted;
exports.computeMedian = (arr = [], sort = true) => {
    if (sort) {
        arr.sort((a, b) => a - b);
    }
    const len = arr.length;
    switch (len) {
        case 0: {
            return 0;
        }
        case 1: {
            return arr[0];
        }
        default: {
            const mid = len / 2;
            if (len % 2 === 0) {
                return arr[mid];
            }
            else {
                return (arr[Math.floor(mid)] + arr[Math.ceil(mid)]) / 2;
            }
        }
    }
};
function binarySearch(arr, el, comparator) {
    if (comparator == null) {
        // Emulate the default Array.sort() comparator
        comparator = (a, b) => {
            return a.toString() > b.toString()
                ? 1
                : a.toString() < b.toString()
                    ? -1
                    : 0;
        };
    }
    let m = 0;
    let n = arr.length - 1;
    while (m <= n) {
        const k = (n + m) >> 1;
        const cmp = comparator(el, arr[k]);
        if (cmp > 0) {
            m = k + 1;
        }
        else if (cmp < 0) {
            n = k - 1;
        }
        else {
            return k;
        }
    }
    return -m - 1;
}
exports.binarySearch = binarySearch;
exports.makeShortHash = (x, n = 4) => {
    if (x) {
        if (x.length > 63) {
            if (x.length === 64) {
                return x.slice(0, n) + 'x' + x.slice(63 - n);
            }
            else if (x.length === 128) {
                return x.slice(0, n) + 'xx' + x.slice(127 - n);
            }
            else if (x.length === 192) {
                return x.slice(0, n) + 'xx' + x.slice(191 - n);
            }
        }
        return x;
    }
    else {
        return x;
    }
};
exports.replyResult = (res, result) => {
    if (res.setHeader)
        res.setHeader('content-type', 'text/plain');
    else if (res.header)
        res.header('content-type', 'text/plain');
    res.send(result);
};
//# sourceMappingURL=test.js.map