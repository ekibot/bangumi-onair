/*
 * @Description: utils
 * @Author: ekibun
 * @Date: 2019-08-02 13:32:54
 * @LastEditors  : ekibun
 * @LastEditTime : 2020-01-05 15:16:26
 */
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const axios = require('axios').default.create({
    timeout: 5000,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
});
const chalk = new (require('chalk')).Instance({ level: 2 });

axios.interceptors.response.use(
    (response) => Promise.resolve(response.data),
    (error) => Promise.reject(error),
);

/**
 * 函数上下文
 * @typedef { Object } This
 * @property { { v: (...message) => void, e: (...message) => void } } log
 * @property { typeof safeRequest } safeRequest
 */

/**
 * safe request with retry
 * @param { string } url
 * @param { * } options
 * @param { number } retry
 */
async function safeRequest(url, options, retry = 3) {
    return retry ? axios.get(url, options).catch((error) => {
        if (error.response) {
            this.log.e(error.response.status, typeof error.response.data === 'string'
                ? cheerio.load(error.response.data).text().trim().split('\n')[0].substring(0, 100)
                : error.response.data);
            return undefined;
        }
        this.log.e(error.message);
        return safeRequest.call(this, url, options, retry - 1);
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
 * create this with logger
 * @param { (type, ...messsage) => void } printer
 * @returns { This }
 */
// eslint-disable-next-line no-console
function createThis(printer = (type, ...message) => console[type](...message)) {
    const log = {
        v: (...message) => printer('log', ...message),
        e: (...message) => printer('error', ...message),
    };
    return {
        chalk,
        log,
        safeRequest,
    };
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
    await Promise.all(new Array(num).fill(0).map(async (_, i) => {
        while (fetchs.length) {
            const pre = [chalk.yellow(`${_fetchs.length - fetchs.length + 1}/${_fetchs.length}`), chalk.green(i)];
            const messages = [];
            const _this = createThis((...message) => messages.push(message));
            try {
                await run.call(_this, fetchs.shift());
            } catch (e) { _this.log.e(e.stack || e); }
            messages[0] = messages[0] || ['log'];
            messages[0].splice(1, 0, ...pre);
            // eslint-disable-next-line no-console
            messages.forEach((v) => v && console[v[0]] && console[v[0]](...v.slice(1)));
        }
    }));
}

module.exports = {
    safeRequest,
    setOrPush,
    queue,
    createThis,
};
