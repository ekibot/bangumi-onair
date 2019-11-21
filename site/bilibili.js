/*
 * @Description: bilibili spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2019-11-16 20:36:29
 */
const utils = require('../utils')

module.exports = async(site, log) => {
    let data = await utils.safeRequest(`https://bangumi.bilibili.com/view/web_api/media?media_id=${site.id}`, log, { json: true })
    let airInfo = data.result && data.result.episode_index && /每(周[一二三四五六日])\s?(\d{2}:\d{2})更新/g.exec(data.result.episode_index.index_show)
    if (airInfo) {
        site.week = "一二三四五六日".indexOf(airInfo[1].trim().replace("周", "")) + 1
        site.time = airInfo[2].replace(":", "")
    }
    if (!data.result || !data.result.episodes) {
        log(data)
        return
    }
    site.sort = data.result.episodes.length || site.sort
    return data.result.episodes.map(ep => ({
        site: site.site,
        sort: Number(ep.index),
        title: ep.index_title,
        url: `https://www.bilibili.com/bangumi/play/ep${ep.ep_id}`,
        time: new Date(ep.pub_real_time + "+8")
    }))
}
if (!module.parent) {
    (async () => {
        let site = {
            site: 'bilibili',
            id: '28222622'
        }
        console.log(await module.exports(site, console.log))
        console.log(site)
    })()
}