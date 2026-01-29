'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext'
import { Dashboard } from '../components/Dashboard'
import { ContractDetails } from '../components/ContractDetails'
import { ContractCreation } from '../components/ContractCreation'
import { NewContractChoice } from '../components/NewContractChoice'
import { TemplateLibrary } from '../components/TemplateLibrary'
import { ContractTemplate } from '../data/templates'
import { FileText } from 'lucide-react'
import { USER_ROLE } from '@/utils/constants'
import { useConnection } from 'wagmi';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';

export default function DashboardPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { isConnected } = useConnection();
  const web3Auth = getWeb3AuthInstance();
  const [selectedContract, setSelectedContract] = useState<number | null>(null)
  const [showContractCreation, setShowContractCreation] = useState(false)
  const [showNewContractChoice, setShowNewContractChoice] = useState(false)
  const [showTemplateSelection, setShowTemplateSelection] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)

  // Check connection status and redirect only if not connected
  useEffect(() => {
    // If both connections are not active, redirect to login
    if (!web3Auth?.connected && !isConnected) {
      router.push('/login');
      return;
    }
    
    // Only redirect to register if role is explicitly NO_ROLE
    if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, isConnected, web3Auth?.connected, router]);

  // If connections are not active, don't render (will redirect)
  if (!web3Auth?.connected && !isConnected) {
    return null;
  }
  
  // If role is NO_ROLE, don't render (will redirect to register)
  if (userRole === USER_ROLE.NO_ROLE) {
    return null;
  }
  
  // If role is null but connections are active, render the page
  // ContractHeader will fetch and set the role
  // The page can render with userRole as null temporarily

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
              icon: FileText,
              createdDate: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              createdBy: 'System',
              sectionIds: []
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
    return <Dashboard onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : undefined} />
  }

  return renderMainContent()
}

