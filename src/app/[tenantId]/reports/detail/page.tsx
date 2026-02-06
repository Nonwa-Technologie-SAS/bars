'use client';

import { withAppLayout, type AppLayoutContext } from '@/components/hoc/withAppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Mail, MessageCircle, Printer } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type Period = 'day' | 'week' | 'month' | 'year' | 'custom';

interface ReportItem {
  productId: string;
  name: string;
  category?: string | null;
  unitPrice?: number | null;
  soldQty: number;
  revenue: number;
  stockRemaining: number;
}

interface ReportResponse {
  items: ReportItem[];
  totals: {
    totalRevenue: number;
    totalItemsSold: number;
    productCount: number;
    from: string | Date;
    to: string | Date;
    period: Period;
  };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
    amount || 0,
  );

const formatDate = (value: string | Date) => {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('fr-FR', { dateStyle: 'medium' });
};

interface DetailPageProps {
  layout: AppLayoutContext;
}

const ReportDetailPage: React.FC<DetailPageProps> = ({ layout }) => {
  const { tenantId } = layout;
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [sortBy, setSortBy] = useState<'revenue' | 'soldQty' | 'name'>(
    'revenue',
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showTable, setShowTable] = useState(true);
  const router = useRouter();

  const sortedItems = useMemo(() => {
    if (!report?.items) return [];
    const arr = [...report.items];
    arr.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const av = sortBy === 'soldQty' ? a.soldQty : a.revenue;
      const bv = sortBy === 'soldQty' ? b.soldQty : b.revenue;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [report, sortBy, sortDir]);

  useEffect(() => {
    if (!tenantId) return;
    const id = params.get('id');
    if (!id) return;

    const controller = new AbortController();
    let cancelled = false;

    const fetchReport = async () => {
      try {
        const url = new URL(
          `/api/${tenantId}/reports/${id}`,
          window.location.origin,
        );

        const res = await fetch(url.toString(), { signal: controller.signal });
        
        if (!res.ok) {
          throw new Error('Report not found');
        }

        const data: ReportResponse = await res.json();
        
        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        // Ignorer AbortError (navigation/démontage) pour ne pas polluer la console
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching report:', err);
        if (!cancelled) {
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchReport();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tenantId, params]);

  const handleExportPDF = () => window.print();

  const getShareText = (data: ReportResponse) => {
    const p = data?.totals
      ? `${formatDate(data.totals.from)} → ${formatDate(data.totals.to)}`
      : '';
    const total = formatCurrency(data?.totals?.totalRevenue ?? 0);
    const qty = data?.totals?.totalItemsSold ?? 0;
    return `Rapport (${p}): ${total} (${qty} ventes). Détail: ${window.location.href}`;
  };

  const handleEmail = () => {
    if (!report) return;
    const subject = 'Détail du rapport de vente';
    const body = `Voici le rapport détaillé.\n${getShareText(report)}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleWhatsApp = () => {
    if (!report) return;
    const text = `Voici le rapport détaillé.\n${getShareText(report)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return <div className='p-8 text-center'>Chargement du rapport...</div>;
  }

  if (!report) {
    return (
      <div className='p-8 text-center space-y-4'>
        <p>Aucun rapport trouvé ou ID manquant.</p>
        <Button variant='outline' onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6 pb-20 print:p-0 w-full'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Détail du rapport
            </h1>
            <p className='text-muted-foreground'>
              Période: {formatDate(report.totals.from)} -{' '}
              {formatDate(report.totals.to)}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => setShowTable(!showTable)}>
            {showTable ? 'Masquer le tableau' : 'Voir le tableau'}
          </Button>
          <Button variant='outline' onClick={handleExportPDF}>
            <Printer className='mr-2 h-4 w-4' /> Imprimer / PDF
          </Button>
          <Button variant='outline' onClick={handleEmail}>
            <Mail className='mr-2 h-4 w-4' /> Email
          </Button>
          <Button variant='outline' onClick={handleWhatsApp}>
            <MessageCircle className='mr-2 h-4 w-4' /> WhatsApp
          </Button>
        </div>
      </div>

      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full'>
        <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-blue-900 dark:text-blue-100'>
              Revenu Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>
              {formatCurrency(report.totals.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-green-900 dark:text-green-100'>
              Quantité Vendue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-700 dark:text-green-300'>
              {report.totals.totalItemsSold}
            </div>
          </CardContent>
        </Card>
        <Card className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-purple-900 dark:text-purple-100'>
              Produits distincts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-700 dark:text-purple-300'>
              {report.totals.productCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {showTable && (
        <Card>
          <CardHeader>
            <CardTitle>Détail par produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className='cursor-pointer'
                      onClick={() => {
                        setSortBy('name');
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Produit{' '}
                      {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className='text-right cursor-pointer'
                      onClick={() => {
                        setSortBy('soldQty');
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Qté Vendue{' '}
                      {sortBy === 'soldQty' && (sortDir === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className='text-right'>Stock Restant</TableHead>
                    <TableHead className='text-right'>Prix Unitaire</TableHead>
                    <TableHead
                      className='text-right cursor-pointer'
                      onClick={() => {
                        setSortBy('revenue');
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Recette{' '}
                      {sortBy === 'revenue' && (sortDir === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className='font-medium'>
                        {item.name}
                        {item.category && (
                          <span className='ml-2 text-xs text-muted-foreground'>
                            ({item.category})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.soldQty}
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.stockRemaining}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(item.unitPrice || 0)}
                      </TableCell>
                      <TableCell className='text-right font-bold'>
                        {formatCurrency(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withAppLayout(ReportDetailPage);
