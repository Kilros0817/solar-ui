"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Dummy template data
const templates = [
  {
    id: 1,
    title: "Service Agreement",
    category: "Service Contracts",
    description: "Standard service agreement template for professional services including scope, deliverables, and payment terms.",
    tags: ["Professional", "Services", "Standard"],
    estimatedTime: "15 min"
  },
  {
    id: 2,
    title: "Employment Contract",
    category: "HR & Employment",
    description: "Comprehensive employment contract template covering job responsibilities, compensation, benefits, and termination clauses.",
    tags: ["HR", "Employment", "Legal"],
    estimatedTime: "25 min"
  },
  {
    id: 3,
    title: "Software License Agreement",
    category: "Technology",
    description: "Software licensing agreement template for software distribution, usage rights, and intellectual property protection.",
    tags: ["Software", "License", "Technology"],
    estimatedTime: "20 min"
  },
  {
    id: 4,
    title: "Non-Disclosure Agreement",
    category: "Legal & Compliance",
    description: "Confidentiality agreement template to protect sensitive information and trade secrets between parties.",
    tags: ["Confidentiality", "Legal", "Protection"],
    estimatedTime: "10 min"
  },
  {
    id: 5,
    title: "Purchase Agreement",
    category: "Procurement",
    description: "Purchase agreement template for goods and services procurement including terms, conditions, and delivery schedules.",
    tags: ["Procurement", "Purchase", "Goods"],
    estimatedTime: "18 min"
  },
  {
    id: 6,
    title: "Consulting Agreement",
    category: "Professional Services",
    description: "Consulting services agreement template with project scope, deliverables, timeline, and compensation structure.",
    tags: ["Consulting", "Professional", "Project"],
    estimatedTime: "22 min"
  },
  {
    id: 7,
    title: "Lease Agreement",
    category: "Real Estate",
    description: "Property lease agreement template covering rental terms, responsibilities, and maintenance obligations.",
    tags: ["Real Estate", "Lease", "Property"],
    estimatedTime: "30 min"
  },
  {
    id: 8,
    title: "Partnership Agreement",
    category: "Business Formation",
    description: "Business partnership agreement template defining roles, responsibilities, profit sharing, and decision-making processes.",
    tags: ["Partnership", "Business", "Formation"],
    estimatedTime: "35 min"
  }
];

const categoryColors = {
  "Service Contracts": "blue",
  "HR & Employment": "green",
  "Technology": "default",
  "Legal & Compliance": "red",
  "Procurement": "yellow",
  "Professional Services": "blue",
  "Real Estate": "green",
  "Business Formation": "default"
};

export default function TemplateLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleUseTemplate = (templateId) => {
    // Redirect to new contract page with template ID
    window.location.href = `/contracts/new?template=${templateId}`;
  };

  const handleBlankDocument = () => {
    // Redirect to new contract page without template
    window.location.href = "/contracts/new";
  };

  const handleNewTemplate = () => {
    // TODO: Implement new template creation
    console.log("Creating new template");
    // This could redirect to template creation form
  };

  // Get unique categories for filter buttons
  const categories = [...new Set(templates.map(template => template.category))];

  // Filter templates based on search query and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery.trim() ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Template Library</h1>
          <p className="text-[var(--muted)] mt-2">
            Browse and manage your contract templates
          </p>
        </div>
        <div className="flex gap-2">
            <Button
              onClick={handleBlankDocument}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Blank Document (New)
            </Button>
            <Button
              onClick={handleNewTemplate}
              size="sm"
              className="flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Template
            </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search Box */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="category-filter" className="text-sm font-medium text-[var(--foreground)] whitespace-nowrap">
            Category:
          </label>
          <div className="relative flex-1 sm:flex-none">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none px-4 py-3 pr-8 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200 cursor-pointer min-w-[180px] w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-4 w-4 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
              className="text-xs px-3 py-2 bg-[var(--muted)]/20 text-[var(--muted)] rounded-md hover:bg-[var(--muted)]/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Template Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--muted)]">
          {filteredTemplates.length} of {templates.length} templates
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--foreground)] text-lg leading-tight">
                    {template.title}
                  </h3>
                  <Badge
                    variant={categoryColors[template.category] || "default"}
                    className="mt-2"
                  >
                    {template.category}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--muted)] ml-2">
                  {template.estimatedTime}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-[var(--foreground)]/5 text-[var(--muted)] rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

               <Button
                 onClick={() => handleUseTemplate(template.id)}
                 className="w-full mt-4 cursor-pointer"
                 size="sm"
               >
                 Use Template
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-[var(--muted)] text-lg">
            {(searchQuery || selectedCategory) ? "No templates found" : "No templates available"}
          </div>
          <p className="text-sm text-[var(--muted)] mt-2">
            {(searchQuery || selectedCategory)
              ? "Try adjusting your search terms or filters"
              : "Check back later for new template additions"
            }
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
              className="mt-4 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
