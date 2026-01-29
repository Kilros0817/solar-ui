'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractList } from '../components/ContractList';
import { ContractDetails } from '../components/ContractDetails';
import { ContractCreation } from '../components/ContractCreation';
import { NewContractChoice } from '../components/NewContractChoice';
import { TemplateLibrary } from '../components/TemplateLibrary';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { ContractTemplate } from '../data/templates';
import { FileText } from 'lucide-react';

export default function PendingPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [showContractCreation, setShowContractCreation] = useState(false);
  const [showNewContractChoice, setShowNewContractChoice] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

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

  const handleCreateContract = (contractData: any) => {
    console.log('Creating contract:', contractData);
    setShowContractCreation(false);
    setSelectedTemplate(null);
    setSelectedContract(1);
  };

  const handleCreateFromTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setShowContractCreation(true);
  };

  const renderContent = () => {
    if (showNewContractChoice) {
      return (
        <NewContractChoice
          onSelectBlank={() => {
            setShowNewContractChoice(false);
            const blankTemplate: ContractTemplate = {
              id: 'blank',
              name: 'Blank Contract',
              description: 'Start from scratch',
              category: 'Custom',
              icon: FileText,
              createdDate: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              createdBy: 'System',
              sectionIds: []
            };
            handleCreateFromTemplate(blankTemplate);
          }}
          onSelectTemplate={() => {
            setShowNewContractChoice(false);
            setShowTemplateSelection(true);
          }}
          onBack={() => {
            setShowNewContractChoice(false);
          }}
        />
      );
    }

    if (showTemplateSelection) {
      return (
        <TemplateLibrary
          onSelectContractTemplate={(template) => {
            setShowTemplateSelection(false);
            handleCreateFromTemplate(template);
          }}
        />
      );
    }

    if (showContractCreation && selectedTemplate) {
      return (
        <ContractCreation
          onBack={() => {
            setShowContractCreation(false);
            setSelectedTemplate(null);
          }}
          onCreateContract={handleCreateContract}
          selectedTemplate={selectedTemplate}
        />
      );
    }

    if (selectedContract) {
      return <ContractDetails contractId={selectedContract} onBack={() => setSelectedContract(null)} />;
    }

    return (
      <ContractList
        title="Pending Review"
        filterStatus="pending"
        onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : null}
        onViewContract={(contractId) => setSelectedContract(contractId)}
      />
    );
  };

  return renderContent();
}

