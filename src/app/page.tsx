import { Suspense } from 'react';
import HomeClient from './components/HomeClient';

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient />
    </Suspense>
  );
}

