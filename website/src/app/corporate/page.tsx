import type { Metadata } from 'next';
import { CorporatePage } from './CorporatePage';

export const metadata: Metadata = {
  title: 'MSC Arabia \u2014 Technology. Gaming. Innovation.',
  description:
    "MSC Arabia delivers premium technology solutions, gaming experiences, and digital innovation. Creators of Don't Touch Purple.",
  openGraph: {
    title: 'MSC Arabia',
    description: 'Technology. Gaming. Innovation.',
    url: 'https://mscarabia.com',
    siteName: 'MSC Arabia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MSC Arabia',
    description: 'Technology. Gaming. Innovation.',
  },
};

export default function Page() {
  return <CorporatePage />;
}
