import { JSX, lazy } from 'solid-js';
import { Router, createRouterTree } from 'solid-tiny-router';

function normalizeRoute(path: string): string {
  const base = path.substring(8, path.length - 4);
  if (base.endsWith('/index')) {
    return base.substring(0, base.length - 5);
  }
  return base;
}

const routesGlob = import.meta.glob<boolean, string, any>('./routes/**/*.tsx');

const rawRoutes = Object.entries(routesGlob)
  .map(([key, value]) => ({
    path: normalizeRoute(key),
    component: lazy(value),
  }));

const routes = createRouterTree(rawRoutes);

export interface RouterProps {
  pathname: string;
  search: string;
}

export default function RouterRenderer(props: RouterProps): JSX.Element {
  return (
    <Router
      routes={routes}
      location={{
        pathname: props.pathname,
        search: props.search,
      }}
    />
  );
}
