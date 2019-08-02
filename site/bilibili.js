/*
 * @Description: bilibili spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-02 13:48:05
 */
const utils = require('../utils')

module.exports = async(site) => {
    let data = await utils.safeRequest(`https://bangumi.bilibili.com/view/web_api/media?media_id=${site.id}`, { json: true })
    if (!data.result || !data.result.episodes) {
        console.log(data)
        return
    }
    return data.result.episodes.map(ep => ({
        site: site.site,
        sort: Number(ep.index),
        title: ep.index_title,
        url: `https://www.bilibili.com/bangumi/play/ep${ep.ep_id}`
    }))
}