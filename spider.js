/*
 * @Description: 
 * @Author: ekibun
 * @Date: 2019-07-14 18:35:31
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-02 12:41:46
 */
const bangumiData = require('bangumi-data')
const request = require('request-promise-native')
const fs = require('fs')
const git = require('simple-git')(`./`)
const path = require('path')

let now = new Date()
let lagDay = (a, b) => {
    return (a - b) / 1000 / 60 / 60 / 24
}

let safeRequest = async (url, options) => {
    let retry = 3
    let ret = undefined
    while (!ret && retry > 0)
        ret = await request(url, { timeout: 10000, ...options }).catch((error) => {
            retry--
            return new Promise((resolve) => { setTimeout(resolve, 1000) })
        })
    return ret
}

(async () => {
    let count = 0
    for (bgmItem of bangumiData.items) {
        count++
        let bangumi = bgmItem.sites.find(v => v.site == 'bangumi')
        if (!bangumi) continue
        let bgmId = bangumi.id

        console.log(`${count}/${bangumiData.items.length}`, bgmId, bgmItem.title)
        if (bgmItem.sites.length <= 1) continue
        let _subject = undefined
        let getSubject = async () => {
            while (!_subject)
                _subject = await safeRequest(`https://api.bgm.tv/subject/${bgmId}/ep`, { json: true })
            return _subject
        }

        let filePath = `./onair/${Math.floor(bgmId / 1000)}/${bgmId}.json`
        let data = { id: bgmId, name: bgmItem.title, eps: [] }
        if (fs.existsSync(filePath)) try {
            data = JSON.parse(fs.readFileSync(filePath))
        } catch (e) { console.log(e.stack || e) }

        let rulePath = `./rule/${bgmId}.js`
        let rule = undefined
        if (fs.existsSync(rulePath)) try {
            rule = require(rulePath)
        } catch (e) { console.log(e.stack || e) }

        let clearEpSite = (site) => {
            for (ep of data.eps) {
                ep.sites = ep.sites.filter(v => v.site != site.site)
            }
            data.eps = data.eps.filter(v => v.sites.length)
        }

        let addEpSite = async (site) => {
            let bgm_sort = (rule && rule[site.site] && rule[site.site].sort) ? rule[site.site].sort(site.sort) : site.sort
            let bgmEps = (await getSubject()).eps
            if (!bgmEps) return false
            let bgmEp = bgmEps.find(v => v.sort == bgm_sort)
            if (!bgmEp) return false
            let ep = data.eps.find(v => v.id == bgmEp.id)
            if (ep) {
                let siteIndex = ep.sites.findIndex(v => v.site == site.site && v.url == site.url)
                if (~siteIndex) {
                    ep.sites[siteIndex] = site
                } else {
                    ep.sites.push(site)
                }
                ep.sort = bgmEp.sort
                ep.name = bgmEp.name
            } else {
                data.eps.push({
                    id: bgmEp.id,
                    sort: bgmEp.sort,
                    name: bgmEp.name,
                    sites: [site]
                })
            }
            return true
        }

        let ruleNeedUpdate = (site) => {
            if (rule && rule[site.site] && rule[site.site].sort) {
                let lastEp = data.eps.reverse().find(ep => ep.sites.find(v => v.site == site.site))
                if (lastEp.sort === undefined) return true
                let lastSite = lastEp.sites.reverse().find(v => v.site == site.site)
                if (lastSite.sort === undefined) return true
                if (rule[site.site].sort(lastSite.sort, site.site) != lastEp.sort) return true
            }
            return false
        }

        let isNewSubject = ((!bgmItem.end || lagDay(now, new Date(bgmItem.end)) < 10) && lagDay(new Date(bgmItem.begin), now) < 10)
        for (site of bgmItem.sites) {
            if (!isNewSubject && !ruleNeedUpdate(site) && data.eps.find(ep => ep.sites.find(v => v.site == site.site))) continue

            console.log(`- ${site.site} ${site.id}`)
            if (!site.id) break
            try {
                switch (site.site) {
                    case 'bilibili':
                        let data = await safeRequest(`https://bangumi.bilibili.com/view/web_api/media?media_id=${site.id}`, { json: true })
                        if (!data.result || !data.result.episodes) {
                            console.log(data)
                            break
                        }
                        clearEpSite(site)
                        for (ep of data.result.episodes) {
                            await addEpSite({
                                site: site.site,
                                sort: Number(ep.index),
                                title: ep.index_title,
                                url: `https://www.bilibili.com/bangumi/play/ep${ep.ep_id}`
                            })
                        }
                        break
                    case 'iqiyi':
                        let albumId = await safeRequest(`https://www.iqiyi.com/${site.id}.html`)
                        albumId = /albumId: "([0-9]*)"/g.exec(albumId)
                        if (!albumId || !albumId[1]) break
                        albumId = albumId[1] // 202728701
                        let listInfo = await safeRequest(`https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=${albumId}&page=1&size=100000`, { json: true })
                        if (!listInfo.data || !listInfo.data.epsodelist) {
                            console.log(listInfo)
                            break
                        }
                        clearEpSite(site)
                        for (ep of listInfo.data.epsodelist) {
                            await addEpSite({
                                site: site.site,
                                sort: ep.order,
                                title: ep.name,
                                url: ep.playUrl
                            })
                        }
                        break
                    case 'qq': // 5/53q0eh78q97e4d1
                        let json = await safeRequest(`http://s.video.qq.com/get_playsource?id=${site.id.split('/')[1]}&type=4&otype=json&range=1-100000`)
                        json = JSON.parse(json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1))
                        if (!json.PlaylistItem || !json.PlaylistItem.videoPlayList) {
                            console.log(json)
                            break
                        }
                        clearEpSite(site)
                        for (ep of json.PlaylistItem.videoPlayList) {
                            await addEpSite({
                                site: site.site,
                                sort: Number(ep.episode_number),
                                title: ep.title,
                                url: ep.playUrl
                            })
                        }
                }
            } catch (e) {
                console.log(e.stack || e)
            }
        }
        if (data.eps.length > 0) {
            let dirPath = path.dirname(filePath)
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath)
            fs.writeFileSync(filePath, JSON.stringify(data))
        }
    }
})().then(() => {
    let time = new Date()
    git.add('./*')
        .commit('update at ' + time)
        .push(['-u', 'origin', 'master'], (e) => {
            console.log('commit ' + (e == null ? "成功" : e) + ', at：' + time)
        })
})
