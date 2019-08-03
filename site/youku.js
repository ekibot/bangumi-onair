/*
 * @Description: youku spider
 * @Author: ekibun
 * @Date: 2019-08-03 13:31:54
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-03 14:09:33
 */
const utils = require('../utils')
const cheerio = require('cheerio')

module.exports = async (site) => {
    let showId = await utils.safeRequest(`https://list.youku.com/show/id_z${site.id}.html`)
    showId = /showid:\"([0-9]*)\"/g.exec(showId)
    if (!showId || !showId[1]) return
    showId = showId[1] // 19592
    let content = [];
    let page = 1;
    while (true) {
        console.log(`...loading page ${page}`)
        let json = await utils.safeRequest(`https://v.youku.com/page/playlist?&showid=${showId}&videoCategoryId=100&isSimple=false&page=${page}&callback=jQuery`)
        json = JSON.parse(json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1))
        let arr = cheerio.load(json.html)('div.item').toArray().map(cheerio)
        if (!arr.length) break
        content.push(...arr)
        page++
    }
    return content.map(ep => ({
        site: site.site,
        sort: ep.attr("seq"),
        title: ep.attr("title"),
        url: `https://v.youku.com/v_show/${ep.attr("item-id").replace("item_", "id_")}`
    }))
}
if (!module.parent) {
    (async () => {
        console.log(await module.exports({
            site: 'youku',
            id: 'cc003400962411de83b1'
        }))
    })()
}