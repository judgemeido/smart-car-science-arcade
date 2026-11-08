import '../../styles.css';
import { bootstrapActivity } from '../bootstrap';
import { navigationHref } from '../../app/navigation-items';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Activity root not found');
const app = bootstrapActivity(root, {
  activityId: 'structure-lab',
  title: '结构闯关',
  galleryHref: navigationHref('explore'),
  view: '<section class="activity-preparation"><h1>结构闯关</h1><p>活动正在准备中。你可以先回到结构展厅，看看新能源汽车的部件怎样合作。</p></section>',
  mount: () => ({ setActive() {}, dispose() {} }),
});
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
