import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LayoutDashboard, Package, Tags, ShoppingBag, Users, Boxes, Settings, Plus, Pencil, Trash2, Upload, X, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/lib/store/state';
import { money, priceOf, storeConfig, type Product } from '@/lib/store/catalog';
import { IMAGE_BUCKET, signImages } from '@/lib/store/repository';
import { buildVariants, nextStatuses, parseList, toDraft, validateProductDraft, type DraftVariant, type OrderStatus } from '@/lib/store/admin-helpers';
import { toast } from 'sonner';

const sections = [['Dashboard', LayoutDashboard], ['Products', Package], ['Categories', Tags], ['Orders', ShoppingBag], ['Customers', Users], ['Inventory', Boxes], ['Settings', Settings]] as const;
const label = (s: string) => s.replace(/_/g, ' ');

type OrderItem = { id: string; name: string; size: string; color: string; quantity: number; unit_price: number; image: string | null };
type Order = { id: string; order_number: number; user_id: string; status: OrderStatus; payment_status: string; total: number; customer_name: string; customer_phone: string; customer_email: string | null; address: unknown; note: string | null; created_at: string; order_items: OrderItem[] };
type Customer = { id: string; full_name: string | null; phone: string | null; created_at: string };
type Cat = { id: string; name: string; sort_order: number };

