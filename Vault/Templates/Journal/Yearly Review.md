<%*
const yearMatch = tp.file.title.match(/^(\d{4})$/);
const year = yearMatch ? Number(yearMatch[1]) : moment().year();
tR += `---\ntype: journal\nperiod: yearly\n---\n\n# ${year}\n`;
%>

## Year at a Glance

```dataviewjs
await dv.view("System/Views/Chronicle/Evidence", { period: "yearly" })
```

> [!note]- How to use these prompts
> Use the questions that are useful. You do not need to answer every question.

## The Year in Review

> [!question]- Review prompts
> - What changed most during the year?
> - Which decisions had the largest effect?
> - Which milestones changed what became possible?
> - Which plans were abandoned or replaced?
> - What became true about VISCERIUM that was not true one year ago?

-

## What Strengthened VISCERIUM

> [!question]- Review prompts
> - Which work created the most value?
> - What became more distinctive?
> - Which strengths became difficult to reproduce?
> - Which strengths depend on several parts of VISCERIUM working together?
> - Which strengths became more useful because your systems supported them?
> - What should you protect or develop further?

-

## What Should Change

> [!question]- Review prompts
> - What repeatedly caused friction?
> - What consumed effort without sufficient value?
> - Which assumptions were wrong?
> - What became less important during the year?
> - What should you stop, reduce, simplify, or rebuild?
> - What problem will become worse if you ignore it?

-

## Next Year

> [!question]- Review prompts
> - What does VISCERIUM need most next year?
> - Which existing strengths should receive more attention?
> - Which weaknesses need deliberate work?
> - What should become possible by the end of next year?
> - What should you deliberately not pursue?
> - Which directions deserve long-term attention?

-
