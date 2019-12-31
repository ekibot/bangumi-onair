/* eslint-disable no-console, max-len */
/*
 * @Description: utils
 * @Author: ekibun
 * @Date: 2019-08-02 13:32:54
 * @LastEditors  : ekibun
 * @LastEditTime : 2019-12-31 17:13:54
 */
const request = require('request-promise-native');
// eslint-disable-next-line global-require
const chalk = new (require('chalk')).Instance({ level: 2 });

/**
 * safe request with retry
 * @param { string } url
 * @param { * } options
 * @param { number } retry
 */
async function safeRequest(url, options, retry = 3) {
    return retry ? request(url, {
        forever: true,
        timeout: 10000,
        ...options,
    }).catch((error) => {
        this.log.e(`${error}`.split('\n')[0].substring(0, 100));
        return safeRequest(url, options, retry - 1);
    }) : undefined;
}

/**
 * set of append list
 * @template T
 * @param { T[] } arr
 * @param { T } newData
 * @param { (value: T, index: number) => boolean } finder
 */
function setOrPush(arr, newData, finder) {
    const index = arr.findIndex(finder);
    if (~index) arr.splice(index, 1, newData);
    else arr.push(newData);
}

/**
 * async pool
 * @template T
 * @param { T[] } _fetchs
 * @param { (data: T) => Promise } run
 * @param { number } num
 */
async function queue(_fetchs, run, num = 2) {
    const fetchs = _fetchs.concat();
    await Promise.all(new Array(num).fill(0).map(async () => {
        while (fetchs.length) {
            const messages = [[chalk.yellow(`${_fetchs.length - fetchs.length + 1}/${_fetchs.length}`)]];
            const log = {
                v: (...message) => {
                    messages.push(message);
                },
                e: (...message) => {
                    messages.push(message.map((v) => chalk.red(typeof v === 'string' ? v : JSON.stringify(v))));
                },
            };
            try {
                // eslint-disable-next-line no-await-in-loop
                await run.call({ chalk, log }, fetchs.shift());
            } catch (e) { log.e(e.stack || e); }
            messages.forEach((v) => v && console.log(...v));
        }
    }));
}

module.exports = {
    safeRequest,
    setOrPush,
    queue,
};
