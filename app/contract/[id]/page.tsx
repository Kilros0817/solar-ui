'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ContractDetails } from '../../components/ContractDetails';

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id ? parseInt(String(params.id), 10) : 1;
  const from = searchParams.get('from');

  return (
    <ContractDetails
      contractId={id}
      onBack={() => router.back()}
      showApproveActions={from !== 'pending'}
    />
  );
}
