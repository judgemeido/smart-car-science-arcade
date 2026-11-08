import { scenarios } from './data';

export const view = `
      <div class="traffic-experience">
        <div class="traffic-stage">
          <canvas data-traffic-canvas aria-label="三维中国城市道路场景，有车辆、行人和交通标志"></canvas>
          <div class="traffic-stage__topline"><span><i>04</i> 安全上路 · 规则体验</span><span>点选判断 · 车辆自动行驶</span></div>
          <div class="traffic-stage__stats" aria-live="polite">
            <span>情境 <b data-traffic-progress>0 / ${scenarios.length}</b></span>
            <span>安全分 <b data-traffic-score>0</b></span>
          </div>
          <div class="traffic-scene-caption"><span>杭州 · 城市道路</span><b data-traffic-state>准备出发</b></div>
        </div>
        <aside class="traffic-panel">
          <div class="traffic-panel__intro">
            <p class="eyebrow"><span>第四展厅</span><span>道路安全 · 互动体验</span></p>
            <h2>安全上路，<em>你来做选择。</em></h2>
            <p>车会自己往前开。遇到交通情境时，点选你认为安全的做法。</p>
          </div>
          <section class="traffic-question" data-traffic-overlay aria-live="polite">
            <div class="traffic-question__tag"><span>情境判断</span><b data-traffic-progress>0 / ${scenarios.length}</b></div>
            <h3 data-traffic-title>准备好了吗？</h3>
            <p data-traffic-copy>跟着曜境 S9 上路，认识红绿灯、人行横道和道路标志。</p>
            <div class="traffic-options" data-traffic-options></div>
            <div class="traffic-feedback" data-traffic-feedback aria-live="polite"></div>
            <div class="traffic-question__actions">
              <button class="traffic-primary" type="button" data-traffic-start>开始体验 <span>↗</span></button>
              <button class="traffic-secondary" type="button" data-traffic-next hidden>继续前进 <span>→</span></button>
              <button class="traffic-secondary" type="button" data-traffic-reset>重新开始 <span>↺</span></button>
            </div>
          </section>
          <div class="traffic-rule-note"><span>出行小提醒</span><p>游戏帮助认识常见规则。上路时要遵守交通信号，并听从现场交警指挥。</p></div>
          <div class="traffic-panel__footer"><button class="text-button" type="button" data-next="lidar">返回激光雷达 <span>↗</span></button><span>智驾博物馆 · 04</span></div>
        </aside>
      </div>
    `;
