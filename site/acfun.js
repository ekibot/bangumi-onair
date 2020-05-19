/* eslint-disable no-param-reassign */
/*
 * @Description: acfun spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors: ekibun
 * @LastEditTime: 2020-05-19 18:45:44
 */

/**
 * @this { import('../utils').This }
 */
async function acfun(site) {
    const page = await this.safeRequest(`https://www.acfun.cn/bangumi/aa${site.id}`);
    if (!site.week) {
        const airInfo = page && /每(周[一二三四五六日])\s*(\d{2}:\d{2})更新/g.exec(page);
        if (airInfo) {
            site.week = '一二三四五六日'.indexOf(airInfo[1].replace('周', '')) + 1;
            site.time = airInfo[2].replace(':', '');
        }
    }
    let bangumiList = /window.bangumiList *?= ?(.*?);/.exec(page);
    bangumiList = bangumiList && JSON.parse(bangumiList[1]);
    if (!bangumiList || !bangumiList.items) return;
    // eslint-disable-next-line consistent-return
    return bangumiList.items.map((ep, index) => ({
        site: site.site,
        sort: Number((/\d+(.\d)?/.exec(ep.episodeName) || [])[0] || index + 1),
        title: ep.title || ep.episodeName,
        url: `https://www.acfun.cn/bangumi/ab${ep.bangumiId}_36188_${ep.itemId}`,
        time: new Date(ep.updateTime),
    }));
}
module.exports = acfun;
/* eslint-disable no-console */
if (!module.parent) {
    (async () => {
        const site = {
            site: 'acfun',
            id: '6001745',
        };
        console.log(await module.exports.call(require('../utils').createThis(), site));
        console.log(site);
    })();
}
