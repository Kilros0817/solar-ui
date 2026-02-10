'use client'

import { LegalReviewSectionList } from '@/app/legal-review/LegalReviewSectionList';

export default function LegalReviewApprovedPage() {
  return (
    <LegalReviewSectionList
      title="Approved by legal"
      subtitle="Sections approved by Legal Review."
      statusFilter={2}
      emptyMessage="No sections approved by legal (status 2)."
    />
  );
}
