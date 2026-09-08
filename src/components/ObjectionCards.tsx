export type Objection = {
  question: string;
  answer: string;
};

export function ObjectionCards({
  items,
  tone = "default",
}: {
  items: Objection[];
  tone?: "default" | "dark";
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.question}
          className={tone === "dark"
            ? "rounded-2xl border border-primary/20 bg-noir-light p-6 text-cream md:p-7"
            : "rounded-2xl border border-border bg-card p-6 md:p-7"}
        >
          <h3 className="font-display text-xl font-semibold">
            « {item.question} »
          </h3>
          <p className={tone === "dark"
            ? "mt-3 leading-relaxed text-cream/70"
            : "mt-3 leading-relaxed text-muted-foreground"}>
            {item.answer}
          </p>
        </article>
      ))}
    </div>
  );
}
