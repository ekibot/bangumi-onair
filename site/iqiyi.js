/* eslint-disable no-param-reassign */
/*
 * @Description: iqiyi spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors  : ekibun
 * @LastEditTime : 2019-12-31 20:27:07
 */

/**
 * @this { import('../utils').This }
 */
async function iqiyi(site) {
    let albumId = await this.safeRequest(`https://www.iqiyi.com/${site.id}.html`);
    const airInfo = albumId && /每(周[一二三四五六日])(\d{2}:\d{2}|\S+)更新/g.exec(albumId);
    if (airInfo) {
        site.week = '一二三四五六日'.indexOf(airInfo[1].trim().replace('周', '')) + 1;
        site.time = airInfo[2].replace(':', '');
    }
    albumId = /albumId: "([0-9]*)"/g.exec(albumId);
    if (!albumId || !albumId[1]) return;
    // eslint-disable-next-line prefer-destructuring
    albumId = albumId[1]; // 202728701
    const content = [];
    let totalPage = Math.max(0, Math.floor((site.sort || 0) / 100)) + 1;
    let page = totalPage;
    while (page <= totalPage) {
        this.log.v(`...loading page ${page}`);
        // eslint-disable-next-line no-await-in-loop
        const listInfo = await this.safeRequest(`https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=${albumId}&page=${page}&size=100`);
        if (!listInfo || !listInfo.data || !listInfo.data.epsodelist) {
            this.log.e(listInfo);
            break;
        }
        content.push(...listInfo.data.epsodelist);
        site.sort = (page - 1) * 100 + listInfo.data.epsodelist.length || site.sort;
        totalPage = listInfo.data.page;
        page += 1;
    }

    // eslint-disable-next-line consistent-return
    return content.map((ep) => ({
        site: site.site,
        sort: ep.order,
        title: ep.subtitle || ep.name,
        url: ep.playUrl,
        time: new Date(ep.publishTime || ep.issueTime),
    }));
}
module.exports = iqiyi;
/* eslint-disable no-console */
if (!module.parent) {
    (async () => {
        const site = {
            site: 'iqiyi',
            id: 'a_19rrgif6qp',
        };
        console.log(await module.exports.call(require('../utils').createThis(), site));
        console.log(site);
    })();
}
