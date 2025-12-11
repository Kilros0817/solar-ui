'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractHeader } from '../components/ContractHeader';
import { ContractSidebar } from '../components/ContractSidebar';
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
  const [activeTab, setActiveTab] = useState('pending');
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

  const handleTabChange = (tab: string) => {
    if (tab === 'team' && userRole === USER_ROLE.LEGAL_TEAM) {
      router.push('/divisions');
      return;
    }
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'my-contracts': '/my-contracts',
      'pending': '/pending',
      'approved': '/approved',
      'templates': '/templates',
      'analytics': '/analytics',
      'incoming': '/incoming',
      'assigned-work': '/assigned-work',
      'team-assignments': '/team-assignments',
      'my-assignments': '/my-assignments',
      'settings': '/settings',
    };
    const route = routeMap[tab];
    if (route) {
      router.push(route);
    }
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
              tags: [],
              usageCount: 0,
              lastUsed: null,
              lastModified: new Date().toISOString(),
              icon: FileText,
              isBlank: true,
              createdDate: new Date().toISOString(),
              createdBy: 'System',
              estimatedTime: '30-60 min',
              complexity: 'simple',
              status: 'active'
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <ContractHeader />
      <div className="flex-1 flex">
        <ContractSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

