export type FocusKey = 'all' | 'battery' | 'cabin' | 'adas';

export const focusCopy: Record<
  FocusKey,
  { index: string; title: string; copy: string; facts: [string, string][] }
> = {
  all: {
    index: 'SYSTEM 01 / 04',
    title: '整车结构',
    copy: '先从完整形态观察曜境 S9：外部车身、座舱、电池与感知组件被组织在同一个移动系统里。',
    facts: [
      ['模型', 'EV SUV'],
      ['节点', '802'],
      ['材质', '19 组'],
    ],
  },
  battery: {
    index: 'SYSTEM 02 / 04',
    title: '电池系统',
    copy: '电池包位于车身下方，是纯电平台的能量底座。模型中的 12 模块布局用于解释包装关系，不代表量产容量或化学体系。',
    facts: [
      ['位置', '底盘中央'],
      ['模块', '12 个示意模块'],
      ['作用', '储能 / 供电'],
    ],
  },
  cabin: {
    index: 'SYSTEM 03 / 04',
    title: '座舱系统',
    copy: '座舱把人的输入转化为机器可以执行的指令：座椅、显示器、方向盘和内饰结构共同形成一个人机界面。',
    facts: [
      ['区域', '前后排座舱'],
      ['界面', '显示 / 操控'],
      ['目标', '理解与响应'],
    ],
  },
  adas: {
    index: 'SYSTEM 04 / 04',
    title: '智驾感知',
    copy: '摄像头、雷达与光学窗口构成车辆的感知层。波纹从车身上的传感器向外扩散，模拟它如何测量距离、方向和目标回波，再把环境交给计算系统判断。',
    facts: [
      ['输入', '光学 / 距离'],
      ['波形', '超声 / 雷达'],
      ['状态', '扫描中'],
    ],
  },
};

export const assemblyInfo: Record<string, { label: string; system: string; description: string }> = {
  ADAS: {
    label: '智驾感知装配',
    system: '感知系统',
    description: '摄像头、激光雷达和超声波传感器共同构成车辆的环境输入层。',
  },
  BatteryPack: {
    label: '动力电池包',
    system: '能源系统',
    description: '位于底盘中央的电池包，为电机和高压附件提供储能与供电。',
  },
  BodyStructure: {
    label: '车身结构',
    system: '承载系统',
    description: '车身骨架连接悬架、座舱和外覆盖件，承担载荷传递与碰撞路径。',
  },
  Brakes: {
    label: '制动系统',
    system: '底盘系统',
    description: '制动执行器、液压管路与制动机构共同完成减速和停车。',
  },
  Cabin: {
    label: '座舱系统',
    system: '人机系统',
    description: '座椅、显示器、方向盘和内饰结构把人的输入转换为可执行指令。',
  },
  ChargeHV: {
    label: '高压充电系统',
    system: '能源系统',
    description: '充电接口和高压连接件把外部电能安全送入动力电池。',
  },
  Door_FL: {
    label: '左前车门',
    system: '车身开合件',
    description: '包含车门外板、内饰卡板、玻璃和铰链，是前排乘员的进出界面。',
  },
  Door_FR: {
    label: '右前车门',
    system: '车身开合件',
    description: '包含车门外板、内饰卡板、玻璃和铰链，是前排乘员的进出界面。',
  },
  Door_RL: { label: '左后车门', system: '车身开合件', description: '后排乘员入口与侧围结构的可动覆盖件。' },
  Door_RR: { label: '右后车门', system: '车身开合件', description: '后排乘员入口与侧围结构的可动覆盖件。' },
  Exterior: {
    label: '外饰覆盖',
    system: '车身外观',
    description: '外板、灯具开口和装饰件共同形成车辆的可见外轮廓。',
  },
  FrontEaxle: {
    label: '前电驱桥',
    system: '电驱系统',
    description: '前部电机、减速机构与高压接口组成前轴驱动单元。',
  },
  FrontSuspension: {
    label: '前悬架',
    system: '底盘系统',
    description: '前轮悬架控制车轮跳动、转向响应和车身支撑。',
  },
  Hood: { label: '前舱盖', system: '车身开合件', description: '覆盖前舱并通过铰链与车身连接的可动外板。' },
  RearEaxle: {
    label: '后电驱桥',
    system: '电驱系统',
    description: '后部电机、减速机构与高压接口组成后轴驱动单元。',
  },
  RearSuspension: {
    label: '后悬架',
    system: '底盘系统',
    description: '后轮悬架负责车轮定位、路面隔离和车身稳定。',
  },
  RoofGlazing: {
    label: '车顶玻璃',
    system: '车身外观',
    description: '车顶采光和玻璃结构，连接车顶开口与乘员视野。',
  },
  Steering: {
    label: '转向系统',
    system: '底盘系统',
    description: '方向盘、转向柱和转向执行件把驾驶者输入传递到前轮。',
  },
  Tailgate: {
    label: '后备箱尾门',
    system: '车身开合件',
    description: '后部电动尾门及其铰链、撑杆和内衬，提供行李舱开口。',
  },
  ThermalHVAC: {
    label: '热管理与空调',
    system: '热管理系统',
    description: '热交换、冷却和空调部件调节电池、座舱与电驱系统的温度。',
  },
  Wheel_FL: {
    label: '左前车轮',
    system: '底盘系统',
    description: '轮胎、轮辋和轮毂组件，把悬架运动转换为路面接触。',
  },
  Wheel_FR: {
    label: '右前车轮',
    system: '底盘系统',
    description: '轮胎、轮辋和轮毂组件，把悬架运动转换为路面接触。',
  },
  Wheel_RL: {
    label: '左后车轮',
    system: '底盘系统',
    description: '轮胎、轮辋和轮毂组件，把悬架运动转换为路面接触。',
  },
  Wheel_RR: {
    label: '右后车轮',
    system: '底盘系统',
    description: '轮胎、轮辋和轮毂组件，把悬架运动转换为路面接触。',
  },
};

