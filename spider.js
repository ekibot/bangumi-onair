/*
 * @Description: 
 * @Author: ekibun
 * @Date: 2019-07-14 18:35:31
 * @LastEditors: ekibun
 * @LastEditTime: 2019-07-16 14:14:01
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
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath))
        }
        let addEpSite = async (sort, site) => {
            let bgmEps = (await getSubject()).eps
            if (!bgmEps) return false
            let bgmEp = bgmEps.find(v => v.sort == sort)
            if (!bgmEp) return false
            let ep = data.eps.find(v => v.id == bgmEp.id)
            if (ep) {
                let siteIndex = ep.sites.indexOf(v => v.site == site.site && v.url == site.url)
                if (~siteIndex) {
                    ep.sites[siteIndex] = site
                } else {
                    ep.sites.push(site)
                }
                ep.name = bgmEp.name
            } else {
                data.eps.push({
                    id: bgmEp.id,
                    name: bgmEp.name,
                    sites: [site]
                })
            }
            return true
        }

        let isNewSubject = ((!bgmItem.end || lagDay(now, new Date(bgmItem.end)) < 10) && lagDay(new Date(bgmItem.begin), now) < 10)
        for (site of bgmItem.sites) {
            if (!isNewSubject && data.eps.find(ep => ep.sites.find(v => v.site == site.site))) continue
            console.log(`- ${site.site} ${site.id}`)
            if (!site.id) break
            try {
                switch (site.site) {
                    case 'bilibili':
                        let data = await safeRequest(`https://bangumi.bilibili.com/view/web_api/season?season_id=${site.id}`, { json: true })
                        if (!data.result || !data.result.episodes) {
                            console.log(data)
                            break
                        }
                        for (ep of data.result.episodes) {
                            await addEpSite(Number(ep.index), {
                                site: 'bilibili',
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
                        for (ep of listInfo.data.epsodelist) {
                            await addEpSite(ep.order, {
                                site: 'iqiyi',
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
                        for (ep of json.PlaylistItem.videoPlayList) {
                            await addEpSite(Number(ep.episode_number), {
                                site: 'qq',
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
