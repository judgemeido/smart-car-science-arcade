import type { ChoiceQuestion } from '../../shared/learning-assessment';

export interface ExploreLearningTask {
  readonly id: string;
  readonly title: string;
  readonly hint: string;
  readonly targetKey: string;
  readonly question: ChoiceQuestion;
}

export const exploreLearningTasks: readonly ExploreLearningTask[] = [
  {
    id: 'explore-energy-battery',
    title: '找到动力电池',
    hint: '找找车身下方储存电能的装配。',
    targetKey: 'explore-energy-battery',
    question: {
      id: 'explore-energy-battery-function',
      kind: 'single-choice',
      prompt: '动力电池主要做什么？',
      choices: [
        {
          id: 'explore-energy-battery-function:choice-1',
          label: '储存电能，给车辆供电',
        },
        {
          id: 'explore-energy-battery-function:choice-2',
          label: '直接观察红绿灯',
        },
        {
          id: 'explore-energy-battery-function:choice-3',
          label: '只让座椅更柔软',
        },
      ],
      correctChoiceId: 'explore-energy-battery-function:choice-1',
      correctFeedback: '电池储存电能，电机和其他用电设备需要用到这些电能。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-energy-motor',
    title: '找到驱动电机',
    hint: '看看前、后电驱桥里把电能变成转动的部分。',
    targetKey: 'explore-energy-motor',
    question: {
      id: 'explore-energy-motor-function',
      kind: 'single-choice',
      prompt: '驱动电机怎样帮助汽车运动？',
      choices: [
        {
          id: 'explore-energy-motor-function:choice-1',
          label: '用摄像头拍摄道路',
        },
        {
          id: 'explore-energy-motor-function:choice-2',
          label: '把电能转化成转动的动力',
        },
        {
          id: 'explore-energy-motor-function:choice-3',
          label: '储存乘客的行李',
        },
      ],
      correctChoiceId: 'explore-energy-motor-function:choice-2',
      correctFeedback: '电机把电能转成转动，再通过传动部件带动车轮。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-energy-wheel',
    title: '找到动力到达的车轮',
    hint: '观察四角与路面接触的车轮。',
    targetKey: 'explore-energy-wheel',
    question: {
      id: 'explore-energy-wheel-function',
      kind: 'single-choice',
      prompt: '车轮转动时，车辆怎样向前移动？',
      choices: [
        {
          id: 'explore-energy-wheel-function:choice-1',
          label: '车轮只负责装饰',
        },
        {
          id: 'explore-energy-wheel-function:choice-2',
          label: '车轮直接测出红灯颜色',
        },
        {
          id: 'explore-energy-wheel-function:choice-3',
          label: '驱动力通过轮胎与路面的接触使车向前',
        },
      ],
      correctChoiceId: 'explore-energy-wheel-function:choice-3',
      correctFeedback: '车轮和路面之间的接触很重要。路面湿滑时，车辆的运动和停车都会受到影响。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-energy-transmission',
    title: '找到传动结构',
    hint: '看看电驱桥里连接电机和车轮的减速、差速机构。',
    targetKey: 'explore-energy-transmission',
    question: {
      id: 'explore-energy-transmission-function',
      kind: 'single-choice',
      prompt: '传动结构主要帮助完成什么？',
      choices: [
        {
          id: 'explore-energy-transmission-function:choice-1',
          label: '把电机的转动力传给车轮，并调整转速',
        },
        {
          id: 'explore-energy-transmission-function:choice-2',
          label: '判断乘客的年龄',
        },
        {
          id: 'explore-energy-transmission-function:choice-3',
          label: '给车身改变颜色',
        },
      ],
      correctChoiceId: 'explore-energy-transmission-function:choice-1',
      correctFeedback: '传动结构让电机的转动和车轮的运动配合起来。模型展示的是电驱桥中的机构。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-structure-body',
    title: '找到车身骨架',
    hint: '寻找支撑、连接车上不同部分的结构。',
    targetKey: 'explore-structure-body',
    question: {
      id: 'explore-structure-body-function',
      kind: 'single-choice',
      prompt: '车身骨架的作用是什么？',
      choices: [
        {
          id: 'explore-structure-body-function:choice-1',
          label: '只储存电能',
        },
        {
          id: 'explore-structure-body-function:choice-2',
          label: '支撑和连接车辆的不同部分',
        },
        {
          id: 'explore-structure-body-function:choice-3',
          label: '只测量车外的距离',
        },
      ],
      correctChoiceId: 'explore-structure-body-function:choice-2',
      correctFeedback: '车身骨架帮助支撑车辆，也为座舱和其他装配提供连接位置。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-structure-chassis',
    title: '认识底盘系统',
    hint: '分别找一处悬架和一处制动系统，看看它们怎样帮助车辆行驶。',
    targetKey: 'explore-structure-chassis',
    question: {
      id: 'explore-structure-chassis-function',
      kind: 'single-choice',
      prompt: '这里说的底盘系统是什么？',
      choices: [
        {
          id: 'explore-structure-chassis-function:choice-1',
          label: '车顶的一块玻璃',
        },
        {
          id: 'explore-structure-chassis-function:choice-2',
          label: '一个独立的摄像头',
        },
        {
          id: 'explore-structure-chassis-function:choice-3',
          label: '与行驶、支撑、减速等有关的多个系统',
        },
      ],
      correctChoiceId: 'explore-structure-chassis-function:choice-3',
      correctFeedback: '底盘不是当前模型里一个单独叫“底盘”的零件。悬架、制动等系统各有分工。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-structure-suspension',
    title: '找到悬架',
    hint: '找找连接车轮和车身、帮助应对路面起伏的机构。',
    targetKey: 'explore-structure-suspension',
    question: {
      id: 'explore-structure-suspension-function',
      kind: 'single-choice',
      prompt: '汽车经过不平路面时，悬架帮助做什么？',
      choices: [
        {
          id: 'explore-structure-suspension-function:choice-1',
          label: '支撑车身，缓和路面起伏带来的影响',
        },
        {
          id: 'explore-structure-suspension-function:choice-2',
          label: '把所有颠簸都完全消除',
        },
        {
          id: 'explore-structure-suspension-function:choice-3',
          label: '替代所有道路观察设备',
        },
      ],
      correctChoiceId: 'explore-structure-suspension-function:choice-1',
      correctFeedback: '悬架帮助支撑车身和缓和颠簸，也让车轮更好地与路面配合。它不能消除所有起伏。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-structure-wheel',
    title: '认识轮胎与路面',
    hint: '再观察一只车轮，想想雨天为什么要更谨慎。',
    targetKey: 'explore-structure-wheel',
    question: {
      id: 'explore-structure-wheel-function',
      kind: 'single-choice',
      prompt: '轮胎与路面的接触为什么重要？',
      choices: [
        {
          id: 'explore-structure-wheel-function:choice-1',
          label: '轮胎只是让汽车好看',
        },
        {
          id: 'explore-structure-wheel-function:choice-2',
          label: '加速、转弯和减速都依赖它们的配合',
        },
        {
          id: 'explore-structure-wheel-function:choice-3',
          label: '轮胎能判断所有天气变化',
        },
      ],
      correctChoiceId: 'explore-structure-wheel-function:choice-2',
      correctFeedback: '车辆需要轮胎与路面之间的作用力来改变运动状态。湿滑路面会让安全操作更困难。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-sensor-front-camera',
    title: '找到前向摄像头',
    hint: '看看朝向车辆前方、接收道路图像的镜头。',
    targetKey: 'explore-sensor-front-camera',
    question: {
      id: 'explore-sensor-front-camera-function',
      kind: 'single-choice',
      prompt: '摄像头主要收集什么？',
      choices: [
        {
          id: 'explore-sensor-front-camera-function:choice-1',
          label: '只收集电池里的电量',
        },
        {
          id: 'explore-sensor-front-camera-function:choice-2',
          label: '只听附近的声音',
        },
        {
          id: 'explore-sensor-front-camera-function:choice-3',
          label: '道路上的图像信息',
        },
      ],
      correctChoiceId: 'explore-sensor-front-camera-function:choice-3',
      correctFeedback:
        '摄像头接收图像，计算系统再从图像中分析车辆、行人或标志。摄像头本身不等于完整的自动驾驶系统。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-sensor-surround-camera',
    title: '找到侧面或车尾的摄像头',
    hint: '它们可以与其他镜头配合，提供车辆周围的图像。',
    targetKey: 'explore-sensor-surround-camera',
    question: {
      id: 'explore-sensor-surround-camera-function',
      kind: 'single-choice',
      prompt: '多个方向的摄像头配合有什么帮助？',
      choices: [
        {
          id: 'explore-sensor-surround-camera-function:choice-1',
          label: '提供不同方向的图像，帮助观察车辆周围',
        },
        {
          id: 'explore-sensor-surround-camera-function:choice-2',
          label: '保证所有盲区和风险都不存在',
        },
        {
          id: 'explore-sensor-surround-camera-function:choice-3',
          label: '直接替代制动系统',
        },
      ],
      correctChoiceId: 'explore-sensor-surround-camera-function:choice-1',
      correctFeedback: '不同方向的图像帮助观察周围。模型中的位置是教学示意，不能据此认定真实车型的全部配置。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-sensor-lidar',
    title: '找到激光雷达',
    hint: '找找车顶用激光测量周围距离的装置。',
    targetKey: 'explore-sensor-lidar',
    question: {
      id: 'explore-sensor-lidar-function',
      kind: 'single-choice',
      prompt: '激光雷达怎样帮助认识周围空间？',
      choices: [
        {
          id: 'explore-sensor-lidar-function:choice-1',
          label: '只让车顶更加漂亮',
        },
        {
          id: 'explore-sensor-lidar-function:choice-2',
          label: '发出激光，利用回波测量距离',
        },
        {
          id: 'explore-sensor-lidar-function:choice-3',
          label: '只记录导航目的地',
        },
      ],
      correctChoiceId: 'explore-sensor-lidar-function:choice-2',
      correctFeedback: '激光雷达利用光的往返时间等信息测距；许多测量点可以组成空间点云。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
  {
    id: 'explore-sensor-millimeter',
    title: '认识毫米波雷达',
    hint: '查看单独标明“教学示意”的雷达卡片或热点。',
    targetKey: 'explore-sensor-millimeter',
    question: {
      id: 'explore-sensor-millimeter-function',
      kind: 'single-choice',
      prompt: '毫米波雷达主要利用什么探测目标？',
      choices: [
        {
          id: 'explore-sensor-millimeter-function:choice-1',
          label: '座椅的压力',
        },
        {
          id: 'explore-sensor-millimeter-function:choice-2',
          label: '轮胎的花纹',
        },
        {
          id: 'explore-sensor-millimeter-function:choice-3',
          label: '无线电波',
        },
      ],
      correctChoiceId: 'explore-sensor-millimeter-function:choice-3',
      correctFeedback:
        '毫米波雷达利用无线电波探测目标，可提供距离和相对运动等信息。它的表现也受环境、目标和系统条件影响。',
      retryFeedback: '回到教学卡片看看：毫米波雷达发出的是什么波？',
    },
  },
  {
    id: 'explore-sensor-ultrasonic',
    title: '找到超声波传感器',
    hint: '找找保险杠附近观察近处物体的小传感器。',
    targetKey: 'explore-sensor-ultrasonic',
    question: {
      id: 'explore-sensor-ultrasonic-function',
      kind: 'single-choice',
      prompt: '超声波传感器更适合帮助观察哪里？',
      choices: [
        {
          id: 'explore-sensor-ultrasonic-function:choice-1',
          label: '车辆附近较近的物体',
        },
        {
          id: 'explore-sensor-ultrasonic-function:choice-2',
          label: '遥远城市的道路',
        },
        {
          id: 'explore-sensor-ultrasonic-function:choice-3',
          label: '卫星在太空中的位置',
        },
      ],
      correctChoiceId: 'explore-sensor-ultrasonic-function:choice-1',
      correctFeedback: '超声波传感器常用于近距离探测，例如停车时辅助观察。测量范围和效果会受设备与环境影响。',
      retryFeedback: '先看看你选中的部件在什么位置，再想想它帮助汽车做什么。',
    },
  },
];

export const exploreLearningGroups = [
  {
    id: 'explore-energy',
    title: '第一组：动力从哪里来？',
    taskIds: [
      'explore-energy-battery',
      'explore-energy-motor',
      'explore-energy-wheel',
      'explore-energy-transmission',
    ],
  },
  {
    id: 'explore-structure',
    title: '第二组：结构怎样帮助行驶？',
    taskIds: [
      'explore-structure-body',
      'explore-structure-chassis',
      'explore-structure-suspension',
      'explore-structure-wheel',
    ],
  },
  {
    id: 'explore-sensors',
    title: '第三组：汽车怎样观察道路？',
    taskIds: [
      'explore-sensor-front-camera',
      'explore-sensor-surround-camera',
      'explore-sensor-lidar',
      'explore-sensor-millimeter',
      'explore-sensor-ultrasonic',
    ],
  },
] as const;

const extraReviewQuestions: readonly ChoiceQuestion[] = [
  {
    id: 'explore-adas-role',
    kind: 'single-choice',
    prompt: '感知设备收集到信息以后，还需要什么？',
    choices: [
      {
        id: 'explore-adas-role:choice-1',
        label: '只把车灯打开',
      },
      {
        id: 'explore-adas-role:choice-2',
        label: '计算系统分析，再配合合适的驾驶行动',
      },
      {
        id: 'explore-adas-role:choice-3',
        label: '车身换一种颜色',
      },
    ],
    correctChoiceId: 'explore-adas-role:choice-2',
    correctFeedback: '收集信息、分析风险和执行行动，是不同的步骤。',
    retryFeedback: '观察和行动不是同一件事，想想谁帮助分析道路信息。',
  },
  {
    id: 'explore-cabin-role',
    kind: 'single-choice',
    prompt: '座舱怎样帮助人与车交流？',
    choices: [
      {
        id: 'explore-cabin-role:choice-1',
        label: '让人通过方向盘、显示器等了解和操作车辆',
      },
      {
        id: 'explore-cabin-role:choice-2',
        label: '独自判断所有道路风险',
      },
      {
        id: 'explore-cabin-role:choice-3',
        label: '只给电池充电',
      },
    ],
    correctChoiceId: 'explore-cabin-role:choice-1',
    correctFeedback: '座舱是乘坐和操作的空间，显示器、方向盘等帮助人与车交流。',
    retryFeedback: '看看座舱里哪些东西是给人查看和操作的。',
  },
];
export const exploreReviewQuestions: readonly ChoiceQuestion[] = [
  exploreLearningTasks[0].question,
  ...extraReviewQuestions,
];
