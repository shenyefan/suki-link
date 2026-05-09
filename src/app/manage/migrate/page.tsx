'use client'

import { useRef, useState } from 'react'
import { DatabaseBackup, Download, FileJson, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/manage/api'

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
      const text = await file.text()
      const payload = JSON.parse(text) as ExportData
      const result = await apiJson<ImportResult>('/api/links/import', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      toast.success('导入完成', `成功 ${result.success} 条，跳过 ${result.skipped} 条，失败 ${result.failed} 条`)
    } catch (err) {
      toast.error('导入失败', err instanceof Error ? err.message : '操作失败')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-4" />
            导出
          </CardTitle>
          <CardDescription>导出全部短链数据，接口会自动分页读取所有记录。</CardDescription>
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
            导入
          </CardTitle>
          <CardDescription>选择 Suki-Link 导出的 JSON 文件，接口会分批写入。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            disabled={importing}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importLinks(file)
            }}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {importing ? <Loader2 className="size-3.5 animate-spin" /> : <FileJson className="size-3.5" />}
            已存在的 slug 会被跳过。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
