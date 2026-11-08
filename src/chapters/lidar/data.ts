import { lidarLearningContent } from './learning-data';

export type LidarMode = 'assembly' | 'exploded' | 'cutaway';

export type PartInfo = {
  id: string;
  name: string;
  copy: string;
  fact: string;
};

export const partCatalog: PartInfo[] = [
  {
    id: 'VLP16_scan',
    name: '扫描器组件',
    copy: '这是 VLP-16 的扫描器外形组件。它逐方向测量周围空间并接收目标回波。',
    fact: '真实外形：VLP16_scan.dae',
  },
  {
    id: 'VLP16_base_2',
    name: '上盖组件',
    copy: '位于扫描器上方，组成真实模型外部结构的一部分。',
    fact: '真实外形：VLP16_base_2.dae',
  },
  {
    id: 'VLP16_base_1',
    name: '安装底座',
    copy: '下方底座用于安装并支撑传感器。',
    fact: '真实外形：VLP16_base_1.dae',
  },
  {
    id: 'lidar_optical_array',
    name: '16通道光学阵列',
    copy: '16组发射器与接收器按固定仰角排布，旋转扫描头带着它们水平转一圈。',
    fact: '功能示意：发射脉冲 + 接收回波',
  },
  {
    id: 'lidar_motor',
    name: '旋转电机与轴承',
    copy: '电机带动扫描头旋转，轴承保持转动平稳；方位角由编码器同步记录。',
    fact: '功能示意：驱动水平 360° 扫描',
  },
  {
    id: 'lidar_tof_board',
    name: '回波与测距电路',
    copy: '记录发射与回波的时间差，并把时间换算成距离，同时保留回波强度。',
    fact: '距离 = 光速 × 往返时间 ÷ 2',
  },
  {
    id: 'lidar_encoder',
    name: '方位编码器',
    copy: '给每一次测量标记扫描头的水平角度，让距离和方向可以配成一个点。',
    fact: '功能示意：方位角 + 时间戳',
  },
  {
    id: 'lidar_io',
    name: '供电与数据接口',
    copy: '底座为电子系统供电，并把距离、角度、反射率和时间戳送给上位机。',
    fact: '功能示意：供电 / 数据输出',
  },
];

for (const part of partCatalog) {
  part.copy = lidarLearningContent.parts.find((item) => item.sourcePartId === part.id)?.copy ?? part.copy;
}

export const partById = new Map(partCatalog.map((part) => [part.id, part]));

export const lessonSteps = [
  {
    title: '发出光',
    copy: '16 组通道按时序发出很短的激光脉冲；扫描头旋转，让光线覆盖水平 360°。',
    partId: 'lidar_optical_array',
  },
  {
    title: '碰到物体',
    copy: '光照到车辆、行人或路边物体后，一部分光会反射回来。材质和角度会影响回波强弱。',
    partId: 'VLP16_scan',
  },
  {
    title: '收回回波',
    copy: '接收器捕捉返回的光，测距电路计算光的往返时间，再换算出目标距离。',
    partId: 'lidar_tof_board',
  },
  {
    title: '画成点云',
    copy: '距离、仰角、方位角和时间戳合在一起，就得到一个点；许多点组成空间点云。',
    partId: 'lidar_encoder',
  },
];

for (const step of lessonSteps) {
  step.copy = lidarLearningContent.steps.find((item) => item.sourcePartId === step.partId)?.copy ?? step.copy;
}
