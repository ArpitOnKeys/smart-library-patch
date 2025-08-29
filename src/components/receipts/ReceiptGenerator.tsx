import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Student, FeePayment } from '@/types/database';
import { ReceiptTemplate } from './ReceiptTemplate';
import { generateVisualReceiptPDF, ReceiptSettings } from '@/utils/receiptUtils';
import { 
  Download, 
  Eye, 
  Settings, 
  Palette, 
  Image as ImageIcon,
  FileText,
  MessageSquare
} from 'lucide-react';

interface ReceiptGeneratorProps {
  student: Student;
  payment: FeePayment;
  onWhatsAppSend?: (pdfBlob: Blob) => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  student,
  payment,
  onWhatsAppSend
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<ReceiptSettings>(() => {
    const saved = localStorage.getItem('receipt_settings');
    return saved ? JSON.parse(saved) : {
      libraryLogo: '',
      accentColor: '#3b82f6',
      useStyledPDF: true,
      includePhoto: true,
      paperSize: 'A4'
    };
  });

  const { toast } = useToast();

  const saveSettings = (newSettings: ReceiptSettings) => {
    setSettings(newSettings);
    localStorage.setItem('receipt_settings', JSON.stringify(newSettings));
    toast({
      title: "Settings Saved",
      description: "Receipt settings updated successfully"
    });
  };

  const generateReceiptNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = Date.now().toString().slice(-4);
    return `PATCH${year}${month}${day}${time}`;
  };

  const handleDownloadReceipt = async () => {
    setIsGenerating(true);
    try {
      const receiptNumber = generateReceiptNumber();
      const pdfBlob = await generateVisualReceiptPDF(
        student,
        payment,
        receiptNumber,
        settings
      );

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FeeReceipt_${student.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Receipt Downloaded! 📄",
        description: "Fee receipt PDF has been generated and downloaded"
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate receipt PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppSend = async () => {
    if (!onWhatsAppSend) return;
    
    setIsGenerating(true);
    try {
      const receiptNumber = generateReceiptNumber();
      const pdfBlob = await generateVisualReceiptPDF(
        student,
        payment,
        receiptNumber,
        settings
      );

      onWhatsAppSend(pdfBlob);
      
      toast({
        title: "Receipt Ready for WhatsApp! 📱",
        description: "Receipt PDF generated and ready to send"
      });
    } catch (error) {
      console.error('Error generating receipt for WhatsApp:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate receipt for WhatsApp",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newSettings = { ...settings, libraryLogo: e.target?.result as string };
        saveSettings(newSettings);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Preview Button */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <ReceiptTemplate
              student={student}
              payment={payment}
              receiptNumber={generateReceiptNumber()}
              libraryLogo={settings.libraryLogo}
              accentColor={settings.accentColor}
              showInModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Button */}
      <Button 
        onClick={handleDownloadReceipt}
        disabled={isGenerating}
        size="sm"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Generating...</span>
          </div>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </>
        )}
      </Button>

      {/* WhatsApp Send Button */}
      {onWhatsAppSend && (
        <Button 
          onClick={handleWhatsAppSend}
          disabled={isGenerating}
          variant="outline"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Send via WhatsApp
        </Button>
      )}

      {/* Settings Button */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Receipt Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Library Logo */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Library Logo
              </Label>
              {settings.libraryLogo && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <img 
                    src={settings.libraryLogo} 
                    alt="Library Logo" 
                    className="h-12 w-12 object-contain border rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Logo</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => saveSettings({ ...settings, libraryLogo: '' })}
                      className="mt-1"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Header Color
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => saveSettings({ ...settings, accentColor: e.target.value })}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => saveSettings({ ...settings, accentColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => saveSettings({ ...settings, accentColor: color })}
                  />
                ))}
              </div>
            </div>

            {/* Receipt Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Styled PDF Mode</Label>
                  <p className="text-sm text-muted-foreground">Use professional layout vs simple text</p>
                </div>
                <Switch
                  checked={settings.useStyledPDF}
                  onCheckedChange={(checked) => saveSettings({ ...settings, useStyledPDF: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Include Student Photo</Label>
                  <p className="text-sm text-muted-foreground">Show student photo in receipt</p>
                </div>
                <Switch
                  checked={settings.includePhoto}
                  onCheckedChange={(checked) => saveSettings({ ...settings, includePhoto: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select 
                  value={settings.paperSize} 
                  onValueChange={(value) => saveSettings({ ...settings, paperSize: value as 'A4' | 'Letter' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};