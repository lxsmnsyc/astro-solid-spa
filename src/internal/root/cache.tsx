import {
  createContext,
  createResource,
  JSX,
  Resource,
  useContext,
} from 'solid-js';
import { SWRStore, createSWRStore } from 'swr-store';
import { UseSWRStoreOptions, useSWRStoreSuspenseless } from 'solid-swr-store';
import {
  LoadResult,
  RouterInstance,
  RouterParams,
  useRouter,
} from '../router';

function useSWRStore<T, P extends any[] = []>(
  store: SWRStore<T, P>,
  args: () => P,
  options?: UseSWRStoreOptions<T>,
): Resource<T | undefined> {
  const suspenseless = useSWRStoreSuspenseless(store, args, options ?? {});
  const [resource] = createResource(
    suspenseless,
    async (result): Promise<T> => {
      if (result.status === 'failure') {
        throw result.data;
      }
      const dat = await result.data;
      return dat;
    },
    options ? {
      initialValue: options.initialData,
      ssrLoadFrom: 'initial',
    } : {},
  );
  return resource as Resource<T | undefined>;
}

const CacheContext = createContext<SWRStore<any, RouterInstance<RouterParams>[]>>();

interface CacheProps {
  children: JSX.Element;
}

export function CacheBoundary(props: CacheProps) {
  const store = createSWRStore<LoadResult<any>, RouterInstance<RouterParams>[]>({
    key: (router) => `${router.pathname}?${new URLSearchParams(router.search).toString()}`,
    get: async (router) => {
      const params = new URLSearchParams(router.search);
      params.set('.get', '');
      const response = await fetch(`${router.pathname}?${params.toString()}`);
      const result = (await response.json()) as LoadResult<any>;
      return result;
    },
    revalidateOnFocus: true,
    revalidateOnNetwork: true,
  });

  return (
    <CacheContext.Provider value={store}>
      {props.children}
    </CacheContext.Provider>
  );
}

export function useCache<T>(
  options?: UseSWRStoreOptions<LoadResult<T>>,
): Resource<LoadResult<T>> {
  const ctx = useContext(CacheContext)!;
  const router = useRouter();
  const result = useSWRStore(ctx, () => [router], options);
  return result as Resource<LoadResult<T>>;
}
