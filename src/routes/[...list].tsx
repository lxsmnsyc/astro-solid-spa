import { JSX } from 'solid-js';
import { Link } from '../internal/router';

const sleep = (ms: number) => new Promise((res) => {
  setTimeout(res, ms, true);
});

export async function load(request: Request, params: { list: string[] }) {
  await sleep(1000);
  return params.list.join(', ');
}

export default function CaptureAllRoute(props: { data: string }): JSX.Element {
  return (
    <div class="p-4 rounded-lg bg-indigo-900 bg-opacity-25 flex flex-col space-y-4">
      <span class="text-2xl text-white font-sans">
        {'Welcome to '}
        <span class="bg-white bg-opacity-25 font-mono p-2 rounded m-1">{`Page ${props.data}`}</span>
        !
      </span>
      <div class="flex flex-col space-y-1">
        <Link href="/" class="text-white underline bg-white bg-opacity-25 rounded px-2 py-1">Go to home</Link>
      </div>
    </div>
  );
}
