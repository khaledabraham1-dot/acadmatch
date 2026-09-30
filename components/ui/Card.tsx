import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-slate-200 bg-white p-5 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
