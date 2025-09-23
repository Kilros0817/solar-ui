// Seed data for the application
export function seedContracts() {
  const existingContracts = JSON.parse(localStorage.getItem("contracts") || "[]");
  
  // For demo purposes, always seed the dummy data
  // In production, you might want to check if contracts already exist

  const dummyContracts = [
    {
      id: "contract-1",
      title: "Software License Agreement",
      description: "Annual software license renewal for enterprise tools",
      contractValue: 125000,
      priority: "Medium",
      clientCompany: "TechCorp Solutions",
      assignedDivision: "legal",
      divisions: [
        {
          id: "legal",
          name: "Legal",
          sections: [
            {
              title: "Terms and Conditions",
              clauses: [
                "License is valid for 12 months from effective date",
                "Renewal requires 30-day written notice",
                "Usage limited to 500 concurrent users"
              ]
            },
            {
              title: "Payment Terms",
              clauses: [
                "Payment due within 30 days of invoice",
                "Late fees apply after 45 days",
                "Annual payment discount of 5% available"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "legal": {
          "Terms and Conditions": [
            { clauseIndex: 0, assignedTo: "member-1", assignedAt: new Date().toISOString() },
            { clauseIndex: 1, assignedTo: "member-2", assignedAt: new Date().toISOString() },
            { clauseIndex: 2, assignedTo: "member-1", assignedAt: new Date().toISOString() }
          ],
          "Payment Terms": [
            { clauseIndex: 0, assignedTo: "member-3", assignedAt: new Date().toISOString() },
            { clauseIndex: 1, assignedTo: "member-2", assignedAt: new Date().toISOString() },
            { clauseIndex: 2, assignedTo: "member-1", assignedAt: new Date().toISOString() }
          ]
        }
      }
    },
    {
      id: "contract-2",
      title: "Office Equipment Purchase",
      description: "Bulk purchase of office equipment and furniture",
      contractValue: 75000,
      priority: "High",
      clientCompany: "OfficeMax Supplies",
      assignedDivision: "procurement",
      divisions: [
        {
          id: "procurement",
          name: "Procurement",
          sections: [
            {
              title: "Equipment Specifications",
              clauses: [
                "All equipment must meet ISO 9001 standards",
                "Delivery within 60 days of order confirmation",
                "Warranty coverage for minimum 2 years"
              ]
            },
            {
              title: "Delivery Terms",
              clauses: [
                "Free delivery for orders over $50,000",
                "Installation services included",
                "Damage inspection within 48 hours of delivery"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "procurement": {
          "Equipment Specifications": [
            { clauseIndex: 0, assignedTo: "member-4", assignedAt: new Date().toISOString() },
            { clauseIndex: 1, assignedTo: "member-5", assignedAt: new Date().toISOString() },
            { clauseIndex: 2, assignedTo: "member-4", assignedAt: new Date().toISOString() }
          ],
          "Delivery Terms": [
            { clauseIndex: 0, assignedTo: "member-6", assignedAt: new Date().toISOString() },
            { clauseIndex: 1, assignedTo: "member-5", assignedAt: new Date().toISOString() },
            { clauseIndex: 2, assignedTo: "member-6", assignedAt: new Date().toISOString() }
          ]
        }
      }
    },
    {
      id: "contract-3",
      title: "Financial Services Agreement",
      description: "Banking and financial services partnership",
      contractValue: 200000,
      priority: "Critical",
      clientCompany: "First National Bank",
      assignedDivision: "finance",
      divisions: [
        {
          id: "finance",
          name: "Finance",
          sections: [
            {
              title: "Service Level Agreement",
              clauses: [
                "99.9% uptime guarantee required",
                "Response time under 2 hours for critical issues",
                "Monthly performance reports required"
              ]
            },
            {
              title: "Compliance Requirements",
              clauses: [
                "Must comply with SOX regulations",
                "Annual audit rights for both parties",
                "Data security standards must be maintained"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "finance": {
          "Service Level Agreement": [
            { clauseIndex: 0, assignedTo: "member-7", assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-8", assignedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-7", assignedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
          ],
          "Compliance Requirements": [
            { clauseIndex: 0, assignedTo: "member-8", assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-7", assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-8", assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
          ]
        }
      }
    },
    {
      id: "contract-4",
      title: "IT Infrastructure Contract",
      description: "Cloud infrastructure and support services",
      contractValue: 300000,
      priority: "Medium",
      clientCompany: "CloudTech Solutions",
      assignedDivision: "operations",
      divisions: [
        {
          id: "operations",
          name: "Operations",
          sections: [
            {
              title: "Infrastructure Requirements",
              clauses: [
                "Redundant systems for high availability",
                "24/7 monitoring and support",
                "Scalability to handle 10x current load"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "operations": {
          "Infrastructure Requirements": [
            { clauseIndex: 0, assignedTo: "member-9", assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-10", assignedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-9", assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      }
    },
    {
      id: "contract-5",
      title: "Regulatory Compliance Audit",
      description: "Annual compliance audit and certification",
      contractValue: 50000,
      priority: "Low",
      clientCompany: "Compliance Partners LLC",
      assignedDivision: "compliance",
      divisions: [
        {
          id: "compliance",
          name: "Compliance",
          sections: [
            {
              title: "Audit Scope",
              clauses: [
                "Full compliance review of all processes",
                "Documentation review and verification",
                "Recommendations for improvement required"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "compliance": {
          "Audit Scope": [
            { clauseIndex: 0, assignedTo: "member-11", assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-12", assignedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-11", assignedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      }
    },
    {
      id: "contract-6",
      title: "Marketing Services Agreement",
      description: "Digital marketing and advertising services contract",
      contractValue: 85000,
      priority: "Medium",
      clientCompany: "Creative Marketing Co",
      assignedDivision: "legal",
      divisions: [
        {
          id: "legal",
          name: "Legal",
          sections: [
            {
              title: "Service Terms",
              clauses: [
                "Campaign delivery within agreed timelines",
                "Performance metrics reporting monthly",
                "Creative approval process defined"
              ]
            },
            {
              title: "Payment Schedule",
              clauses: [
                "50% upfront payment required",
                "Remaining 50% upon completion",
                "Late payment fees apply after 15 days"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "legal": {
          "Service Terms": [
            { clauseIndex: 0, assignedTo: "member-1", assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-2", assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-3", assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          "Payment Schedule": [
            { clauseIndex: 0, assignedTo: "member-1", assignedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-2", assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-3", assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
          ]
        }
      }
    },
    {
      id: "contract-7",
      title: "HR Software License",
      description: "Annual HR management software subscription",
      contractValue: 45000,
      priority: "Low",
      clientCompany: "HR Solutions Inc",
      assignedDivision: "procurement",
      divisions: [
        {
          id: "procurement",
          name: "Procurement",
          sections: [
            {
              title: "License Terms",
              clauses: [
                "Single user license per seat",
                "Annual renewal required",
                "Support included for 12 months"
              ]
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      clauseAllocations: {
        "procurement": {
          "License Terms": [
            { clauseIndex: 0, assignedTo: "member-4", assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 1, assignedTo: "member-5", assignedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { clauseIndex: 2, assignedTo: "member-6", assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      }
    }
  ];

  localStorage.setItem("contracts", JSON.stringify(dummyContracts));
}

export function seedMembers() {
  const existingMembers = JSON.parse(localStorage.getItem("divisionMembers") || "[]");
  
  // For demo purposes, always seed the dummy data
  // In production, you might want to check if members already exist

  const dummyMembers = [
    { id: "member-1", name: "Sarah Johnson", division: "legal", role: "Senior Legal Associate" },
    { id: "member-2", name: "Michael Chen", division: "legal", role: "Legal Associate" },
    { id: "member-3", name: "Emily Rodriguez", division: "legal", role: "Legal Assistant" },
    { id: "member-4", name: "David Kim", division: "procurement", role: "Procurement Specialist" },
    { id: "member-5", name: "Lisa Thompson", division: "procurement", role: "Senior Procurement Manager" },
    { id: "member-6", name: "James Wilson", division: "procurement", role: "Procurement Coordinator" },
    { id: "member-7", name: "Anna Martinez", division: "finance", role: "Financial Analyst" },
    { id: "member-8", name: "Robert Taylor", division: "finance", role: "Senior Financial Manager" },
    { id: "member-9", name: "Jennifer Brown", division: "operations", role: "Operations Manager" },
    { id: "member-10", name: "Kevin Davis", division: "operations", role: "IT Operations Specialist" },
    { id: "member-11", name: "Amanda White", division: "compliance", role: "Compliance Officer" },
    { id: "member-12", name: "Christopher Lee", division: "compliance", role: "Senior Compliance Analyst" }
  ];

  localStorage.setItem("divisionMembers", JSON.stringify(dummyMembers));
}
