"use client"

import * as React from "react"
import {
    Copy,
    CopyCheck,
    ExternalLink,
    MoreVertical,
    QrCode,
    Edit,
    Trash,
    Calendar,
    Hourglass
} from "lucide-react"
import { toast } from "sonner"
import { LinkEditor } from "./link-editor"
import { api } from "@/lib/api-client"
import { QRCodeSVG } from "qrcode.react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface LinkCardProps {
    link: {
        id?: string
        slug: string
        url: string
        title?: string
        description?: string
        comment?: string
        createdAt: number | string // Handle both number (from backend) and string
        updatedAt?: number | string
        expiration?: number | string
    }
    onDelete?: () => void
}

export function LinkCard({ link, onDelete }: LinkCardProps) {
    const [copied, setCopied] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [showQrCode, setShowQrCode] = React.useState(false)

    const formatDate = (val: number | string) => {
        if (typeof val === 'number') {
            return new Date(val * 1000).toLocaleDateString()
        }
        return val
    }

    const shortLink = `${typeof window !== "undefined" ? window.location.origin : ""}/${link.slug}`

    const getHost = (url: string) => {
        try {
            return new URL(url).host
        } catch {
            return ""
        }
    }

    const linkIcon = `https://unavatar.io/${getHost(link.url)}?fallback=https://suki.icu/logo.svg`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shortLink)
        setCopied(true)
        toast.success("链接已复制")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const body = await api.delete('/api/delete', { slug: link.slug })
            if (body.code === 200) {
                toast.success("链接已删除")
                onDelete?.()
            } else {
                toast.error(body.msg || "删除失败")
            }
        } catch {
            toast.error("网络错误")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", isDeleting && "opacity-50 pointer-events-none")}>
            <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={linkIcon} alt={link.slug} />
                            <AvatarFallback>{link.slug[0].toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-1">
                                <div className="truncate font-bold leading-5">
                                    {typeof window !== "undefined" ? window.location.host : ""}/{link.slug}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <CopyCheck className="h-3.5 w-3.5" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="truncate text-sm text-muted-foreground whitespace-nowrap">
                                            {link.comment || link.title || link.description || "无描述"}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] break-all">
                                        <p>{link.comment || link.title || link.description || "无描述"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-1">
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>

                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setShowQrCode(true)}
                            >
                                <QrCode className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <LinkEditor
                                        link={{
                                            ...link,
                                            expiration: typeof link.expiration === 'number' ? link.expiration : undefined
                                        }}
                                        onSuccess={onDelete} // Re-fetch links on success
                                        trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                编辑
                                            </DropdownMenuItem>
                                        }
                                    />
                                    <Separator className="my-1" />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                删除
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>确定要删除这个短链吗？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    此操作无法撤销。这将永久删除该短链及其访问统计。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>取消</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={handleDelete}
                                                >
                                                    确认删除
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex h-5 items-center space-x-2 text-xs text-muted-foreground overflow-hidden">
                        <div className="flex items-center shrink-0">
                            <Calendar className="mr-1 h-3.5 w-3.5" />
                            {formatDate(link.createdAt)}
                        </div>

                        {link.expiration && (
                            <>
                                <Separator orientation="vertical" />
                                <div className="flex items-center shrink-0">
                                    <Hourglass className="mr-1 h-3.5 w-3.5" />
                                    {formatDate(link.expiration)}
                                </div>
                            </>
                        )}

                        <Separator orientation="vertical" />
                        <span className="truncate flex-1">{link.url}</span>
                    </div>
                </div>
            </CardContent>

            <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>短链二维码</DialogTitle>
                        <DialogDescription>
                            扫描二维码即可访问短链
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="bg-white p-4 rounded-lg">
                            <QRCodeSVG
                                value={shortLink}
                                size={256}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium">{link.slug}</p>
                            <p className="text-xs text-muted-foreground break-all">
                                {shortLink}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(shortLink)
                                    toast.success("链接已复制")
                                }}
                                className="mt-2"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                复制链接
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
