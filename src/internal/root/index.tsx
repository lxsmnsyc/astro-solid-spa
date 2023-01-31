import {
  createComponent,
  createContext,
  createResource,
  JSX,
  lazy,
  onMount,
  Show,
  Suspense,
  useContext,
} from 'solid-js';
import useMeta from '../meta/use-meta';
import {
  createRouterTree,
  LoadResult,
  matchRoute,
  Router,
  SSRPage,
  useRouter,
} from '../router';

const Data = createContext<{ data: LoadResult<any>, initial: boolean }>();

function createPage<T>(
  Comp: (props: T) => JSX.Element,
  fallback: () => JSX.Element,
): () => JSX.Element {
  return function CustomPage() {
    const ctx = useContext(Data)!;
    const router = useRouter();

    const [data] = createResource(
      async () => {
        const params = new URLSearchParams(router.search);
        params.set('.get', '');
        const response = await fetch(`${router.pathname}?${params.toString()}`);
        const result = (await response.json()) as LoadResult<T>;
        return result;
      },
      ctx.initial ? {
        initialValue: ctx.data as LoadResult<T>,
        ssrLoadFrom: 'initial',
      } : {},
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
    return base.substring(0, base.length - 5);
  }
  return base;
}

export interface RendererConfig {
  routes: {
    path: string;
    imports: Record<string, () => Promise<SSRPage>>;
  };
  pages: {
    404: () => JSX.Element;
  };
}

export interface RouterProps<T> {
  data: LoadResult<T>;
  pathname: string;
  search: string;
}

export default function defineRenderer(config: RendererConfig) {
  const offset = config.routes.path.length;
  const normalizedRoutes = Object.entries(config.routes.imports)
    .map(([key, value]) => [normalizeRoute(key, offset), value] as const);
  const rawPages = normalizedRoutes
    .map(([key, value]) => ({
      path: key,
      value: createPage(lazy(value), config.pages[404]),
    }));
  const rawLoaders = normalizedRoutes
    .map(([key, value]) => ({
      path: key,
      value: async () => {
        const result = await value();
        return result.load;
      },
    }));

  const pages = createRouterTree(rawPages);
  const loaders = createRouterTree(rawLoaders);

  return {
    getLoader: (url: URL) => matchRoute(loaders, url.pathname),
    Renderer: <T, >(props: RouterProps<T>) => (
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
    ),
  };
}
