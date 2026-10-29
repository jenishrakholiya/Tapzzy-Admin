import React from 'react';
import { getCardByCode } from '@/lib/data-service';
import CardResolver from '@/components/customer/CardResolver';

interface Props {
  params: {
    cardCode: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const result = await getCardByCode(params.cardCode);
  if (!result) {
    return { title: 'Stand Review — Tapyy' };
  }
  if (!result.business || result.card.status === 'unassigned') {
    return {
      title: `Activate Stand ${params.cardCode} — Tapyy`,
      description: `Link hardware stand ${params.cardCode} to your business review link.`,
    };
  }
  return {
    title: `Review ${result.business.name} — Tapyy`,
    description: `Leave a review for ${result.business.name} via Tapyy NFC & QR card.`,
  };
}

export default async function CustomerReviewPage({ params }: Props) {
  const result = await getCardByCode(params.cardCode);
  return <CardResolver cardCode={params.cardCode} initialResult={result} />;
}
