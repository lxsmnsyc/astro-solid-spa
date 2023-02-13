import {
  createComponent,
  createContext,
  JSX,
  onMount,
  Show,
  Suspense,
  useContext,
} from 'solid-js';
import useMeta from '../meta/use-meta';
import {
  createRouterTree,
  Load,
  LoadResult,
  matchRoute,
  Router,
  useRouter,
} from '../router';
import { CacheBoundary, useCache } from './cache';

const Data = createContext<{ data: LoadResult<any>, initial: boolean }>();

function createPage<T>(
  Comp: (props: T) => JSX.Element,
  fallback: () => JSX.Element,
): () => JSX.Element {
  return function CustomPage() {
    const ctx = useContext(Data)!;
    const router = useRouter();
    const data = useCache(
      ctx.initial
        ? { initialData: ctx.data as LoadResult<T> }
        : { shouldRevalidate: true },
    );

    onMount(() => {
      ctx.initial = false;
    });

    return (
      <Suspense>
        <Show when={data()} keyed>
          {(loaded) => {
            if ('redirect' in loaded) {
              router.push(loaded.redirect);
              return null;
            }
            if ('notFound' in loaded) {
              return createComponent(fallback, {});
            }
            if (!ctx.initial) {
              useMeta(loaded);
            }
            return <Comp {...loaded.props} />;
          }}
        </Show>
      </Suspense>
    );
  };
}

function normalizeRoute(path: string, offset: number): string {
  const base = path.substring(offset, path.length - 4);
  if (base.endsWith('/index')) {
    if (base === '/index') {
      return '/';
    }
    return base.substring(0, base.length - 6);
  }
  return base;
}

export interface LoaderConfig {
  routes: {
    path: string;
    imports: Record<string, Load>;
  };
}

export interface RendererConfig {
  routes: {
    path: string;
    imports: Record<string, () => JSX.Element>;
  };
  pages: {
    404: () => JSX.Element;
  };
}

export function defineLoaderRouter(config: LoaderConfig) {
  const offset = config.routes.path.length;
  const rawLoaders = Object.entries(config.routes.imports)
    .map(([key, value]) => ({
      path: normalizeRoute(key, offset),
      value,
    }));
  const loaders = createRouterTree(rawLoaders);

  return (url: URL) => matchRoute(loaders, url.pathname);
}

export interface RouterProps<T> {
  data: LoadResult<T>;
  pathname: string;
  search: string;
}

export function definePageRouter(config: RendererConfig) {
  const offset = config.routes.path.length;
  const rawPages = Object.entries(config.routes.imports)
    .map(([key, value]) => ({
      path: normalizeRoute(key, offset),
      value: createPage(value, config.pages[404]),
    }));

  const pages = createRouterTree(rawPages);

  return function Renderer<T>(props: RouterProps<T>) {
    return (
      <CacheBoundary>
        <Data.Provider value={{ initial: true, data: props.data }}>
          <Router
            routes={pages}
            location={{
              pathname: props.pathname,
              search: props.search,
            }}
            fallback={config.pages[404]}
          />
        </Data.Provider>
      </CacheBoundary>
    );
  };
}
