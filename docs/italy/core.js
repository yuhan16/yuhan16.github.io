export const STORAGE_KEY = 'italy-notebook-v1';
export const ZONES = {'Europe/Rome':'意大利时间','Asia/Shanghai':'北京时间','Asia/Almaty':'阿拉木图时间','Asia/Dubai':'迪拜时间'};
export const clone = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function requireDay(state,id) { const day=state.days.find(d=>d.id===id); if(!day) throw Error('没有找到这一天。'); return day; }
export function selectedPlan(day,id) { const p=id==='latest'?day.latest:day.plans.find(p=>p.id===id); if(!p) throw Error('没有找到这个方案。'); return p; }
export function defaultPlanId(day) { return day.latest?'latest':day.plans[0].id; }
export function fixedKind(event) {
  const kind=event.kind.trim().toLowerCase();
  if(/住宿|酒店|旅馆|民宿|入住|退房|hotel|accommodation|stay/.test(kind))return 'stay';
  if(/交通|航班|飞机|火车|高铁|列车|接送|机场|巴士|大巴|轮渡|flight|train|transport|transfer|ferry/.test(kind))return 'transport';
  return 'other';
}
export function hasTimeConflict(day,plan) {
  let lastEnd=-1;
  for(const item of plan.items) {
    if(day.completed[item.placeId]||day.skipped.includes(item.placeId)||!item.time)continue;
    const [h,m]=item.time.split(':').map(Number);const start=h*60+m;
    if(start<lastEnd)return true;
    lastEnd=start+item.duration;
  }
  return false;
}
export function candidates(day) {
  const all=new Map();
  const add=(id,label)=>{if(!all.has(id))all.set(id,{placeId:id,plans:[]});if(!all.get(id).plans.includes(label))all.get(id).plans.push(label);};
  for(const plan of [...day.plans,...(day.latest?[day.latest]:[])])for(const item of plan.items)add(item.placeId,plan.label);
  for(const id of day.extraCandidates)add(id,'手动加入');
  for(const id of Object.keys(day.completed))if(!all.has(id))add(id,'已完成');
  return [...all.values()];
}
export function ensureLatest(day,sourceId=defaultPlanId(day)) {
  if(sourceId==='latest' && day.latest)return day.latest;
  const source=selectedPlan(day,sourceId);
  const done=Object.values(day.completed).sort((a,b)=>a.completedAt.localeCompare(b.completedAt)).map(({completedAt,...item})=>item);
  day.latest={id:'latest',label:'最新调整',items:[...clone(done),...clone(source.items.filter(i=>!day.completed[i.placeId]))]};
  return day.latest;
}
export function applyPlan(day,sourceId) { ensureLatest(day,sourceId); }
export function updateItem(day,sourceId,placeId,changes) {
  const plan=ensureLatest(day,sourceId);const item=plan.items.find(i=>i.placeId===placeId);
  if(!item)throw Error('该项目已经不在此方案中。');Object.assign(item,changes);
  if(day.completed[placeId])Object.assign(day.completed[placeId],changes);
}
export function addItem(day,place,sourceId=defaultPlanId(day)) {
  const plan=ensureLatest(day,sourceId);
  if(plan.items.some(i=>i.placeId===place.id))throw Error('这个项目已在当前安排中。');
  plan.items.push({id:uid(),placeId:place.id,time:'',duration:place.duration,note:''});
  if(!day.extraCandidates.includes(place.id))day.extraCandidates.push(place.id);
}
export function removeItem(day,sourceId,placeId) {
  if(day.completed[placeId])throw Error('请先撤销完成状态，再移除这个项目。');
  const plan=ensureLatest(day,sourceId);plan.items=plan.items.filter(i=>i.placeId!==placeId);
}
export function moveItem(day,sourceId,placeId,direction) {
  const plan=ensureLatest(day,sourceId);const index=plan.items.findIndex(i=>i.placeId===placeId);const next=index+direction;
  if(index<0||next<0||next>=plan.items.length)return;
  if(day.completed[placeId]||day.completed[plan.items[next].placeId])throw Error('已完成的记录保留在原处。');
  [plan.items[index],plan.items[next]]=[plan.items[next],plan.items[index]];
}
export function setStatus(day,item,status) {
  const id=item.placeId;
  if(status==='done')day.completed[id]={...clone(item),completedAt:new Date().toISOString()};
  else delete day.completed[id];
  day.skipped=day.skipped.filter(x=>x!==id);
  if(status==='skipped')day.skipped.push(id);
}
export function safeUrl(value) {
  if(!value)return '';
  try {const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}
}
export function mapUrl(place) {return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([place.name,place.address,place.city].filter(Boolean).join(' '));}
export function validDate(value) {return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function validTime(value) {return value===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
export function localToUtc(date,time,zone) {
  if(!time||!validDate(date)||!validTime(time)||!ZONES[zone])return NaN;
  const desired=Date.parse(`${date}T${time}:00Z`);let utc=desired;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  for(let i=0;i<3;i++) {const p=Object.fromEntries(parts.formatToParts(utc).map(p=>[p.type,p.value]));const wall=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);utc+=desired-wall;}
  const check=Object.fromEntries(parts.formatToParts(utc).map(p=>[p.type,p.value]));
  if(`${check.year}-${check.month}-${check.day}T${check.hour}:${check.minute}`!==`${date}T${time}`)return NaN;
  return utc;
}
export function beijingTime(date,time,zone) {
  const utc=localToUtc(date,time,zone);if(!Number.isFinite(utc))return '';
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(utc).map(p=>[p.type,p.value]));
  return `${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
function fail() {throw Error('备份内容不完整或格式不受支持，原有行程没有改变。');}
function str(x,max=10000) {if(typeof x!=='string'||x.length>max)fail();}
function id(x) {str(x,100);if(!/^[a-zA-Z0-9_-]+$/.test(x)||['__proto__','constructor','prototype'].includes(x))fail();}
function array(x,max=1000) {if(!Array.isArray(x)||x.length>max)fail();}
function unique(xs) {if(new Set(xs).size!==xs.length)fail();}
function duration(x) {if(!Number.isInteger(x)||x<0||x>1440)fail();}
function time(x) {str(x,5);if(!validTime(x))fail();}
export function validateState(input) {
  if(!input||typeof input!=='object'||input.schemaVersion!==1)fail();
  if(!Number.isInteger(input.revision)||input.revision<0)fail();
  if(input.updatedAt!==null)str(input.updatedAt,50);
  array(input.places,2000);array(input.days,366);if(!input.days.length)fail();
  unique(input.places.map(p=>p.id));unique(input.days.map(d=>d.id));unique(input.days.map(d=>d.date));
  const placeIds=new Set(input.places.map(p=>p.id));
  for(const p of input.places) {
    id(p.id);str(p.name,200);if(!p.name.trim())fail();duration(p.duration);
    for(const key of ['city','kind','address','description','bestTime','openingHours','notes','sourceUrl','checkedAt','uncertainty'])str(p[key]);
    array(p.tags,30);p.tags.forEach(t=>str(t,60));
    if(p.sourceUrl&&!safeUrl(p.sourceUrl))fail();if(p.checkedAt&&!validDate(p.checkedAt))fail();
  }
  const item=i=>{if(!i||typeof i!=='object')fail();id(i.id);id(i.placeId);if(!placeIds.has(i.placeId))fail();time(i.time);duration(i.duration);str(i.note);};
  for(const d of input.days) {
    id(d.id);if(!validDate(d.date)||!ZONES[d.timeZone])fail();str(d.city,200);str(d.note);if(typeof d.isExample!=='boolean')fail();
    array(d.plans,30);if(!d.plans.length)fail();unique(d.plans.map(p=>p.id));unique(d.plans.map(p=>p.label));
    const plan=p=>{id(p.id);str(p.label,50);array(p.items,500);p.items.forEach(item);unique(p.items.map(i=>i.placeId));};
    d.plans.forEach(p=>{plan(p);if(p.id==='latest')fail();});
    if(d.latest!==null){plan(d.latest);if(d.latest.id!=='latest'||d.latest.label!=='最新调整')fail();}
    if(!d.completed||typeof d.completed!=='object'||Array.isArray(d.completed))fail();
    for(const [key,i]of Object.entries(d.completed)){id(key);item(i);if(key!==i.placeId)fail();str(i.completedAt,50);}
    for(const xs of [d.skipped,d.extraCandidates]){array(xs,2000);unique(xs);xs.forEach(x=>{id(x);if(!placeIds.has(x))fail();});}
    if(d.skipped.some(x=>d.completed[x]))fail();
    array(d.fixedEvents,300);unique(d.fixedEvents.map(e=>e.id));
    for(const e of d.fixedEvents){id(e.id);for(const k of ['title','kind','address','notes'])str(e[k]);if(!e.title.trim())fail();time(e.time);time(e.endTime);if(!validDate(e.date)||!ZONES[e.timeZone]||!ZONES[e.endTimeZone])fail();if(e.endDate&&!validDate(e.endDate))fail();if(e.endTime&&!e.endDate)fail();if(e.time&&!Number.isFinite(localToUtc(e.date,e.time,e.timeZone)))fail();if(e.endTime&&!Number.isFinite(localToUtc(e.endDate,e.endTime,e.endTimeZone)))fail();if(e.time&&e.endTime&&localToUtc(e.endDate,e.endTime,e.endTimeZone)<localToUtc(e.date,e.time,e.timeZone))fail();if(fixedKind(e)==='stay'&&e.endDate&&e.endDate<e.date)fail();if(e.bookingStatus!==undefined&&!['','已预订','待预订','待确认'].includes(e.bookingStatus))fail();}
  }
  return clone(input);
}
export function serialize(state) {return JSON.stringify(validateState(state),null,2);}
export function deserialize(raw) {if(typeof raw!=='string'||raw.length>4_000_000)fail();try{return validateState(JSON.parse(raw,(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))fail();return value;}));}catch{fail();}}
// Write first, then publish the state to the UI. A failed save must not appear successful.
export function saveState(storage,next,currentRevision) {
  const existing=storage.getItem(STORAGE_KEY);
  if(existing) {const parsed=JSON.parse(existing);if(parsed.revision!==currentRevision)throw Error('另一窗口已修改行程，请刷新后继续。当前输入仍保留在这里。');}
  const clean=validateState(next);clean.revision=currentRevision+1;clean.updatedAt=new Date().toISOString();
  storage.setItem(STORAGE_KEY,JSON.stringify(clean));return clean;
}
