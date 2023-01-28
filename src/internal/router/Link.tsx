import {
  createEffect,
  createSignal,
  JSX,
  onCleanup,
  Show,
} from 'solid-js';
import { useRouter } from './Router';
import { isLocalURL, isModifiedEvent, omitProps } from './utilities';

function Throwable(props: { error: Error }): JSX.Element {
  throw props.error;
}

type BaseAnchorAttributes = JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

export interface LinkProps extends BaseAnchorAttributes {
  href: string;
  scroll?: ScrollBehavior;
  replace?: boolean;
  prefetch?: boolean;
  children?: JSX.Element;
}

export default function Link(
  props: LinkProps,
): JSX.Element {
  const router = useRouter();

  let anchorRef!: HTMLAnchorElement;

  // Override click behavior
  createEffect(() => {
    const shouldScroll = props.scroll;
    const anchorHref = props.href;
    const shouldReplace = props.replace;

    const onClick = (ev: MouseEvent) => {
      if (isModifiedEvent(ev) || !isLocalURL(anchorHref)) {
        return;
      }
      ev.preventDefault();

      // avoid scroll for urls with anchor refs
      let scroll = shouldScroll;
      if (scroll == null && anchorHref.indexOf('#') >= 0) {
        scroll = undefined;
      }

      router[shouldReplace ? 'replace' : 'push'](anchorHref, {
        scroll,
      });
    };

    anchorRef.addEventListener('click', onClick);
    onCleanup(() => {
      anchorRef.removeEventListener('click', onClick);
    });
  });

  const [error, setError] = createSignal<Error>();

  const [visible, setVisible] = createSignal(false);

  createEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === anchorRef && entry.isIntersecting) {
          // Host intersected, set visibility to true
          setVisible(true);

          // Stop observing
          observer.disconnect();
        }
      });
    });

    observer.observe(anchorRef);

    onCleanup(() => {
      observer.unobserve(anchorRef);
      observer.disconnect();
    });
  });

  // Lazy prefetching
  createEffect(() => {
    // TODO intersection observer
    const anchorHref = props.href;
    const isVisible = visible();
    const shouldPrefetch = (props.prefetch ?? true) && isVisible && isLocalURL(anchorHref);
    if (shouldPrefetch) {
      router.prefetch(anchorHref).catch((err) => {
        setError(err);
      });
    }
  });

  // Priotized prefetching on mouse enter
  createEffect(() => {
    const anchorHref = props.href;
    const shouldPrefetch = (props.prefetch ?? true) && isLocalURL(anchorHref);
    const onMouseEnter = () => {
      if (shouldPrefetch) {
        router.prefetch(anchorHref, true).catch((err) => {
          setError(err);
        });
      }
    };

    anchorRef.addEventListener('mouseenter', onMouseEnter);
    onCleanup(() => {
      anchorRef.removeEventListener('mouseenter', onMouseEnter);
    });
  });

  return (
    <>
      <Show when={error()} keyed>
        {(err) => <Throwable error={err} />}
      </Show>
      <a
        ref={(e) => {
          if (typeof props.ref === 'function') {
            props.ref(e);
          }
          anchorRef = e;
        }}
        {...omitProps(props, [
          'prefetch',
          'scroll',
          'ref',
          'replace',
          'children',
        ])}
      >
        {props.children}
      </a>
    </>
  );
}
