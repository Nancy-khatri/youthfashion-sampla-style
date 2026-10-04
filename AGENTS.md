<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Storefront architecture
- Keep storefront screens in reusable store components and thin TanStack file routes; this maintains one shared layout and route-specific metadata.
- Route all catalog access through the typed product repository; demo data must remain explicitly marked and replaceable by a database adapter.
- Keep cart, wishlist, recently viewed and admin demo edits in session-only React state; no customer details or live orders are persisted before a backend is connected.
- Keep business contact destinations in one store configuration; a missing WhatsApp number must show an honest Instagram fallback, not a fabricated link.
- Checkout and admin are frontend previews only; production payments, authenticated roles, inventory and order persistence require server-verified integrations.
- The runtime remains TanStack Start; future database, Cloudinary, Razorpay and WhatsApp adapters must use server functions without exposing private keys.
- Product types, categories, demo rows, config and repository live in separate src/lib/store modules re-exported by catalog.ts; customer views only show active products via visible()/filterProducts.
