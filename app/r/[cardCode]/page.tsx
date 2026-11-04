import React from 'react';
import { getCardByCode } from '@/lib/data-service';
import CardResolver from '@/components/customer/CardResolver';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: {
    cardCode: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const cleanCode = (params.cardCode || '').trim().toUpperCase();
  const result = await getCardByCode(cleanCode);
  if (!result) {
    return { title: 'Stand Review — Tapzzy' };
  }
  if (!result.business || result.card.status === 'unassigned') {
    return {
      title: `Activate Stand ${cleanCode} — Tapzzy`,
      description: `Link hardware stand ${cleanCode} to your business review link.`,
    };
  }
  return {
    title: `Review ${result.business.name} — Tapzzy`,
    description: `Leave a review for ${result.business.name} via Tapzzy NFC & QR card.`,
  };
}

export default async function CustomerReviewPage({ params }: Props) {
  const cleanCode = (params.cardCode || '').trim().toUpperCase();
  const result = await getCardByCode(cleanCode);
  return <CardResolver cardCode={cleanCode} initialResult={result} />;
}
