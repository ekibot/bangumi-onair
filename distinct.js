/*
 * @Description: distinct data
 * @Author: ekibun
 * @Date: 2019-07-18 22:15:48
 * @LastEditors: ekibun
 * @LastEditTime: 2019-07-18 22:21:43
 */
const fs = require('fs')
const path = require('path')

const root = './onair'
for (pre of fs.readdirSync(root)) {
    for (p of fs.readdirSync(path.join(root, pre))) {
        let filePath = path.join(root, pre, p)
        let data = JSON.parse(fs.readFileSync(filePath))
        for (ep of data.eps) {
            ep.sites = ep.sites.filter(v => ep.sites.find(f => f.site == v.site && f.url == v.url) == v)
        }
        fs.writeFileSync(filePath, JSON.stringify(data))
    }
}