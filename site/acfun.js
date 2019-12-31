/* eslint-disable no-param-reassign */
/*
 * @Description: acfun spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors  : ekibun
 * @LastEditTime : 2019-12-31 15:05:48
 */
const utils = require('../utils');

module.exports = async function acfun(site) {
    if (!site.week) {
        let airInfo = await utils.safeRequest(`https://www.acfun.cn/bangumi/aa${site.id}`);
        airInfo = airInfo && /每(周[一二三四五六日])\s*(\d{2}:\d{2})更新/g.exec(airInfo);
        if (airInfo) {
            site.week = '一二三四五六日'.indexOf(airInfo[1].replace('周', '')) + 1;
            site.time = airInfo[2].replace(':', '');
        }
    }
    const content = [];
    let totalPage = Math.max(0, Math.floor((site.sort || 0) / 100)) + 1;
    let page = totalPage;
    while (page <= totalPage) {
        this.log.v(`...loading page ${page}`);
        // eslint-disable-next-line no-await-in-loop
        const data = await utils.safeRequest(`https://www.acfun.cn/album/abm/bangumis/video?albumId=${site.id}&size=100&num=${page}`, { json: true });
        if (!data.data || !data.data.content) {
            this.log.e(data);
            break;
        }
        content.push(...data.data.content.map((v) => v.videos[0]));
        totalPage = data.data.totalPage || totalPage;
        site.sort = (page - 1) * 100 + data.data.content.length || site.sort;
        page += 1;
    }

    return content.map((ep) => ({
        site: site.site,
        sort: Math.floor(ep.sort / 10),
        title: ep.newTitle || ep.episodeName,
        url: `https://www.acfun.cn/bangumi/ab${ep.albumId}_${ep.groupId}_${ep.id}`,
        time: new Date(ep.updatedAt || ep.onlineTime),
    }));
};

/* eslint-disable no-console */
if (!module.parent) {
    (async () => {
        const site = {
            site: 'acfun',
            id: '6000221',
        };
        console.log(await module.exports(site, console.log));
        console.log(site);
    })();
}
