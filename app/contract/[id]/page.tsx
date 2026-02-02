'use client';

import { useParams, useRouter } from 'next/navigation';
import { ContractDetails } from '../../components/ContractDetails';

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? parseInt(String(params.id), 10) : 1;

  return (
    <ContractDetails
      contractId={id}
      onBack={() => router.back()}
    />
  );
}
