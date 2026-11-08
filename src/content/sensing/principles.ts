import type { ChoiceQuestion } from '../../shared/learning-assessment';


export interface DistanceRange {
  readonly id: string;
  readonly label: string;
  readonly minMeters: number;
  readonly maxMeters: number;
  readonly maxInclusive: boolean;
}
export interface PreparedDistanceRound {
  readonly id: string;
  readonly targets: readonly {
    readonly id: string;
    readonly label: string;
    readonly distanceMeters: number;
  }[];
  readonly correctNearestTargetId: string;
  readonly correctRangeId: string;
}
export interface SensorCard {
  readonly id: string;
  readonly name: string;
  readonly helps: string;
  readonly limits: string;
  readonly analogy: string;
}
export interface LidarLearningContent {
  readonly intro: string;
  readonly bridge: string;
  readonly completion: string;
  readonly steps: readonly {
    readonly index: number;
    readonly sourcePartId: string;
    readonly title: string;
    readonly copy: string;
  }[];
  readonly parts: readonly { readonly sourcePartId: string; readonly copy: string }[];
  readonly guide: {
    readonly title: string;
    readonly instructions: readonly string[];
    readonly observationPrompt: string;
    readonly suggestedAnswer: string;
    readonly vocabulary: readonly { readonly term: string; readonly explanation: string }[];
  };
  readonly distance: {
    readonly title: string;
    readonly prompt: string;
    readonly ranges: readonly DistanceRange[];
    readonly rounds: readonly PreparedDistanceRound[];
    readonly correctFeedback: string;
    readonly retryFeedback: string;
  };
  readonly weather: {
    readonly title: string;
    readonly environments: readonly { readonly id: string; readonly label: string; readonly copy: string }[];
    readonly questions: readonly ChoiceQuestion[];
  };
  readonly sensorCards: readonly SensorCard[];
}

