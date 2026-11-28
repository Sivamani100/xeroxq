import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#171717]/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] px-3 py-2 text-sm ring-offset-background placeholder:text-[#737373] dark:placeholder:text-[#85858B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB432C]/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
