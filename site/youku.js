/*
 * @Description: youku spider
 * @Author: ekibun
 * @Date: 2019-08-03 13:31:54
 * @LastEditors: ekibun
 * @LastEditTime: 2019-11-16 23:07:59
 */
const utils = require('../utils')
const cheerio = require('cheerio')

module.exports = async (site) => {
    let showId = await utils.safeRequest(`https://list.youku.com/show/id_z${site.id}.html`)
    let airInfo = await utils.safeRequest(`https://list.youku.com/show/id_z${site.id}.html`)
    airInfo = airInfo && cheerio.load(airInfo)(".p-renew").text()
    airInfo = airInfo && /每(周[一二三四五六日])(\d{2}:\d{2})更新/g.exec(airInfo)
    if(airInfo){
        site.week = "一二三四五六日".indexOf(airInfo[1].replace("周", "")) + 1
        site.time = airInfo[2].replace(":", "")
    }

    showId = /showid:\"([0-9]*)\"/g.exec(showId)
    if (!showId || !showId[1]) return
    showId = showId[1] // 19592
    let content = []
    let page = Math.max(0, Math.floor((site.sort || 0) / 50)) + 1
    while (true) {
        console.log(`...loading page ${page}`)
        let json = JSON.parse(await utils.safeRequest(`https://v.youku.com/page/playlist?&showid=${showId}&isSimple=false&page=${page}`))
        let arr = cheerio.load(json.html)('div.item').toArray().map(cheerio)
        if (!arr.length) break
        content.push(...arr)
        site.sort = (page - 1) * 50 + arr.length || site.sort
        if (arr.length < 50) break
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
        let site = {
            site: 'youku',
            id: 'cc003400962411de83b1',
            sort: 900
        }
        console.log(await module.exports(site))
        console.log(site)
    })()
}