export const fallbackExplodeVectors: Record<string, [number, number, number]> = {
  ADAS: [0, 1.2, 0],
  BatteryPack: [0, -0.9, 0],
  BodyStructure: [0, -0.45, 0],
  Brakes: [0.85, 0.28, 0.4],
  Cabin: [0, 0.95, 0],
  ChargeHV: [-0.8, -0.3, 0.45],
  Door_FL: [0, 0, -0.9],
  Door_FR: [0, 0, 0.9],
  Door_RL: [0, 0, -0.9],
  Door_RR: [0, 0, 0.9],
  Exterior: [0, 0.9, 0],
  FrontEaxle: [1.05, 0, 0],
  FrontSuspension: [0.65, 0, 0],
  Hood: [0.55, 0.65, 0],
  RearEaxle: [-1.05, 0, 0],
  RearSuspension: [-0.65, 0, 0],
  RoofGlazing: [0, 1.35, 0],
  Steering: [0.55, 0.35, 0],
  Tailgate: [-0.8, 0.75, 0],
  ThermalHVAC: [1.1, -0.25, 0.65],
  Wheel_FL: [0, 0, -1.05],
  Wheel_FR: [0, 0, 1.05],
  Wheel_RL: [0, 0, -1.05],
  Wheel_RR: [0, 0, 1.05],
};

export type PartCategory = 'all' | 'body' | 'energy' | 'drive' | 'chassis' | 'cabin' | 'adas' | 'opening';

export const partCategoryLabels: Record<PartCategory, string> = {
  all: '全部零件',
  body: '车身外观',
  energy: '能源系统',
  drive: '电驱系统',
  chassis: '底盘系统',
  cabin: '座舱人机',
  adas: '智驾感知',
  opening: '开合部件',
};

export const partCategoryMap: Record<string, PartCategory> = {
  BodyStructure: 'body',
  Exterior: 'body',
  RoofGlazing: 'body',
  BatteryPack: 'energy',
  ChargeHV: 'energy',
  ThermalHVAC: 'energy',
  FrontEaxle: 'drive',
  RearEaxle: 'drive',
  Brakes: 'chassis',
  FrontSuspension: 'chassis',
  RearSuspension: 'chassis',
  Wheel_FL: 'chassis',
  Wheel_FR: 'chassis',
  Wheel_RL: 'chassis',
  Wheel_RR: 'chassis',
  Cabin: 'cabin',
  Steering: 'cabin',
  ADAS: 'adas',
  Door_FL: 'opening',
  Door_FR: 'opening',
  Door_RL: 'opening',
  Door_RR: 'opening',
  Hood: 'opening',
  Tailgate: 'opening',
};

export const partCategoryForName = (name: string): PartCategory => partCategoryMap[name] ?? 'body';

export const humanizeNodeName = (name: string) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/\b\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim() || '未命名零件';

export type DisassemblyTask = { target: string; label: string; title: string; copy: string };

export const disassemblyTasks: DisassemblyTask[] = [
  {
    target: 'BatteryPack',
    label: '动力电池包',
    title: '找到能量底座',
    copy: '动力电池包藏在车身下方，它把电能储存起来，再交给电机使用。',
  },
  {
    target: 'ADAS',
    label: '智驾感知系统',
    title: '找到机器的眼睛',
    copy: '智驾感知系统用摄像头、雷达和激光雷达观察道路，把环境信息交给计算系统。',
  },
  {
    target: 'Cabin',
    label: '座舱系统',
    title: '找到人与车的界面',
    copy: '座舱把人的输入变成车辆可以执行的指令，是人与汽车交流的空间。',
  },
];

export const powerflowStages = [
  {
    at: 0,
    step: '01 / ENERGY SUPPLY',
    title: '能量，从电池开始',
    copy: '动力电池释放电能，送入车辆的高压系统。',
  },
  {
    at: 1.2,
    step: '02 / ELECTRIC DRIVE',
    title: '电机，把电变成转动',
    copy: '电控协调前后电驱桥，让电机输出旋转动力。',
  },
  {
    at: 2.55,
    step: '03 / WHEELS IN MOTION',
    title: '动力，传到四个车轮',
    copy: '电驱桥把转动力传给车轮，车辆由此向前行驶。',
  },
  {
    at: 3.45,
    step: '04 / ADAS SENSING',
    title: '出发前，先看清周围',
    copy: '摄像头接收道路图像，雷达和激光雷达主动探测；不同设备把信息交给计算系统。',
  },
];
