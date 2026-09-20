import {localToUtc,fixedKind} from './core.js';
export {fixedKind} from './core.js';

// Cards refer to existing bookings; they never create copies in a daily plan.
export function fixedReferences(state,day) {
  return state.days.flatMap(owner=>owner.fixedEvents.map(event=>({event,ownerId:owner.id})))
    .filter(({event:e,ownerId})=>ownerId===day.id||e.date===day.date||e.endDate===day.date||
      (fixedKind(e)!=='other'&&e.endDate&&e.date<day.date&&day.date<e.endDate));
}

export function overnightStays(state,day) {
  return fixedReferences(state,day).filter(({event:e})=>fixedKind(e)==='stay'&&
    !/退房/.test(e.kind)&&e.date<=day.date&&(e.endDate?day.date<e.endDate:e.date===day.date));
}

export function fixedMilestones(state,day) {
  const milestones=[];
  for(const ref of fixedReferences(state,day)) {
    const e=ref.event,kind=fixedKind(e);
    const add=(phase,date,time,zone)=>milestones.push({...ref,phase,date,time,zone,
      at:time?localToUtc(date,time,zone):null});
    if(kind==='transport') {
      if(e.date===day.date)add('transport',e.date,e.time,e.timeZone);
      else if(e.endDate===day.date)add('arrival',e.endDate,e.endTime,e.endTimeZone);
      else if(e.endDate&&e.date<day.date&&day.date<e.endDate)add('in-transit',day.date,'',day.timeZone);
    }
    if(kind==='stay') {
      if(e.date===day.date&&e.time)add(/退房/.test(e.kind)?'checkout':'checkin',e.date,e.time,e.timeZone);
      if(e.endDate===day.date)add('checkout',e.endDate,e.endTime,e.endTimeZone);
    }
  }
  return milestones.sort((a,b)=>(a.at??-Infinity)-(b.at??-Infinity));
}

export function dayTimeline(state,day,plan) {
  const pending=[...fixedMilestones(state,day)],result=[];
  // Keep the user's activity order, including untimed entries and completed history.
  while(pending.length&&pending[0].at===null)result.push({type:'fixed',...pending.shift()});
  for(const item of plan.items) {
    const at=item.time?localToUtc(day.date,item.time,day.timeZone):NaN;
    while(pending.length&&pending[0].at<=at)result.push({type:'fixed',...pending.shift()});
    result.push({type:'activity',item});
  }
  return result.concat(pending.map(ref=>({type:'fixed',...ref})));
}
