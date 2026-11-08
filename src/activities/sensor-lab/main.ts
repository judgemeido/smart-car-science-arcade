import '../../styles.css';
import { bootstrapActivity } from '../bootstrap';
import { navigationHref } from '../../app/navigation-items';
import '../../ui/arcade/styles.css';
import './styles.css';
import { mount, view } from './index';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Activity root not found');
const app = bootstrapActivity(root, {
  activityId: 'sensor-lab',
  title: '回波侦探',
  galleryHref: navigationHref('lidar'),
  view,
  mount,
});
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
