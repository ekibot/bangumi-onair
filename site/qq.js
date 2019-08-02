/*
 * @Description: qq spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-02 13:48:12
 */
const utils = require('../utils')

module.exports = async (site) => {
    let json = await utils.safeRequest(`http://s.video.qq.com/get_playsource?id=${site.id.split('/')[1]}&type=4&otype=json&range=1-100000`)
    json = JSON.parse(json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1))
    if (!json.PlaylistItem || !json.PlaylistItem.videoPlayList) {
        console.log(json)
        return
    }
    return json.PlaylistItem.videoPlayList.map(ep => ({
        site: site.site,
        sort: Number(ep.episode_number),
        title: ep.title,
        url: ep.playUrl
    }))
}