export function AdminPage() {
  const { products, refresh } = useStore();
  const [tab, setTab] = useState('Dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);

  const loadCats = useCallback(async () => { const { data } = await supabase.from('categories').select('id,name,sort_order').order('sort_order'); setCats(data ?? []); }, []);
  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('id,order_number,user_id,status,payment_status,total,customer_name,customer_phone,customer_email,address,note,created_at,order_items(id,name,size,color,quantity,unit_price,image)').order('created_at', { ascending: false }).limit(200);
    if (error) toast.error('Could not load orders.'); else setOrders(data as unknown as Order[]);
  }, []);
  const loadCustomers = useCallback(async () => { const { data } = await supabase.from('profiles').select('id,full_name,phone,created_at').order('created_at', { ascending: false }).limit(500); setCustomers(data ?? []); }, []);
  useEffect(() => { void loadCats(); void loadOrders(); void loadCustomers(); void refresh(); }, [loadCats, loadOrders, loadCustomers, refresh]);

  const paid = orders.filter(o => o.payment_status === 'paid');
  const toShip = orders.filter(o => ['paid', 'processing', 'needs_attention'].includes(o.status)).length;
  const lowStock = products.flatMap(p => p.variants.filter(v => v.stock <= p.lowStockThreshold).map(v => ({ p, v })));

  async function removeProduct(p: Product) {
    if (!confirm(`Delete “${p.name}”? This cannot be undone. Past orders keep their details.`)) return;
    await supabase.from('product_variants').delete().eq('product_id', p.id);
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) return toast.error('Could not delete product.');
    const paths = (p.imagePaths ?? []).filter(i => !i.startsWith('/') && !i.startsWith('http'));
    if (paths.length) await supabase.storage.from(IMAGE_BUCKET).remove(paths);
    toast.success('Product deleted'); void refresh();
  }
  async function toggleActive(p: Product) {
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    if (error) toast.error('Could not update product.'); else void refresh();
  }
  async function setStock(id: string, stock: number) {
    if (!Number.isInteger(stock) || stock < 0) return toast.error('Stock must be 0 or more.');
    const { error } = await supabase.from('product_variants').update({ stock }).eq('id', id);
    if (error) toast.error('Could not save stock.'); else { toast.success('Stock saved'); void refresh(); }
  }

  return <main className="wrap section">
    <div className="mb-7"><p className="eyebrow text-muted-foreground mb-3">YOUTH FASHION / STORE MANAGEMENT</p><h1 className="page-title">STORE ADMIN</h1></div>
    <div className="admin-layout border-t">
      <aside className="md:border-r md:py-6 md:pr-6"><nav className="flex overflow-auto md:grid gap-2 py-4 md:py-0">{sections.map(([l, Icon]) => <Button key={l} variant={tab === l ? 'default' : 'ghost'} className="justify-start shrink-0" onClick={() => setTab(l)}><Icon />{l}</Button>)}</nav></aside>
      <section className="py-6 md:pl-8 min-w-0">
        <div className="flex justify-between items-center gap-3 mb-8"><h2 className="text-4xl uppercase">{tab}</h2>{tab === 'Products' && <Button onClick={() => setEditing(null)}><Plus />ADD PRODUCT</Button>}</div>

        {tab === 'Dashboard' && <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">{([['Products', products.length], ['Paid orders', paid.length], ['To fulfil', toShip], ['Revenue (paid)', money(paid.reduce((n, o) => n + o.total, 0))]] as const).map(([l, v]) => <div key={l} className="border p-5"><p className="text-[10px] text-muted-foreground mb-4">{l}</p><p className="font-display text-4xl">{v}</p></div>)}</div>
          <h3 className="text-3xl mb-5">LOW STOCK</h3>
          {lowStock.length ? <div className="divide-y">{lowStock.slice(0, 8).map(({ p, v }) => <div key={v.id} className="py-3 flex justify-between text-xs"><span>{p.name} · {v.color} / {v.size}</span><span className={v.stock === 0 ? 'text-destructive' : ''}>{v.stock} left</span></div>)}</div> : <p className="text-xs text-muted-foreground">All sizes and colours are above their low-stock level.</p>}
          <Button className="mt-7" variant="outline" onClick={() => setTab('Orders')}>VIEW ORDERS <ArrowUpRight /></Button>
        </>}

        {tab === 'Products' && (products.length ? <div className="overflow-x-auto"><table className="w-full text-xs min-w-[560px]"><thead><tr className="text-left border-b text-muted-foreground"><th className="pb-4">Product</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{products.map(p => <tr className="border-b" key={p.id}>
          <td className="py-4"><div className="flex items-center gap-3">{p.images[0] ? <img src={p.images[0]} alt="" className="w-11 h-14 object-cover" /> : <div className="w-11 h-14 bg-muted" />}<div><p className="font-semibold">{p.name}</p><p className="text-muted-foreground mt-1">{p.category}</p></div></div></td>
          <td>{money(priceOf(p))}{p.discountPrice && <span className="line-through text-muted-foreground ml-1">{money(p.price)}</span>}</td><td>{p.stock}</td>
          <td><Button variant={p.active ? 'secondary' : 'outline'} size="sm" onClick={() => toggleActive(p)}>{p.active ? 'Active' : 'Hidden'}</Button><p className="text-[10px] text-muted-foreground mt-1">{[p.featured && 'Featured', p.newArrival && 'New'].filter(Boolean).join(' · ')}</p></td>
          <td><div className="flex justify-end"><Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => removeProduct(p)}><Trash2 /></Button></div></td></tr>)}</tbody></table></div>
          : <Empty icon={Package} title="NO PRODUCTS YET." text="Add your first product with photos, sizes, colours and stock." />)}

        {tab === 'Inventory' && (products.length ? <div className="grid gap-6">{products.map(p => <div key={p.id} className="border p-4"><p className="font-semibold text-sm mb-3">{p.name} <span className="text-muted-foreground font-normal">· {p.category}</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{p.variants.map(v => <label key={v.id} className="text-[11px]"><span className={v.stock <= p.lowStockThreshold ? 'text-destructive' : 'text-muted-foreground'}>{v.color} / {v.size}</span>
            <input type="number" min={0} className="mt-1" defaultValue={v.stock} key={`${v.id}-${v.stock}`} aria-label={`${p.name} ${v.color} ${v.size} stock`} onBlur={e => { const n = Number(e.target.value); if (n !== v.stock) void setStock(v.id, n); }} /></label>)}</div></div>)}
          <p className="text-[11px] text-muted-foreground">Change a number and tap outside the box to save.</p></div>
          : <Empty icon={Boxes} title="NO STOCK YET." text="Add products first." />)}

        {tab === 'Categories' && <Categories cats={cats} products={products} reload={loadCats} />}
        {tab === 'Orders' && <Orders orders={orders} reload={loadOrders} />}
        {tab === 'Customers' && (customers.length ? <div className="overflow-x-auto"><table className="w-full text-xs min-w-[520px]"><thead><tr className="text-left border-b text-muted-foreground"><th className="pb-4">Customer</th><th>Mobile</th><th>Orders</th><th>Total paid</th><th>Joined</th></tr></thead><tbody>{customers.map(c => { const mine = orders.filter(o => o.user_id === c.id); return <tr key={c.id} className="border-b"><td className="py-3">{c.full_name || '—'}</td><td>{c.phone || '—'}</td><td>{mine.length}</td><td>{money(mine.filter(o => o.payment_status === 'paid').reduce((n, o) => n + o.total, 0))}</td><td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td></tr>; })}</tbody></table></div> : <Empty icon={Users} title="NO CUSTOMERS YET." text="Customers appear here after they create an account." />)}
        {tab === 'Settings' && <div className="grid gap-4 max-w-lg text-xs">{[['Store name', storeConfig.name], ['Store address', storeConfig.address], ['Instagram', storeConfig.instagram], ['WhatsApp number', storeConfig.whatsappNumber || 'Not set yet'], ['Google Maps link', storeConfig.mapsUrl]].map(([l, v]) => <div key={l} className="border-b pb-3"><p className="text-muted-foreground mb-1">{l}</p><p className="break-all">{v}</p></div>)}<p className="text-muted-foreground leading-6">Ask your developer to change these details.</p></div>}
      </section>
    </div>
    {editing !== undefined && <ProductForm product={editing} cats={cats.map(c => c.name)} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); void refresh(); }} />}
  </main>;
}

