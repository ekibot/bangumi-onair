/*
 * @Description: acfun spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-03 12:04:15
 */
const utils = require('../utils')

module.exports = async (site) => {
    let content = [];
    let page = 1, totalPage = 1;
    while (page <= totalPage) {
        let data = await utils.safeRequest(`https://www.acfun.cn/album/abm/bangumis/video?albumId=${site.id}&size=1000&num=${page}`, { json: true })
        if (!data.data || !data.data.content) {
            console.log(data)
            break
        }
        content.push(...data.data.content.map(v => v.videos[0]))
        totalPage = data.data.totalPage || totalPage
        page++
    }

    return content.map(ep => ({
        site: site.site,
        sort: Math.floor(ep.sort / 10),
        title: ep.newTitle || ep.episodeName,
        url: `https://www.acfun.cn/bangumi/ab${ep.albumId}_${ep.groupId}_${ep.id}`
    }))
}