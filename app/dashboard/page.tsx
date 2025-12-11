'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { ContractHeader } from '../components/ContractHeader'
import { ContractSidebar } from '../components/ContractSidebar'
import { Dashboard } from '../components/Dashboard'
import { ContractDetails } from '../components/ContractDetails'
import { ContractCreation } from '../components/ContractCreation'
import { NewContractChoice } from '../components/NewContractChoice'
import { TemplateLibrary } from '../components/TemplateLibrary'
import { ContractTemplate } from '../data/templates'
import { FileText } from 'lucide-react'
import { USER_ROLE } from '@/utils/constants'

export default function DashboardPage() {
  const router = useRouter();
  const { userRole } = useUser()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedContract, setSelectedContract] = useState<number | null>(null)
  const [showContractCreation, setShowContractCreation] = useState(false)
  const [showNewContractChoice, setShowNewContractChoice] = useState(false)
  const [showTemplateSelection, setShowTemplateSelection] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, router]);

  // Don't render if redirecting
  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  const handleCreateContract = (contractData: any) => {
    // In a real app, this would make an API call to create the contract
    console.log('Creating contract:', contractData)
    
    // For now, let's simulate creating a contract and redirecting to contract details
    setShowContractCreation(false)
    setSelectedTemplate(null)
    setSelectedContract(1) // Simulate selecting the newly created contract
  }

  const handleCreateFromTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setShowContractCreation(true)
  }

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

  const renderMainContent = () => {
    // Show new contract choice screen
    if (showNewContractChoice) {
      return (
        <NewContractChoice
          onSelectBlank={() => {
            setShowNewContractChoice(false)
            // Create a blank template
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
            }
            handleCreateFromTemplate(blankTemplate)
          }}
          onSelectTemplate={() => {
            setShowNewContractChoice(false)
            setShowTemplateSelection(true)
          }}
          onBack={() => {
            setShowNewContractChoice(false)
          }}
        />
      )
    }

    // Show template selection
    if (showTemplateSelection) {
      return (
        <TemplateLibrary 
          onSelectContractTemplate={(template) => {
            setShowTemplateSelection(false)
            handleCreateFromTemplate(template)
          }}
        />
      )
    }

    // Show contract creation
    if (showContractCreation && selectedTemplate) {
      return (
        <ContractCreation 
          onBack={() => {
            setShowContractCreation(false)
            setSelectedTemplate(null)
          }}
          onCreateContract={handleCreateContract}
          selectedTemplate={selectedTemplate}
        />
      )
    }

    // Show contract details
    if (selectedContract) {
      return <ContractDetails contractId={selectedContract} onBack={() => setSelectedContract(null)} />
    }

    // Main dashboard view
    return <Dashboard onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : null} />
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ContractHeader />
      <div className="flex-1 flex">
        <ContractSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}

