"use client";

import { FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RegisterPage: FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
};

export default RegisterPage; 