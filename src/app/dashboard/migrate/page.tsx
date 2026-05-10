'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { DatabaseBackup, Download, FileJson, Loader2, Upload } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/lib/dashboard-api'

type ExportData = {
  version: string
  exportedAt: string
  count: number
  links: unknown[]
  list_complete?: boolean
}

type ImportResult = {
  success: number
  skipped: number
  failed: number
  successItems?: unknown[]
  skippedItems?: unknown[]
  failedItems?: unknown[]
}

const IMPORT_BATCH_SIZE = 10

function mergeImportResult(target: ImportResult, source: ImportResult) {
  target.success += source.success
  target.skipped += source.skipped
  target.failed += source.failed
  target.successItems?.push(...(source.successItems ?? []))
  target.skippedItems?.push(...(source.skippedItems ?? []))
  target.failedItems?.push(...(source.failedItems ?? []))
}

export default function MigratePage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const exportLinks = async () => {
    setExporting(true)
    try {
      const data = await apiJson<ExportData>('/api/links/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `suki-link-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('导出完成', `共导出 ${data.count} 条短链`)
    } catch (err) {
      toast.error('导出失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setExporting(false)
    }
  }

  const importLinks = async (file: File) => {
    setImporting(true)
    try {
      const payload = JSON.parse(await file.text()) as ExportData
      if (!Array.isArray(payload.links) || payload.links.length === 0)
        throw new Error('导入文件没有可导入的链接')

      const result: ImportResult = {
        success: 0,
        skipped: 0,
        failed: 0,
        successItems: [],
        skippedItems: [],
        failedItems: [],
      }

      for (let start = 0; start < payload.links.length; start += IMPORT_BATCH_SIZE) {
        const chunk = payload.links.slice(start, start + IMPORT_BATCH_SIZE)
        const chunkResult = await apiJson<ImportResult>('/api/links/import', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            count: chunk.length,
            links: chunk,
          }),
        })
        mergeImportResult(result, chunkResult)
      }

      toast.success('导入完成', `成功 ${result.success} 条，跳过 ${result.skipped} 条，失败 ${result.failed} 条`)
    } catch (err) {
      toast.error('导入失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <Header fixed>
        <Breadcrumb className="me-auto min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/links">Suki-Link</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>迁移</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-4" />
              导出数据
            </CardTitle>
            <CardDescription>将所有链接下载为 JSON 文件</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled={exporting} onClick={() => void exportLinks()}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <DatabaseBackup className="size-4" />}
              导出 JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4" />
              导入数据
            </CardTitle>
            <CardDescription>上传 JSON 文件以导入链接</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              disabled={importing}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importLinks(file)
              }}
            />
            <Button variant="outline" disabled={importing} onClick={() => fileRef.current?.click()}>
              {importing ? <Loader2 className="size-4 animate-spin" /> : <FileJson className="size-4" />}
              选择 JSON
            </Button>
          </CardContent>
        </Card>
      </div>
      </Main>
    </>
  )
}
