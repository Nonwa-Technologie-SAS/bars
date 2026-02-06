import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace - Bars',
  description: 'Marketplace pages for Bars application',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
      <div className='relative w-full'>{children}</div>
    </div>
  );
}
