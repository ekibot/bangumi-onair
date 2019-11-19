/*
 * @Description: utils
 * @Author: ekibun
 * @Date: 2019-08-02 13:32:54
 * @LastEditors: ekibun
 * @LastEditTime: 2019-11-19 16:41:58
 */
const request = require('request-promise-native')
let timezoneOffset = 60 * 8 * 60 * 1000; // UTC+8 
let parseWeekTime = (date) => {
    if (!date) return { week: 0, time: '' }
    let offset = new Date(new Date(date).getTime() + timezoneOffset)
    let week = offset.getUTCDay();
    let time = offset.getUTCHours().toString().padStart(2, "0") + offset.getUTCMinutes().toString().padStart(2, "0");
    return { week, time }
}

module.exports = {
    safeRequest: async (url, options) => {
        let retry = 2
        let ret = undefined
        while (!ret && retry > 0)
            ret = await request(url, {
                forever: true,
                timeout: 5000,
                ...options
            }).catch((error) => {
                console.log(`${error}`.split('\n')[0].substring(0, 100))
                retry--
                return new Promise((resolve) => { setTimeout(resolve, 100) })
            })
        return ret
    },
    lagDay: (a, b) => {
        return (a - b) / 1000 / 60 / 60 / 24
    },
    parseWeekTime,
    getChinaDate: (item, sites) => {
        let site = sites && sites.find(v => v.week && !isNaN(Number(v.time)))
        if (site)
            return site

        let chinaSites = ["acfun", "bilibili", "tucao", "sohu", "youku", "tudou", "qq", "iqiyi", "letv", "pptv", "kankan", "mgtv"]
        let date = undefined;
        for (site of item.sites) {
            if (!site.begin || !chinaSites.includes(site.site)) continue;
            date = !date && date < site.begin ? date : site.begin
        }
        return parseWeekTime(date);
    }
}