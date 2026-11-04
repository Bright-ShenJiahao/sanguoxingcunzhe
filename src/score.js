// 排行榜评分：前端和服务器（netlify/functions/scores.mjs）共用这一份，改规则只改这里
export const CLEAR_BONUS=20000;
export const scoreOf=r=>(r.clear?CLEAR_BONUS:0)+Math.round((r.t||0)*2+(r.kills||0)+(r.lv||0)*10+(r.bosses||0)*200);
