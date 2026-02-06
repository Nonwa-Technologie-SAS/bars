'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Package, Plus, Search, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ProductsResponse =
  | Product[]
  | { data?: Product[]; message?: string; success: boolean };

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const MarketplacePage: React.FC = () => {
  const params = useSearchParams();
  const tenantId = params.get('tenantId') || params.get('tenant') || '';
  const tableId = params.get('tableId') || params.get('table') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const url = new URL(`/api/${tenantId}/products`, window.location.origin);
    url.searchParams.set('availableOnly', 'true');
    const q = search.trim();
    if (q) url.searchParams.set('query', q);
    if (categoryFilter) url.searchParams.set('category', categoryFilter);
    fetch(url.toString(), { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ProductsResponse) => {
        const list = Array.isArray(data) ? data : data.data || [];
        const time = (v: unknown) =>
          typeof v === 'string'
            ? new Date(v).getTime()
            : v instanceof Date
            ? v.getTime()
            : 0;
        setProducts(list.sort((a, b) => time(b.createdAt) - time(a.createdAt)));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch products', err);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [tenantId, search, categoryFilter]);

  useEffect(() => {
    if (!tenantId || !tableId) return;
    try {
      const key = `bars_cart_${tenantId}_${tableId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setQuantities(parsed || {});
      }
    } catch {}
  }, [tenantId, tableId]);

  useEffect(() => {
    if (!tenantId || !tableId) return;
    try {
      const key = `bars_cart_${tenantId}_${tableId}`;
      localStorage.setItem(key, JSON.stringify(quantities));
    } catch {}
  }, [tenantId, tableId, quantities]);

  const filtered = products;

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ) as string[],
    [products]
  );

  const cartItems = useMemo(() => {
    return Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        return product ? { product, quantity: qty } : null;
      })
      .filter(Boolean) as Array<{ product: Product; quantity: number }>;
  }, [quantities, products]);

  const total = cartItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );

  const inc = (id: string) =>
    setQuantities((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const dec = (id: string) =>
    setQuantities((q) => {
      const next = Math.max(0, (q[id] || 0) - 1);
      return { ...q, [id]: next };
    });
  const setQty = (id: string, qty: number) =>
    setQuantities((q) => ({
      ...q,
      [id]: Math.max(0, Math.min(99, Math.floor(qty || 0))),
    }));
  const clearCart = () => setQuantities({});

  const placeOrder = async () => {
    if (!tenantId || !tableId) {
      toast.error('QR invalide: tenantId ou tableId manquant');
      return;
    }
    if (cartItems.length === 0) {
      toast.info('Ajoutez des produits au panier');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/${tenantId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          tableId,
          items: cartItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Commande créée');
        clearCart();
        setCartOpen(false);
      } else {
        toast.error(json?.error || 'Échec de la création de commande');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  if (!tenantId || !tableId) {
    return (
      <main className='min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className='max-w-md w-full border-gray-200 dark:border-gray-800 shadow-lg'>
            <CardHeader>
              <CardTitle className='text-gray-900 dark:text-white'>
                QR invalide
              </CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              Paramètres manquants. Scannez le QR d&apos;une table pour accéder
              au menu.
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className='relative min-h-screen p-4 sm:p-6 overflow-x-hidden bg-slate-50 dark:bg-slate-950'>
      {/* Fond décoratif */}
      <div className='absolute inset-0 -z-10 overflow-hidden pointer-events-none'>
        <div className='absolute -top-32 -left-24 w-[40vw] h-[40vw] rounded-full bg-blue-200/30 dark:bg-blue-900/25 blur-3xl' />
        <div className='absolute bottom-[-20%] -right-16 w-[45vw] h-[45vw] rounded-full bg-indigo-200/30 dark:bg-indigo-900/25 blur-3xl' />
      </div>

      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl border border-white/10'
        >
          <div className='px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className='space-y-1'>
              <div className='text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2'>
                <span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur text-sm font-bold'>
                  Be
                </span>
                <span className='text-white'>Mart</span>
              </div>
              <p className='text-xs sm:text-sm text-blue-100/90 max-w-md'>
                Choisissez vos produits, ajustez les quantités puis validez
                votre commande pour cette table.
              </p>
              {tableId && (
                <div className='mt-1 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] sm:text-xs text-blue-50'>
                  <span className='font-medium'>Table</span>
                  <span className='rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold'>
                    {tableId}
                  </span>
                </div>
              )}
            </div>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant='secondary'
                  className='gap-2 bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-md font-semibold'
                >
                  <ShoppingCart className='h-5 w-5' />
                  <span className='inline-flex items-center gap-2'>
                    <span className='inline-flex items-center justify-center rounded-full bg-blue-600 text-white size-6 text-xs font-bold min-w-[24px]'>
                      {cartItems.length}
                    </span>
                    <span className='hidden xs:inline'>Mon Panier</span>
                    <span className='font-bold'>{formatCurrency(total)}</span>
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side='right'
                className='w-full sm:max-w-md flex flex-col'
              >
                <SheetHeader>
                  <SheetTitle className='text-gray-900 dark:text-white'>
                    Votre panier
                  </SheetTitle>
                  <SheetDescription id='cart-description'>
                    Vérifiez les éléments avant de valider
                  </SheetDescription>
                </SheetHeader>
                <div className='flex-1 overflow-y-auto mt-6 space-y-4'>
                  {cartItems.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'
                    >
                      <ShoppingCart className='h-12 w-12 mb-3 opacity-50' />
                      <p className='text-sm'>Panier vide</p>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {cartItems.map(({ product, quantity }, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.05 }}
                          className='flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
                        >
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              className='rounded-lg object-cover shrink-0'
                            />
                          ) : (
                            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0'>
                              <Package className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-gray-900 dark:text-white truncate'>
                              {product.name}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Button
                              size='icon'
                              variant='ghost'
                              className='h-8 w-8'
                              onClick={() => dec(product.id)}
                            >
                              <Minus className='size-4' />
                            </Button>
                            <Input
                              value={quantity}
                              onChange={(e) =>
                                setQty(product.id, Number(e.target.value))
                              }
                              className='w-12 h-8 text-center text-sm'
                              type='number'
                              min={0}
                              max={99}
                            />
                            <Button
                              size='icon'
                              variant='ghost'
                              className='h-8 w-8'
                              onClick={() => inc(product.id)}
                            >
                              <Plus className='size-4' />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
                <SheetFooter className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-800'>
                  <div className='w-full space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        Total
                      </span>
                      <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        className='flex-1 border-gray-300 dark:border-gray-700'
                        onClick={clearCart}
                      >
                        Vider
                      </Button>
                      <Button
                        className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                        onClick={placeOrder}
                        disabled={submitting || cartItems.length === 0}
                      >
                        {submitting ? 'Validation…' : 'Valider la commande'}
                      </Button>
                    </div>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </motion.header>

        {/* Produits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Card className='border-0 shadow-sm bg-white/90 dark:bg-slate-900/90 ring-1 ring-slate-200/80 dark:ring-slate-800/80 backdrop-blur'>
            <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'>
                  <Package className='h-5 w-5' />
                </div>
                <CardTitle className='text-lg sm:text-xl text-gray-900 dark:text-white'>
                  Produits disponibles
                </CardTitle>
              </div>
              <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
                <div className='relative w-full sm:w-72'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Rechercher…'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='pl-9 h-10 bg-gray-50 dark:bg-slate-900/70 border-gray-200 dark:border-slate-700 focus-visible:ring-blue-600 text-sm'
                  />
                </div>
                {categories.length > 0 ? (
                  <div className='flex gap-2 overflow-x-auto pb-1 sm:pb-0'>
                    <Button
                      variant={categoryFilter === '' ? 'default' : 'outline'}
                      size='sm'
                      className={
                        categoryFilter === ''
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shrink-0'
                          : 'shrink-0 border-slate-200 dark:border-slate-700'
                      }
                      onClick={() => setCategoryFilter('')}
                    >
                      Tous
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={categoryFilter === cat ? 'default' : 'outline'}
                        size='sm'
                        className={
                          categoryFilter === cat
                            ? 'bg-blue-600 hover:bg-blue-700 shrink-0'
                            : 'shrink-0'
                        }
                        onClick={() =>
                          setCategoryFilter(categoryFilter === cat ? '' : cat)
                        }
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className='p-4 sm:p-6'>
              {loading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className='space-y-3'>
                      <Skeleton className='h-40 w-full rounded-2xl' />
                      <Skeleton className='h-4 w-2/3' />
                      <Skeleton className='h-4 w-1/3' />
                      <Skeleton className='h-10 w-full rounded-lg' />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex flex-col items-center justify-center py-16 text-center text-muted-foreground'
                >
                  <Package className='h-14 w-14 mb-4 opacity-50' />
                  <p className='text-sm'>Aucun produit disponible</p>
                </motion.div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
                  <AnimatePresence>
                    {filtered.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        whileHover={{ y: -4 }}
                        className='group rounded-2xl overflow-hidden border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all duration-200'
                      >
                        <div className='aspect-[4/3] bg-gray-100 dark:bg-slate-800 relative overflow-hidden'>
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              className='object-cover transition-transform duration-300 group-hover:scale-105'
                              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw'
                            />
                          ) : (
                            <div className='absolute inset-0 flex items-center justify-center'>
                              <Package className='h-12 w-12 text-gray-400 dark:text-gray-500' />
                            </div>
                          )}
                          <div className='absolute top-2 right-2'>
                            <Badge
                              variant='secondary'
                              className={
                                (p.stockQuantity ?? 0) > 0
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0'
                              }
                            >
                              {(p.stockQuantity ?? 0) > 0
                                ? 'En stock'
                                : 'Rupture'}
                            </Badge>
                          </div>
                        </div>
                        <div className='p-4 space-y-3'>
                          <div className='space-y-1'>
                            <div className='font-semibold text-gray-900 dark:text-white line-clamp-2'>
                              {p.name}
                            </div>
                            {p.category && (
                              <p className='text-xs text-muted-foreground'>
                                {p.category}
                              </p>
                            )}
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-base font-bold text-blue-600 dark:text-blue-400'>
                              {formatCurrency(p.price)}
                            </span>
                            {(p.stockQuantity ?? 0) > 0 && (
                              <span className='text-[11px] text-muted-foreground'>
                                {p.stockQuantity} en stock
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-2 pt-1'>
                            <Button
                              size='icon'
                              variant='outline'
                              className='h-9 w-9 shrink-0 border-gray-200 dark:border-gray-700'
                              onClick={() => dec(p.id)}
                            >
                              <Minus className='size-4' />
                            </Button>
                            <Input
                              value={quantities[p.id] || 0}
                              onChange={(e) =>
                                setQty(p.id, Number(e.target.value))
                              }
                              className='w-14 h-9 text-center text-sm focus-visible:ring-blue-600'
                              type='number'
                              min={0}
                              max={99}
                            />
                            <Button
                              size='icon'
                              variant='outline'
                              className='h-9 w-9 shrink-0 border-gray-200 dark:border-gray-700'
                              onClick={() => inc(p.id)}
                            >
                              <Plus className='size-4' />
                            </Button>
                            <Button
                              size='sm'
                              className='ml-auto h-9 bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-full px-4'
                              onClick={() => setCartOpen(true)}
                            >
                              <ShoppingCart className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Barre fixe panier */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 px-4'
          >
            <div className='mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl flex items-center justify-between px-4 py-3 ring-1 ring-gray-200 dark:ring-gray-800'>
              <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                Total{' '}
                <span className='text-blue-600 dark:text-blue-400'>
                  {formatCurrency(total)}
                </span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-gray-300 dark:border-gray-700'
                  onClick={clearCart}
                >
                  Vider
                </Button>
                <Button
                  size='sm'
                  className='bg-blue-600 hover:bg-blue-700 text-white'
                  onClick={() => setCartOpen(true)}
                >
                  Voir le panier
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default MarketplacePage;
