import {
  createContext,
  createResource,
  JSX,
  lazy,
  Show,
  Suspense,
  useContext,
} from 'solid-js';
import {
  createRouterTree,
  matchRoute,
  Page,
  Router,
  SSRPage,
  useRouter,
} from './internal/router';

const Data = createContext<{ data: any, initial: boolean }>();

export interface PageProps<T> {
  data: T;
}

function createPage<T>(Comp: (props: PageProps<T>) => JSX.Element): () => JSX.Element {
  return function CustomPage() {
    const ctx = useContext(Data)!;
    const router = useRouter();

    const [data] = createResource(
      async () => {
        const params = new URLSearchParams(router.search);
        params.set('.get', '');
        const response = await fetch(`${router.pathname}?${params.toString()}`);
        const result = (await response.json()) as T;
        return result;
      },
      ctx.initial ? {
        initialValue: ctx.data as T,
        ssrLoadFrom: 'initial',
      } : {},
    );

    return (
      <Suspense>
        <Show when={data()} keyed>
          {(loaded) => <Comp data={loaded} />}
        </Show>
      </Suspense>
    );
  };
}

function normalizeRoute(path: string): string {
  const base = path.substring(8, path.length - 4);
  if (base.endsWith('/index')) {
    return base.substring(0, base.length - 5);
  }
  return base;
}

const routesGlob = import.meta.glob<boolean, string, SSRPage>('./routes/**/*.tsx');

const rawPages = Object.entries(routesGlob)
  .map(([key, value]) => ({
    path: normalizeRoute(key),
    value: createPage(lazy(value)),
  }));
const rawLoaders = Object.entries(routesGlob)
  .map(([key, value]) => ({
    path: normalizeRoute(key),
    value: async () => {
      const result = await value();
      return result.load;
    },
  }));

const pages = createRouterTree(rawPages);
const loaders = createRouterTree(rawLoaders);

export function getLoader(url: URL) {
  return matchRoute(loaders, url.pathname);
}

export interface RouterProps<T> {
  data: T;
  pathname: string;
  search: string;
}

export default function RouterRenderer<T>(props: RouterProps<T>): JSX.Element {
  return (
    <Data.Provider value={{ initial: true, data: props.data }}>
      <Router
        routes={pages}
        location={{
          pathname: props.pathname,
          search: props.search,
        }}
      />
    </Data.Provider>
  );
}
