/* eslint-disable no-param-reassign */
/*
 * @Description: qq spider
 * @Author: ekibun
 * @Date: 2019-08-02 13:36:17
 * @LastEditors  : ekibun
 * @LastEditTime : 2019-12-31 10:27:54
 */
const utils = require('../utils');

module.exports = async (site, log) => {
    if (!site.week) {
        let airInfo = await utils.safeRequest(`https://v.qq.com/detail/${site.id}.html`, log);
        airInfo = airInfo && /每(周[一二三四五六日])(\d{2}[:：]\d{2})更/g.exec(airInfo);
        if (airInfo) {
            site.week = '一二三四五六日'.indexOf(airInfo[1].replace('周', '')) + 1;
            site.time = airInfo[2].replace(/[:：]/, '');
        }
    }
    let json = await utils.safeRequest(`http://s.video.qq.com/get_playsource?id=${site.id.split('/')[1]}&type=4&otype=json&range=${site.sort || 1}-10000`, log);
    json = JSON.parse(json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1));
    if (!json.PlaylistItem || !json.PlaylistItem.videoPlayList) {
        log.e(json);
        return;
    }
    // eslint-disable-next-line max-len
    site.sort = (json.PlaylistItem.totalEpisode || json.PlaylistItem.videoPlayList.length || 1) - 1 + (site.sort || 1);
    // eslint-disable-next-line consistent-return
    return json.PlaylistItem.videoPlayList.map((ep) => ({
        site: site.site,
        sort: Number(ep.episode_number),
        title: ep.title,
        url: ep.playUrl,
    }));
};
/* eslint-disable no-console */
if (!module.parent) {
    (async () => {
        const site = {
            site: 'qq',
            id: '8/8szu83s4qj0z4o0',
        };
        console.log(await module.exports(site, console.log));
        console.log(site);
    })();
}
