'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NewContractChoice } from '../components/NewContractChoice';
import { TemplateLibrary } from '../components/TemplateLibrary';
import { useUser } from '../contexts/UserContext';
import { useNewContract } from '../contexts/NewContractContext';
import { USER_ROLE } from '@/utils/constants';
import { ContractTemplate } from '../data/templates';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewContractPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { from, setTemplateId } = useNewContract();
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, router]);

  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  if (userRole !== USER_ROLE.LEGAL_TEAM && userRole !== USER_ROLE.ADMIN) {
    router.replace(`/${from}`);
    return null;
  }

  const handleSelectBlank = () => {
    setTemplateId('blank');
    router.push('/new-contract/create');
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    setTemplateId(template.id);
    router.push('/new-contract/create');
  };

  const handleBack = () => {
    router.push(`/${from}`);
  };

  if (showTemplateLibrary) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setShowTemplateLibrary(false)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to choice
        </Button>
        <TemplateLibrary onSelectContractTemplate={handleSelectTemplate} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <NewContractChoice
        onSelectBlank={handleSelectBlank}
        onSelectTemplate={() => setShowTemplateLibrary(true)}
        onBack={handleBack}
      />
    </div>
  );
}
