import type { LucideIcon } from 'lucide-react'

interface LinkStatusViewProps {
  title: string
  description: string
  icon: LucideIcon
}

export function LinkStatusView({
  title,
  description,
  icon: Icon,
}: LinkStatusViewProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center">
      <section className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted/50">
          <Icon className="h-16 w-16 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto max-w-112.5 text-lg text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  )
}
