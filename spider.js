/*
 * @Description: 
 * @Author: ekibun
 * @Date: 2019-07-14 18:35:31
 * @LastEditors: ekibun
 * @LastEditTime: 2019-08-02 13:49:16
 */
const bangumiData = require('bangumi-data')
const fs = require('fs')
const git = require('simple-git')(`./`)
const path = require('path')
const utils = require('./utils')

let now = new Date();
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
                _subject = await utils.safeRequest(`https://api.bgm.tv/subject/${bgmId}/ep`, { json: true })
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

        let isNewSubject = ((!bgmItem.end || utils.lagDay(now, new Date(bgmItem.end)) < 10) && utils.lagDay(new Date(bgmItem.begin), now) < 10)
        for (site of bgmItem.sites) {
            if (!isNewSubject && !ruleNeedUpdate(site) && data.eps.find(ep => ep.sites.find(v => v.site == site.site))) continue

            console.log(`- ${site.site} ${site.id}`)
            if (!site.id) break
            let sitePath = `./site/${site.site}.js`
            if (fs.existsSync(sitePath)) try {
                let eps = await require(sitePath)(site)
                if (eps && eps.length > 0) {
                    clearEpSite(site)
                    for (ep of eps) await addEpSite(ep)
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
