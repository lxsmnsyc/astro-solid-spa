import { useRouter } from 'solid-tiny-router';

export default function Index() {
  const router = useRouter<{ id: string }>();
  return <h1>{`Hello ${router.params.id}`}</h1>;
}
