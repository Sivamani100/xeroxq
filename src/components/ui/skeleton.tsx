import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#171717]/[0.07] dark:bg-white/[0.08]", className)}
      {...props}
    />
  )
}

export { Skeleton }
