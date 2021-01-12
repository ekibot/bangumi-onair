/* eslint-disable max-len */
/*
 * @Description: spider
 * @Author: ekibun
 * @Date: 2019-07-14 18:35:31
 * @LastEditors: ekibun
 * @LastEditTime: 2020-07-07 13:10:23
 */

/** @type { { items: BangumiData[] } } */
const bangumiData = require('bangumi-data');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const utils = require('./utils');

const now = moment();

/**
 * 通过首播时间推测放送的星期和时间
 * @param { string } dateString
 */
function parseWeekTime(dateString) {
    if (!dateString) return { week: 0, time: '' };
    const date = moment(dateString).tz('Asia/Shanghai');
    return {
        week: date.day(),
        time: date.format('HHmm'),
    };
}

/**
 * 先检查站点的放送信息，不存在则按首播时间推测
 * @param { BangumiData } item
 * @param { Site[] } sites
 */
function getChinaDate(item, sites) {
    let site = sites && sites.find((v) => v.week && !Number.isNaN(Number(v.time)));
    if (site) return site;
    const chinaSites = ['acfun', 'bilibili', 'tucao', 'sohu', 'youku', 'tudou', 'qq', 'iqiyi', 'letv', 'pptv', 'kankan', 'mgtv'];
    let date = null;
    for (site of item.sites) {
        if (site.begin && chinaSites.includes(site.site)) date = date && date < site.begin ? date : site.begin;
    }
    return parseWeekTime(date);
}

