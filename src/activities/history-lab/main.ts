import '../../styles.css';
import { bootstrapActivity } from '../bootstrap';
import { navigationHref } from '../../app/navigation-items';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Activity root not found');
const app = bootstrapActivity(root, {
  activityId: 'history-lab',
  title: '历史闯关',
  galleryHref: navigationHref('history'),
  view: '<section class="activity-preparation"><h1>历史闯关</h1><p>活动正在准备中。你可以先回到历史展厅，认识中国新能源汽车的发展。</p></section>',
  mount: () => ({ setActive() {}, dispose() {} }),
});
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
