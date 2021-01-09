/* eslint-disable no-param-reassign */
/*
 * @Description: youku spider
 * @Author: ekibun
 * @Date: 2019-08-03 13:31:54
 * @LastEditors  : ekibun
 * @LastEditTime : 2019-12-31 20:28:10
 */
const cheerio = require('cheerio');

/**
 * @this { import('../utils').This }
 */
async function youku(site) {
    let showId = await this.safeRequest(`https://list.youku.com/show/id_z${site.id}.html`);
    let airInfo = showId && cheerio.load(showId)('.p-renew').text();
    airInfo = airInfo && /每(周[一二三四五六日])(\d{2}:\d{2})更新/g.exec(airInfo);
    if (airInfo) {
        site.week = '一二三四五六日'.indexOf(airInfo[1].replace('周', '')) + 1;
        site.time = airInfo[2].replace(':', '');
    }

    showId = /showid:"([0-9]*)"/g.exec(showId);
    if (!showId || !showId[1]) return;
    // eslint-disable-next-line prefer-destructuring
    showId = showId[1]; // 19592
    const content = [];
    let page = Math.max(0, Math.floor((site.sort || 0) / 10)) + 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        this.log.v(`...loading page ${page}`);
        // eslint-disable-next-line no-await-in-loop
        let json = await this.safeRequest(`https://list.youku.com/show/episode?id=${showId}&stage=reload_${(page - 1) * 10 + 1}&callback=j`);
        json = JSON.parse(json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1));
        if (json.error) break;
        const arr = cheerio.load(json.html)('div.p-item a').toArray().map(cheerio);
        if (!arr.length) break;
        content.push(...arr);
        site.sort = (page - 1) * 10 + arr.length || site.sort;
        if (arr.length < 10) break;
        page += 1;
    }
    // eslint-disable-next-line consistent-return
    return content.map((ep) => ({
        site: site.site,
        sort: Number(ep.parent().contents().get(0).data),
        title: ep.text(),
        url: `https:${ep.attr('href')}`,
    }));
}
module.exports = youku;
/* eslint-disable no-console */
if (!module.parent) {
    (async () => {
        const site = {
            site: 'youku',
            id: 'cc003400962411de83b1',
            sort: 1010,
        };
        console.log(await module.exports.call(require('../utils').createThis(), site));
        console.log(site);
    })();
}
