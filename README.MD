<!--
 * @Description: read me
 * @Author: ekibun
 * @Date: 2020-06-15 20:10:56
 * @LastEditors: ekibun
 * @LastEditTime: 2020-06-15 21:51:43
--> 
# Bangumi播放源爬虫

[![](https://data.jsdelivr.com/v1/package/gh/ekibot/bangumi-onair/badge)](https://www.jsdelivr.com/package/gh/ekibot/bangumi-onair)

基于[bangumi-data](https://github.com/bangumi-data/bangumi-data)数据，借助github action每日更新的Bangumi播放源及时间表数据。目前支持Acfun、哔哩哔哩、爱奇艺、腾讯视频和优酷。

### 使用方法

数据类型定义见[`./spider.d.ts`](https://github.com/ekibun/bangumi_onair/blob/spider/spider.d.ts)

时间表数据，返回`CalendarItem[]`
```
https://cdn.jsdelivr.net/gh/ekibun/bangumi_onair/calendar.json
```

条目放送数据，返回`Subject`
```
https://cdn.jsdelivr.net/gh/ekibun/bangumi_onair/onair/{id/1000}/{id}.json
```
