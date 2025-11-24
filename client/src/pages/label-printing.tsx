import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Printer, RotateCcw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { Product } from '@shared/schema';

// Generate barcode data URL (simple implementation)
const generateBarcode = (text: string, width: number = 200, height: number = 50) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'black';

  const barWidth = width / (text.length * 10);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const x = i * barWidth * 10;
    for (let j = 0; j < 8; j++) {
      if (charCode & (1 << j)) {
        ctx.fillRect(x + j * barWidth, 10, barWidth, height - 30);
      }
    }
  }

  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, width / 2, height - 5);

  return canvas.toDataURL();
};

// Generate QR Code data URL (simple implementation)
const generateQRCode = (text: string, size: number = 100) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'black';

  const moduleSize = size / 25;
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if ((i + j + text.length) % 3 === 0) {
        ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
      }
    }
  }

  return canvas.toDataURL();
};

interface LabelField {
  id: string;
  label: string;
  checked: boolean;
}

export default function LabelPrinting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [labelNotes, setLabelNotes] = useState('');

  // Field selection state
  const [labelFields, setLabelFields] = useState<LabelField[]>([
    { id: 'productName', label: 'Product Name', checked: true },
    { id: 'batchNo', label: 'Batch No', checked: true },
    { id: 'netWeight', label: 'Net Weight', checked: true },
    { id: 'price', label: 'Price', checked: true },
    { id: 'mfgDate', label: 'Mfg Date', checked: true },
    { id: 'expiryDate', label: 'Expiry Date', checked: true },
    { id: 'barcode', label: 'Barcode', checked: true },
    { id: 'qrCode', label: 'QR Code', checked: false },
    { id: 'notes', label: 'Notes', checked: false },
  ]);

  // Fetch products from database
  const { data: productsData = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/products");
        if (res?.success && res?.products) {
          return Array.isArray(res.products) ? res.products : [];
        }
        if (Array.isArray(res)) {
          return res;
        }
        return [];
      } catch (error) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    retry: (failureCount, error) =>
      !isUnauthorizedError(error) && failureCount < 3,
  });

  const products = Array.isArray(productsData) ? productsData : [];

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search)
    );
  });

  // Toggle field visibility
  const toggleField = (fieldId: string) => {
    setLabelFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, checked: !field.checked } : field
      )
    );
  };

  // Save default template
  const saveDefaultTemplate = () => {
    localStorage.setItem('labelFieldsTemplate', JSON.stringify(labelFields));
    toast({
      title: "Template Saved",
      description: "Your field preferences have been saved as default",
    });
  };

  // Load default template on mount
  useEffect(() => {
    const savedTemplate = localStorage.getItem('labelFieldsTemplate');
    if (savedTemplate) {
      try {
        setLabelFields(JSON.parse(savedTemplate));
      } catch (e) {
        console.error('Failed to load saved template:', e);
      }
    }
  }, []);

  // Preview label
  const handlePreview = (product: Product) => {
    setSelectedProduct(product);
    toast({
      title: "Preview Updated",
      description: `Showing label preview for ${product.name}`,
    });
  };

  // Print label
  const handlePrint = (product: Product, isReprint: boolean = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow pop-ups for printing",
        variant: "destructive",
      });
      return;
    }

    const labelData = {
      productName: product.name,
      batchNo: product.sku || 'N/A',
      netWeight: product.unit || 'N/A',
      price: product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A',
      mfgDate: new Date().toLocaleDateString(),
      expiryDate: 'N/A',
      barcode: product.sku || product.id.toString(),
      notes: labelNotes,
    };

    const barcodeImage = labelFields.find(f => f.id === 'barcode')?.checked
      ? generateBarcode(labelData.barcode)
      : '';

    const qrCodeImage = labelFields.find(f => f.id === 'qrCode')?.checked
      ? generateQRCode(JSON.stringify({ name: product.name, sku: product.sku, price: product.price }))
      : '';

    let labelHTML = '<div class="label">';

    labelFields.forEach(field => {
      if (!field.checked) return;

      switch (field.id) {
        case 'productName':
          labelHTML += `<div class="field-row"><strong>Product:</strong> ${labelData.productName}</div>`;
          break;
        case 'batchNo':
          labelHTML += `<div class="field-row"><strong>Batch No:</strong> ${labelData.batchNo}</div>`;
          break;
        case 'netWeight':
          labelHTML += `<div class="field-row"><strong>Net Weight:</strong> ${labelData.netWeight}</div>`;
          break;
        case 'price':
          labelHTML += `<div class="field-row"><strong>Price:</strong> ${labelData.price}</div>`;
          break;
        case 'mfgDate':
          labelHTML += `<div class="field-row"><strong>Mfg Date:</strong> ${labelData.mfgDate}</div>`;
          break;
        case 'expiryDate':
          labelHTML += `<div class="field-row"><strong>Expiry Date:</strong> ${labelData.expiryDate}</div>`;
          break;
        case 'barcode':
          if (barcodeImage) {
            labelHTML += `<div class="field-row center"><img src="${barcodeImage}" alt="Barcode" class="barcode"/></div>`;
          }
          break;
        case 'qrCode':
          if (qrCodeImage) {
            labelHTML += `<div class="field-row center"><img src="${qrCodeImage}" alt="QR Code" class="qr-code"/></div>`;
          }
          break;
        case 'notes':
          if (labelData.notes) {
            labelHTML += `<div class="field-row"><strong>Notes:</strong> ${labelData.notes}</div>`;
          }
          break;
      }
    });

    labelHTML += '</div>';

    printWindow.document.write(`
      <html>
        <head>
          <title>Product Label - ${product.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .label { 
              border: 2px solid #000; 
              padding: 15px; 
              max-width: 400px;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .field-row { 
              margin: 8px 0; 
              font-size: 14px; 
              line-height: 1.4;
            }
            .field-row.center {
              text-align: center;
            }
            .barcode { 
              max-width: 200px; 
              height: auto; 
              margin: 10px auto;
              display: block;
            }
            .qr-code { 
              width: 100px; 
              height: 100px; 
              margin: 10px auto;
              display: block;
            }
            strong {
              font-weight: 600;
              color: #333;
            }
            @media print { 
              body { 
                margin: 0; 
                padding: 0;
              } 
              .label { 
                page-break-inside: avoid;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          ${labelHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast({
      title: isReprint ? "Reprinting Label" : "Printing Label",
      description: `Label for ${product.name} sent to printer`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Label Printing</h1>
        <p className="text-gray-600 mt-1">Manage and print product labels</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Products List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Saved Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No products found matching your search' : 'No products available'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Batch/SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || 'N/A'}</TableCell>
                        <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(product)}
                              title="Preview Label"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handlePrint(product, false)}
                              title="Print Label"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrint(product, true)}
                              title="Reprint Label"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Label Preview & Field Selection */}
        <div className="space-y-6">
          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Label Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 p-4 bg-white rounded-lg shadow-sm min-h-[300px]">
                {selectedProduct ? (
                  <div className="space-y-2 text-sm">
                    {labelFields.find(f => f.id === 'productName')?.checked && (
                      <div><strong>Product:</strong> {selectedProduct.name}</div>
                    )}
                    {labelFields.find(f => f.id === 'batchNo')?.checked && (
                      <div><strong>Batch No:</strong> {selectedProduct.sku || 'N/A'}</div>
                    )}
                    {labelFields.find(f => f.id === 'netWeight')?.checked && (
                      <div><strong>Net Weight:</strong> {selectedProduct.unit || 'N/A'}</div>
                    )}
                    {labelFields.find(f => f.id === 'price')?.checked && (
                      <div><strong>Price:</strong> ${parseFloat(selectedProduct.price).toFixed(2)}</div>
                    )}
                    {labelFields.find(f => f.id === 'mfgDate')?.checked && (
                      <div><strong>Mfg Date:</strong> {new Date().toLocaleDateString()}</div>
                    )}
                    {labelFields.find(f => f.id === 'expiryDate')?.checked && (
                      <div><strong>Expiry Date:</strong> N/A</div>
                    )}
                    {labelFields.find(f => f.id === 'barcode')?.checked && (
                      <div className="text-center mt-3">
                        <img 
                          src={generateBarcode(selectedProduct.sku || selectedProduct.id.toString())} 
                          alt="Barcode" 
                          className="mx-auto"
                          style={{ maxWidth: '180px' }}
                        />
                      </div>
                    )}
                    {labelFields.find(f => f.id === 'qrCode')?.checked && (
                      <div className="text-center mt-3">
                        <img 
                          src={generateQRCode(JSON.stringify({ name: selectedProduct.name, sku: selectedProduct.sku }))} 
                          alt="QR Code" 
                          className="mx-auto"
                          style={{ width: '80px', height: '80px' }}
                        />
                      </div>
                    )}
                    {labelFields.find(f => f.id === 'notes')?.checked && labelNotes && (
                      <div className="mt-3 pt-3 border-t"><strong>Notes:</strong> {labelNotes}</div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Click Preview on a product to see label
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Customize Label Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {labelFields.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={field.checked}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <Label htmlFor={field.id} className="cursor-pointer">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>

              {labelFields.find(f => f.id === 'notes')?.checked && (
                <div className="space-y-2 pt-3 border-t">
                  <Label htmlFor="label-notes">Notes</Label>
                  <Input
                    id="label-notes"
                    placeholder="Enter notes to appear on label..."
                    value={labelNotes}
                    onChange={(e) => setLabelNotes(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={saveDefaultTemplate}
                variant="outline"
                className="w-full"
              >
                Save as Default Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}