import { assetUrl } from '../../shared/assets';
const historyImage = (file: string) => assetUrl(`/assets/history/${file}`);
export type ArchiveMeta = {
  image?: string;
  imageAlt?: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
  story?: string;
  quote?: string;
};

export type HistoryExhibit = {
  id: string;
  year: string;
  title: string;
  track: 'auto' | 'sensor' | 'ai';
  badge?: string;
  imageTitle?: string;
  detail: string;
  story: string;
  eventTitles: string[];
};

export const archiveAssets: Record<string, ArchiveMeta> = {
  电动车科研专项启动: {
    image: historyImage('ev-early-plug-in.jpg'),
    imageAlt: '比亚迪 F3DM 插电式混合动力车',
    caption: '早期插电式车型展品，代表中国新能源汽车从科研走向产品的探索。',
    credit: 'Wikimedia Commons / RL GNZLZ / CC BY-SA 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:BYD_F3_DM_2010.jpg',
    story:
      '这是一张 2010 年拍摄的车型照片，不是 2001 年科研现场。它用一辆真实展品帮助我们理解早期电动化探索。',
  },
  电动车开进奥运服务车队: {
    image: historyImage('ev-early-plug-in.jpg'),
    imageAlt: '早期插电式新能源车',
    caption: '代表早期新能源车型的展品影像；不作为奥运现场照片使用。',
    credit: 'Wikimedia Commons / RL GNZLZ / CC BY-SA 2.0',
    sourceUrl: 'https://www.nea.gov.cn/2018-11/23/c_137626553.htm',
    story: '2008 年奥运示范的意义，是让新能源车在大型活动和真实道路中被看见、被使用、被检验。',
  },
  '“十城千辆”开始示范': {
    image: historyImage('ev-electric-taxi.jpg'),
    imageAlt: '深圳电动出租车',
    caption: '深圳电动出租车，展示新能源汽车进入城市日常交通。',
    credit: 'Wikimedia Commons / Brücke-Osteuropa / CC0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:BYD_Electric_Taxi_1.JPG',
    story: '公共交通和出租车每天行驶很多里程，最适合帮助工程师发现问题、积累数据、改进车辆。',
  },
  国家规划推动产业化: {
    image: historyImage('ev-shenzhen-bus.jpg'),
    imageAlt: '深圳电动公交车',
    caption: '深圳电动公交车，把电驱动带进高频公共出行。',
    credit: 'Wikimedia Commons / Bennyzhong / CC BY 3.0',
    sourceUrl: 'https://www.mofcom.gov.cn/zcfb/zgdwjjmywg/art/2012/art_c52b03813ed949b6b1c6fe11ba679f46.html',
    story: '当政策、科研、企业和城市一起行动，新能源汽车才有机会从样车变成产业。',
  },
  更多车型走进城市: {
    image: historyImage('ev-plug-in-sedan.jpg'),
    imageAlt: '中国道路上的比亚迪秦插电式混合动力车',
    caption: '插电式混合动力乘用车，展示车型进入家庭和城市生活。',
    credit: 'Wikimedia Commons / Rutger van der Maar / CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:BYD_Qin_in_China.jpg',
    story: '2014—2015 年，新能源车型和销量快速增长，工程问题也从“能不能跑”变成“如何跑得更好”。',
  },
  新能源汽车进入规模化时代: {
    image: historyImage('ev-modern-bus.jpg'),
    imageAlt: '中国城市道路上的新能源公交车',
    caption: '新能源公交车，展示电动化进入城市公共交通。',
    credit: 'Wikimedia Commons / Windmemories / CC BY-SA 4.0',
    sourceUrl: 'https://app.www.gov.cn/govdata/gov/202501/14/523622/article.html',
    story: '2024—2025 年的公开统计显示，新能源汽车已经进入大规模生产和销售阶段。',
  },
  中国新能源汽车驶向海外: {
    image: historyImage('china-nev-exports.svg'),
    imageAlt: '新能源汽车从中国港口装船，驶向海外市场的科普示意图',
    caption: '科普示意图：新能源车从中国港口启程，运往海外市场。',
    credit: '原创科普插图',
    sourceUrl: 'https://www.miit.gov.cn/jgsj/zbys/qcgy/art/2026/art_4c5ed7009d21485da32b2a01abcf2819.html',
    story:
      '出口，就是把在中国生产的汽车运到其他国家和地区。中汽协统计显示，2025 年中国新能源汽车出口 261.5 万辆，比 2024 年增长 103.7%。',
  },
  第二代刀片电池与闪充发布: {
    image: historyImage('byd-blade-battery-2.svg'),
    imageAlt: '第二代刀片电池与闪充原理示意图',
    caption: '科普示意图：电池、闪充与车辆动力系统如何连接。',
    credit: '比亚迪官方发布 / 2026 年 3 月',
    sourceUrl: 'https://www.byd.com/cn/detail617',
    story:
      '2026 年 3 月，比亚迪发布第二代刀片电池与闪充技术。比亚迪公布，常温下电量从 10% 到 70% 约需 5 分钟，从 10% 到 97% 约需 9 分钟。实际时间会受车型、温度和充电条件影响。',
  },
  闪充站铺向更多城市: {
    image: historyImage('byd-national-fast-charge-network.svg'),
    imageAlt: '中国城市闪充网络示意图',
    caption: '科普示意图：充电站从城市节点连接成更大的出行网络。',
    credit: '比亚迪官方通报 / 2026 年 8 月',
    sourceUrl: 'https://www.byd.com/cn/detail633',
    story:
      '截至 2026 年 8 月，比亚迪公布已建成 1 万座闪充站，覆盖 332 座城市，并继续向更多城市布局。充电站越方便，新能源车就越容易服务日常生活和长途出行。',
  },
  '“三电”一起攻关': {
    image: historyImage('ev-battery-pack.jpg'),
    imageAlt: '电动汽车动力电池模型',
    caption: '动力电池模型：电芯、模组和电池包共同储存能量。',
    credit: 'Wikimedia Commons / DKMcLaren / CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:BYD_e5_Electric_Vehicle_Battery_Model.jpg',
    story: '电池、电机、电控缺一不可：电池给能量，电机把能量变成运动，电控负责协调。',
  },
  城市公交验证电驱系统: {
    image: historyImage('ev-shenzhen-bus.jpg'),
    imageAlt: '深圳电动公交车',
    caption: '电动公交车是观察续航、充电和可靠性的真实实验室。',
    credit: 'Wikimedia Commons / Bennyzhong / CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shenzhen_ebus_m414.JPG',
    story: '公共交通每天反复运行，让车辆在真实道路上接受长期检验。',
  },
  专用道路测试智能网联: {
    image: historyImage('sensor-lidar-car.jpg'),
    imageAlt: '车辆上的激光雷达传感器',
    caption: '车辆上的激光雷达传感器；图片用于解释感知硬件，不代表中国试点现场。',
    credit: 'Wikimedia Commons / Ibeo LiDAR sensor in car',
    sourceUrl: 'https://www.ndrc.gov.cn/xxgk/jd/jd/201609/t20160905_1182748.html',
    story: '专用测试道路让工程师可以重复同一个场景，慢慢调整感知、通信和控制。',
  },
  充电桩把电送到路边: {
    image: historyImage('ev-public-charger.jpg'),
    imageAlt: '国家电网充电桩',
    caption: '公共充电设施，把电网和新能源汽车连接起来。',
    credit: 'Wikimedia Commons / Air7538 / CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:中国国家电网充电桩.jpg',
    story: '充电桩让车辆不必回到工厂或停车场，城市里的电网也能成为出行的一部分。',
  },
  电池管理让每一格电更安全: {
    image: historyImage('ev-battery-pack.jpg'),
    imageAlt: '动力电池模型',
    caption: '动力电池模型；管理系统会监测温度、电量和状态。',
    credit: 'Wikimedia Commons / DKMcLaren / CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:BYD_e5_Electric_Vehicle_Battery_Model.jpg',
    story: '电池管理系统像一位细心的管理员，持续观察每一组电芯的状态。',
  },
  汽车开始在试验场学会感知: {
    image: historyImage('sensor-lidar-car.jpg'),
    imageAlt: '汽车上的激光雷达传感器',
    caption: '激光雷达是智能汽车感知硬件的一种。',
    credit: 'Wikimedia Commons / Ibeo LiDAR sensor in car',
    sourceUrl: 'https://www.ndrc.gov.cn/xxgk/jd/jd/201609/t20160905_1182748.html',
    story: '感知系统先测量道路，再把结果交给车载计算平台处理。',
  },
  电动化与智能化并行: {
    image: historyImage('ev-battery-swap.jpg'),
    imageAlt: '新能源汽车换电站',
    caption: '换电站展示了新能源汽车补充能量的另一种方式。',
    credit: 'Wikimedia Commons / bfishadow / CC BY 2.0',
    sourceUrl: 'https://wap.miit.gov.cn/xwdt/szyw/art/2020/art_4390362916324365a260ed97d7558f18.html',
    story: '新能源车的发展不只有电池，还包括补能、联网、计算和服务。',
  },
  多种传感器一起工作: {
    image: historyImage('sensor-lidar-unit.jpg'),
    imageAlt: '激光雷达传感器',
    caption: '激光雷达用光脉冲测量距离；车辆还会结合摄像头、雷达等信息。',
    credit: 'Wikimedia Commons / Velodyne lidar sensor family',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Category:LIDAR_sensors',
    story: '不同传感器像不同的感官：有的看形状，有的测距离，有的专门观察近处。',
  },
  从感知到决策: {
    image: historyImage('sensor-lidar-car.jpg'),
    imageAlt: '车辆上的感知传感器',
    caption: '感知只是第一步，后面还要预测、规划和控制。',
    credit: 'Wikimedia Commons / Ibeo LiDAR sensor in car',
    sourceUrl: 'https://www.ndrc.gov.cn/xxgk/jd/jd/201609/t20160905_1182748.html',
    story: '车辆先发现目标，再判断风险，最后决定减速、转向或继续前进。',
  },
  人和车一起做决定: {
    image: historyImage('ev-modern-bus.jpg'),
    imageAlt: '中国城市道路上的新能源公交车',
    caption: '公共交通提醒我们：技术最终要服务于真实的人和道路。',
    credit: 'Wikimedia Commons / Windmemories / CC BY-SA 4.0',
    sourceUrl: 'https://www.hubei.gov.cn/szyw/202601/t20260115_5855892.shtml',
    story: '更聪明的车也需要清楚的规则、人的监督和安全边界。',
  },
};

