
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle } from 'lucide-react';

const templates = [
  {
    id: 'po',
    title: 'Purchase Order',
    description: 'Create a new Purchase Order document from scratch',
    icon: <FileText className="h-8 w-8" />,
    fileType: 'PDF',
  },
  {
    id: 'clients-po',
    title: 'Clients Purchase Order',
    description: 'Create a new Clients Purchase Order document from scratch',
    icon: <FileText className="h-8 w-8" />,
    fileType: 'PDF',
  },
  {
    id: 'dr',
    title: 'Delivery Receipt',
    description: 'Create a new Delivery Receipt document',
    icon: <FileText className="h-8 w-8" />,
    fileType: 'PDF',
  },
];

export const TemplatesPage: React.FC = () => {
  const handleCreateDocument = (templateId: string) => {
    console.log('Creating document for template:', templateId);
    // Document creation functionality will be implemented
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-600">Create and manage business documents</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Info Card about document mapping workflow */}
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Document Templates</h3>
                <p className="text-sm text-blue-800">
                  Create professional business documents using our pre-built templates. 
                  Each template includes standard fields and formatting to ensure consistency 
                  across your organization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {template.icon}
                  {template.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCreateDocument(template.id)}
                  className="w-full"
                >
                  Create {template.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
