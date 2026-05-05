import { redirect } from 'next/navigation'

import { getHomeUrl } from '@/server/env'

export default async function HomePage() {
  const home = getHomeUrl()
  if (home)
    redirect(home)

  redirect('/manage')
}
