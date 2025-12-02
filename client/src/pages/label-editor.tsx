
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Eye, RotateCcw, Download, Upload, Plus, Trash2, GripVertical } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LabelElement {
  id: string;
  type: 'text' | 'barcode' | 'qrcode' | 'image' | 'line';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  content?: string;
  visible: boolean;
}

interface LabelTemplate {
  id?: number;
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'px';
  elements: LabelElement[];
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const defaultElements: LabelElement[] = [
  { id: 'company-name', type: 'text', label: 'Company Name', x: 50, y: 10, width: 200, height: 30, fontSize: 18, fontWeight: 'bold', textAlign: 'center', content: 'Aakarsak Food', visible: true },
  { id: 'product-name', type: 'text', label: 'Product Name', x: 50, y: 50, width: 200, height: 25, fontSize: 16, fontWeight: 'bold', textAlign: 'center', content: 'Product Name', visible: true },
  { id: 'batch-no', type: 'text', label: 'Batch No', x: 10, y: 85, width: 140, height: 15, fontSize: 10, fontWeight: 'normal', textAlign: 'left', content: 'Batch No: 001', visible: true },
  { id: 'net-weight', type: 'text', label: 'Net Weight', x: 10, y: 105, width: 140, height: 15, fontSize: 10, fontWeight: 'normal', textAlign: 'left', content: 'Net Weight: 500g', visible: true },
  { id: 'price', type: 'text', label: 'Price', x: 10, y: 125, width: 140, height: 15, fontSize: 10, fontWeight: 'normal', textAlign: 'left', content: 'MRP Rs. 100/-', visible: true },
  { id: 'mfg-date', type: 'text', label: 'Mfg Date', x: 10, y: 145, width: 140, height: 15, fontSize: 10, fontWeight: 'normal', textAlign: 'left', content: 'Mfd. Date: 12/02/2025', visible: true },
  { id: 'exp-date', type: 'text', label: 'Exp Date', x: 10, y: 165, width: 140, height: 15, fontSize: 10, fontWeight: 'normal', textAlign: 'left', content: 'Exp. Date: 12/10/2025', visible: true },
  { id: 'ingredients', type: 'text', label: 'Ingredients', x: 160, y: 85, width: 130, height: 95, fontSize: 8, fontWeight: 'normal', textAlign: 'left', content: 'Ingredients: List here', visible: true },
  { id: 'barcode', type: 'barcode', label: 'Barcode', x: 75, y: 190, width: 150, height: 40, visible: true },
];

export default function LabelEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [templateName, setTemplateName] = useState("Custom Label Template");
  const [labelWidth, setLabelWidth] = useState(300);
  const [labelHeight, setLabelHeight] = useState(250);
  const [unit, setUnit] = useState<'mm' | 'px'>('px');
  const [elements, setElements] = useState<LabelElement[]>(defaultElements);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [margins, setMargins] = useState({ top: 2, right: 2, bottom: 2, left: 2 });

  // Get selected element
  const selected = elements.find(el => el.id === selectedElement);

  // Update element property
  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  // Add new element
  const addElement = (type: LabelElement['type']) => {
    const newId = `element-${Date.now()}`;
    const newElement: LabelElement = {
      id: newId,
      type,
      label: `New ${type}`,
      x: 50,
      y: 50,
      width: type === 'line' ? 200 : 100,
      height: type === 'line' ? 2 : type === 'barcode' ? 40 : type === 'qrcode' ? 80 : 20,
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      content: type === 'text' ? 'Text content' : '',
      visible: true,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newId);
  };

  // Delete element
  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    setSelectedElement(elementId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(labelWidth - (selected?.width || 0), e.clientX - rect.left - dragOffset.x));
    const y = Math.max(0, Math.min(labelHeight - (selected?.height || 0), e.clientY - rect.top - dragOffset.y));

