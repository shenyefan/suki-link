"use client"

import * as React from "react"


import { Button } from "@/components/ui/button"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList,
} from "@/components/ui/command"

interface LinkSearchProps {
    onSearch?: (term: string) => void
}

export function LinkSearch({ onSearch }: LinkSearchProps) {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">搜索短链...</span>
                <span className="inline-flex lg:hidden">搜索...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="输入关键词搜索..."
                    onValueChange={(v) => {
                        onSearch?.(v)
                    }}
                />
                <CommandList>
                    <CommandEmpty>开始搜索您的短链...</CommandEmpty>
                    <CommandGroup heading="所有短链">
                        {/* We hide the items here because we are filtering the main list in the parent */}
                        <div className="p-2 text-xs text-muted-foreground italic">
                            搜索结果将实时反映在仪表盘列表中。
                        </div>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
