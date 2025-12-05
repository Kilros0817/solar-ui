import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  FileText, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  User,
  Building,
  Eye,
  Edit,
  Download,
  DollarSign
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useUser } from '../contexts/UserContext';
import { 
  allContracts, 
  divisionLeadContracts, 
  divisionMemberContracts,
  ownerContracts,
  getContractsByStatus 
} from '../data/mockContracts';

interface ContractListProps {
  title: string;
  filterStatus?: string;
  onCreateContract: () => void;
}

export function ContractList({ title, filterStatus, onCreateContract }: ContractListProps) {
  const { userRole } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Get contracts based on role
  const getContractsForRole = () => {
    switch (userRole) {
      case 'legal':
        return allContracts;
      case 'division-lead':
        return divisionLeadContracts;
      case 'division-member':
        return divisionMemberContracts;
      case 'owner':
        return ownerContracts;
      default:
        return allContracts;
    }
  };

  let contracts = getContractsForRole();

  // Apply status filter
  if (filterStatus && filterStatus !== 'all') {
    contracts = getContractsByStatus(contracts, filterStatus);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'requires-action': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.client.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{title}</h1>
          <p className="text-muted-foreground">
            {userRole === 'owner' 
              ? 'Track and approve contracts you own'
              : 'Manage and track your contracts'}
          </p>
        </div>
        {userRole === 'legal' && (
          <Button onClick={onCreateContract} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)]">
            <FileText className="h-4 w-4 mr-2" />
            Create New Contract
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="client">Client Name</SelectItem>
            {userRole === 'owner' && <SelectItem value="value">Contract Value</SelectItem>}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Contract Cards */}
      <div className="grid gap-4">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{contract.name}</h3>
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status.replace('-', ' ')}
                    </Badge>
                    {contract.priority && (
                      <Badge variant={getPriorityColor(contract.priority)}>
                        {contract.priority} priority
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{contract.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{contract.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Modified {contract.lastModified}</span>
                    </div>
                  </div>
                  
                  {userRole === 'owner' && contract.value && (
                    <div className="flex items-center gap-2 mt-3 text-sm font-semibold text-emerald-600">
                      <DollarSign className="h-4 w-4" />
                      <span>{contract.value}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {userRole === 'legal' && (
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {userRole === 'legal' && (
                        <>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No contracts found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          {userRole === 'legal' && (
            <Button onClick={onCreateContract}>Create New Contract</Button>
          )}
        </div>
      )}
    </div>
  );
}