    updateElement(selectedElement, { x: Math.round(x), y: Math.round(y) });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Save template
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const template: LabelTemplate = {
        name: templateName,
        width: labelWidth,
        height: labelHeight,
        unit,
        elements,
        margins,
      };
      localStorage.setItem('labelTemplate', JSON.stringify(template));
      return template;
    },
    onSuccess: () => {
      toast({
        title: "Template Saved",
        description: "Your label template has been saved successfully",
      });
    },
  });

  // Load template
  useEffect(() => {
    const saved = localStorage.getItem('labelTemplate');
    if (saved) {
      try {
        const template: LabelTemplate = JSON.parse(saved);
        setTemplateName(template.name);
        setLabelWidth(template.width);
        setLabelHeight(template.height);
        setUnit(template.unit);
        setElements(template.elements);
        setMargins(template.margins);
      } catch (e) {
        console.error('Failed to load template:', e);
      }
    }
  }, []);

  // Export template
  const exportTemplate = () => {
    const template: LabelTemplate = { name: templateName, width: labelWidth, height: labelHeight, unit, elements, margins };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import template
  const importTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const template: LabelTemplate = JSON.parse(event.target?.result as string);
        setTemplateName(template.name);
        setLabelWidth(template.width);
        setLabelHeight(template.height);
        setUnit(template.unit);
        setElements(template.elements);
        setMargins(template.margins);
        toast({ title: "Template Imported", description: "Template loaded successfully" });
      } catch (error) {
        toast({ title: "Import Failed", description: "Invalid template file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Label Layout Editor</h1>
          <p className="text-gray-600 mt-1">Design and customize your product label layout</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => saveTemplateMutation.mutate()} variant="default">
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          <Button onClick={exportTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <input type="file" accept=".json" onChange={importTemplate} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Label Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center p-8 bg-gray-100 rounded-lg overflow-auto">
              <div
                className="relative bg-white shadow-lg"
                style={{ width: `${labelWidth}px`, height: `${labelHeight}px` }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {elements.filter(el => el.visible).map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move border-2 ${selectedElement === element.id ? 'border-blue-500 bg-blue-50 bg-opacity-20' : 'border-transparent hover:border-gray-300'}`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full overflow-hidden"
                        style={{
                          fontSize: `${element.fontSize}px`,
                          fontWeight: element.fontWeight,
                          textAlign: element.textAlign,
                        }}
                      >
                        {element.content}
                      </div>
                    )}
                    {element.type === 'barcode' && (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                        BARCODE
                      </div>
                    )}
                    {element.type === 'qrcode' && (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                        QR CODE
                      </div>
                    )}
                    {element.type === 'line' && (
                      <div className="w-full h-full bg-black"></div>
                    )}
                    {selectedElement === element.id && (
                      <GripVertical className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Label Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Width ({unit})</Label>
                  <Input type="number" value={labelWidth} onChange={(e) => setLabelWidth(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Height ({unit})</Label>
                  <Input type="number" value={labelHeight} onChange={(e) => setLabelHeight(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={unit} onValueChange={(v: 'mm' | 'px') => setUnit(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">Pixels (px)</SelectItem>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => addElement('text')} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Text Field
              </Button>
              <Button onClick={() => addElement('barcode')} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Barcode
              </Button>
              <Button onClick={() => addElement('qrcode')} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button onClick={() => addElement('line')} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Line/Separator
              </Button>
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Element Properties</span>
                  <Button onClick={() => deleteElement(selected.id)} variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Label</Label>
                  <Input value={selected.label} onChange={(e) => updateElement(selected.id, { label: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>X Position</Label>
                    <Input type="number" value={selected.x} onChange={(e) => updateElement(selected.id, { x: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Y Position</Label>
                    <Input type="number" value={selected.y} onChange={(e) => updateElement(selected.id, { y: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Width</Label>
                    <Input type="number" value={selected.width} onChange={(e) => updateElement(selected.id, { width: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Height</Label>
                    <Input type="number" value={selected.height} onChange={(e) => updateElement(selected.id, { height: Number(e.target.value) })} />
                  </div>
                </div>
                {selected.type === 'text' && (
                  <>
                    <div>
                      <Label>Content</Label>
                      <Input value={selected.content} onChange={(e) => updateElement(selected.id, { content: e.target.value })} />
                    </div>
                    <div>
                      <Label>Font Size</Label>
                      <Input type="number" value={selected.fontSize} onChange={(e) => updateElement(selected.id, { fontSize: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Font Weight</Label>
                      <Select value={selected.fontWeight} onValueChange={(v: 'normal' | 'bold') => updateElement(selected.id, { fontWeight: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Text Align</Label>
                      <Select value={selected.textAlign} onValueChange={(v: 'left' | 'center' | 'right') => updateElement(selected.id, { textAlign: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={selected.visible} onCheckedChange={(checked) => updateElement(selected.id, { visible: !!checked })} />
                  <Label>Visible</Label>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Elements List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {elements.map((element) => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedElement === element.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <span className="text-sm font-medium">{element.label}</span>
                    <span className="text-xs text-gray-500">{element.type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
