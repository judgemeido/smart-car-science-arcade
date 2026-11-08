import './styles.css';
import { bootstrap } from './app/bootstrap';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('App root not found');

const app = bootstrap(root);
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
