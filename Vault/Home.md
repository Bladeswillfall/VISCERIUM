---
cssclasses:
  - viscerium-home
headerImage: Assets/Images/errack-header.webp
decorativeImage: true
homeImagePosition: 50% 46%
homeCreativeLine: Make something worth returning to.
focusTitle: Published Lore
focusDescription: Review the published Codex and its source notes.
focusPrimary: System/Bases/Publishing.base
focusPrimaryLabel: Continue focus
focusSecondary: System/SOPs/Codex Publishing and Deployment SOP
focusSecondaryLabel: Publishing guide
---
> [!home-hero]
> ```dataviewjs
> await dv.view("System/Views/Home/Hero");
> ```

> [!home-continue] Continue working
> ```dataviewjs
> await dv.view("System/Views/Home/Continue");
> ```

> [!home-attention] Needs attention
> ```dataviewjs
> await dv.view("System/Views/Home/Attention");
> ```

> [!home-secondary]
> > [!home-chronicle] Chronicle
> > ```dataviewjs
> > await dv.view("System/Views/Home/Chronicle");
> > ```
>
> > [!home-activity] Progress
> > ```dataviewjs
> > await dv.view("System/Views/Home/Activity");
> > ```

> [!home-navigate] Navigate
> ```dataviewjs
> await dv.view("System/Views/Home/Navigate");
> ```
