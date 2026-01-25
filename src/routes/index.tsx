import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  useEffect(() => {
    const homeUrl = import.meta.env.VITE_HOME_URL;
    
    if (homeUrl) {
      window.location.replace(homeUrl);
    } else {
      window.location.replace('/dashboard');
    }
  }, []);

  return null;
}
