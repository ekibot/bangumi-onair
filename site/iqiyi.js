/*
 * @Description: iqiyi spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-02 13:48:08
 */
const utils = require('../utils')

module.exports = async (site) => {
    let albumId = await utils.safeRequest(`https://www.iqiyi.com/${site.id}.html`)
    albumId = /albumId: "([0-9]*)"/g.exec(albumId)
    if (!albumId || !albumId[1]) return
    albumId = albumId[1] // 202728701
    let listInfo = await utils.safeRequest(`https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=${albumId}&page=1&size=100000`, { json: true })
    if (!listInfo.data || !listInfo.data.epsodelist) {
        console.log(listInfo)
        return
    }
    return listInfo.data.epsodelist.map(ep => ({
        site: site.site,
        sort: ep.order,
        title: ep.subtitle || ep.name,
        url: ep.playUrl
    }))
}