'use client';

import type { AppLayoutContext } from '@/components/hoc/withAppLayout';
import { withAppLayout } from '@/components/hoc/withAppLayout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ExternalLink,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { useMemo } from 'react';

interface HelpPageProps {
  layout: AppLayoutContext;
}

function HelpPage({ layout }: HelpPageProps) {
  const { t } = useI18n();

  const FAQ_ITEMS = useMemo(
    () => [
      {
        q: t('help.faq.items.0.q'),
        a: t('help.faq.items.0.a'),
      },
      {
        q: t('help.faq.items.1.q'),
        a: t('help.faq.items.1.a'),
      },
      {
        q: t('help.faq.items.2.q'),
        a: t('help.faq.items.2.a'),
      },
      {
        q: t('help.faq.items.3.q'),
        a: t('help.faq.items.3.a'),
      },
      {
        q: t('help.faq.items.4.q'),
        a: t('help.faq.items.4.a'),
      },
    ],
    [t],
  );
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className='min-h-screen bg-gray-50/50 dark:bg-gray-950'
    >
      {/* En-tête */}
      <div className='z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-start gap-4'>
            <div className='h-12 w-12 shrink-0 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
              <HelpCircle className='h-6 w-6' />
            </div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                {t('help.title')}
              </h1>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                {t('help.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
        {/* FAQ */}
        <Card className='border-border/50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <BookOpen className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              {t('help.faq.title')}
            </CardTitle>
            <CardDescription>
              {t('help.faq.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className='p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40 hover:border-border transition-colors'
              >
                <p className='font-semibold text-foreground mb-2'>{item.q}</p>
                <p className='text-sm text-muted-foreground'>{item.a}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className='border-border/50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <MessageSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              {t('help.contact.title')}
            </CardTitle>
            <CardDescription>
              {t('help.contact.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid sm:grid-cols-2 gap-4'>
              <a
                href='mailto:support@bars-app.com'
                className='flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group'
              >
                <div className='h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
                  <Mail className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400'>
                    {t('help.contact.email.label')}
                  </p>
                  <p className='text-sm text-muted-foreground truncate'>
                    support@bars-app.com
                  </p>
                </div>
                <ExternalLink className='h-4 w-4 text-muted-foreground shrink-0' />
              </a>
              <a
                href='tel:+237XXXXXXXXX'
                className='flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group'
              >
                <div className='h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
                  <Phone className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400'>
                    {t('help.contact.phone.label')}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    +237 XXX XXX XXX
                  </p>
                </div>
                <ExternalLink className='h-4 w-4 text-muted-foreground shrink-0' />
              </a>
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('help.contact.responseTime')}
            </p>
          </CardContent>
        </Card>

        {/* Liens utiles */}
        <Card className='border-border/50'>
          <CardHeader>
            <CardTitle className='text-lg'>{t('help.resources.title')}</CardTitle>
            <CardDescription>
              {t('help.resources.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-3'>
              <a
                href={`/${layout.tenantId}/settings`}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors'
              >
                <BookOpen className='h-4 w-4' />
                {t('help.resources.settingsLink')}
              </a>
              <a
                href={`/${layout.tenantId}/settings#faq`}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors'
              >
                <HelpCircle className='h-4 w-4' />
                {t('help.resources.faqLink')}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.main>
  );
}

export default withAppLayout(HelpPage, {
  requireAuth: true,
  showLoading: true,
});
