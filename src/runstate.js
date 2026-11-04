// 每局临时状态：挂在 window 上、跨模块共用的"本局"变量统一在这里登记，开新局时一次清空。
// 新加这类变量时，记得加进 RUN_GLOBALS，否则可能把上一局的状态带进下一局。
export const RUN_GLOBALS={
 CUR_E:'',LASTHIT:'',   // 最近一次伤害来源（死因记录）
 HURT:0,FHT:null,HPLAG:null,   // 受伤闪红时间、本局首次受伤时间、血条残影
 HSLOW:0,HS:0,SHK:0,FLASHW:0,   // 减速、顿帧、震屏、白闪
 FREEZE:0,CLEARED:0,KB:1};   // 怀表时停、已通关、击退倍率
export function resetRunGlobals(){for(const [k,v] of Object.entries(RUN_GLOBALS))window[k]=v;window.TUT_STOP?.()}
