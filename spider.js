/*
 * @Description: 
 * @Author: ekibun
 * @Date: 2019-07-14 18:35:31
 * @LastEditors: ekibun
 * @LastEditTime: 2019-07-14 22:22:04
 */
const bangumiData = require('bangumi-data')
const request = require('request-promise-native')
const fs = require('fs')

let now = new Date()
let lagDay = (a, b) => {
    return (a - b) / 1000 / 60 / 60 / 24;
}

let safeRequest = (url, options) => {
    return request(url, options).catch((error) => {
        console.log(error.stack)
        return new Promise((resolve) => { setTimeout(resolve, 1000) })
    });
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
        let hasMatchedEps = false
        let filePath = `./onair/${bgmId}.json`
        let newSites = []
        if (((!bgmItem.end || lagDay(now, new Date(bgmItem.end)) < 10) && lagDay(new Date(bgmItem.begin), now) < 10) || !fs.existsSync(filePath)) {
            newSites = bgmItem.sites
        } else {
            let data = JSON.parse(fs.readFileSync(filePath))
            for (site of bgmItem.sites) {
                if (data.eps.find(ep => ep.sites.find(v => v.site == site.site))) {
                    continue
                }
                newSites.push(site)
            }
        }
        for (site of newSites) {
            switch (site.site) {
                case "bilibili":
                    let data = await safeRequest(`https://bangumi.bilibili.com/view/web_api/season?season_id=${site.id}`, { json: true })
                    if (!data.result || !data.result.episodes) {
                        console.log(data)
                        break
                    }
                    let bgmEps = (await getSubject()).eps
                    if (!bgmEps) break

                    for (ep of data.result.episodes) {
                        let bgmEp = bgmEps.find(v => v.sort == Number(ep.index))
                        if (!bgmEp) continue
                        hasMatchedEps = true
                        bgmEp.sites = bgmEp.sites || []
                        bgmEp.sites.push({
                            site: "bilibili",
                            title: ep.index_title,
                            url: `https://www.bilibili.com/bangumi/play/ep${ep.ep_id}`
                        })
                    }
                    break
            }
        }
        if (!hasMatchedEps) continue
        let eps = (await getSubject()).eps.filter(v => v.sites).map(({ id, name, sites }) => ({ id, name, sites }))
        if (eps.length > 1) {
            // mixin
            if (fs.existsSync(filePath)) {
                let oldEps = JSON.parse(fs.readFileSync(filePath)).eps
                for (oldEp of oldEps) {
                    let ep = eps.find(ep => ep.id == oldEp.id)
                    if (ep) {
                        for (oldSite of oldEp.sites) {
                            if (ep.sites.find(v => v.site == oldSite.site)) continue
                            ep.sites.push(oldSite)
                        }
                    } else {
                        eps.push(ep)
                    }
                }
            }
            fs.writeFileSync(filePath, JSON.stringify({ id: bgmId, name: bgmItem.title, eps }))
        }
    }
})().catch((e) => {
    console.log(e)
})

