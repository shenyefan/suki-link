"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "./date-picker"

import { toast } from "sonner"
import { api } from "@/lib/api-client"

interface LinkEditorProps {
    onSuccess?: () => void
    link?: {
        slug: string
        url: string
        comment?: string
        expiration?: number
    }
    trigger?: React.ReactNode
}

export function LinkEditor({ onSuccess, link, trigger }: LinkEditorProps) {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [url, setUrl] = React.useState(link?.url || "")
    const [slug, setSlug] = React.useState(link?.slug || "")
    const [comment, setComment] = React.useState(link?.comment || "")
    const [expiration, setExpiration] = React.useState<Date | undefined>(
        link?.expiration ? new Date(link.expiration * 1000) : undefined
    )

    const isEditing = !!link

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return

        setIsLoading(true)
        const expTimestamp = expiration ? Math.floor(expiration.getTime() / 1000) : (isEditing ? null : undefined)

        try {
            const endpoint = isEditing ? '/api/edit' : '/api/create'
            const requestData = {
                url,
                slug: slug || undefined,
                comment,
                expiration: expTimestamp
            }

            const body = isEditing
                ? await api.put(endpoint, requestData)
                : await api.post(endpoint, requestData)

            if (body.code === 200) {
                setOpen(false)
                if (!isEditing) {
                    setUrl("")
                    setSlug("")
                    setComment("")
                    setExpiration(undefined)
                }
                toast.success(isEditing ? "链接已保存" : "链接已创建")
                onSuccess?.()
            } else {
                toast.error(body.msg || "操作失败")
            }
        } catch (err) {
            console.error("Link save failed:", err)
            toast.error("请求失败")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        创建短链
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "编辑短链" : "创建短链"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "修改原始 URL 或备注信息。" : "输入原始 URL 和自定义的短链后缀。"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="url">目标 URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">后缀</Label>
                            <Input
                                id="slug"
                                placeholder="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isEditing}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="comment">备注</Label>
                            <Textarea
                                id="comment"
                                placeholder="在这里输入备注"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>过期时间</Label>
                            <DatePicker
                                selected={expiration}
                                onSelect={setExpiration}
                                placeholder="选择过期日期"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
