import {createSeed} from './seed.js';
import {fixedKind,fixedReferences,overnightStays,dayTimeline} from './itinerary.js';
import {STORAGE_KEY,ZONES,clone,uid,requireDay,selectedPlan,defaultPlanId,hasTimeConflict,candidates,ensureLatest,applyPlan,updateItem,addItem,removeItem,moveItem,setStatus,safeUrl,mapUrl,validDate,validTime,localToUtc,beijingTime,serialize,deserialize,saveState} from './core.js';

const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const action=(name,label,extra='',className='')=>`<button type="button" data-action="${name}" ${extra} class="${className}">${label}</button>`;
let state=createSeed(),recovery=false,corruptRaw='',dayId=state.days[0].id,view='day',previewId=null,search='',flushDialog=null,closeCleanup=null,offlineReady=false;
let toastTimer,saveTimer;
try {const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=deserialize(raw);else localStorage.setItem(STORAGE_KEY,JSON.stringify(state));dayId=state.days[0].id;} catch(error) {try{corruptRaw=localStorage.getItem(STORAGE_KEY)||'';}catch{}recovery=Boolean(corruptRaw);warn(recovery?'本地行程暂时无法读取。请先导出原始记录，再从备份恢复。':'当前浏览器无法保存数据。请检查存储权限后再编辑。');}
function day(){return requireDay(state,dayId);}
function currentId(){return previewId||defaultPlanId(day());}
function place(id){return state.places.find(p=>p.id===id);}
function warn(message){$('#storage-warning').hidden=false;$('#storage-warning').textContent=message;}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3300);}
function commit(mutator,message='',options={}) {
  if(recovery){toast('请先恢复本地记录。');return false;}
  try {const next=clone(state);mutator(next);state=saveState(localStorage,next,state.revision);$('#storage-warning').hidden=true;const errorBox=$('#dialog-error');if(errorBox)errorBox.textContent='';if(options.latest)previewId='latest';render();if(message)toast(message);return true;}
  catch(error){const message=error?.name==='QuotaExceededError'?'存储空间不足，尚未保存。请先导出备份，当前输入仍保留。':error?.message||'保存失败，当前输入仍保留。';warn(message);const el=$('#dialog-error');if(el)el.textContent=message;toast('本次修改未保存');return false;}
}
function zoneSelect(name,value){return `<select name="${name}" aria-label="${name==='endTimeZone'?'到达时间所属时区':'时间所属时区'}">${Object.entries(ZONES).map(([id,label])=>`<option value="${id}" ${id===value?'selected':''}>${label}</option>`).join('')}</select>`;}
function field(label,name,value='',type='text',extra=''){return `<label class="field">${label}<input name="${name}" type="${type}" value="${escape(value)}" ${extra}></label>`;}
function area(label,name,value='',extra=''){return `<label class="field">${label}<textarea name="${name}" ${extra}>${escape(value)}</textarea></label>`;}
function external(url,label){const safe=safeUrl(url);return safe?`<a class="external" href="${escape(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`:'';}
function tagList(p){return `<div class="tags">${p.tags.map(t=>`<span class="tag">${escape(t)}</span>`).join('')}</div>`;}
function saveLabel(){return state.updatedAt?`已保存在此设备 · ${new Date(state.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`:'保存在当前设备';}
function dayHeading(){const d=day();const date=new Date(d.date+'T12:00:00Z');return `<div class="day-top"><div><p class="date-label">${escape(date.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}))}</p><h1>${escape(d.city)} ${d.isExample?'<span class="badge blue">示例草稿</span>':''}</h1><p class="day-subtitle">${escape(ZONES[d.timeZone])} · ${escape(d.note||'按自己的节奏，安排这一天。')}</p></div><div class="date-controls"><label class="sr-only" hidden for="day-select">选择日期</label><select id="day-select" aria-label="选择日期">${[...state.days].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>`<option value="${escape(x.id)}" ${x.id===dayId?'selected':''}>${escape(x.date.slice(5).replace('-','月')+'日 '+x.city)}</option>`).join('')}</select>${action('new-day','＋','aria-label="添加一天"','icon')}</div></div>`;}
function fixedAction(ref,label='查看 / 编辑') {
  return action('edit-fixed',label,`data-id="${escape(ref.event.id)}" data-owner="${escape(ref.ownerId)}"`,'small quiet');
}
function bookingTimes(e) {
  const stay=fixedKind(e)==='stay',start=stay?'入住':'开始 / 出发',end=stay?'退房':'结束 / 到达';
  const line=(label,date,time,zone)=>`<p class="time-line">${label} ${escape(date.slice(5))} ${escape(time||'时间待确认')} · ${escape(ZONES[zone])}${time&&zone!=='Asia/Shanghai'?`<br><span class="muted">北京时间 ${escape(beijingTime(date,time,zone))}</span>`:''}</p>`;
  return line(start,e.date,e.time,e.timeZone)+(e.endDate?line(end,e.endDate,e.endTime,e.endTimeZone):'');
}
function fixedEvents() {
  const refs=fixedReferences(state,day());
  return `<details class="fixed-block"><summary>交通、住宿与固定安排 <span class="badge">${refs.length} 项</span></summary><div class="fixed-content">${refs.map(ref=>{const e=ref.event;return `<div class="fixed-item"><div>${bookingTimes(e)}<h3>${escape(e.title)}</h3>${e.bookingStatus?`<p class="muted">${escape(e.bookingStatus)}</p>`:''}${e.address?`<p>${escape(e.address)}</p>${external(mapUrl({name:e.title,address:e.address}),'查看地图')}`:''}${e.notes?`<p class="muted">${escape(e.notes)}</p>`:''}</div>${fixedAction(ref,'编辑')}</div>`;}).join('')}${action('new-fixed','＋ 添加固定安排','','full-width')}</div></details>`;
}
function stayCards() {
  const stays=overnightStays(state,day());
  if(!stays.length)return `<section class="stay-summary stay-empty" aria-label="今晚住宿"><div><h3>今晚住宿</h3><p class="muted small-text">尚未填写今晚酒店</p></div>${action('new-fixed','＋ 添加住宿','data-kind="住宿"','small')}</section>`;
  return `<section class="stay-list" aria-label="今晚住宿">${stays.map(ref=>{const e=ref.event;return `<article class="stay-summary" data-stay="${escape(e.id)}"><div class="booking-heading"><span class="booking-label">今晚住宿</span><span class="badge">${escape(e.bookingStatus||'预订状态未标注')}</span></div><h3>${escape(e.title)}</h3><p class="small-text muted booking-address">${escape(e.address||'地址待补充')}</p><div class="stay-footer"><p class="small-text muted">${e.endDate?`住至 ${escape(e.endDate.slice(5))} · 当天退房${e.endTime?' '+escape(e.endTime)+' '+escape(ZONES[e.endTimeZone]):'，时间待确认'}`:'未填写退房日期，仅显示在当天'}</p><div class="action-group">${e.address?external(mapUrl({name:e.title,address:e.address}),'导航'):''}${fixedAction(ref)}</div></div></article>`;}).join('')}</section>`;
}
function fixedCard(ref) {
  const e=ref.event,stay=fixedKind(e)==='stay';
  const label={transport:'重要交通',arrival:'交通 · 到达',checkin:'入住提醒',checkout:'退房提醒','in-transit':'旅途中'}[ref.phase];
  const time=ref.time||'待确认';
  return `<article class="event-card booking-card ${stay?'lodging-event':''}" data-fixed="${escape(e.id)}" data-phase="${ref.phase}"><div class="event-time">${escape(time)}<span>${escape(ZONES[ref.zone])}</span></div><div class="booking-body"><div class="booking-heading"><span class="booking-label">${label}</span><span class="badge">各方案共用</span></div><h3>${escape(e.title)}</h3>${!stay?bookingTimes(e):`<p class="small-text muted">${escape(ref.date.slice(5))} · ${escape(e.address||'地址待补充')}</p>`}${e.bookingStatus?`<p class="small-text muted">${escape(e.bookingStatus)}</p>`:''}${e.notes?`<p class="booking-note">${escape(e.notes)}</p>`:''}<div class="booking-actions">${e.address?external(mapUrl({name:e.title,address:e.address}),stay?'导航':'查看地图'):''}${fixedAction(ref)}</div></div></article>`;
}
function itemCard(item){const p=place(item.placeId),d=day(),done=Boolean(d.completed[p.id]),skipped=d.skipped.includes(p.id);return `<article class="event-card ${done?'done':skipped?'skipped':''}" data-place="${escape(p.id)}"><div class="event-time">${escape(item.time||'待安排')}<span>${item.duration} 分钟</span></div><div><button class="event-title" data-action="detail" data-id="${escape(p.id)}">${escape(p.name)}</button>${done?'<span class="badge">已完成</span>':skipped?'<span class="badge">已跳过</span>':''}<p class="event-desc">${escape(p.description)}</p>${tagList(p)}${p.uncertainty?`<p class="warn-text">${escape(p.uncertainty)}</p>`:''}${item.note?`<p class="note">${escape(item.note)}</p>`:''}<div class="event-actions">${action('toggle-done',`<span class="check-icon" aria-hidden="true">${done?'✓':''}</span>${done?'已完成':'标记完成'}`,`data-id="${escape(p.id)}" aria-pressed="${done}" aria-label="${done?'撤销完成':'标记完成'}：${escape(p.name)}"`,'check-button')}<div class="action-group">${external(mapUrl(p),'地图')}${action('edit-item','调整',`data-id="${escape(p.id)}"`,'small quiet')}</div></div></div></article>`;}
function candidateCard(p,labels,library=false){const d=day(),done=Boolean(d.completed[p.id]),skipped=d.skipped.includes(p.id);const inPlan=selectedPlan(d,defaultPlanId(d)).items.some(i=>i.placeId===p.id);return `<article class="place-card"><button class="event-title" data-action="detail" data-id="${escape(p.id)}">${escape(p.name)}</button><p class="event-desc">${escape(p.description)}</p>${tagList(p)}<p class="address">${escape(p.address||'地址待补充')}</p><p class="small-text muted">${p.duration} 分钟 · ${escape(p.bestTime||'时段不限')}${library?` · ${escape(p.city)}`:''}</p>${labels?`<p class="small-text muted">${escape(labels.join('、'))}</p>`:''}${p.uncertainty?`<p class="warn-text">${escape(p.uncertainty)}</p>`:''}${skipped?'<p class="small-text muted">今天已跳过，仍可重新选择</p>':''}<div class="event-actions">${external(mapUrl(p),'地图')}<div class="action-group">${library?action('edit-place','编辑',`data-id="${escape(p.id)}"`,'small quiet'):''}${action('add-item',done?'今天已完成':inPlan?'已在当前安排':'加入当前安排',`data-id="${escape(p.id)}" ${done||inPlan?'disabled':''}`,'small')}</div></div></article>`;}
function sidePanel(){const d=day();const available=candidates(d).filter(c=>!d.completed[c.placeId]);return `<aside class="side-panel"><h2>今天还可以去</h2><p class="small-text muted">各方案合并，${available.length} 个未完成项目</p>${available.slice(0,4).map(c=>`<div class="candidate-mini"><button class="event-title" data-action="detail" data-id="${escape(c.placeId)}">${escape(place(c.placeId).name)}</button><p class="muted">${place(c.placeId).duration} 分钟 · ${escape(c.plans.join('、'))}</p></div>`).join('')}${action('view-candidates','查看当天候选','','full-width')}<div class="divider"></div><p class="small-text muted">未去的地点会继续保留，原定时段过去也不会自动消失。</p></aside>`;}
function renderDay() {
  const d=day(),plan=selectedPlan(d,currentId()),preview=currentId()!==defaultPlanId(d);
  const items=plan.items,minutes=items.filter(i=>!d.completed[i.placeId]&&!d.skipped.includes(i.placeId)).reduce((n,i)=>n+i.duration,0);
  const extras=Object.values(d.completed).filter(i=>!items.some(x=>x.placeId===i.placeId));
  const timeline=dayTimeline(state,d,plan);
  return `${dayHeading()}<div class="chips" aria-label="每日方案">${[...d.plans,...(d.latest?[d.latest]:[])].map(p=>action('plan',escape(p.label),`data-id="${escape(p.id)}" aria-pressed="${p.id===currentId()}"`,'chip '+(p.id===currentId()?'selected':''))).join('')}</div>
    <div class="toolbar"><span class="save-status">${saveLabel()}</span><div class="toolbar-actions">${action('save-plan','另存为备选','','small')}${action('day-info','当天备注','','small quiet')}${action('view-candidates','＋ 加入项目','','small')}</div></div>
    ${preview?`<div class="preview-banner"><span>正在查看【${escape(plan.label)}】。当前行程仍是【${escape(selectedPlan(d,defaultPlanId(d)).label)}】。</span>${action('apply-plan','采用剩余安排','','small')}</div>`:''}
    <div class="workspace"><section class="day-schedule">${fixedEvents()}<div class="section-title"><div><h2>游览安排</h2><p>${items.length} 个游览项目 · 剩余停留约 ${minutes} 分钟，不含交通</p></div></div>${stayCards()}
    ${hasTimeConflict(d,plan)?'<p class="warn-text">部分未完成项目的时段重叠或顺序不一致，请点「调整」修改时间或顺序。交通时间还需另行预留。</p>':''}
    ${timeline.length?`<div class="timeline">${timeline.map(entry=>entry.type==='activity'?itemCard(entry.item):fixedCard(entry)).join('')}</div>`:''}
    ${!items.length?`<div class="empty"><p>这一天还没有游览安排。</p>${action('view-places','从地点库选择')}</div>`:''}
    ${extras.length?`<div class="section-title"><h2>今天已经完成</h2></div><div class="timeline">${extras.map(itemCard).join('')}</div>`:''}</section>${sidePanel()}</div>`;
}
function renderCandidates(){const d=day(),list=candidates(d),pending=list.filter(c=>!d.completed[c.placeId]),done=list.filter(c=>d.completed[c.placeId]);return `${dayHeading()}<div class="section-title"><h2>当天候选 <span class="badge">${pending.length} 项未完成</span></h2>${action('view-places','从地点库添加','','small')}</div><p class="view-intro">来自当天所有方案。同一地点只出现一次，未去的项目始终保留。加入后会保存到【最新调整】。</p>${pending.length?`<div class="place-grid">${pending.map(c=>candidateCard(place(c.placeId),c.plans)).join('')}</div>`:'<div class="empty">目前没有未完成的候选，可以从地点库添加。</div>'}${done.length?`<details class="done-group"><summary>今天已完成 · ${done.length} 项</summary><div class="place-grid">${done.map(c=>candidateCard(place(c.placeId),c.plans)).join('')}</div></details>`:''}`;}
function renderPlaces(){const q=search.toLowerCase();const list=state.places.filter(p=>[p.name,p.city,p.address,...p.tags].join(' ').toLowerCase().includes(q));return `${dayHeading()}<div class="section-title"><h2>地点库 <span class="badge">${state.places.length} 项</span></h2>${action('new-place','＋ 新建项目','','primary small')}</div><p class="view-intro">地点资料在所有方案中共用。添加到当天后，可以单独调整时段、停留时长和当天备注。</p><div class="search-row"><input id="place-search" type="search" placeholder="搜索名称、城市或标签" aria-label="搜索地点" value="${escape(search)}"></div><div class="place-grid">${list.map(p=>candidateCard(p,null,true)).join('')}</div>${!list.length?'<div class="empty">没有找到匹配的地点。</div>':''}`;}
function render(){
  if(recovery){$('#main').innerHTML='<div class="empty"><h1>先找回你的行程</h1><p>本地记录暂时无法读取，尚未用示例覆盖。</p><div class="more-actions">'+action('export-raw','导出原始记录')+action('import','从备份恢复','','primary')+'</div></div>';return;}
  if(!state.days.some(d=>d.id===dayId))dayId=state.days[0].id;
  if(previewId&&!([...(day().plans.map(p=>p.id)),...(day().latest?['latest']:[])].includes(previewId)))previewId=null;
  $('#main').innerHTML=view==='day'?renderDay():view==='candidates'?renderCandidates():renderPlaces();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-current',b.dataset.view===view?'page':'false'));
}
function setView(next){view=next;render();window.scrollTo({top:0});}
function openDialog(title,body,footer=''){if($('#dialog').open){if(!closeDialog())return false;}$('#dialog-content').innerHTML=`<div class="dialog-head"><h2>${escape(title)}</h2>${action('close','×','aria-label="关闭"','icon quiet')}</div><div class="dialog-body">${body}<div id="dialog-error" class="dialog-error" role="alert"></div></div>${footer?`<div class="dialog-foot">${footer}</div>`:''}`;$('#dialog').showModal();return true;}
function closeDialog(){clearTimeout(saveTimer);if(flushDialog&&!flushDialog()&&!confirm('还有未保存的输入。关闭并放弃这些未保存的输入？已经保存的修改会保留。'))return false;flushDialog=null;if(closeCleanup)closeCleanup();closeCleanup=null;$('#dialog').close();return true;}
function getForm(){return $('#dialog form');}
function formValues(){return Object.fromEntries(new FormData(getForm()).entries());}
function formOK(){return getForm().reportValidity();}
function autoForm(save){const form=getForm();let dirty=false;const flush=()=>{if(!dirty)return true;if(!formOK())return false;const ok=save();if(ok){dirty=false;const caption=$('#autosave-caption');if(caption)caption.textContent='已自动保存';}return ok;};form.addEventListener('input',()=>{dirty=true;const caption=$('#autosave-caption');if(caption)caption.textContent='正在编辑…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(form.checkValidity())flush();},400);});form.addEventListener('submit',e=>{e.preventDefault();if(flush())closeDialog();});flushDialog=flush;}
const autoFooter=`<span id="autosave-caption" class="saved-caption">修改后自动保存</span>${action('close','完成','','primary')}`;
function showDetail(id){const p=place(id);openDialog(p.name,`<p>${escape(p.description||'还没有描述。')}</p>${tagList(p)}${p.uncertainty?`<p class="warn-text">${escape(p.uncertainty)}</p>`:''}<dl>${[['位置',p.address],['建议时长',`${p.duration} 分钟`],['适合时段',p.bestTime],['开放限制',p.openingHours||'未填写，请另行核实'],['备注',p.notes],['核对日期',p.checkedAt||'未核对']].map(([k,v])=>`<div class="detail-row"><dt>${k}</dt><dd>${escape(v||'—')}</dd></div>`).join('')}</dl><div class="more-actions">${external(mapUrl(p),'打开 Google Maps')}${external(p.sourceUrl,'信息来源')}</div>`,action('edit-place','编辑地点资料',`data-id="${escape(id)}"`)+action('close','关闭','','primary'));}
function editItemDialog(id){const d=day();let source=currentId();let item=selectedPlan(d,source).items.find(i=>i.placeId===id)||d.completed[id];if(!item)return;const p=place(id);openDialog(`调整 · ${p.name}`,`<p>首次修改会复制为【最新调整】，原方案保留。这里的备注只用于当天。</p><form><div class="form-grid">${field('计划时间','time',item.time,'time')}${field('停留时长（分钟）','duration',item.duration,'number','min="0" max="1440" required')}</div>${area('当天备注','note',item.note,'maxlength="10000"')}</form><div class="more-actions">${action('move-up','向前移',`data-id="${escape(id)}"`)}${action('move-down','向后移',`data-id="${escape(id)}"`)}${action('skip',d.skipped.includes(id)?'恢复待安排':'今天跳过',`data-id="${escape(id)}"`)}${action('remove-item','从此方案移除',`data-id="${escape(id)}"`,'danger')}</div>`,autoFooter);autoForm(()=>{const v=formValues();const ok=commit(s=>updateItem(requireDay(s,dayId),source,id,{time:v.time,duration:Number(v.duration),note:v.note}),'',{latest:true});if(ok)source='latest';return ok;});}
function editPlaceDialog(id=null){const existing=id?place(id):null;const p=existing||{name:'',city:day().city,kind:'游览',address:'',description:'',duration:30,tags:[],bestTime:'白天',openingHours:'',notes:'',sourceUrl:'',checkedAt:'',uncertainty:''};openDialog(existing?'编辑地点资料':'新建地点或项目',`<p>这些资料在所有方案中共用。预订时间请填到当天的固定安排。</p><form>${field('名称','name',p.name,'text','required maxlength="200"')}<div class="form-grid">${field('城市','city',p.city,'text','maxlength="200"')}${field('类型','kind',p.kind,'text','placeholder="游览、餐饮、散步…"')}</div>${field('地址或地图检索名称','address',p.address)}${area('描述','description',p.description)}<div class="form-grid">${field('建议停留（分钟）','duration',p.duration,'number','required min="0" max="1440"')}${field('适合去的时间','bestTime',p.bestTime)}</div>${field('标签，用逗号分隔','tags',p.tags.join('，'))}${field('开放时间或限制','openingHours',p.openingHours)}${field('待确认事项','uncertainty',p.uncertainty)}${field('信息来源链接','sourceUrl',p.sourceUrl,'url','placeholder="https://…"')}${field('核对日期','checkedAt',p.checkedAt,'date')}${area('备注','notes',p.notes)}</form>`,existing?autoFooter:action('save-new-place','保存项目','','primary'));if(existing)autoForm(()=>savePlace(id));}
function savePlace(id){if(!formOK())return false;const v=formValues();if(v.sourceUrl&&!safeUrl(v.sourceUrl)){ $('#dialog-error').textContent='来源链接请使用 http 或 https 地址。';return false;}if(!v.name.trim()){$('#dialog-error').textContent='请输入项目名称。';return false;}const data={...v,id:id||uid(),name:v.name.trim(),duration:Number(v.duration),tags:v.tags.split(/[,，]/).map(s=>s.trim()).filter(Boolean)};return commit(s=>{if(id)Object.assign(s.places.find(p=>p.id===id),data);else s.places.push(data);},id?'':'已保存到地点库');}
function fixedDialog(id=null,ownerId=dayId,kind='交通') {
  const d=requireDay(state,ownerId),e=id?d.fixedEvents.find(e=>e.id===id):{title:'',kind,date:day().date,time:'',timeZone:day().timeZone,endDate:'',endTime:'',endTimeZone:day().timeZone,address:'',notes:''};
  if(!e)throw Error('没有找到这项固定安排。');
  openDialog(id?'编辑固定安排':'添加交通、住宿或预约',`<p>固定安排在所有方案中共用。住宿填写退房日期后，会在连续入住的每一天显示。</p><form data-owner="${escape(ownerId)}">
    ${field('名称 / 酒店名','title',e.title,'text','required maxlength="200"')}${field('类型','kind',e.kind,'text','list="fixed-kinds"')}<datalist id="fixed-kinds"><option value="交通"><option value="住宿"><option value="休息"><option value="预约"></datalist>
    <label class="field">预订状态<select name="bookingStatus" aria-label="预订状态">${['','已预订','待预订','待确认'].map(status=>`<option value="${status}" ${status===(e.bookingStatus||'')?'selected':''}>${status||'未标注'}</option>`).join('')}</select></label>
    <div class="form-grid">${field('<span id="fixed-start-date-label">开始 / 出发日期</span>','date',e.date,'date','required')}${field('<span id="fixed-start-time-label">开始 / 出发时间</span>','time',e.time,'time')}</div><label class="field">时间所属时区${zoneSelect('timeZone',e.timeZone)}</label>
    <div class="form-grid">${field('<span id="fixed-end-date-label">结束 / 到达日期（可选）</span>','endDate',e.endDate,'date')}${field('<span id="fixed-end-time-label">结束 / 到达时间（可选）</span>','endTime',e.endTime,'time')}</div><label class="field"><span id="fixed-end-zone-label">结束 / 到达时区</span>${zoneSelect('endTimeZone',e.endTimeZone)}</label>
    ${field('地址','address',e.address)}${area('备注、航班号或预订信息','notes',e.notes)}</form>${id?action('delete-fixed','删除这项固定安排',`data-id="${escape(id)}" data-owner="${escape(ownerId)}"`,'danger'):''}`,id?autoFooter:action('save-new-fixed','保存安排','','primary'));
  const labels=()=>{const stay=fixedKind({kind:getForm().elements.kind.value})==='stay';for(const [key,text] of Object.entries(stay?{'start-date':'入住日期','start-time':'入住时间（可选）','end-date':'退房日期（可选）','end-time':'退房时间（可选）','end-zone':'退房时间所属时区'}:{'start-date':'开始 / 出发日期','start-time':'开始 / 出发时间','end-date':'结束 / 到达日期（可选）','end-time':'结束 / 到达时间（可选）','end-zone':'结束 / 到达时区'}))$('#fixed-'+key+'-label').textContent=text;};
  labels();getForm().elements.kind.addEventListener('input',labels);
  if(id)autoForm(()=>saveFixed(id));
}
function saveFixed(id) {
  if(!formOK())return false;
  const v=formValues(),ownerId=getForm().dataset.owner;
  if(!v.title.trim()||!validDate(v.date)||(v.endTime&&!validDate(v.endDate))){$('#dialog-error').textContent='请填写名称和有效日期；填写结束时间时也需要结束日期。';return false;}
  if(fixedKind(v)==='stay'&&v.endDate&&v.endDate<v.date){$('#dialog-error').textContent='退房日期不能早于入住日期。';return false;}
  if(v.time&&v.endTime&&localToUtc(v.endDate,v.endTime,v.endTimeZone)<localToUtc(v.date,v.time,v.timeZone)){$('#dialog-error').textContent='结束时刻早于开始时刻，请核对日期和时区。';return false;}
  return commit(s=>{const d=requireDay(s,ownerId),data={...v,id:id||uid()};if(id)Object.assign(d.fixedEvents.find(e=>e.id===id),data);else d.fixedEvents.push(data);},id?'':'已添加固定安排');
}
function newDayDialog(){openDialog('添加一天',`<form>${field('日期','date','','date','required')}${field('城市','city','','text','required maxlength="200"')}<label class="field">当地时区${zoneSelect('timeZone','Europe/Rome')}</label>${area('当天备注','note','')}</form>`,action('save-new-day','添加','','primary'));}
function settings(){openDialog('备份与设置',`<p>行程只保存在当前浏览器或主屏幕应用中，不会自动同步到其他设备。</p><div class="settings-stack">${action('export','导出行程备份')}${action('import','从文件恢复行程')}${recovery?action('export-raw','导出无法读取的原始记录'):''}</div><p class="settings-description">建议出发前和重要调整后导出备份，保存到 iPhone「文件」。清除网站数据、更换浏览器或设备可能使本地记录丢失。导入备份会替换当前行程，导入前可同时下载当前备份。</p><div class="divider"></div><h3>离线使用</h3><p class="offline-state">${offlineReady?'页面已缓存，可断网打开。':'页面离线准备尚未完成，请保持联网。'}</p><p class="settings-description">首次完整打开后再离线使用。Google Maps 和信息来源链接属于外部服务，行程工具不会替它们缓存地图。</p><div class="divider"></div><h3>放到 iPhone 主屏幕</h3><p class="settings-description">在 Safari 打开可访问的网址，点「分享」→「添加到主屏幕」。手机完整离线使用需要 HTTPS 网址；电脑本地地址仅用于当前电脑试用。</p>`,action('close','完成','','primary'));}
function download(content,name,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function exportBackup(){download(serialize(state),`意大利行程备份-${new Date().toISOString().slice(0,10)}.json`);toast('备份已下载，请保存到「文件」');}

document.addEventListener('click',event=>{const nav=event.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return;}const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const id=b.dataset.id,a=b.dataset.action;
  try {
    if(a==='close'){closeDialog();return;}
    if(a==='plan'){previewId=id;render();return;}
    if(a==='view-candidates'){setView('candidates');return;}
    if(a==='view-places'){setView('places');return;}
    if(a==='detail'){showDetail(id);return;}
    if(a==='edit-place'||a==='new-place'){editPlaceDialog(id||null);return;}
    if(a==='save-new-place'){if(savePlace(null))closeDialog();return;}
    if(a==='new-fixed'||a==='edit-fixed'){fixedDialog(id||null,b.dataset.owner||dayId,b.dataset.kind||'交通');return;}
    if(a==='save-new-fixed'){if(saveFixed(null))closeDialog();return;}
    if(a==='delete-fixed'){if(!confirm('删除这项固定安排？相关日期的提示卡也会一起移除。'))return;flushDialog=null;if(commit(s=>{const d=requireDay(s,b.dataset.owner||dayId);d.fixedEvents=d.fixedEvents.filter(e=>e.id!==id);},'已删除固定安排'))closeDialog();return;}
    if(a==='new-day'){newDayDialog();return;}
    if(a==='save-new-day'){if(!formOK())return;const v=formValues();if(state.days.some(d=>d.date===v.date)){$('#dialog-error').textContent='这一天已经存在，请在日期列表中选择。';return;}const id=uid();if(commit(s=>{s.days.push({id,...v,isExample:false,plans:[{id:uid(),label:'规划',items:[]}],latest:null,completed:{},skipped:[],extraCandidates:[],fixedEvents:[]});},'已添加一天')){dayId=id;previewId=null;view='day';closeDialog();render();}return;}
    if(a==='day-info'){openDialog('当天备注',`<form>${field('城市','city',day().city,'text','required maxlength="200"')}${area('当天备注','note',day().note)}</form>`,autoFooter);autoForm(()=>{const v=formValues();return commit(s=>Object.assign(requireDay(s,dayId),v));});return;}
    if(a==='save-plan'){openDialog('另存为备选',`<p>保存当前查看的方案，之后可以随时切换查看。</p><form>${field('方案标签','label',`备选${day().plans.length}`,'text','required maxlength="50"')}</form>`,action('confirm-save-plan','保存备选','','primary'));return;}
    if(a==='confirm-save-plan'){if(!formOK())return;const label=formValues().label.trim();if(!label||label==='最新调整'||day().plans.some(p=>p.label===label)){$('#dialog-error').textContent='请输入一个未使用的方案名称。';return;}if(commit(s=>{const d=requireDay(s,dayId);if(d.plans.length>=30)throw Error('每天最多保存 30 个方案。');d.plans.push({id:uid(),label,items:clone(selectedPlan(d,currentId()).items)});},'已保存备选方案'))closeDialog();return;}
    if(a==='apply-plan'){if(confirm('采用这份方案尚未完成的部分？已完成项目和固定安排会保留；剩余时刻请按实际情况调整。'))commit(s=>applyPlan(requireDay(s,dayId),currentId()),'已保存为最新调整，请核对后续时刻',{latest:true});return;}
    if(a==='add-item'){const p=place(id);if(p.uncertainty&&!confirm(`${p.uncertainty}\n\n仍先加入安排，并保留待确认提示？`))return;commit(s=>addItem(requireDay(s,dayId),p),'已加入最新调整',{latest:true});return;}
    if(a==='toggle-done'){const d=day(),item=selectedPlan(d,currentId()).items.find(i=>i.placeId===id)||d.completed[id];commit(s=>setStatus(requireDay(s,dayId),item,d.completed[id]?'pending':'done'),d.completed[id]?'已撤销完成':'已记录完成');return;}
    if(a==='edit-item'){editItemDialog(id);return;}
    if(['move-up','move-down','skip','remove-item'].includes(a)){
      if(flushDialog&&!flushDialog())return;
      const source=currentId(),item=selectedPlan(day(),source).items.find(i=>i.placeId===id)||day().completed[id];
      if(a==='remove-item'&&!confirm('从当前方案移除？地点库和其他备选会保留。'))return;
      const ok=commit(s=>{const d=requireDay(s,dayId);if(a==='skip')setStatus(d,item,d.skipped.includes(id)?'pending':'skipped');else if(a==='remove-item')removeItem(d,source,id);else moveItem(d,source,id,a==='move-up'?-1:1);},a==='skip'?'已更新当天状态':'已保存调整',{latest:a!=='skip'});if(ok){flushDialog=null;closeDialog();}return;
    }
    if(a==='export'){if(recovery){download(corruptRaw,'行程原始记录.json');}else exportBackup();return;}
    if(a==='export-raw'){download(corruptRaw,'行程原始记录.json');return;}
    if(a==='import'){if(flushDialog&&!flushDialog())return;$('#import-file').click();return;}
  }catch(error){toast(error.message||'操作未完成');const e=$('#dialog-error');if(e)e.textContent=error.message;}
});
document.addEventListener('change',event=>{if(event.target.id==='day-select'){dayId=event.target.value;previewId=null;render();}});
document.addEventListener('submit',event=>event.preventDefault());
document.addEventListener('input',event=>{if(event.target.id==='place-search'){const input=event.target,pos=input.selectionStart;search=input.value;render();$('#place-search').focus();$('#place-search').setSelectionRange(pos,pos);}});
$('#settings-button').addEventListener('click',settings);
$('#dialog').addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try {if(file.size>4_000_000)throw Error('文件过大，请选择本工具导出的行程备份。');const incoming=deserialize(await file.text());if(!confirm(`恢复 ${incoming.days.length} 天、${incoming.places.length} 个地点？将替换当前行程，并先下载当前记录作为备份。`))return;
    if(recovery)download(corruptRaw,'恢复前原始记录.json');else exportBackup();
    if(recovery){incoming.revision=0;incoming.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(incoming));state=incoming;recovery=false;$('#storage-warning').hidden=true;}
    else if(!commit(s=>Object.assign(s,incoming)))return;
    flushDialog=null;closeDialog();dayId=state.days[0].id;previewId=null;view='day';render();toast('行程已从备份恢复');
  }catch(error){toast(error.message||'无法读取该文件，当前行程未改变。');const e=$('#dialog-error');if(e)e.textContent=error.message;}finally{event.target.value='';}
});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)warn('另一窗口的行程已改变。请先保留当前输入，再刷新此页面。');});
window.addEventListener('pagehide',()=>{if(flushDialog)flushDialog();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&flushDialog)flushDialog();});
render();
if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;}).catch(()=>{offlineReady=false;});}

// Optional browser-native navigation. Unsupported browsers simply use the visible controls.
if(document.modelContext?.registerTool){const life=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'show_trip_day',title:'查看指定日期的行程',description:'切换到已有日期的行程视图，不修改或上传行程数据。',inputSchema:{type:'object',properties:{date:{type:'string'}},required:['date'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.date!=='string'||Object.keys(input).some(k=>k!=='date')||!validDate(input.date))throw Error('需要有效的 YYYY-MM-DD 日期。');const target=state.days.find(d=>d.date===input.date);if(!target)throw Error('没有该日期的行程。');if($('#dialog').open)throw Error('请先完成当前编辑。');dayId=target.id;previewId=null;setView('day');return {displayed:true,date:target.date};}},{signal:life.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>life.abort(),{once:true});}
