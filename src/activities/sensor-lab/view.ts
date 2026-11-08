import { createScope } from '../../shared/lifecycle';
import type { SensorAction, SensorSnapshot } from './types';
import { projectSensorScene } from './projection';

export function mountSensorView(stage: HTMLElement, tools: HTMLElement, onAction: (action: SensorAction) => void) {
  const scope = createScope(); let current: SensorSnapshot | null = null; let previousShot = -1;
  let active = true; let animations: Animation[] = [];
  stage.innerHTML = `<div class="sensor-lab"><div class="sensor-scene"><div class="sensor-scene__caption"><span>回波测试场</span><span>光程动画已放慢</span></div>
    <svg data-sensor-svg role="img" aria-label="发射器、教学反光点与接收器的光路示意" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="sensor-metal" x2="0" y2="1"><stop stop-color="#faffff"/><stop offset="1" stop-color="#c0d9ea"/></linearGradient><linearGradient id="sensor-blue" x2="0" y2="1"><stop stop-color="#4278ed"/><stop offset="1" stop-color="#2352cf"/></linearGradient><pattern id="sensor-table-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#dcecf6" stroke-width="1"/></pattern><marker id="sensor-out-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#b85019" stroke-width="1.6"/></marker><marker id="sensor-back-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#007f78" stroke-width="1.6"/></marker></defs>
      <rect width="100%" height="100%" rx="20" fill="url(#sensor-table-grid)"/>
      <path data-road fill="none" stroke="#e3edf4" stroke-width="62" stroke-linecap="round"/>
      <path data-measuring-line fill="none" stroke="#92b2c7" stroke-width="2"/>
      <g data-meter-ticks fill="#49657b" font-size="16"/>
      <path data-direction-arc fill="none" stroke="#8bacc2" stroke-width="2" stroke-dasharray="5 6"/>
      <path data-aim-guide fill="none" stroke="#2352cf" stroke-width="2" stroke-dasharray="6 7" opacity=".4"/>
      <path data-ray-out class="sensor-ray sensor-ray--out" fill="none" stroke="#b85019" stroke-width="5" marker-end="url(#sensor-out-arrow)" hidden/>
      <path data-ray-back class="sensor-ray sensor-ray--back" fill="none" stroke="#007f78" stroke-width="4" marker-end="url(#sensor-back-arrow)" hidden/>
      <path data-cable fill="none" stroke="#173653" stroke-width="8" stroke-linecap="round"/>
      <path data-cable-signal fill="none" stroke="#007f78" stroke-width="4" stroke-linecap="round" hidden/>
      <g data-cable-plug><rect x="-8" y="-11" width="17" height="24" rx="4" fill="#2352cf" stroke="#173653" stroke-width="2"/><path d="M-4-12V-18M4-12V-18" stroke="#7f9bad" stroke-width="4"/><path d="M-2-5V6" stroke="#8eb5ff" stroke-width="3"/></g>
      <g data-emitter><ellipse cx="0" cy="43" rx="78" ry="15" fill="#b7d2e4" opacity=".45"/><path d="M-68 9H55L66 36H-74Z" fill="url(#sensor-blue)" stroke="#173653" stroke-width="3"/><path d="M-63 12V29M-43 12V29M-23 12V29" stroke="#80acf7" stroke-width="3"/><circle cx="-55" cy="32" r="3" fill="#173653"/><circle cx="47" cy="32" r="3" fill="#173653"/><rect x="-39" y="-58" width="66" height="63" rx="12" fill="url(#sensor-metal)" stroke="#173653" stroke-width="3"/><path d="M-38-25H26" stroke="#8baec3" stroke-width="2"/><rect x="-47" y="-6" width="81" height="19" rx="8" fill="#bfd8e8" stroke="#173653" stroke-width="3"/><g data-turret><path d="M-26-36H5L20-18V-3H-26Z" fill="#2352cf" stroke="#173653" stroke-width="3"/><rect x="6" y="-26" width="34" height="24" rx="5" fill="#d9edff" stroke="#173653" stroke-width="3"/><ellipse cx="40" cy="-14" rx="7" ry="12" fill="#173653"/><ellipse cx="42" cy="-14" rx="3" ry="7" fill="#83e6e0"/><path d="M-19-29H-4" stroke="#89b6ff" stroke-width="3"/></g><rect x="-23" y="18" width="17" height="13" rx="3" fill="#ffd36a" stroke="#173653" stroke-width="2"/><circle cx="20" cy="24" r="8" fill="#e5ffff" stroke="#173653" stroke-width="2"/></g>
      <g data-target><ellipse cx="0" cy="51" rx="47" ry="11" fill="#b7d2e4" opacity=".5"/><path d="M-36 40H36L45 55H-45Z" fill="#d6e3ed" stroke="#173653" stroke-width="3"/><rect x="-7" y="-12" width="14" height="52" rx="3" fill="#8eacc0" stroke="#173653" stroke-width="3"/><rect x="-33" y="-55" width="66" height="64" rx="8" fill="#ffd36a" stroke="#173653" stroke-width="3"/><path d="M-27-46L-7-26M-6-46L14-26M15-46L29-32" stroke="#d37c25" stroke-width="7"/><rect x="-24" y="-20" width="48" height="22" rx="5" fill="#fff" stroke="#173653" stroke-width="2"/><circle cx="0" cy="0" r="8" fill="#fff" stroke="#007f78" stroke-width="3"/><path d="M-12 0H12M0-12V12" stroke="#007f78" stroke-width="2"/></g>
      <g data-receiver><ellipse cx="0" cy="32" rx="49" ry="10" fill="#b7d2e4" opacity=".5"/><rect x="-44" y="-34" width="88" height="65" rx="12" fill="url(#sensor-metal)" stroke="#173653" stroke-width="3"/><rect x="-28" y="-22" width="55" height="30" rx="5" fill="#173653"/><path data-receiver-wave d="M-21-8H-12L-8-17L-2 0L3-11L8-8H20" fill="none" stroke="#ffd36a" stroke-width="3"/><circle cx="-22" cy="20" r="4" fill="#007f78"/><path d="M-8 20H24" stroke="#8daebe" stroke-width="3"/><rect x="-52" y="-5" width="12" height="19" rx="3" fill="#2352cf" stroke="#173653" stroke-width="2"/></g>
    </svg><span class="sensor-scene__target" data-target-label>教学反光点</span><span class="sensor-scene__loose" data-loose-label>未接线</span><span class="sensor-scene__emitter">旋转发射器</span><span class="sensor-scene__receiver">回波接收器</span><div class="sensor-socket-labels"><span data-scene-tx>Tx 发射</span><span data-scene-rx>Rx 接收</span></div></div>
    <aside class="sensor-evidence" aria-label="本次光程证据"><h3>光程证据</h3><dl><div><dt>单程距离</dt><dd data-distance>— m</dd></div><div><dt>往返路程</dt><dd data-roundtrip>— m</dd></div><div><dt>往返时间</dt><dd data-nanoseconds>— ns</dd></div></dl><p data-receive-status>等待发射</p><p class="sensor-teaching-note">数值来自路标上的反光点。一部分光反射回来，设备记录往返时间。</p></aside></div>`;
  tools.innerHTML = `<div class="sensor-tools" data-game-controls><fieldset class="sensor-aim"><legend>转动方向 <output data-angle>0°</output></legend><div><button type="button" data-turn="-1" aria-label="向左转">−</button><input type="range" min="-40" max="40" step="4" value="0" data-aim aria-label="发射方向"><button type="button" data-turn="1" aria-label="向右转">+</button></div></fieldset><button type="button" class="arcade-primary sensor-fire" data-fire>发射一次</button><fieldset class="sensor-connections"><legend>接收通路</legend><div><button type="button" data-cable-button>接收线头</button><button type="button" data-socket="tx">Tx 发射口</button><button type="button" data-socket="rx">Rx 接收口</button></div></fieldset></div><p class="sensor-next-stage" data-next-stage hidden>第一个实验完成！后续扫描与天气实验正在准备中。你可以再练一遍。</p>`;
  const q = <T extends Element = HTMLElement>(selector: string) => stage.querySelector<T>(selector)!;
  const t = <T extends HTMLElement = HTMLElement>(selector: string) => tools.querySelector<T>(selector)!;
  const svg = q<SVGSVGElement>('[data-sensor-svg]');
  scope.listen(t('[data-aim]'), 'input', () => onAction({ type: 'aim', degrees: Number(t<HTMLInputElement>('[data-aim]').value) }));
  scope.listen(t('[data-fire]'), 'click', () => onAction({ type: 'fire' }));
  scope.listen(t('[data-cable-button]'), 'click', () => onAction({ type: 'select-cable' }));
  tools.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach(button => scope.listen(button, 'click', () => { if (current) onAction({ type: 'aim', degrees: Math.max(-40, Math.min(40, current.angleDegrees + Number(button.dataset.turn) * Number(t<HTMLInputElement>('[data-aim]').step))) }); }));
  tools.querySelectorAll<HTMLButtonElement>('[data-socket]').forEach(button => scope.listen(button, 'click', () => onAction({ type: 'connect', socket: button.dataset.socket as 'tx' | 'rx' })));

  function stopAnimations() { animations.forEach(animation => animation.cancel()); animations = []; }
  function geometry() {
    if (!current) return;
    const width = Math.max(300, svg.clientWidth);
    const { mobile, height, origin, target: point, receiver, tx, rx, loosePlug } = projectSensorScene(width, current.target.reflectivePoint);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    q('[data-emitter]').setAttribute('transform', `translate(${origin.x} ${origin.y})`);
    q('[data-target]').setAttribute('transform', `translate(${point.x} ${point.y})`);
    q('[data-receiver]').setAttribute('transform', `translate(${receiver.x} ${receiver.y})`);
    q('[data-turret]').setAttribute('transform', `rotate(${current.angleDegrees} 0 -14)`);
    q('[data-road]').setAttribute('d', `M${origin.x + 65} ${origin.y}L${point.x + 18} ${point.y}`);
    const dx = point.x - origin.x; const dy = point.y - origin.y; const length = Math.hypot(dx, dy);
    const normal = { x: -dy / length, y: dx / length };
    const rulerStart = { x: origin.x + normal.x * 37, y: origin.y + normal.y * 37 };
    const rulerEnd = { x: point.x + normal.x * 37, y: point.y + normal.y * 37 };
    q('[data-measuring-line]').setAttribute('d', `M${rulerStart.x} ${rulerStart.y}L${rulerEnd.x} ${rulerEnd.y}`);
    q('[data-meter-ticks]').innerHTML = [0, .25, .5, .75, 1].map(fraction => {
      const x = rulerStart.x + dx * fraction; const y = rulerStart.y + dy * fraction;
      return `<path d="M${x} ${y}L${x + normal.x * 8} ${y + normal.y * 8}" fill="none" stroke="#6e94ad" stroke-width="2"/>${fraction === 0 || fraction === .5 || fraction === 1 ? `<text x="${x + normal.x * 22}" y="${y + normal.y * 22}" text-anchor="middle">${(fraction * current!.target.distanceMeters).toFixed(0)} m</text>` : ''}`;
    }).join('');
    q('[data-direction-arc]').setAttribute('d', `M${origin.x + 70} ${origin.y - 78}Q${origin.x + 130} ${origin.y - 15} ${origin.x + 70} ${origin.y + 64}`);
    const radians = current.angleDegrees * Math.PI / 180; const rayLength = width - origin.x - 22;
    const rayEnd = current.ray?.hit ? point : { x: origin.x + Math.cos(radians) * rayLength, y: origin.y + Math.sin(radians) * rayLength };
    q('[data-aim-guide]').setAttribute('d', `M${origin.x + 42} ${origin.y - 14}L${origin.x + Math.cos(radians) * rayLength} ${origin.y + Math.sin(radians) * rayLength}`);
    q('[data-ray-out]').setAttribute('d', `M${origin.x + 42} ${origin.y - 14}L${rayEnd.x} ${rayEnd.y}`);
    q('[data-ray-back]').setAttribute('d', `M${point.x} ${point.y + 8}L${origin.x + 30} ${origin.y + 5}`);
    q('[data-ray-out]').toggleAttribute('hidden', !current.ray);
    q('[data-ray-back]').toggleAttribute('hidden', !current.ray?.hit);
    const connection = current.connection === 'tx' ? tx : current.connection === 'rx' ? rx : loosePlug;
    const cable = `M${receiver.x - 48} ${receiver.y + 5}C${receiver.x - 110} ${height - 4} ${origin.x + 80} ${height - 4} ${connection.x} ${connection.y + 8}`;
    q('[data-cable]').setAttribute('d', cable); q('[data-cable-signal]').setAttribute('d', cable);
    q('[data-cable-signal]').toggleAttribute('hidden', !current.connection);
    q('[data-cable-signal]').setAttribute('stroke', current.connection === 'tx' ? '#b85019' : '#007f78');
    q('[data-cable-plug]').setAttribute('transform', `translate(${connection.x} ${connection.y})`);
    q('[data-cable]').setAttribute('stroke', current.cableSelected ? '#2352cf' : '#173653');
    q('[data-receiver-wave]').setAttribute('stroke', current.ray?.received ? '#7cf4df' : '#ffd36a');
    const label = q<HTMLElement>('[data-target-label]'); label.style.left = `${point.x}px`; label.style.top = `${mobile && current.target.reflectivePoint.x > 0 ? point.y - 82 : point.y + 68}px`;
    const loose = q<HTMLElement>('[data-loose-label]'); loose.hidden = !!current.connection; loose.style.left = `${loosePlug.x + 14}px`; loose.style.top = `${loosePlug.y - 17}px`;
    const socketLabels = q<HTMLElement>('.sensor-socket-labels'); socketLabels.style.left = `${origin.x - 47}px`; socketLabels.style.top = `${origin.y + 42}px`;
    q<HTMLElement>('.sensor-scene__emitter').style.left = `${origin.x - 63}px`;
    q<HTMLElement>('.sensor-scene__receiver').style.left = `${receiver.x - 52}px`;
  }
  const observer = new ResizeObserver(geometry); observer.observe(svg); scope.add(() => observer.disconnect());
  return {
    render(snapshot: SensorSnapshot, angleStep = 4) {
      current = snapshot; geometry();
      t<HTMLInputElement>('[data-aim]').value = String(snapshot.angleDegrees); t<HTMLInputElement>('[data-aim]').step = String(angleStep);
      t('[data-angle]').textContent = `${snapshot.angleDegrees}°`;
      t('[data-cable-button]').setAttribute('aria-pressed', String(snapshot.cableSelected));
      tools.querySelectorAll<HTMLButtonElement>('[data-socket]').forEach(button => { button.setAttribute('aria-pressed', String(snapshot.connection === button.dataset.socket)); button.dataset.locked = String(snapshot.stage !== 'receive' || !snapshot.cableSelected); });
      t('[data-cable-button]').dataset.locked = String(snapshot.stage !== 'receive');
      tools.querySelectorAll<HTMLInputElement | HTMLButtonElement>('[data-turn],[data-aim],[data-fire]').forEach(control => { control.dataset.locked = String(snapshot.stage === 'first-complete'); });
      t('[data-next-stage]').hidden = snapshot.stage !== 'first-complete';
      const evidence = snapshot.measuredTargets[0];
      q('[data-distance]').textContent = evidence ? `${evidence.distanceMeters.toFixed(1)} m` : '— m';
      q('[data-roundtrip]').textContent = evidence ? `${(evidence.distanceMeters * 2).toFixed(1)} m` : '— m';
      q('[data-nanoseconds]').textContent = evidence ? `${evidence.roundTripNanoseconds.toFixed(1)} ns` : '— ns';
      q('[data-receive-status]').textContent = snapshot.ray?.received ? '✓ 接收器已记录回波' : snapshot.ray?.hit ? '回波返回，等待接收通路' : snapshot.ray ? '这一发没有产生目标回波' : '等待发射';
      if (snapshot.shots !== previousShot) {
        stopAnimations(); previousShot = snapshot.shots;
        if (active && snapshot.ray && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          animations.push(q<SVGPathElement>('[data-ray-out]').animate([{ strokeDasharray: '900', strokeDashoffset: '900' }, { strokeDasharray: '900', strokeDashoffset: '0' }], { duration: 440, easing: 'ease-out' }));
          if (snapshot.ray.hit) animations.push(q<SVGPathElement>('[data-ray-back]').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 300, fill: 'backwards' }));
        }
      }
    },
    setActive(value: boolean) { active = value; if (!value) stopAnimations(); },
    dispose() { stopAnimations(); scope.dispose(); },
  };
}
