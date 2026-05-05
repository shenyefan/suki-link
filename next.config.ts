import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: pkgRoot,
  },
}

export default nextConfig
