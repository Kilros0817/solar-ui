'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ContractCreation } from '../../components/ContractCreation';
import { useUser } from '../../contexts/UserContext';
import { useNewContract } from '../../contexts/NewContractContext';
import { USER_ROLE, URLs } from '@/utils/constants';
import { ContractTemplate } from '../../data/templates';
import { FileText } from 'lucide-react';

const blankTemplate: ContractTemplate = {
  id: 'blank',
  name: 'Blank Contract',
  description: 'Start from scratch',
  category: 'Custom',
  icon: FileText,
  createdDate: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  createdBy: 'System',
  sectionIds: [],
};

export default function NewContractCreatePage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { templateId } = useNewContract();

  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
      return;
    }
    if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId || templateId === 'blank') {
        setSelectedTemplate(blankTemplate);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${URLs.ContractAPI}/${encodeURIComponent(templateId)}`);
        const data = await res.json();
        if (res.ok && data.item) {
          const item = data.item;
          setSelectedTemplate({
            id: item.id ?? item.templateId ?? '',
            name: item.name,
            description: item.description,
            category: item.category,
            icon: FileText,
            createdDate: item.createdDate ?? new Date().toISOString(),
            lastModified: item.lastModified ?? new Date().toISOString(),
            createdBy: item.createdBy ?? 'System',
            sectionIds: item.sectionIds ?? [],
          });
        } else {
          setError('Template not found');
          setSelectedTemplate(blankTemplate);
        }
      } catch (err) {
        console.error('Failed to fetch template:', err);
        setError('Failed to load template');
        setSelectedTemplate(blankTemplate);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const handleBack = () => {
    router.push('/new-contract');
  };

  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="p-6">
        <p className="text-destructive">{error || 'Template not found'}</p>
        <button onClick={handleBack} className="mt-4 text-sm underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <ContractCreation
      onBack={handleBack}
      selectedTemplate={selectedTemplate}
    />
  );
}
