"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DayPicker } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
    selected: Date | undefined
    onSelect: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: React.ComponentProps<typeof DayPicker>['disabled']
}

export function DatePicker({
    selected,
    onSelect,
    placeholder = "选择日期",
    className,
    disabled,
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!selected}
                    className={cn(
                        "w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground",
                        className
                    )}
                >
                    {selected ? (
                        format(selected, "yyyy年MM月dd日", { locale: zhCN })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selected}
                    onSelect={onSelect}
                    disabled={disabled ?? { before: new Date(new Date().setHours(23, 59, 59, 999)) }}
                />
                {selected && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => onSelect(undefined)}
                        >
                            清除日期
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
