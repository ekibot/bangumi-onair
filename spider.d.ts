/*
 * @Description: 类型声明
 * @Author: ekibun
 * @Date: 2020-06-15 21:06:22
 * @LastEditors: ekibun
 * @LastEditTime: 2020-06-15 21:53:20
 */ 

/**
 * 站点信息
 */
type Site = {
  site: string,       // 播放站点，同bangumi-data
  id: string,         // 播放源id，同bangumi-data
  begin: string,      // 开始放送时间，同bangumi-data
  week: number,       // 国内放送星期
  time: string,       // 国内放送时间
}

/**
 * 站点剧集信息
 */
type SiteEpisode = {
  site: string,       // 播放站点，同bangumi-data
  sort: number,       // 集数编号，用于与bangumi数据配对
  title: string,      // 剧集名称
  url: string,        // 剧集链接
  time: Date,         // 放送日期
}

/**
 * 剧集信息
 */
type Episode = {
  id: number,         // bangumi剧集id
  type: number,       // 剧集类型，同bangumi api
  sort: number,       // 集数编号，同bangumi api
  name: string,       // 剧集名称，同bangumi api，注：时间表会包含停更数据，此项会标示为"本周停更"
  name_cn: string,    // 中文名称，同bangumi api
  airdate: any,       // 放送日期，同bangumi api
  sites: SiteEpisode[], // 播放站点信息
  status: "NA" | "Air" | "Today", // 放送状态，同bangumi api
}

/**
 * 时间表
 */
type CalendarItem = {
  id: number,         // bangumi条目id
  name: string,       // 番剧名称
  name_cn: string,    // 中文名称
  air_date: string,   // 放送日期
  weekDayJP: number,  // 日本放送星期，取值0-6，由bangumi-data的begin数据计算得到
  weekDayCN: number,  // 国内放送星期，取值0-6，由播放源数据或bangumi-data的begin数据计算得到
  timeJP: string,     // 日本放送时间，格式为HHmm，由bangumi-data的begin数据计算得到
  timeCN: string,     // 国内放送时间，格式为HHmm，由播放源数据或bangumi-data的begin数据计算得到
  image: string,      // 番剧图片(grid)
  sites: Site[],      // 播放站点信息
  eps: Episode[],     // 剧集信息
}

/**
 * 条目信息
 */
type Subject = {
  id: number,         // bangumi条目id
  name: string,       // 番剧名称
  sites: Site[],      // 播放站点信息
  eps: Episode[],     // 剧集信息
}

/**
 * 附加规则
 */
type Rule = {
  _item: BangumiData?,  // 覆盖bangumi-data的数据
  [key: string]: {      // 站点名称
    sort: (ep: number) => number; // 集数编号映射：(站点集数编号)->bangumi集数编号
  };
}

/**
 * bangumi-data
 */
type BangumiData = {
  title: string;      // 标题
  begin: string;      // 开始放送时间
  end: string;        // 结束放送时间
  sites: Site[];      // 站点信息
}