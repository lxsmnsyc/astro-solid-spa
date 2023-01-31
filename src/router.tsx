import NotFound from './404';
import defineRenderer from './internal/root';
import { SSRPage } from './internal/router';

export const { getLoader, Renderer } = defineRenderer({
  routes: {
    path: './routes',
    imports: import.meta.glob<boolean, string, SSRPage>('./routes/**/*.tsx'),
  },
  pages: {
    404: NotFound,
  },
});
