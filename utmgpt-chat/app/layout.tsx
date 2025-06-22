import './globals.css';
import { Public_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import Header from '@/components/Header';

const publicSans = Public_Sans({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <title>UTMGPT</title>
        <link rel='shortcut icon' href='/images/favicon.ico' />
        <meta name='description' content='UTMGPT - AI-powered assistant for UTM students' />
        <meta property='og:title' content='UTMGPT' />
        <meta property='og:description' content='UTMGPT - AI-powered assistant for UTM students' />
        <meta property='og:image' content='/images/og-image.png' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='UTMGPT' />
        <meta name='twitter:description' content='UTMGPT - AI-powered assistant for UTM students' />
        <meta name='twitter:image' content='/images/og-image.png' />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <div className='bg-white w-full flex flex-col h-[100dvh]'>
            <Header />
            <div className='bg-background m-4 relative grid rounded-t-2xl border border-input border-b-0 h-full'>
              <div className='absolute inset-0'>{children}</div>
            </div>
          </div>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
