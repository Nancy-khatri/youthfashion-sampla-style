# Future integrations

The storefront is intentionally a frontend-only demo. Do not enable live checkout without these boundaries.

- Replace `productRepository` with a server-side catalog adapter; store the shared Product schema in the database so storefront and future WhatsApp search use the same source.
- Add authenticated owner access before persisting admin edits. Never trust browser state for permissions.
- Cloudinary uploads require server-authorized signing; do not expose API secrets. Session upload previews are not stored.
- Razorpay order creation and webhook signature verification belong on the server. Recalculate prices, delivery and inventory against the live catalog. Never collect card data in this app.
- WhatsApp Cloud API and AI search require server-side tokens and validated product queries. The current WhatsApp button opens an Instagram fallback until the confirmed number is supplied.
- Customer address data is used only to validate the checkout preview and is never saved or transmitted.
- Cart, wishlist and recent views deliberately reset on full reload in this first preview. Add durable customer state only with a secure persistence layer.
- Deployment stays on TanStack Start; a future MongoDB connection must use a runtime-compatible HTTP service, not a separate Node process inside the app.

Future private environment variables (server only): CLOUDINARY_API_SECRET, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN, CATALOG_SERVICE_TOKEN. Provision through secret management when integrations are enabled; never commit values.