(async () => {
    /** @type { CalendarItem[] } */ const calendar = [];
    /**
     * @this { import('./utils').This }
     */
    async function queueItem(bgmItem) {
        const bangumi = bgmItem.sites.find((v) => v.site === 'bangumi');
        if (!bangumi) return;
        const bgmId = bangumi.id;
        this.log.v(bgmId, bgmItem.title);

        /**
         * 只加载一次bgm.tv的数据
         */
        let _subject = null;
        /** @type { () => Promise<Subject> } */ const getSubject = async () => {
            if (!_subject) _subject = await this.safeRequest(`https://api.bgm.tv/subject/${bgmId}/ep`);
            return _subject || getSubject();
        };

        /**
         * 加载上次保存的数据
         */
        const filePath = `./onair/${Math.floor(bgmId / 1000)}/${bgmId}.json`;
        /** @type { Subject } */ let data = {
            id: bgmId,
            name: bgmItem.title,
            sites: [],
            eps: [],
        };
        if (fs.existsSync(filePath)) try {
            data = JSON.parse(fs.readFileSync(filePath));
        } catch (e) { this.log.e(e.stack || e); }

        /**
         * 加载条目规则
         */
        const rulePath = `./rule/${bgmId}.js`;
        /** @type { Rule | null } */ let rule = null;
        if (fs.existsSync(rulePath)) try {
            rule = require(rulePath);
            // eslint-disable-next-line no-param-reassign
            bgmItem = {
                ...bgmItem,
                ...rule._item,
            };
        } catch (e) { this.log.e(e.stack || e); }

        /**
         * 检测保存的条目是否满足规则
         * @param { Site } site
         * @returns { boolean }
         */
        const ruleNeedUpdate = (site) => rule && rule[site.site] && rule[site.site].sort && data.eps.reduce(
            (accEp, curEp) => accEp || curEp.sites.reduce(
                (accSite, curSite) => accSite || (curSite.site === site.site
                    && (!curSite.sort || rule[curSite.site].sort(curSite.sort, site.site) !== curEp.sort)), false,
            ), false,
        );

        const isNewSubject = ((!bgmItem.end || now.diff(moment(bgmItem.end), 'day') < 10) && moment(bgmItem.begin).diff(now, 'day') < 10);

        for (const bgmSite of bgmItem.sites) {
            if (!bgmSite.id || (!isNewSubject && !ruleNeedUpdate(bgmSite)
                && data.eps.find((ep) => ep.sites.find((v) => v.site === bgmSite.site)))) continue;
            this.log.v(`- ${bgmSite.site} ${bgmSite.id}`);
            data.sites = data.sites || [];
            /** @type { Site } */ let site = {
                site: bgmSite.site,
                id: bgmSite.id,
            };
            const siteIndex = data.sites.findIndex((v) => v.site === bgmSite.site && v.id === bgmSite.id);
            if (~siteIndex) {
                site = data.sites[siteIndex];
            }
            const sitePath = `./site/${site.site}.js`;
            if (fs.existsSync(sitePath)) try {
                /** @type { SiteEpisode[] } */const eps = await this.awaitTimeout((require(sitePath)).call(this, site));
                /**
                 * 更新剧集信息
                 */
                if (eps && eps.length > 0) for (const siteEp of eps) {
                    const bgmSort = (rule && rule[site.site] && rule[site.site].sort)
                        ? rule[site.site].sort(siteEp.sort) : siteEp.sort;
                    const bgmEps = (await this.awaitTimeout(getSubject())).eps;
                    const bgmEp = bgmEps && bgmEps.find((v) => v.sort === bgmSort);
                    if (!bgmEp) continue;
                    const ep = data.eps.find((v) => v.id === bgmEp.id);
                    if (ep) {
                        utils.setOrPush(ep.sites, siteEp, (v) => v.site === site.site && v.url === siteEp.url);
                        ep.sort = bgmEp.sort;
                        ep.name = bgmEp.name;
                    } else {
                        data.eps.push({
                            id: bgmEp.id,
                            sort: bgmEp.sort,
                            name: bgmEp.name,
                            sites: [siteEp],
                        });
                    }
                }
                this.log.v(site);
            } catch (e) {
                this.log.e(e.stack || e);
            }
            if (site.week || site.sort) {
                /**
                 * 更新站点信息
                 */
                if (~siteIndex) {
                    data.sites[siteIndex] = site;
                } else {
                    data.sites.push(site);
                }
            }
        }
        if (data.eps.length > 0) {
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
            this.log.v(`- writing ${data.eps.length} eps`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 1));
        }
        /**
         * 时间表
         */
        if (isNewSubject) {
            const subject = await this.awaitTimeout(getSubject());
            const dateJP = parseWeekTime(bgmItem.begin);
            const dateCN = getChinaDate(bgmItem, data.sites);
            const eps = subject.eps && subject.eps.filter((ep) => ep.airdate && Math.abs(now.diff(moment(ep.airdate), 'day')) < 10).map((ep) => {
                // eslint-disable-next-line camelcase, object-curly-newline
                const { id, type, sort, name, name_cn, airdate, status } = ep;
                return {
                    id, type, sort, name, name_cn, airdate: moment(airdate).format('YYYY-MM-DD'), status,
                };
            });
            const epMain = (subject.eps || []).filter((ep) => ep.type === 0);
            const epNotOnAir = epMain.find((ep) => ep.status === 'NA'); // 第一个没放送
            let curEp = epMain[epMain.indexOf(epNotOnAir) - 1] || epNotOnAir;
            const accEp = epMain[epMain.indexOf(curEp) - 1];
            if (!(accEp && moment(curEp.airdate).diff(moment(accEp.airdate), 'day') > 30)) while (curEp) {
                const airdate = moment(curEp.airdate);
                if (!(now.diff(airdate, 'day') < 30)) break; // 超过一个月就不管了
                const nextEp = epMain[epMain.indexOf(curEp) + 1];
                const nextAirdate = nextEp && moment(nextEp.airdate);
                while (nextAirdate && !(nextAirdate.diff(airdate, 'day') < 14)) {
                    airdate.add(7, 'day');
                    if (now.diff(airdate, 'day') > 10) continue;
                    if (airdate.diff(now, 'day') > 10) break;
                    // eslint-disable-next-line camelcase, object-curly-newline
                    const { type, sort } = nextEp;
                    eps.push({
                        type, sort, name: '本周停更', airdate: moment(airdate).format('YYYY-MM-DD'),
                    });
                }
                if (airdate.diff(now, 'day') > 10) break;
                curEp = nextEp;
            }
            if (eps && eps.length > 0) {
                calendar.push({
                    id: subject.id,
                    name: subject.name,
                    name_cn: subject.name_cn,
                    air_date: subject.air_date,
                    weekDayJP: dateJP.week,
                    weekDayCN: dateCN.week,
                    timeJP: dateJP.time,
                    timeCN: dateCN.time,
                    image: subject.images && subject.images.grid,
                    sites: data.sites.filter((v) => v.week),
                    eps,
                });
                calendar.sort((a, b) => a.id - b.id);
                fs.writeFileSync('calendar.json', `[${calendar.map((v) => JSON.stringify(v)).join(',\n')}]`);
            }
        }
    }
    await utils.queue(bangumiData.items, queueItem, 5);
})();
