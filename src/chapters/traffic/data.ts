export interface ScenarioOption {
  choiceId: string;
  label: string;
  correct: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  copy: string;
  tag: string;
  stopZ: number;
  options: ScenarioOption[];
  feedback: string;
}
type ScenarioSource = Omit<Scenario, 'options'> & {
  options: Omit<ScenarioOption, 'choiceId'>[];
};

export const scenarios: Scenario[] = (
  [
    {
      id: 'red-light',
      tag: '简单 · 看信号灯',
      title: '前方红灯亮了，应该怎么做？',
      copy: '汽车来到路口停止线前。红灯亮时，车辆要在停止线前停下。',
      stopZ: -10.4,
      options: [
        { label: '停在停止线前，等绿灯', correct: true },
        { label: '路上没车，直接开过去', correct: false },
        { label: '按喇叭提醒别人后通过', correct: false },
      ],
      feedback: '红灯表示停止。车辆应停在停止线前，等信号允许后再走。',
    },
    {
      id: 'pedestrians',
      tag: '简单 · 礼让行人',
      title: '斑马线上有人正在过街',
      copy: '前方行人正在通过斑马线。开车经过人行横道，要注意观察并礼让行人。',
      stopZ: -26.5,
      options: [
        { label: '减速停车，让行人先通过', correct: true },
        { label: '从行人前面快速开过去', correct: false },
        { label: '鸣笛让行人停下', correct: false },
      ],
      feedback: '遇行人正在通过人行横道，应停车让行。慢一点，大家都安全。',
    },
    {
      id: 'yellow-light',
      tag: '思考一下 · 黄灯',
      title: '黄灯亮了，车还没有越过停止线',
      copy: '前方路口亮起黄灯，车辆还没到停止线。如果能安全停下，应该怎样做？',
      stopZ: -49.4,
      options: [
        { label: '平稳减速，在停止线前安全停车', correct: true },
        { label: '加速抢在红灯前冲过去', correct: false },
        { label: '突然急刹，后车不用管', correct: false },
      ],
      feedback: '黄灯亮时，未越过停止线的车辆应在安全条件下停车；已经越过停止线的车辆可以继续通行。',
    },
    {
      id: 'school-zone',
      tag: '想一想 · 学校路段',
      title: '学校附近有“限速 30”标志',
      copy: '路边出现限速标志，附近还有孩子。开车要看清标志，留意周围。',
      stopZ: -68.4,
      options: [
        { label: '不超过 30 km/h，同时留意孩子', correct: true },
        { label: '限速 30 只是建议，可以开到 40', correct: false },
        { label: '只看速度表，路边不用观察', correct: false },
      ],
      feedback: '限速标志告诉驾驶员这段路允许的最高速度。经过学校周边还要多观察、提前减速。',
    },
    {
      id: 'green-pedestrians',
      tag: '思考一下 · 绿灯与行人',
      title: '虽然是绿灯，行人还没走完斑马线',
      copy: '信号灯允许车辆通行，但斑马线上还有人。遇到正在通过的行人，仍要礼让。',
      stopZ: -92.5,
      options: [
        { label: '先停车礼让，等行人通过', correct: true },
        { label: '绿灯就一直开，不用管行人', correct: false },
        { label: '贴近行人慢慢挤过去', correct: false },
      ],
      feedback: '绿灯不是“只看灯”。车辆经过人行横道时，还要注意行人并依法礼让。',
    },
    {
      id: 'queue',
      tag: '思考一下 · 排队通行',
      title: '前方车辆排起了队，可以借道绕行吗？',
      copy: '本车道前方车辆正在排队，对向车道还有来车。想一想怎样做更安全。',
      stopZ: -113,
      options: [
        { label: '依次等候，不占对向车道', correct: true },
        { label: '从对面车道绕过去再插队', correct: false },
        { label: '从人行道开过去', correct: false },
      ],
      feedback: '遇到排队或缓行，要依次等候，不能借对向车道超车或穿插。',
    },
    {
      id: 'construction',
      tag: '简单 · 道路施工',
      title: '前方有施工锥桶，应该怎么通过？',
      copy: '路边的施工提示牌和锥桶表示前方正在施工。请留在开放车道内安全通行。',
      stopZ: -138,
      options: [
        { label: '提前减速，按标志从开放车道通过', correct: true },
        { label: '开进锥桶围起来的区域', correct: false },
        { label: '贴着前车快速通过', correct: false },
      ],
      feedback: '施工区域要看清警示标志，减速并按现场指引通行。',
    },
    {
      id: 'ambulance',
      tag: '思考一下 · 执行任务的救护车',
      title: '听到警报声、看到闪灯的救护车，怎么办？',
      copy: '前方对向车道有正在执行任务的救护车。先观察周围，再安全地礼让。',
      stopZ: -163,
      options: [
        { label: '保持安全，及时让出通行空间', correct: true },
        { label: '跟在救护车后面抢行', correct: false },
        { label: '突然变道，不用观察', correct: false },
      ],
      feedback: '执行紧急任务并使用警灯、警报器的救护车需要让行；变道或靠边时都要先确保安全。',
    },
  ] satisfies ScenarioSource[]
).map((scenario) => ({
  ...scenario,
  options: scenario.options.map((option, index) => ({
    ...option,
    choiceId: `${scenario.id}:${index}`,
  })),
}));

export function orderOptions(scenario: Scenario, index: number) {
  const options = [...scenario.options];
  const correctIndex = options.findIndex((option) => option.correct);
  if (correctIndex < 0) return options;
  const [correct] = options.splice(correctIndex, 1);
  const slots = [0, 2, 1, 2, 0, 1, 2, 1];
  options.splice(Math.min(slots[index % slots.length], options.length), 0, correct);
  if (index % 2 === 1) {
    const wrong = options.filter((option) => !option.correct).reverse();
    let next = 0;
    return options.map((option) => (option.correct ? option : wrong[next++]));
  }
  return options;
}
