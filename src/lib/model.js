export const STATUSES=['focus','maintain','delegate','park'];
export const SCORE_KEYS=['impact','importance','urgency','fit','attention','mental'];
export const priority=v=>Math.round((v.scores.impact*.35+v.scores.importance*.30+v.scores.urgency*.20+v.scores.fit*.15)*10);
export const openTasks=(v,tasks)=>tasks.filter(t=>t.ventureId===v.id&&t.status==='open');
export function lensScore(v,tasks,lens){if(lens==='impact')return v.scores.impact*10;if(lens==='attention')return (v.scores.attention*.6+v.scores.mental*.4)*10;if(lens==='tasks')return openTasks(v,tasks).length;return priority(v)}
export function rank(ventures,tasks,lens='priority'){return [...ventures].sort((a,b)=>lensScore(b,tasks,lens)-lensScore(a,tasks,lens)||a.name.localeCompare(b.name));}
export function dateKey(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Nassau',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export const isOverdue=(t,today=dateKey())=>!!t.due&&t.due<today&&t.status==='open';
export function taskScore(t,v,today){const days=t.due?(Date.parse(t.due)-Date.parse(today))/86400000:Infinity;return priority(v)+t.impact*3+(days<=0?18:days<=3?10:0);}
export function dailyPlan(state,today=dateKey()){
 const eligible=state.tasks.filter(t=>t.status==='open'&&state.ventures.some(v=>v.id===t.ventureId&&['focus','maintain'].includes(v.status)));
 eligible.sort((a,b)=>taskScore(b,state.ventures.find(v=>v.id===b.ventureId),today)-taskScore(a,state.ventures.find(v=>v.id===a.ventureId),today));
 const top=[],seen=new Set();let available=Math.round(state.hours*60);
 for(const t of eligible){if(top.length===3)break;if(!seen.has(t.ventureId)&&t.minutes<=available){top.push(t);available-=t.minutes;seen.add(t.ventureId)}}
 // Fill spare slots if there are fewer than three active ventures, without exceeding capacity.
 for(const t of eligible){if(top.length===3)break;if(!top.some(x=>x.id===t.id)&&t.minutes<=available){top.push(t);available-=t.minutes}}
 const quick=eligible.find(t=>t.minutes<=20&&!top.some(x=>x.id===t.id)&&t.minutes<=available);
 const delegated=state.tasks.find(t=>t.status==='delegated')||state.tasks.find(t=>t.status==='open'&&state.ventures.find(v=>v.id===t.ventureId)?.status==='delegate');
 const parked=state.ventures.find(v=>v.status==='park');
 return {top,quick,delegated,parked,minutes:top.reduce((n,t)=>n+t.minutes,0)+(quick?.minutes||0),available};
}
export function validateState(s){
 if(!s||s.version!==1||!Array.isArray(s.ventures)||!s.ventures.length||s.ventures.length>40||!Array.isArray(s.tasks)||s.tasks.length>3000||!Number.isFinite(s.hours)||s.hours<.5||s.hours>12)return false;
 const ids=new Set();for(const v of s.ventures){if(!v||typeof v.id!=='string'||ids.has(v.id)||typeof v.name!=='string'||typeof v.short!=='string'||!/^#[\da-f]{6}$/i.test(v.color)||!STATUSES.includes(v.status)||!Array.isArray(v.projects)||!v.projects.every(p=>typeof p==='string')||!['role','bottleneck','next','rationale'].every(k=>typeof v[k]==='string')||!SCORE_KEYS.every(k=>Number.isFinite(v.scores?.[k])&&v.scores[k]>=1&&v.scores[k]<=10))return false;ids.add(v.id)}
 const tids=new Set();return s.tasks.every(t=>{if(!t||typeof t.id!=='string'||tids.has(t.id)||!ids.has(t.ventureId)||!['open','done','delegated','parked'].includes(t.status)||typeof t.title!=='string'||!t.title.trim()||typeof t.project!=='string'||typeof t.note!=='string'||!Number.isFinite(t.minutes)||t.minutes<5||t.minutes>1440||!Number.isFinite(t.impact)||t.impact<1||t.impact>10||typeof t.due!=='string'||(t.due&&!/^\d{4}-\d{2}-\d{2}$/.test(t.due)))return false;tids.add(t.id);return true});
}
