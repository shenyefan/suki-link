import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))

/** 腾讯云 Node SDK：避免被打进不合理的 bundle；参阅 Next `serverExternalPackages`。 */
const nextConfig: NextConfig = {
  turbopack: {
    root: pkgRoot,
  },
  serverExternalPackages: [
    'bcryptjs',
    'tencentcloud-sdk-nodejs-common',
    'tencentcloud-sdk-nodejs-teo',
  ],
}

export default nextConfig
