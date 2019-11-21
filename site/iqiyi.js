/*
 * @Description: iqiyi spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2019-11-16 23:40:41
 */
const utils = require('../utils')

module.exports = async (site, log) => {
    let albumId = await utils.safeRequest(`https://www.iqiyi.com/${site.id}.html`, log)
    let airInfo = albumId && /每(周[一二三四五六日])(\d{2}:\d{2}|\S+)更新/g.exec(albumId)
    if (airInfo) {
        site.week = "一二三四五六日".indexOf(airInfo[1].trim().replace("周", "")) + 1
        site.time = airInfo[2].replace(":", "")
    }
    albumId = /albumId: "([0-9]*)"/g.exec(albumId)
    if (!albumId || !albumId[1]) return
    albumId = albumId[1] // 202728701
    let content = []
    let totalPage = Math.max(0, Math.floor((site.sort || 0) / 100)) + 1
    let page = totalPage
    while (page <= totalPage) {
        log(`...loading page ${page}`)
        let listInfo = await utils.safeRequest(`https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=${albumId}&page=${page}&size=100`, log, { json: true })
        if (!listInfo || !listInfo.data || !listInfo.data.epsodelist) {
            log(listInfo)
            break
        }
        content.push(...listInfo.data.epsodelist)
        site.sort = (page - 1) * 100 + listInfo.data.epsodelist.length || site.sort
        totalPage = listInfo.data.page
        page++
    }

    return content.map(ep => ({
        site: site.site,
        sort: ep.order,
        title: ep.subtitle || ep.name,
        url: ep.playUrl,
        time: new Date(ep.publishTime || ep.issueTime)
    }))
}
if (!module.parent) {
    (async () => {
        let site = {
            site: 'iqiyi',
            id: 'a_19rrk1kp41'
        }
        console.log(await module.exports(site, console.log))
        console.log(site)
    })()
}