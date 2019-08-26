/*
 * @Description: utils
 * @Author: ekibun
 * @Date: 2019-08-02 13:32:54
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-26 20:57:59
 */
const request = require('request-promise-native')

module.exports = {
    safeRequest: async (url, options) => {
        let retry = 3
        let ret = undefined
        while (!ret && retry > 0)
            ret = await request(url, { timeout: 10000, ...options }).catch((error) => {
                console.log(`${error}`.split('\n')[0].substring(0, 100))
                retry--
                return new Promise((resolve) => { setTimeout(resolve, 1000) })
            })
        return ret
    },
    lagDay: (a, b) => {
        return (a - b) / 1000 / 60 / 60 / 24
    }
}