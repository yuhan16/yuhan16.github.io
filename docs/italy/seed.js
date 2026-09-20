const centerSource = 'https://www.yesmilano.it/en/itineraries';
const place = (id, name, address, duration, tags, description, extra = {}) => ({
  id, name, city:'米兰', kind:'游览', address, duration, tags, description,
  bestTime:'白天', openingHours:'', notes:'', sourceUrl:centerSource,
  checkedAt:'2026-09-20', uncertainty:'', ...extra,
});
export function createSeed() {
  const places = [
    place('duomo','米兰大教堂广场','Piazza del Duomo, Milano',20,['历史建筑','室外'],'看看教堂外立面，在广场慢慢走。',{notes:'本方案只看外观，不含教堂入内和登顶。人多时可以缩短。'}),
    place('galleria','埃马努埃莱二世拱廊','Galleria Vittorio Emanuele II, Milano',20,['建筑','有顶步行空间'],'抬头看玻璃屋顶，感受拱廊的空间。',{notes:'往返仍有露天路段；商店营业时间与通道开放不是一回事。'}),
    place('scala','斯卡拉广场','Piazza della Scala, Milano',15,['剧院外观','室外'],'在广场看看斯卡拉剧院外观。',{notes:'不含剧院内部或博物馆参观；累了可跳过。'}),
    place('mercanti','商人广场','Piazza dei Mercanti, Milano',20,['历史建筑','室外'],'看看老城广场和周边建筑外观。'),
    place('satiro','San Satiro 教堂','Via Torino 17/19, Milano',30,['透视建筑','室内'],'Bramante 的透视错觉空间。',{bestTime:'确认开放的时段',uncertainty:'周一游客参观时间待确认，仪式期间也可能无法参观。',sourceUrl:'https://www.yesmilano.it/accessibilita-luoghi/chiesa-di-santa-maria-presso-san-satiro-accessibilita'}),
    place('darsena','Darsena 旧港池','Darsena, Piazza XXIV Maggio, Milano',30,['历史港池','水边'],'在旧港池边停留，看看城市水岸。',{notes:'热门休闲片区，不保证人少。只安排白天散步。',sourceUrl:'https://www.yesmilano.it/en/see-and-do/venues/darsena'}),
    place('lavandai','运河近端与洗衣巷','Vicolo dei Lavandai, Milano',45,['城市散步','水边'],'沿 Naviglio Grande 靠近旧港池的一段散步，到洗衣巷看看。',{notes:'只走城区近端，不向城外延伸；遇到冷清路段就折返。',sourceUrl:'https://www.yesmilano.it/quartieri/cosa-vedere-navigli-milano'}),
  ];
  const entry = (placeId,time,duration) => ({id:`entry-${placeId}`,placeId,time,duration,note:''});
  return {
    schemaVersion:1, revision:0, updatedAt:null,
    places, days:[{
      id:'milan-0928', date:'2026-09-28', city:'米兰', timeZone:'Europe/Rome',
      note:'抵达日，下午只选一个片区。疲劳或延误时，直接缩短游览。',
      isExample:true, plans:[
        {id:'main',label:'规划',items:[entry('duomo','15:15',20),entry('galleria','15:40',20),entry('scala','16:05',15),entry('mercanti','16:30',20)]},
        {id:'architecture',label:'备选1',items:[entry('satiro','15:15',30),entry('mercanti','15:50',20),entry('galleria','16:25',20)]},
        {id:'canals',label:'备选2',items:[entry('darsena','15:15',30),entry('lavandai','15:50',45)]},
      ], latest:null, completed:{}, skipped:[], extraCandidates:[],
      fixedEvents:[
        {id:'settle',title:'抵达、进城与安顿',kind:'交通',date:'2026-09-28',time:'09:00',timeZone:'Europe/Rome',endDate:'',endTime:'',endTimeZone:'Europe/Rome',address:'',notes:'示例时段，需用实际客票确认。机场交通、入住与行李寄存另行核对。'},
        {id:'rest',title:'午餐与休息',kind:'休息',date:'2026-09-28',time:'12:30',timeZone:'Europe/Rome',endDate:'',endTime:'',endTimeZone:'Europe/Rome',address:'',notes:'预留至 14:30；暂不包含你的住宿地址。'},
        {id:'return',title:'返回住处',kind:'休息',date:'2026-09-28',time:'17:15',timeZone:'Europe/Rome',endDate:'',endTime:'',endTimeZone:'Europe/Rome',address:'',notes:'目标 18:30 前安顿。交通和用餐耗时较长时，提前结束游览。'},
      ],
    }],
  };
}
