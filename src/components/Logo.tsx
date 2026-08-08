export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <span className="text-lg leading-none">R</span>
      </span>
      <span className="text-lg">
        Ref<span className="text-primary">ai</span>
      </span>
    </a>
  );
}

