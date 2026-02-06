'use client';

import type { AppLayoutContext } from '@/components/hoc/withAppLayout';
import { withAppLayout } from '@/components/hoc/withAppLayout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Edit,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Table as TableIcon,
  Trash,
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
  category?: string;
  createdAt?: string | Date;
  imageUrl?: string;
}

interface ProductListProps {
  layout: AppLayoutContext;
}

interface UpdatedProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
  category?: string;
  createdAt?: string | Date;
  imageUrl?: string;
}

const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Le prix doit être positif'),
  stockQuantity: z.coerce
    .number()
    .int()
    .min(0, 'La quantité doit être positive'),
  imageUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  category: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductList: React.FC<ProductListProps> = ({ layout }) => {
  const { tenantId, tenant } = layout;
  const { t, locale } = useI18n();
  const intlLocale =
    locale === 'en'
      ? 'en-US'
      : locale === 'lb' || locale === 'ar'
      ? 'ar'
      : locale === 'zh'
      ? 'zh-CN'
      : 'fr-FR';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet & Form State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    imageUrl: '',
    category: '',
  });
  const [formErrors, setFormErrors] = useState<
    Record<string, { message: string }>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      imageUrl: '',
      category: '',
    });
    setEditingId(null);
    setFormErrors({});
    setImageFile(null);
  };

  const handleOpenSheet = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stockQuantity: product.stockQuantity || 0,
        imageUrl: product.imageUrl || '',
        category: product.category || '',
      });
    } else {
      resetForm();
    }
    setImageFile(null);
    setIsSheetOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (formErrors['imageUrl']) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['imageUrl'];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Validate
      const validatedData = productSchema.parse(formData);

      if (!tenantId) return;

      const url = editingId
        ? `/api/${tenantId}/products/${editingId}`
        : `/api/${tenantId}/products`;

      const method = editingId ? 'PATCH' : 'POST';

      const form = new FormData();
      form.append('name', validatedData.name);
      if (validatedData.description)
        form.append('description', validatedData.description);
      form.append('price', String(validatedData.price));
      form.append('stockQuantity', String(validatedData.stockQuantity));
      if (validatedData.category)
        form.append('category', validatedData.category);
      // Only set isAvailable on creation to default true
      if (!editingId) {
        form.append('isAvailable', 'true');
      }
      if (imageFile) {
        form.append('image', imageFile);
      }

      const response = await fetch(url, {
        method,
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Erreur lors de la ${
              editingId ? 'modification' : 'création'
            } du produit`
        );
      }

      // Success
      if (editingId) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? data.data : p))
        );
        toast.success(t('products.update.success'));
      } else {
        setProducts((prev) => [data.data, ...prev]);
        toast.success(t('products.create.success'));
      }

      setIsSheetOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, { message: string }> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = { message: err.message };
          }
        });
        setFormErrors(newErrors);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t('products.delete.confirm'))) return;

    try {
      const response = await fetch(`/api/${tenantId}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('products.delete.error'));
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success(t('products.delete.success'));
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetch(`/api/${tenantId}/products`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setProducts(data.data);
          } else if (Array.isArray(data)) {
            setProducts(data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch products', err);
          toast.error(t('products.load.error'));
        })
        .finally(() => setLoading(false));
    }
  }, [tenantId]);

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((pId) => pId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(intlLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date?: string | Date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  });

  const outOfStockProducts = filteredProducts.filter(
    (p) => (p.stockQuantity ?? 0) <= 0
  );

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className='container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'
    >
      {/* Header Section */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white'>
            {t('products.title')}
          </h1>
          <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1'>
            {t('products.subtitle').replace('{name}', tenant?.name || tenantId)}
          </p>
        </div>

        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) resetForm();
          }}
        >
          <SheetTrigger asChild>
            <Button
              className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white'
              onClick={() => handleOpenSheet()}
            >
              <Plus className='h-4 w-4 mr-2' />
              {t('products.sheet.createTitle')}
            </Button>
          </SheetTrigger>
          <SheetContent className='overflow-y-auto sm:max-w-md'>
            <SheetHeader>
              <SheetTitle>
                {editingId
                  ? t('products.sheet.editTitle')
                  : t('products.sheet.createTitle')}
              </SheetTitle>
              <SheetDescription>
                {editingId
                  ? t('products.sheet.editDescription')
                  : t('products.sheet.createDescription')}
              </SheetDescription>
            </SheetHeader>

            <div className='grid gap-6 py-6'>
              {/* Name */}
              <Field>
                <FieldLabel>{t('products.sheet.fields.name')}</FieldLabel>
                <Input
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('products.sheet.placeholders.name')}
                />
                <FieldError errors={[formErrors.name]} />
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel>
                  {t('products.sheet.fields.description')}
                </FieldLabel>
                <textarea
                  name='description'
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder={t('products.sheet.placeholders.description')}
                  className='flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
                />
                <FieldError errors={[formErrors.description]} />
              </Field>

              <div className='grid grid-cols-2 gap-4'>
                {/* Price */}
                <Field>
                  <FieldLabel>{t('products.sheet.fields.price')}</FieldLabel>
                  <Input
                    name='price'
                    type='number'
                    step='0.01'
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                  <FieldError errors={[formErrors.price]} />
                </Field>

                {/* Stock */}
                <Field>
                  <FieldLabel>{t('products.sheet.fields.stock')}</FieldLabel>
                  <Input
                    name='stockQuantity'
                    type='number'
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                  />
                  <FieldError errors={[formErrors.stockQuantity]} />
                </Field>
              </div>

              {/* Category */}
              <Field>
                <FieldLabel>{t('products.sheet.fields.category')}</FieldLabel>
                <Input
                  name='category'
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  placeholder={t('products.sheet.placeholders.category')}
                />
                <FieldError errors={[formErrors.category]} />
              </Field>

              {/* Image URL */}
              <Field>
                <FieldLabel>{t('products.sheet.fields.image')}</FieldLabel>
                <Input
                  type='file'
                  name='image'
                  accept='image/*'
                  onChange={handleFileChange}
                />
                <FieldError errors={[formErrors.imageUrl]} />
              </Field>
            </div>

            <SheetFooter>
              <Button variant='outline' onClick={() => setIsSheetOpen(false)}>
                {t('products.sheet.actions.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className='bg-blue-600 hover:bg-blue-700'
              >
                {isSubmitting
                  ? editingId
                    ? t('products.sheet.actions.submittingEdit')
                    : t('products.sheet.actions.submittingCreate')
                  : editingId
                  ? t('products.sheet.actions.submitEdit')
                  : t('products.sheet.actions.submitCreate')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Out of Stock Alert */}
      <AnimatePresence>
        {outOfStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='rounded-xl bg-red-50/50 dark:bg-red-950/10 p-4 sm:p-6 border border-red-100 dark:border-red-900/20'
          >
            <div className='flex items-center gap-2 mb-4'>
              <div className='relative flex h-3 w-3'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-3 w-3 bg-red-500'></span>
              </div>
              <h2 className='text-lg sm:text-xl font-semibold tracking-tight text-red-900 dark:text-red-200'>
                {t('products.outOfStock.title').replace(
                  '{count}',
                  String(outOfStockProducts.length)
                )}
              </h2>
            </div>
            <div className='flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory'>
              {outOfStockProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className='min-w-[260px] sm:min-w-[280px] flex-none snap-start border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all'>
                    <CardContent className='p-4 sm:p-5 space-y-4'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='space-y-1 flex-1'>
                          <div
                            className='font-bold text-base sm:text-lg line-clamp-1'
                            title={p.name}
                          >
                            {p.name}
                          </div>
                          <p className='text-xs text-muted-foreground uppercase font-medium'>
                            {p.category || 'Sans catégorie'}
                          </p>
                        </div>
                        {p.imageUrl && (
                          <div className='relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 border bg-muted'>
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              className='object-cover'
                              sizes='48px'
                            />
                          </div>
                        )}
                      </div>

                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div className='space-y-1'>
                          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                            {t('products.outOfStock.priceLabel')}
                          </p>
                          <p className='font-semibold text-base'>
                            {new Intl.NumberFormat(intlLocale, {
                              style: 'currency',
                              currency: 'XOF',
                              maximumFractionDigits: 0,
                            }).format(p.price)}
                          </p>
                        </div>
                        <div className='space-y-1 text-right'>
                          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                            {t('products.outOfStock.stockLabel')}
                          </p>
                          <Badge variant='destructive' className='px-2'>
                            {t('products.outOfStock.stockBadge')}
                          </Badge>
                        </div>
                      </div>

                      <div className='flex items-center justify-between pt-2 gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full'
                          onClick={() => handleOpenSheet(p)}
                        >
                          <Edit className='size-4 mr-2' />
                          {t('products.outOfStock.editButton')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Products Card */}
      <Card className='border-0 shadow-sm bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800'>
        <CardHeader className='p-4 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg'>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div className='flex items-center gap-2'>
              <CardTitle className='text-base sm:text-lg md:text-xl font-semibold'>
                {t('products.list.title')}
              </CardTitle>
              <Badge variant='secondary' className='text-xs px-2 py-0.5'>
                {filteredProducts.length}
              </Badge>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-56 md:w-64 min-w-[180px] sm:min-w-[200px]'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <Input
                type='search'
                placeholder={t('products.list.searchPlaceholder')}
                className='pl-9 h-9 sm:h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              className='hidden md:flex items-center gap-2 h-9 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm'
            >
              {t('products.list.categories')}
              <ChevronDown className='h-3.5 w-3.5 opacity-50' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex items-center gap-2 h-9 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm'
            >
              <ListFilter className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>
                {t('products.list.filter')}
              </span>
            </Button>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className={`h-9 w-9 ${
                  viewMode === 'table'
                    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : ''
                }`}
                onClick={() => setViewMode('table')}
                aria-label={t('products.list.view.tableAria')}
              >
                <TableIcon className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                className={`h-9 w-9 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : ''
                }`}
                onClick={() => setViewMode('grid')}
                aria-label={t('products.list.view.gridAria')}
              >
                <LayoutGrid className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {viewMode === 'table' ? (
            <>
              {/* Desktop/Tablet Table View */}
              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader className='bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10'>
                    <TableRow className='hover:bg-transparent border-b border-gray-200 dark:border-gray-700'>
                      <TableHead className='w-[50px] pl-4 sm:pl-6 py-3'>
                        <Checkbox
                          checked={
                            filteredProducts.length > 0 &&
                            selectedProducts.length === filteredProducts.length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label={t('products.aria.selectAll')}
                        />
                      </TableHead>
                      <TableHead className='min-w-[220px] sm:min-w-[250px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('products.table.headers.product')}
                      </TableHead>
                      <TableHead className='hidden lg:table-cell min-w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('products.table.headers.id')}
                      </TableHead>
                      <TableHead className='hidden xl:table-cell min-w-[130px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('products.table.headers.date')}
                      </TableHead>
                      <TableHead className='min-w-[110px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('products.table.headers.price')}
                      </TableHead>
                      <TableHead className='min-w-[90px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center'>
                        {t('products.table.headers.stock')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center'>
                        {t('products.table.headers.status')}
                      </TableHead>
                      <TableHead className='w-[80px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('products.table.headers.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className='h-32 text-center text-gray-500 py-8'
                        >
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <Package className='h-8 w-8 text-gray-400' />
                            <p className='text-sm'>
                              {searchQuery
                                ? t('products.table.empty.search')
                                : t('products.table.empty.noData')}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50'
                        >
                          <TableCell className='pl-4 sm:pl-6 py-3'>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() =>
                                toggleSelectProduct(product.id)
                              }
                              aria-label={`Sélectionner ${product.name}`}
                            />
                          </TableCell>
                          <TableCell className='py-3'>
                            <div className='flex items-center gap-3'>
                              <div className='relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700'>
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className='object-cover'
                                    sizes='56px'
                                  />
                                ) : (
                                  <span className='flex h-full w-full items-center justify-center text-lg sm:text-xl font-bold text-gray-500 dark:text-gray-400'>
                                    {product.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className='min-w-0 flex-1'>
                                <div className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate mb-0.5'>
                                  {product.name}
                                </div>
                                <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                  {product.category ||
                                    t('products.category.uncategorized')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='hidden lg:table-cell py-3'>
                            <span className='font-mono text-xs text-gray-500 dark:text-gray-400'>
                              {product.id.substring(0, 8).toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className='hidden xl:table-cell py-3'>
                            <div className='flex flex-col'>
                              <span className='text-sm text-gray-900 dark:text-gray-200'>
                                {formatDate(product.createdAt || new Date())}
                              </span>
                              <span className='text-xs text-gray-500 dark:text-gray-400'>
                                {formatTime(product.createdAt || new Date())}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='py-3 text-right'>
                            <span className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white whitespace-nowrap'>
                              {new Intl.NumberFormat(intlLocale, {
                                style: 'currency',
                                currency: 'XOF',
                                maximumFractionDigits: 0,
                              }).format(product.price)}
                            </span>
                          </TableCell>
                          <TableCell className='py-3 text-center'>
                            <Badge
                              variant='secondary'
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                                (product.stockQuantity ?? 0) > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                  : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                              }`}
                            >
                              {product.stockQuantity ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className='py-3 text-center'>
                            <Badge
                              variant='secondary'
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold border whitespace-nowrap ${
                                product.isAvailable
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                              }`}
                            >
                              {product.isAvailable
                                ? t('products.status.available')
                                : t('products.status.unavailable')}
                            </Badge>
                          </TableCell>
                          <TableCell className='py-3 text-right'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                >
                                  <MoreHorizontal className='h-4 w-4' />
                                  <span className='sr-only'>Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleOpenSheet(product)}
                                  className='cursor-pointer'
                                >
                                  <Edit className='mr-2 h-4 w-4' />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(product.id)}
                                  className='text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/20'
                                >
                                  <Trash className='mr-2 h-4 w-4' />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Compact Card View */}
              <div className='md:hidden space-y-3 p-3 sm:p-4'>
                {filteredProducts.length === 0 ? (
                  <div className='text-center text-gray-500 py-12'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <Package className='h-8 w-8 text-gray-400' />
                      <p className='text-sm'>
                        {searchQuery
                          ? 'Aucun produit trouvé pour cette recherche.'
                          : 'Aucun produit trouvé.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all active:scale-[0.98]'>
                          <CardContent className='p-4'>
                            <div className='flex items-start gap-3'>
                              {/* Checkbox */}
                              <div className='pt-1.5'>
                                <Checkbox
                                  checked={selectedProducts.includes(
                                    product.id
                                  )}
                                  onCheckedChange={() =>
                                    toggleSelectProduct(product.id)
                                  }
                                  aria-label={t(
                                    'products.aria.selectProduct'
                                  ).replace('{name}', product.name)}
                                />
                              </div>

                              {/* Product Image */}
                              <div className='relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700'>
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className='object-cover'
                                    sizes='64px'
                                  />
                                ) : (
                                  <span className='flex h-full w-full items-center justify-center text-xl font-bold text-gray-500 dark:text-gray-400'>
                                    {product.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-start justify-between gap-2 mb-3'>
                                  <div className='flex-1 min-w-0'>
                                    <h3 className='font-semibold text-base text-gray-900 dark:text-white truncate mb-1'>
                                      {product.name}
                                    </h3>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                      {product.category ||
                                        t('products.category.uncategorized')}
                                    </p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8 text-gray-500 flex-shrink-0 -mt-1'
                                      >
                                        <MoreHorizontal className='h-4 w-4' />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align='end'
                                      className='w-48'
                                    >
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => handleOpenSheet(product)}
                                        className='cursor-pointer'
                                      >
                                        <Edit className='mr-2 h-4 w-4' />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(product.id)}
                                        className='text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/20'
                                      >
                                        <Trash className='mr-2 h-4 w-4' />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Product Details Grid */}
                                <div className='grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800'>
                                  <div>
                                    <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                      {t('products.outOfStock.priceLabel')}
                                    </p>
                                    <p className='font-bold text-base text-gray-900 dark:text-white'>
                                      {new Intl.NumberFormat(intlLocale, {
                                        style: 'currency',
                                        currency: 'XOF',
                                        maximumFractionDigits: 0,
                                      }).format(product.price)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                      {t('products.outOfStock.stockLabel')}
                                    </p>
                                    <Badge
                                      variant='secondary'
                                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        (product.stockQuantity ?? 0) > 0
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                          : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                      }`}
                                    >
                                      {product.stockQuantity ?? 0}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                      {t('products.table.headers.status')}
                                    </p>
                                    <Badge
                                      variant='secondary'
                                      className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
                                        product.isAvailable
                                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                      }`}
                                    >
                                      {product.isAvailable
                                        ? t('products.status.available')
                                        : t('products.status.unavailable')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                      {t('products.table.headers.date')}
                                    </p>
                                    <p className='text-xs text-gray-900 dark:text-gray-200 font-medium'>
                                      {formatDate(
                                        product.createdAt || new Date()
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </>
          ) : (
            <div className='p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {filteredProducts.length === 0 ? (
                <div className='col-span-full text-center text-gray-500 py-12'>
                  {searchQuery
                    ? t('products.table.empty.search')
                    : t('products.table.empty.noData')}
                </div>
              ) : (
                <AnimatePresence>
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card className='group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all'>
                        <CardContent className='p-4 space-y-3'>
                          <div className='flex items-start gap-3'>
                            <div className='relative h-16 w-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0'>
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  className='object-cover'
                                  sizes='64px'
                                />
                              ) : (
                                <span className='flex h-full w-full items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-400'>
                                  {product.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-gray-900 dark:text-white truncate'>
                                {product.name}
                              </div>
                              <div className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                {product.category ||
                                  t('products.category.uncategorized')}
                              </div>
                              <div className='text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1'>
                                {new Intl.NumberFormat(intlLocale, {
                                  style: 'currency',
                                  currency: 'XOF',
                                  maximumFractionDigits: 0,
                                }).format(product.price)}
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800'>
                            <Badge
                              variant='secondary'
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                product.isAvailable
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                              }`}
                            >
                              {product.isAvailable
                                ? t('products.status.available')
                                : t('products.status.unavailable')}
                            </Badge>
                            <div className='flex items-center gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => handleOpenSheet(product)}
                                title={t('products.dropdown.edit')}
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-red-600 hover:text-red-700'
                                onClick={() => handleDelete(product.id)}
                                title={t('products.dropdown.delete')}
                              >
                                <Trash className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </CardContent>

        {filteredProducts.length > 0 && (
          <div className='p-4 border-t border-gray-100 dark:border-gray-800'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href='#' />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href='#' isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href='#' />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default withAppLayout(ProductList, {
  requireAuth: true,
  showLoading: true,
});
