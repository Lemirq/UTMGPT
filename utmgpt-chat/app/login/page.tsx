'use client';

import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

export default function Login() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold mb-4'>Login to UTM-GPT</h1>
        <Button onClick={handleLogin}>Sign in with Google</Button>
      </div>
    </div>
  );
}