// Runtime source of truth. The authored preparation document is reference-only.
export const lidarLearningContent: LidarLearningContent = {
  intro: '你是感知实验员。先看光怎样往返，再改变距离、观察点云，最后想想设备不确定时该怎么办。',
  bridge: '发现目标只是第一步。下一站，你要根据道路情况，为测试车选择合适的行动。',
  completion: '我知道：观察、分析和行动需要配合；看不清时，不能假装已经看清。',
  steps: [
    {
      index: 0,
      sourcePartId: 'lidar_optical_array',
      title: '发出光',
      copy: '激光雷达发出很短的光脉冲，扫描头转动，让不同方向都得到测量。',
    },
    {
      index: 1,
      sourcePartId: 'VLP16_scan',
      title: '碰到物体',
      copy: '光碰到物体后，一部分会反射回来。不同物体、角度和环境会让回波不一样。',
    },
    {
      index: 2,
      sourcePartId: 'lidar_tof_board',
      title: '收回回波',
      copy: '设备记录光出去再回来的时间。光走了一个来回，计算距离时要把往返路程除以二。',
    },
    {
      index: 3,
      sourcePartId: 'lidar_encoder',
      title: '画成点云',
      copy: '把每次测得的距离和方向标成一个点。许多点放在一起，能帮助我们认识周围空间。',
    },
  ],
  parts: [
    {
      sourcePartId: 'VLP16_scan',
      copy: '扫描器沿不同方向测量周围空间。这个模型展示它的外形，不是内部所有部件的真实拆机图。',
    },
    {
      sourcePartId: 'VLP16_base_2',
      copy: '上盖是外壳的一部分。它与扫描器、底座一起组成这个雷达的外部结构。',
    },
    {
      sourcePartId: 'VLP16_base_1',
      copy: '底座用来安装和支撑传感器，让它稳稳地固定在位置上。',
    },
    {
      sourcePartId: 'lidar_optical_array',
      copy: '模型里的16组发射和接收通道帮助我们理解：光怎样发出去，回波怎样收回来。内部排列是原理示意。',
    },
    {
      sourcePartId: 'lidar_motor',
      copy: '电机带动扫描头转动，轴承帮助转动平稳，让雷达可以观察不同方向。',
    },
    {
      sourcePartId: 'lidar_tof_board',
      copy: '测距电路像计时员，记录光的往返时间，再把时间换算为距离。',
    },
    {
      sourcePartId: 'lidar_encoder',
      copy: '编码器像方向记录员，帮助标记扫描头转到了哪个角度。',
    },
    {
      sourcePartId: 'lidar_io',
      copy: '接口一边提供电力，一边把测量信息送给计算系统。',
    },
  ],
  guide: {
    title: '实验一：看光怎样画出空间',
    instructions: [
      '在现有雷达展品上选择发射、反射、接收、成点云四步。',
      '把目标距离从20米调到60米，观察往返时间的变化。',
      '试着暂停扫描、旋转观察，再重新开始。',
      '说一句你发现的变化。',
    ],
    observationPrompt: '目标更远时，光的往返时间会怎样变化？',
    suggestedAnswer: '目标更远时，光走的往返路程更长，往返时间也更长。',
    vocabulary: [
      {
        term: '回波',
        explanation: '光碰到物体后返回设备的信号。',
      },
      {
        term: '点云',
        explanation: '许多带有位置的信息点组成的集合。',
      },
      {
        term: 'ns',
        explanation: '纳秒，是很短的时间单位；一纳秒是一秒的十亿分之一。这里只需比较远近带来的变化。',
      },
    ],
  },
  distance: {
    title: '实验二：谁离得最近？',
    prompt: '先观察三个目标，选出最近的一个，再选它所在的距离区间。提交以后才显示测量值。',
    ranges: [
      {
        id: 'range-under-10',
        label: '0米到不到10米',
        minMeters: 0,
        maxMeters: 10,
        maxInclusive: false,
      },
      {
        id: 'range-10-to-20',
        label: '10米到不到20米',
        minMeters: 10,
        maxMeters: 20,
        maxInclusive: false,
      },
      {
        id: 'range-20-to-40',
        label: '20米到40米',
        minMeters: 20,
        maxMeters: 40,
        maxInclusive: true,
      },
    ],
    rounds: [
      {
        id: 'lidar-distance-round-1',
        targets: [
          {
            id: 'lidar-distance-round-1-target-a',
            label: '障碍物A',
            distanceMeters: 5,
          },
          {
            id: 'lidar-distance-round-1-target-b',
            label: '障碍物B',
            distanceMeters: 12,
          },
          {
            id: 'lidar-distance-round-1-target-c',
            label: '障碍物C',
            distanceMeters: 20,
          },
        ],
        correctNearestTargetId: 'lidar-distance-round-1-target-a',
        correctRangeId: 'range-under-10',
      },
      {
        id: 'lidar-distance-round-2',
        targets: [
          {
            id: 'lidar-distance-round-2-target-a',
            label: '障碍物A',
            distanceMeters: 18,
          },
          {
            id: 'lidar-distance-round-2-target-b',
            label: '障碍物B',
            distanceMeters: 7,
          },
          {
            id: 'lidar-distance-round-2-target-c',
            label: '障碍物C',
            distanceMeters: 25,
          },
        ],
        correctNearestTargetId: 'lidar-distance-round-2-target-b',
        correctRangeId: 'range-under-10',
      },
      {
        id: 'lidar-distance-round-3',
        targets: [
          {
            id: 'lidar-distance-round-3-target-a',
            label: '障碍物A',
            distanceMeters: 22,
          },
          {
            id: 'lidar-distance-round-3-target-b',
            label: '障碍物B',
            distanceMeters: 30,
          },
          {
            id: 'lidar-distance-round-3-target-c',
            label: '障碍物C',
            distanceMeters: 12,
          },
        ],
        correctNearestTargetId: 'lidar-distance-round-3-target-c',
        correctRangeId: 'range-10-to-20',
      },
    ],
    correctFeedback: '你把最近目标和距离区间都找对了。比较数字可以帮你验证观察。',
    retryFeedback: '最近目标的距离应该最小。再看看距离区间的边界：10米归第二档，20米归第三档。',
  },
  weather: {
    title: '实验三：看不清时怎么办？',
    environments: [
      {
        id: 'weather-normal',
        label: '正常环境',
        copy: '观察比较清楚的示意点云，记录哪些轮廓容易看出来。',
      },
      {
        id: 'weather-rain',
        label: '下雨环境',
        copy: '雨滴可能产生额外回波，也可能让一些目标的回波变弱。不要把零散的点直接当成真实目标。',
      },
      {
        id: 'weather-fog',
        label: '有雾环境',
        copy: '雾中的小水滴会影响光的传播，可能让目标更难观察。效果与雾的浓度、设备和目标等条件有关。',
      },
    ],
    questions: [
      {
        id: 'lidar-weather-effect',
        kind: 'single-choice',
        prompt: '为什么天气变化可能影响激光雷达？',
        choices: [
          {
            id: 'lidar-weather-effect:choice-1',
            label: '雨滴和雾滴会影响光的传播与回波',
          },
          {
            id: 'lidar-weather-effect:choice-2',
            label: '雷达在任何天气下都完全一样',
          },
          {
            id: 'lidar-weather-effect:choice-3',
            label: '雨天所有传感器一定同时失效',
          },
        ],
        correctChoiceId: 'lidar-weather-effect:choice-1',
        correctFeedback: '天气会改变测量条件，但不同设备、环境和目标的表现也不同。',
        retryFeedback: '想想光在雨、雾中会碰到什么：这些小水滴可能改变传播和回波。',
      },
      {
        id: 'lidar-uncertain-action',
        kind: 'single-choice',
        prompt: '测试车不能可靠判断前方情况，应怎样处理？',
        choices: [
          {
            id: 'lidar-uncertain-action:choice-1',
            label: '因为没看见危险，所以加速',
          },
          {
            id: 'lidar-uncertain-action:choice-2',
            label: '降低风险；仍看不清时在安全条件下停车并提示',
          },
          {
            id: 'lidar-uncertain-action:choice-3',
            label: '只把屏幕调亮，就继续高速前进',
          },
        ],
        correctChoiceId: 'lidar-uncertain-action:choice-2',
        correctFeedback: '不确定不是已经安全。车辆应降低风险，必要时在安全条件下停下，并提示需要帮助。',
        retryFeedback: '看不清不能当成前方没有危险。',
      },
      {
        id: 'lidar-sensor-team',
        kind: 'single-choice',
        prompt: '为什么汽车常让多种传感器一起工作？',
        choices: [
          {
            id: 'lidar-sensor-team:choice-1',
            label: '装得越多，就不用检查任何设备',
          },
          {
            id: 'lidar-sensor-team:choice-2',
            label: '只要有激光雷达，所有设备都可以去掉',
          },
          {
            id: 'lidar-sensor-team:choice-3',
            label: '它们各有擅长和局限，可以互相补充信息',
          },
        ],
        correctChoiceId: 'lidar-sensor-team:choice-3',
        correctFeedback: '多种信息可以互相补充，计算系统也要判断信息是否可靠。数量多不等于一定安全。',
        retryFeedback: '想一想：看图像、测距离、近处探测，是不是完全相同的工作？',
      },
    ],
  },
  sensorCards: [
    {
      id: 'sensor-front-camera',
      name: '前向摄像头',
      helps: '收集车辆前方的图像，供系统分析道路、车辆和标志等。',
      limits: '光照、遮挡和天气等会影响图像；图像还需要计算系统分析。',
      analogy: '接收图像的观察员',
    },
    {
      id: 'sensor-surround-camera',
      name: '环视摄像头组',
      helps: '不同方向的摄像头配合，提供车辆周围的图像。',
      limits: '镜头覆盖、遮挡和图像质量仍有限，不能保证所有盲区都消失。',
      analogy: '从不同方向看周围',
    },
    {
      id: 'sensor-lidar',
      name: '激光雷达',
      helps: '利用激光回波测量距离和方向，形成空间点。',
      limits: '天气、目标材质、角度和遮挡等会影响测量。',
      analogy: '用光来测距离',
    },
    {
      id: 'sensor-millimeter-radar',
      name: '毫米波雷达',
      helps: '利用无线电波探测目标，可提供距离和相对运动等信息。',
      limits: '环境干扰、目标特点和设备条件也会影响效果，不会在任何天气下都完美工作。',
      analogy: '用无线电波来探测',
    },
    {
      id: 'sensor-ultrasonic',
      name: '超声波传感器',
      helps: '利用声音的回波辅助探测近处物体，例如停车时观察附近。',
      limits: '范围和效果有限，也受目标形状、材质和环境影响。',
      analogy: '关注近处的观察员',
    },
    {
      id: 'sensor-gnss',
      name: 'GNSS卫星定位',
      helps: '接收卫星信号，帮助确定车辆的位置。',
      limits: '建筑物遮挡等会影响定位；卫星定位不能识别行人或路障。',
      analogy: '告诉系统大概在哪里',
    },
  ],
};


