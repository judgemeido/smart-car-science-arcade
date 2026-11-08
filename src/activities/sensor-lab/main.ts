import '../../styles.css';
import { bootstrapActivity } from '../bootstrap';
import { navigationHref } from '../../app/navigation-items';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Activity root not found');
const app = bootstrapActivity(root, {
  activityId: 'sensorgame',
  title: '感知闯关',
  galleryHref: navigationHref('lidar'),
  view: '<section class="activity-preparation"><h1>感知闯关</h1><p>活动正在准备中。你可以先回到雷达展厅，探索汽车怎样感知周围的世界。</p></section>',
  mount: () => ({ setActive() {}, dispose() {} }),
});
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
