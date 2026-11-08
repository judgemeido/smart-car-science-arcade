import type { ChoiceQuestion } from '../../shared/learning-assessment';

export interface TrafficReviewAnnotation {
  readonly id: string;
  readonly sourceScenarioId: string;
  readonly observationClue: string;
  readonly choiceFeedback: readonly { readonly sourceChoiceId: string; readonly copy: string }[];
  readonly knowledgeSummary: readonly string[];
  readonly reflection: {
    readonly prompt: string;
    readonly suggestedAnswer: string;
    readonly grading: string;
  };
}

export type TrafficSceneKind =
  | 'green-clear'
  | 'sudden-person'
  | 'obstacle'
  | 'heavy-rain'
  | 'sensor-uncertain';
export interface TrafficPracticeScenario {
  readonly id: string;
  readonly title: string;
  readonly sceneAssumptions: readonly string[];
  readonly observation: string;
  readonly question: ChoiceQuestion;
  readonly summary: readonly string[];
  readonly sceneKind: TrafficSceneKind;
}
export const trafficReviewAnnotations: readonly TrafficReviewAnnotation[] = [
  {
    id: 'traffic-review-red-light',
    sourceScenarioId: 'red-light',
    observationClue: '先看信号灯和停止线。',
    choiceFeedback: [
      {
        sourceChoiceId: 'red-light:0',
        copy: '红灯亮，车辆应在停止线前等待。',
      },
      {
        sourceChoiceId: 'red-light:1',
        copy: '认为“没车就能过”，会忽略信号规则并增加冲突风险。',
      },
      {
        sourceChoiceId: 'red-light:2',
        copy: '鸣笛不会让红灯变成允许通行。',
      },
    ],
    knowledgeSummary: ['信号灯帮助不同方向的车辆和行人有序通行。', '空路口也要遵守信号。'],
    reflection: {
      prompt: '为什么没有其他车时，也不能直接闯红灯？',
      suggestedAnswer: '规则不能只在看见别人时才遵守，路口也可能有尚未发现的人或车。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-pedestrians',
    sourceScenarioId: 'pedestrians',
    observationClue: '看看斑马线上有没有正在通过的人。',
    choiceFeedback: [
      {
        sourceChoiceId: 'pedestrians:0',
        copy: '停车礼让，给行人留下通过的时间和空间。',
      },
      {
        sourceChoiceId: 'pedestrians:1',
        copy: '从行人前方抢过，可能突然进入行人的行走路线。',
      },
      {
        sourceChoiceId: 'pedestrians:2',
        copy: '鸣笛不代替停车礼让，还可能让人慌乱。',
      },
    ],
    knowledgeSummary: ['提前观察人行横道。', '遇到正在通过的人，应停车让行。'],
    reflection: {
      prompt: '车辆已经慢下来，就一定可以贴着行人通过吗？',
      suggestedAnswer: '不一定。应留出安全空间，等待行人通过。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-yellow-light',
    sourceScenarioId: 'yellow-light',
    observationClue: '看看车有没有越过停止线，也看看能否安全停下。',
    choiceFeedback: [
      {
        sourceChoiceId: 'yellow-light:0',
        copy: '在题目给定的安全停车条件下，平稳减速停车。',
      },
      {
        sourceChoiceId: 'yellow-light:1',
        copy: '抢灯加速会压缩观察和处理风险的时间。',
      },
      {
        sourceChoiceId: 'yellow-light:2',
        copy: '不观察后车就突然急刹，也可能带来新的风险。',
      },
    ],
    knowledgeSummary: ['黄灯不是加速冲过的信号。', '题目中的安全停车条件很重要。'],
    reflection: {
      prompt: '为什么题目要写“如果能安全停下”？',
      suggestedAnswer: '行动既要符合信号要求，也要考虑车辆位置和周围的安全条件。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-school-zone',
    sourceScenarioId: 'school-zone',
    observationClue: '找到限速标志，并观察学校附近的人。',
    choiceFeedback: [
      {
        sourceChoiceId: 'school-zone:0',
        copy: '遵守最高速度限制，也要关注孩子和道路情况。',
      },
      {
        sourceChoiceId: 'school-zone:1',
        copy: '把最高限速当成随意建议，可能开得过快。',
      },
      {
        sourceChoiceId: 'school-zone:2',
        copy: '只看速度表，会漏掉路边和前方的变化。',
      },
    ],
    knowledgeSummary: ['最高限速不是必须达到的速度。', '经过学校附近，要多观察并按情况提前减速。'],
    reflection: {
      prompt: '开到30 km/h就能保证学校附近安全吗？',
      suggestedAnswer: '不能。30是题目中的最高限制，还要看天气、视线和孩子等情况。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-green-pedestrians',
    sourceScenarioId: 'green-pedestrians',
    observationClue: '既看绿灯，也看斑马线上的行人。',
    choiceFeedback: [
      {
        sourceChoiceId: 'green-pedestrians:0',
        copy: '即使绿灯，也应让正在通过人行横道的人先走。',
      },
      {
        sourceChoiceId: 'green-pedestrians:1',
        copy: '只看灯不看人，会漏掉仍在过街的风险。',
      },
      {
        sourceChoiceId: 'green-pedestrians:2',
        copy: '贴近行人挤过去，没有给他们留下足够的空间。',
      },
    ],
    knowledgeSummary: ['信号允许通行，还要确认实际道路安全。', '道路观察要看多个线索。'],
    reflection: {
      prompt: '绿灯亮了，为什么还不能只盯着灯往前走？',
      suggestedAnswer: '因为道路上可能还有行人和其他风险，绿灯不能替代观察。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-queue',
    sourceScenarioId: 'queue',
    observationClue: '看清自己的车道、前方队伍和对向来车。',
    choiceFeedback: [
      {
        sourceChoiceId: 'queue:0',
        copy: '依次等候，保持安全间距。',
      },
      {
        sourceChoiceId: 'queue:1',
        copy: '借对向车道插队，可能进入来车路线。',
      },
      {
        sourceChoiceId: 'queue:2',
        copy: '人行道是给行人使用的，不能开车绕队。',
      },
    ],
    knowledgeSummary: ['排队等候也是安全决策。', '为了快一点而侵入其他通行空间，会制造风险。'],
    reflection: {
      prompt: '等候时，为什么要给前车留出距离？',
      suggestedAnswer: '留出距离可以增加观察和反应的空间，避免贴得过近。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-construction',
    sourceScenarioId: 'construction',
    observationClue: '找出施工标志、锥桶和仍开放的车道。',
    choiceFeedback: [
      {
        sourceChoiceId: 'construction:0',
        copy: '提前减速，按标志和现场指引通过。',
      },
      {
        sourceChoiceId: 'construction:1',
        copy: '进入锥桶围起的区域，可能遇到工人和施工设备。',
      },
      {
        sourceChoiceId: 'construction:2',
        copy: '紧贴前车，会减少观察施工变化的空间。',
      },
    ],
    knowledgeSummary: ['锥桶和警示标志提供道路变化信息。', '看到施工要早观察、早减速。'],
    reflection: {
      prompt: '为什么要在进入施工区域前就减速？',
      suggestedAnswer: '提前减速能留出观察标志和调整行动的时间。',
      grading: '讨论题，不自动判理由对错',
    },
  },
  {
    id: 'traffic-review-ambulance',
    sourceScenarioId: 'ambulance',
    observationClue: '识别警灯和警报，也观察周围交通。',
    choiceFeedback: [
      {
        sourceChoiceId: 'ambulance:0',
        copy: '在确保安全的条件下，及时给执行任务的救护车让出空间。',
      },
      {
        sourceChoiceId: 'ambulance:1',
        copy: '跟着救护车抢行，会制造新的冲突，也影响其通行。',
      },
      {
        sourceChoiceId: 'ambulance:2',
        copy: '突然变道而不观察，可能撞上旁边车辆或影响其他人。',
      },
    ],
    knowledgeSummary: ['给执行紧急任务的车辆让行。', '让行前也要确认周围安全。'],
    reflection: {
      prompt: '为什么礼让救护车也要先观察？',
      suggestedAnswer: '礼让是为了降低风险，突然不安全的变道会给道路增加风险。',
      grading: '讨论题，不自动判理由对错',
    },
  },
];
export const trafficPracticeScenarios: readonly TrafficPracticeScenario[] = [
  {
    id: 'traffic-practice-green-clear',
    title: '绿灯亮了，先确认什么？',
    sceneAssumptions: ['直行信号为绿灯。', '人行横道和前方通行空间已确认没有冲突。'],
    observation: '看灯、看人、看前方空间。',
    question: {
      id: 'traffic-green-clear-question',
      kind: 'single-choice',
      prompt: '测试车应选择哪一种做法？',
      choices: [
        {
          id: 'traffic-green-clear-question:choice-1',
          label: '确认信号和道路安全后谨慎通过',
        },
        {
          id: 'traffic-green-clear-question:choice-2',
          label: '绿灯亮就加速，不再观察',
        },
        {
          id: 'traffic-green-clear-question:choice-3',
          label: '闭上感知设备，凭上一次的记忆开',
        },
      ],
      correctChoiceId: 'traffic-green-clear-question:choice-1',
      correctFeedback: '确认信号和道路都允许通行后，再谨慎通过；行动过程中仍要观察变化。',
      retryFeedback: '“信号允许”需要和“实际安全”一起判断。',
    },
    summary: ['绿灯是判断条件之一。', '谨慎通过时也要继续观察。'],
    sceneKind: 'green-clear',
  },
  {
    id: 'traffic-practice-sudden-person',
    title: '行人突然进入前方道路',
    sceneAssumptions: [
      '行人进入车辆前方的行驶路径。',
      '测试车具备在给定距离内停车的条件，未指定安全绕行空间。',
    ],
    observation: '注意前方变化，留出反应和停车空间。',
    question: {
      id: 'traffic-sudden-person-question',
      kind: 'single-choice',
      prompt: '哪一种建议更合适？',
      choices: [
        {
          id: 'traffic-sudden-person-question:choice-1',
          label: '鸣笛后保持速度',
        },
        {
          id: 'traffic-sudden-person-question:choice-2',
          label: '及时减速，并在安全条件下停车',
        },
        {
          id: 'traffic-sudden-person-question:choice-3',
          label: '不观察旁边车道就猛打方向',
        },
      ],
      correctChoiceId: 'traffic-sudden-person-question:choice-2',
      correctFeedback: '及时减速和停车能降低冲突风险。突然转向也可能给其他人带来风险。',
      retryFeedback: '先降低与行人的冲突风险，不能用鸣笛代替避险。',
    },
    summary: ['行人突然出现时，要及时降低风险。', '观察和安全空间很重要。'],
    sceneKind: 'sudden-person',
  },
  {
    id: 'traffic-practice-obstacle',
    title: '前方车道被障碍物占住',
    sceneAssumptions: ['障碍物位于本车道前方。', '旁边车道是否安全尚不确定。'],
    observation: '判断障碍的位置，也看看周围是否有安全空间。',
    question: {
      id: 'traffic-obstacle-question',
      kind: 'single-choice',
      prompt: '测试车现在应怎样处理？',
      choices: [
        {
          id: 'traffic-obstacle-question:choice-1',
          label: '加速跨过障碍',
        },
        {
          id: 'traffic-obstacle-question:choice-2',
          label: '直接开进旁边车道，不再确认',
        },
        {
          id: 'traffic-obstacle-question:choice-3',
          label: '提前减速，在障碍物前安全停车，再判断后续行动',
        },
      ],
      correctChoiceId: 'traffic-obstacle-question:choice-3',
      correctFeedback: '先在安全条件下降低风险。要绕行，也必须先确认周围是否允许和安全。',
      retryFeedback: '看见障碍物，不代表旁边车道就一定能走。',
    },
    summary: ['没有确认的空间不能当作安全路线。', '先降低速度和风险，再判断后续行动。'],
    sceneKind: 'obstacle',
  },
  {
    id: 'traffic-practice-heavy-rain',
    title: '雨变大了，前方看不清',
    sceneAssumptions: ['雨使能见度下降，路面湿滑。', '不提供某车型真实制动距离或传感器识别率。'],
    observation: '观察视线、路面和与前车的距离。',
    question: {
      id: 'traffic-heavy-rain-question',
      kind: 'single-choice',
      prompt: '哪一项建议更稳妥？',
      choices: [
        {
          id: 'traffic-heavy-rain-question:choice-1',
          label: '提前降低速度，增加安全距离；仍无法安全行驶时找安全地点停靠',
        },
        {
          id: 'traffic-heavy-rain-question:choice-2',
          label: '有传感器就按原速度继续',
        },
        {
          id: 'traffic-heavy-rain-question:choice-3',
          label: '紧贴前车，靠它带路',
        },
      ],
      correctChoiceId: 'traffic-heavy-rain-question:choice-1',
      correctFeedback: '降低速度和增加间距能留出更多观察、处理的空间。无法可靠判断时，不能盲目继续。',
      retryFeedback: '设备不能让湿滑路面和有限视线消失。',
    },
    summary: ['天气会改变观察和停车条件。', '不能只靠一项设备判断一切安全。'],
    sceneKind: 'heavy-rain',
  },
  {
    id: 'traffic-practice-sensor-uncertain',
    title: '感知系统提示信息不可靠',
    sceneAssumptions: ['测试车检测到前方感知信息不可靠。', '没有足够证据证明前方通行安全。'],
    observation: '注意系统提示：没有可靠信息，不等于没有目标。',
    question: {
      id: 'traffic-sensor-uncertain-question',
      kind: 'single-choice',
      prompt: '测试车应怎样应对？',
      choices: [
        {
          id: 'traffic-sensor-uncertain-question:choice-1',
          label: '没有识别到目标，就当成空路继续',
        },
        {
          id: 'traffic-sensor-uncertain-question:choice-2',
          label: '降低风险，在安全条件下停车并提示需要帮助',
        },
        {
          id: 'traffic-sensor-uncertain-question:choice-3',
          label: '关闭提示，把它当作没有发生',
        },
      ],
      correctChoiceId: 'traffic-sensor-uncertain-question:choice-2',
      correctFeedback: '系统应承认信息不确定，降低风险，必要时安全停车并提示。不能把未检测到当成一定不存在。',
      retryFeedback: '先区分“没有可靠信息”和“已确认安全”。',
    },
    summary: ['不确定时选择降低风险的策略。', '感知、计算和行动共同负责安全。'],
    sceneKind: 'sensor-uncertain',
  },
];
