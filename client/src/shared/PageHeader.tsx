type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-brass">{eyebrow}</p> : null}
      <h1 className="text-4xl font-bold text-white sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-white/70">{description}</p>
    </div>
  );
}
