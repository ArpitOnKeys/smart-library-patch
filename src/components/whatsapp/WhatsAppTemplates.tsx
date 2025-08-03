import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  category: 'fee' | 'welcome' | 'general' | 'reminder';
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Fee Reminder',
    content: 'Dear {name}, your monthly fee of ₹{monthlyFees} is due. Please ensure timely payment. - PATCH Library',
    variables: ['name', 'monthlyFees'],
    category: 'fee',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Welcome Message',
    content: 'Welcome to PATCH - The Smart Library, {name}! Your enrollment no. is {enrollmentNo}. We look forward to your learning journey.',
    variables: ['name', 'enrollmentNo'],
    category: 'welcome',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Payment Confirmation',
    content: 'Dear {name}, we have received your payment of ₹{monthlyFees}. Thank you for choosing PATCH Library.',
    variables: ['name', 'monthlyFees'],
    category: 'fee',
    createdAt: new Date().toISOString()
  }
];

const AVAILABLE_VARIABLES = [
  'name', 'fatherName', 'enrollmentNo', 'contact', 
  'monthlyFees', 'shift', 'seatNumber', 'dueDate'
];

export const WhatsAppTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [previewData] = useState({
    name: 'John Doe',
    fatherName: 'Mr. Doe',
    enrollmentNo: 'PATCH001',
    contact: '+91 9876543210',
    monthlyFees: 2000,
    shift: 'Morning',
    seatNumber: '25',
    dueDate: '15th Dec 2024'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('whatsapp_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('whatsapp_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, []);

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('whatsapp_templates', JSON.stringify(newTemplates));
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{(\w+)}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const previewMessage = (template: MessageTemplate): string => {
    let preview = template.content;
    template.variables.forEach(variable => {
      const value = previewData[variable as keyof typeof previewData];
      preview = preview.replace(new RegExp(`{${variable}}`, 'g'), String(value || `{${variable}}`));
    });
    return preview;
  };

  const handleSaveTemplate = (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    const variables = extractVariables(template.content);
    const newTemplate: MessageTemplate = {
      ...template,
      id: editingTemplate?.id || crypto.randomUUID(),
      variables,
      createdAt: editingTemplate?.createdAt || new Date().toISOString()
    };

    const updatedTemplates = editingTemplate
      ? templates.map(t => t.id === editingTemplate.id ? newTemplate : t)
      : [...templates, newTemplate];

    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    setShowNewTemplate(false);
    
    toast({
      title: editingTemplate ? "Template Updated" : "Template Created",
      description: `Template "${newTemplate.name}" has been saved successfully.`,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    saveTemplates(updatedTemplates);
    
    toast({
      title: "Template Deleted",
      description: "Template has been removed successfully.",
    });
  };

  const copyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copied",
      description: "Template content copied to clipboard.",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fee': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'welcome': return 'bg-green-100 text-green-800 border-green-200';
      case 'reminder': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Message Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage reusable message templates with variables
          </p>
        </div>
        <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <TemplateEditor
            template={null}
            onSave={handleSaveTemplate}
            onCancel={() => setShowNewTemplate(false)}
          />
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Preview: {template.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Message Preview:</Label>
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{previewMessage(template)}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Variables Used:</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.variables.map(variable => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <TemplateEditor
                      template={template}
                      onSave={handleSaveTemplate}
                      onCancel={() => setEditingTemplate(null)}
                    />
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-2">
                {template.content.slice(0, 100)}...
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Variables:</span>
                {template.variables.map(variable => (
                  <Badge key={variable} variant="outline" className="text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first message template to get started
          </p>
          <Button onClick={() => setShowNewTemplate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      )}
    </div>
  );
};

interface TemplateEditorProps {
  template: MessageTemplate | null;
  onSave: (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
  const [name, setName] = useState(template?.name || '');
  const [content, setContent] = useState(template?.content || '');
  const [category, setCategory] = useState<MessageTemplate['category']>(template?.category || 'general');

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    
    onSave({
      name: name.trim(),
      content: content.trim(),
      category,
      variables: []
    });
    
    setName('');
    setContent('');
    setCategory('general');
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {template ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Fee Reminder"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as MessageTemplate['category'])}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="general">General</option>
            <option value="fee">Fee Related</option>
            <option value="welcome">Welcome</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>

        <div>
          <Label htmlFor="content">Message Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your message template..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use variables like {'{name}'}, {'{monthlyFees}'}, {'{enrollmentNo}'} etc.
          </p>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium">Available Variables:</Label>
          <div className="mt-2 flex flex-wrap gap-1">
            {AVAILABLE_VARIABLES.map(variable => (
              <Badge 
                key={variable} 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => setContent(prev => prev + `{${variable}}`)}
              >
                {variable}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !content.trim()}>
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};