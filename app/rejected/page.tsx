'use client'

import { LegalReviewSectionList } from '@/app/legal-review/LegalReviewSectionList';

export default function RejectedPage() {
  return (
    <LegalReviewSectionList
      title="Rejected by legal"
      subtitle="Sections rejected by Legal Review."
      statusFilter={3}
      emptyMessage="No sections rejected by legal (status 3)."
    />
  );
}
