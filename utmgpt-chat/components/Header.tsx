'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className='bg-background border-b border-input'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-6'>
          <Link href='/' className='text-2xl font-bold'>
            UTM-GPT
          </Link>
        </div>
        <div className='flex gap-4 items-center'>
          <Link href='/chat' className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'>
            Chat
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
