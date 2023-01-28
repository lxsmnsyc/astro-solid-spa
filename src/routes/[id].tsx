import { useRouter } from '../internal/router';

export default function Index() {
  const router = useRouter<{ id: string }>();
  return <h1>{`Hello ${router.params.id}`}</h1>;
}
