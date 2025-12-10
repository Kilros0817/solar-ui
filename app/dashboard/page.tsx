'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { RegistrationPage } from '../components/RegistrationPage'
import { ContractHeader } from '../components/ContractHeader'
import { ContractSidebar } from '../components/ContractSidebar'
import { Dashboard } from '../components/Dashboard'
import { ContractList } from '../components/ContractList'
import { ContractDetails } from '../components/ContractDetails'
import { ContractCreation } from '../components/ContractCreation'
import { TemplateLibrary } from '../components/TemplateLibrary'
import { NewContractChoice } from '../components/NewContractChoice'
import { AssignedWork } from '../components/AssignedWork'
import { TeamAssignments } from '../components/TeamAssignments'
import { MyAssignments } from '../components/MyAssignments'
import { IncomingAssignments } from '../components/IncomingAssignments'
import { ContractTemplate } from '../data/templates'
import { FileText } from 'lucide-react'
import { USER_ROLE } from '@/utils/constants'

export default function DashboardPage() {
  const router = useRouter();
  const { userRole, setUserRole } = useUser()
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
      return <ContractDetails />
    }

    // Main navigation based on active tab and user role
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : null} />
      case 'my-contracts':
        return <ContractList title={userRole === USER_ROLE.PROJECT_OWNER || userRole === USER_ROLE.ADMIN ? 'All Contracts' : 'My Contracts'} onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : null} />
      case 'pending':
        return <ContractList title="Pending Review" filterStatus="pending" onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : null} />
      case 'approved':
        return <ContractList title="Approved Contracts" filterStatus="approved" onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setShowNewContractChoice(true) : null} />
      case 'templates':
        return (
          <TemplateLibrary />
        )
      case 'assigned-work':
        return <AssignedWork />
      case 'team-assignments':
        return <TeamAssignments />
      case 'my-assignments':
        return <MyAssignments />
      case 'incoming':
        return <IncomingAssignments />
      case 'team':
        // Team page is now at /divisions route for legal team
        // Other roles can have different team views later
        return (
          <div className="p-6">
            <h1>{userRole === USER_ROLE.DIVISION_LEADER ? 'My Team' : userRole === USER_ROLE.PROJECT_OWNER ? 'Organization' : userRole === USER_ROLE.ADMIN ? 'User Management' : 'Team'}</h1>
            <p className="text-muted-foreground">Team management interface will be displayed here</p>
          </div>
        )
      case 'analytics':
        return (
          <div className="p-6">
            <h1>{userRole === USER_ROLE.ADMIN ? 'System Analytics' : 'Analytics'}</h1>
            <p className="text-muted-foreground">Contract analytics will be displayed here</p>
          </div>
        )
      case 'settings':
        return (
          <div className="p-6">
            <h1>Settings</h1>
            <p className="text-muted-foreground">System settings will be displayed here</p>
          </div>
        )
      default:
        return <Dashboard onCreateContract={() => userRole === USER_ROLE.LEGAL_TEAM ? setActiveTab('my-contracts') : null} />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ContractHeader />
      <div className="flex-1 flex">
        <ContractSidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSelectedContract(null)
            setShowContractCreation(false)
            setSelectedTemplate(null)
            setShowNewContractChoice(false)
            setShowTemplateSelection(false)
          }} 
        />
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}

