'use client'

import { LegalReviewSectionList } from '@/app/legal-review/LegalReviewSectionList';

export default function LegalReviewReviewPage() {
  return (
    <LegalReviewSectionList
      title="In review (Legal)"
      subtitle="Sections submitted to Legal Review. Open a section to view or review."
      statusFilter={1}
      emptyMessage="No sections in review (status 1)."
    />
  );
}