export const historyExhibits: HistoryExhibit[] = [
  {
    id: 'archive-2001',
    year: '2001',
    title: '电动车重大科技专项启动',
    track: 'auto',
    imageTitle: '“三电”一起攻关',
    detail: '国家启动电动汽车科研专项，电池、电机和电控一起研究。',
    story: '电池存电，电机带动车轮，电控负责协调。',
    eventTitles: ['电动车科研专项启动', '“三电”一起攻关'],
  },
  {
    id: 'archive-2008',
    year: '2008',
    title: '新能源车参与奥运服务',
    track: 'auto',
    imageTitle: '电动车开进奥运服务车队',
    detail: '新能源车参加大型活动服务，在真实道路上接受检验。',
    story: '车辆投入使用后，工程师能发现续航、充电和调度中的新问题。',
    eventTitles: ['电动车开进奥运服务车队'],
  },
  {
    id: 'archive-2009',
    year: '2009',
    title: '“十城千辆”开始示范',
    track: 'auto',
    imageTitle: '“十城千辆”开始示范',
    detail: '城市让公交车、出租车和公务车试着使用电力。',
    story: '每天反复行驶带来真实数据，帮助工程师改进车辆。',
    eventTitles: ['“十城千辆”开始示范'],
  },
  {
    id: 'archive-2012',
    year: '2012—2013',
    title: '产业规划与公交验证',
    track: 'auto',
    imageTitle: '国家规划推动产业化',
    detail: '国家规划支持电动车发展，公交车也在城市里持续运行。',
    story: '科研、制造、充电和车辆使用，逐步连成完整的产业。',
    eventTitles: ['国家规划推动产业化', '城市公交验证电驱系统'],
  },
  {
    id: 'archive-2014',
    year: '2014—2015',
    title: '更多车型走进城市',
    track: 'auto',
    imageTitle: '更多车型走进城市',
    detail: '新能源车型变多，开始走进更多城市家庭。',
    story: '大家关心的不只是能不能开，也包括续航、充电和好不好用。',
    eventTitles: ['更多车型走进城市'],
  },
  {
    id: 'archive-2015',
    year: '2015—2016',
    title: '智能网联汽车开始道路测试',
    track: 'ai',
    imageTitle: '专用道路测试智能网联',
    detail: '工程师在测试道路观察汽车怎样看路、认车和作出反应。',
    story: '摄像头、雷达、定位和计算平台开始一起接受测试。',
    eventTitles: ['专用道路测试智能网联', '汽车开始在试验场学会感知'],
  },
  {
    id: 'archive-2020',
    year: '2020',
    title: '充电网络连接更多智能功能',
    track: 'sensor',
    imageTitle: '充电桩把电送到路边',
    detail: '充电设施持续发展，汽车也开始加入联网和智能功能。',
    story: '车要有地方补电，也需要道路、网络和软件配合。',
    eventTitles: ['充电桩把电送到路边', '电动化与智能化并行'],
  },
  {
    id: 'archive-2020s',
    year: '2021—2025',
    title: '新能源汽车进入规模化时代',
    track: 'auto',
    imageTitle: '新能源汽车进入规模化时代',
    detail: '新能源车从示范产品走进更多城市和家庭。',
    story: '电池、制造能力与充电服务一起支持产业普及。',
    eventTitles: ['新能源汽车进入规模化时代'],
  },
  {
    id: 'archive-2025-export',
    year: '2025',
    title: '中国新能源汽车驶向海外',
    track: 'auto',
    badge: '走向世界',
    imageTitle: '中国新能源汽车驶向海外',
    detail: '全年出口 261.5 万辆，比上一年增长 103.7%。',
    story: '汽车从中国出发，运到海外市场。出口数量增长，说明中国新能源车正在服务更多国家和地区的用户。',
    eventTitles: ['中国新能源汽车驶向海外'],
  },
  {
    id: 'archive-2026-blade',
    year: '2026.03',
    title: '第二代刀片电池与闪充发布',
    track: 'auto',
    badge: '中国自主创新',
    imageTitle: '第二代刀片电池与闪充发布',
    detail: '比亚迪公布：常温下充到 70% 约需 5 分钟，充到 97% 约需 9 分钟。',
    story:
      '这是企业公布的技术表现，实际充电时间会受车型、电池温度和充电条件影响。电池像车里的能量仓，闪充让补能更快。',
    eventTitles: ['第二代刀片电池与闪充发布'],
  },
  {
    id: 'archive-2026-charge',
    year: '2026.08',
    title: '闪充站铺向更多城市',
    track: 'auto',
    badge: '全国补能网络',
    imageTitle: '闪充站铺向更多城市',
    detail: '比亚迪公布第 10000 座闪充站落成，覆盖 332 座城市。',
    story:
      '这是企业截至 2026 年 8 月公布的数据。充电站像沿途的补给点，让新能源车更方便地服务日常生活和长途出行。',
    eventTitles: ['闪充站铺向更多城市'],
  },
  {
    id: 'archive-today-battery',
    year: '今天',
    title: '电池管理守护每一份电',
    track: 'sensor',
    imageTitle: '电动化与智能化并行',
    detail: '电池管理系统持续观察温度、电量和电池状态。',
    story: '它像电池的管理员，帮助车辆及时发现异常。',
    eventTitles: ['电池管理让每一格电更安全'],
  },
  {
    id: 'archive-today-sensing',
    year: '今天',
    title: '传感器一起观察道路',
    track: 'ai',
    imageTitle: '多种传感器一起工作',
    detail: '摄像头、雷达和激光雷达各有分工，一起收集道路信息。',
    story: '车辆把信息放在一起，形成环境图，再判断下一步怎么走。',
    eventTitles: ['多种传感器一起工作', '从感知到决策'],
  },
  {
    id: 'archive-future',
    year: '未来',
    title: '人和车共同守护安全',
    track: 'ai',
    detail: '智能系统帮助观察道路，人仍要保持注意力。',
    story: '科技让出行更安心，安全始终排在第一位。',
    eventTitles: ['人和车一起做决定'],
  },
];
