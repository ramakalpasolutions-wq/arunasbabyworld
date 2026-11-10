import PolicyPage from '@/components/policy/PolicyPage';
import { pageMetadata } from '@/lib/seo';
import { POLICIES } from '@/lib/policies';

const policy = POLICIES.terms;

export const metadata = pageMetadata({
  title: policy.title,
  description: policy.description,
  path: policy.path,
});

export default function Page() {
  return <PolicyPage policyKey="terms" />;
}