function Empty({ icon: Icon, title, text }: { icon: typeof Package; title: string; text: string }) {
  return <div className="text-center py-16"><Icon className="size-8 mx-auto mb-5" /><h3 className="text-3xl">{title}</h3><p className="text-muted-foreground text-xs mt-4">{text}</p></div>;
}

function Categories({ cats, products, reload }: { cats: Cat[]; products: Product[]; reload: () => Promise<void> }) {
  const [name, setName] = useState('');
  async function add(e: FormEvent) {
    e.preventDefault(); const n = name.trim(); if (!n) return;
    if (cats.some(c => c.name.toLowerCase() === n.toLowerCase())) return toast.error('That category already exists.');
    const { error } = await supabase.from('categories').insert({ name: n, sort_order: cats.length });
    if (error) return toast.error('Could not add category.');
    setName(''); toast.success('Category added'); void reload();
  }
  async function del(c: Cat) {
    if (products.some(p => p.category === c.name)) return toast.error('Move or delete the products in this category first.');
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) toast.error('Could not delete category.'); else void reload();
  }
  return <><form className="flex gap-3 mb-8" onSubmit={add}><input aria-label="New category name" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} required /><Button type="submit" className="h-11"><Plus />ADD</Button></form>
    <div className="grid sm:grid-cols-2 gap-3">{cats.map(c => <div className="border p-5 flex justify-between items-center" key={c.id}><div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground mt-2">{products.filter(p => p.category === c.name).length} products</p></div><Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => del(c)}><Trash2 /></Button></div>)}</div></>;
}

function Orders({ orders, reload }: { orders: Order[]; reload: () => Promise<void> }) {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  async function update(o: Order, patch: { status?: OrderStatus; note?: string }) {
    const { error } = await supabase.from('orders').update(patch).eq('id', o.id);
    if (error) toast.error(error.message.includes('Unpaid') ? 'Unpaid orders can only be cancelled.' : 'Could not update order.');
    else { toast.success('Order updated'); void reload(); }
  }
  const list = orders.filter(o => filter === 'all' || o.status === filter);
  if (!orders.length) return <Empty icon={ShoppingBag} title="NO ORDERS YET." text="Orders appear here as soon as customers check out." />;
  return <><select className="mb-6 max-w-xs" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter orders"><option value="all">All orders</option>{['paid', 'processing', 'shipped', 'delivered', 'needs_attention', 'pending_payment', 'payment_failed', 'cancelled'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
    <div className="divide-y border-y">{list.map(o => { const a = o.address as Record<string, string> | null; return <div key={o.id} className="py-4 text-xs">
      <button className="w-full grid grid-cols-[1fr_auto] gap-2 text-left" onClick={() => setOpen(open === o.id ? null : o.id)}><span><b>#{o.order_number}</b> · {o.customer_name} · {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span><span className="text-right">{money(o.total)}<br /><span className={`uppercase text-[10px] ${o.status === 'needs_attention' ? 'text-destructive' : 'text-muted-foreground'}`}>{label(o.status)} · {o.payment_status}</span></span></button>
      {open === o.id && <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">{o.order_items.map(i => <div key={i.id} className="flex justify-between gap-3"><span>{i.name} · {i.color}/{i.size} × {i.quantity}</span><span>{money(i.unit_price * i.quantity)}</span></div>)}
          <p className="text-muted-foreground pt-2 leading-5">{o.customer_phone}{o.customer_email && ` · ${o.customer_email}`}<br />{a && [a['house'], a['street'], a['city'], a['state'], a['pin']].filter(Boolean).join(', ')}</p></div>
        <div className="space-y-3">{nextStatuses(o.status).length > 0 && <label className="block">Change status<select className="mt-1" value="" onChange={e => e.target.value && update(o, { status: e.target.value as OrderStatus })}><option value="">Choose…</option>{nextStatuses(o.status).map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>}
          <label className="block">Internal note<textarea className="mt-1 w-full border p-2 bg-transparent" rows={2} defaultValue={o.note ?? ''} onBlur={e => e.target.value !== (o.note ?? '') && update(o, { note: e.target.value })} /></label></div>
      </div>}</div>; })}</div></>;
}

function ProductForm({ product, cats, onClose, onSaved }: { product: Product | null; cats: string[]; onClose: () => void; onSaved: () => void }) {
  const [sizes, setSizes] = useState(product?.sizes.join(', ') ?? 'S, M, L, XL');
  const [colors, setColors] = useState(product?.colors.join(', ') ?? 'Black');
  const [baseSku, setBaseSku] = useState(product?.sku.split('-')[0] ?? '');
  const [variants, setVariants] = useState<DraftVariant[]>(product?.variants.map(toDraft) ?? []);
  const [paths, setPaths] = useState<string[]>(product?.imagePaths ?? []);
  const [previews, setPreviews] = useState<Record<string, string>>(() => Object.fromEntries((product?.imagePaths ?? []).map((p, i) => [p, product?.images[i] ?? p])));
  const [uploading, setUploading] = useState(false), [saving, setSaving] = useState(false);
  const grid = buildVariants(parseList(sizes), parseList(colors), variants, baseSku);
  const setV = (i: number, patch: Partial<DraftVariant>) => { const g = grid.map((v, j) => j === i ? { ...v, ...patch } : v); setVariants([...variants.filter(v => !g.some(x => x.size === v.size && x.color === v.color)), ...g]); };

  async function upload(files: FileList | null) {
    if (!files?.length) return; setUploading(true);
    const added: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not a photo.`); continue; }
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is over 5 MB.`); continue; }
      const path = `products/${crypto.randomUUID()}.${f.name.split('.').pop()?.toLowerCase() || 'jpg'}`;
      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, f, { contentType: f.type });
      if (error) toast.error(`Could not upload ${f.name}.`); else added.push(path);
    }
    const signed = await signImages(added);
    setPreviews(p => ({ ...p, ...signed })); setPaths(p => [...p, ...added]); setUploading(false);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const discountRaw = String(d.get('discountPrice') ?? '').trim();
    const draft = { name: String(d.get('name')), category: String(d.get('category')), price: Number(d.get('price')), discountPrice: discountRaw ? Number(discountRaw) : undefined, variants: grid };
    const err = validateProductDraft(draft); if (err) return toast.error(err);
    setSaving(true);
    const row = { name: draft.name.trim(), category: draft.category, price: draft.price, discount_price: draft.discountPrice ?? null, description: String(d.get('description')), subcategory: String(d.get('subcategory')).trim() || null, tags: parseList(String(d.get('tags'))), images: paths, featured: d.get('featured') === 'on', new_arrival: d.get('newArrival') === 'on', active: d.get('active') === 'on', low_stock_threshold: Math.max(0, Number(d.get('lowStock')) || 0) };
    const res = product ? await supabase.from('products').update(row).eq('id', product.id).select('id').single() : await supabase.from('products').insert(row).select('id').single();
    if (res.error || !res.data) { setSaving(false); return toast.error('Could not save product.'); }
    const id = res.data.id;
    const removed = (product?.variants ?? []).filter(v => !grid.some(g => g.id === v.id)).map(v => v.id);
    if (removed.length) await supabase.from('product_variants').delete().in('id', removed);
    for (const v of grid) {
      const r = v.id ? await supabase.from('product_variants').update({ size: v.size, color: v.color, sku: v.sku.trim(), stock: v.stock }).eq('id', v.id) : await supabase.from('product_variants').insert({ product_id: id, size: v.size, color: v.color, sku: v.sku.trim(), stock: v.stock });
      if (r.error) { setSaving(false); return toast.error(r.error.code === '23505' ? `SKU ${v.sku} is already used by another product.` : 'Could not save stock.'); }
    }
    setSaving(false); toast.success(product ? 'Product updated' : 'Product added'); onSaved();
  }

  const field = (name: string, l: string, def: string | number = '', type = 'text', req = false) => <label className="text-xs">{l}<input className="mt-2" name={name} type={type} defaultValue={def} required={req} min={type === 'number' ? 0 : undefined} /></label>;
  return <Dialog open onOpenChange={o => !o && onClose()}><DialogContent className="max-w-3xl max-h-[90dvh] overflow-auto">
    <DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle><DialogDescription>Saved straight to your shop.</DialogDescription>
    <form onSubmit={save} className="grid grid-cols-2 gap-4">
      <div className="col-span-2">{field('name', 'Name', product?.name, 'text', true)}</div>
      <label className="text-xs">Category<select name="category" className="mt-2" defaultValue={product?.category ?? cats[0]} required>{cats.map(c => <option key={c}>{c}</option>)}</select></label>
      {field('subcategory', 'Subcategory (optional)', product?.subcategory ?? '')}
      {field('price', 'Price (₹)', product?.price ?? '', 'number', true)}
      {field('discountPrice', 'Discount price (₹, optional)', product?.discountPrice ?? '', 'number')}
      <label className="text-xs col-span-2">Description<textarea name="description" rows={3} className="mt-2 w-full border p-2 bg-transparent" defaultValue={product?.description} /></label>
      {field('tags', 'Tags (comma separated, e.g. Casual, Street Style)', product?.tags.join(', ') ?? '')}
      {field('lowStock', 'Low-stock warning at', product?.lowStockThreshold ?? 3, 'number')}

      <div className="col-span-2"><p className="text-xs mb-2">Photos (first is the main photo)</p><div className="flex flex-wrap gap-3">
        {paths.map((p, i) => <div key={p} className="relative w-20 h-24 border"><img src={previews[p] ?? p} alt="" className="w-full h-full object-cover" />
          <button type="button" aria-label="Remove photo" className="absolute top-0 right-0 bg-background p-0.5" onClick={() => setPaths(paths.filter(x => x !== p))}><X className="size-3" /></button>
          {i > 0 && <button type="button" className="absolute bottom-0 inset-x-0 bg-background text-[9px]" onClick={() => setPaths([p, ...paths.filter(x => x !== p)])}>MAKE MAIN</button>}</div>)}
        <label className="w-20 h-24 border border-dashed grid place-items-center cursor-pointer text-[10px] text-center">{uploading ? <Loader2 className="size-4 animate-spin" /> : <span><Upload className="size-4 mx-auto mb-1" />ADD</span>}<input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={e => { void upload(e.target.files); e.target.value = ''; }} /></label>
      </div></div>

      <label className="text-xs">Sizes (comma separated)<input className="mt-2" value={sizes} onChange={e => setSizes(e.target.value)} /></label>
      <label className="text-xs">Colours (comma separated)<input className="mt-2" value={colors} onChange={e => setColors(e.target.value)} /></label>
      <label className="text-xs">SKU prefix<input className="mt-2" value={baseSku} onChange={e => setBaseSku(e.target.value.toUpperCase())} placeholder="e.g. TSH01" /></label>
      <div />
      <div className="col-span-2 overflow-x-auto"><p className="text-xs mb-2">Stock for each size and colour</p><table className="w-full text-xs min-w-[420px]"><thead><tr className="text-left text-muted-foreground border-b"><th className="pb-2">Colour / Size</th><th>SKU</th><th>Stock</th></tr></thead><tbody>
        {grid.map((v, i) => <tr key={`${v.color}-${v.size}`} className="border-b"><td className="py-2">{v.color} / {v.size}</td><td><input value={v.sku} onChange={e => setV(i, { sku: e.target.value })} aria-label={`SKU ${v.color} ${v.size}`} /></td><td><input type="number" min={0} className="max-w-24" value={v.stock} onChange={e => setV(i, { stock: Math.floor(Number(e.target.value)) })} aria-label={`Stock ${v.color} ${v.size}`} /></td></tr>)}
      </tbody></table></div>

      <div className="col-span-2 flex flex-wrap gap-5 text-xs">{([['active', 'Show in shop', product?.active ?? true], ['featured', 'Featured', product?.featured ?? false], ['newArrival', 'New arrival', product?.newArrival ?? true]] as const).map(([n, l, v]) => <label key={n} className="flex items-center gap-2"><input type="checkbox" name={n} defaultChecked={v} className="w-4 h-4" />{l}</label>)}</div>
      <div className="col-span-2 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>CANCEL</Button><Button type="submit" disabled={saving || uploading}>{saving && <Loader2 className="animate-spin" />}SAVE PRODUCT</Button></div>
    </form>
  </DialogContent></Dialog>;
}
