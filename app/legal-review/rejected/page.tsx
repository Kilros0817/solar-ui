'use client'

import { LegalReviewSectionList } from '@/app/legal-review/LegalReviewSectionList';

export default function LegalReviewRejectedPage() {
  return (
    <LegalReviewSectionList
      title="Rejected"
      subtitle="Sections rejected by Legal Review."
      statusFilter={3}
      emptyMessage="No rejected sections."
    />
  );
}
