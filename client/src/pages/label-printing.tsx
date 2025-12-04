import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer, RotateCcw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product } from "@shared/schema";

const generateBarcode = (text: string, width: number = 200, height: number = 50) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "black";
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
  ctx.fillStyle = "black";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height - 5);
  return canvas.toDataURL();
};

const generateQRCode = (text: string, size: number = 100) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "black";
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

interface PrintDialogState {
  isOpen: boolean;
  product: Product | null;
  mfdDate: string;
  expDays: number;
  batchCheckbox: boolean;
  copies: number;
}

export default function LabelPrinting() {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [printDialog, setPrintDialog] = useState<PrintDialogState>({
    isOpen: false,
    product: null,
    mfdDate: new Date().toISOString().split("T")[0],
    expDays: 4,
    batchCheckbox: true,
    copies: 1,
  });

  const [labelFields, setLabelFields] = useState<LabelField[]>([
    { id: "productName", label: "Product Name", checked: true },
    { id: "batchNo", label: "Batch No", checked: true },
    { id: "netWeight", label: "Net Weight", checked: true },
    { id: "price", label: "Price", checked: true },
    { id: "mfgDate", label: "Mfg Date", checked: true },
    { id: "expiryDate", label: "Expiry Date", checked: true },
    { id: "barcode", label: "Barcode", checked: true },
    { id: "qrCode", label: "QR Code", checked: false },
  ]);

  // Fetch products
  const { data: productsData = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return Array.isArray(res) ? res : (res?.products || []);
    },
    retry: (failureCount, error) => !isUnauthorizedError(error) && failureCount < 3,
  });

  // Fetch system settings
  const { data: settingsData = {} } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings");
      return res || {};
    },
  });

  // Print mutation
  const printMutation = useMutation({
    mutationFn: async () => {
      if (!printDialog.product) return;
      
      const mfdDate = new Date(printDialog.mfdDate);
      const expDate = new Date(mfdDate);
      expDate.setDate(expDate.getDate() + printDialog.expDays);

      await apiRequest("POST", "/print-label", {
        productId: printDialog.product.id,
        mfdDate: printDialog.mfdDate,
        expDate: expDate.toISOString().split("T")[0],
        noOfCopies: printDialog.copies,
        batchIncrement: printDialog.batchCheckbox,
      });

      // Open print window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({ title: "Error", description: "Please allow pop-ups", variant: "destructive" });
        return;
      }

      const product = printDialog.product;
      let labelHTML = '<div class="label-content">';

      labelHTML += `<div class="header-row"><div><strong>Reg. No.:</strong> 11752/081/82</div><div><strong>PAN No.:</strong> 163133265</div></div>`;
      labelHTML += `<div class="company-name">Aakarsak Food</div>`;
      labelHTML += `<div class="company-address"><div>Saudol, Tathali -09,</div><div>Changunarayan Municipality, Bhaktapur</div></div>`;
      labelHTML += `<div class="product-name-large">${product.name}</div>`;
      labelHTML += `<div class="two-column-layout"><div class="left-column"><div class="detail-row"><strong>DFTQ No.:</strong></div><div class="detail-row"><strong>Batch No.:</strong> ${product.sku || "N/A"}</div><div class="detail-row"><strong>Net Weight:</strong> ${product.unit || "N/A"}</div><div class="detail-row"><strong>MRP Rs.:</strong> ${parseFloat(product.price).toFixed(2)}/-</div><div class="detail-row"><strong>Mfd. Date:</strong> ${printDialog.mfdDate}</div></div><div class="right-column"><div class="ingredients-box"><div class="ingredients-title"><strong>Ingredients:</strong></div><div class="ingredients-content">Ingredients list here</div></div></div></div>`;
      labelHTML += `<div class="detail-row"><strong>Exp. Date:</strong> ${expDate.toLocaleDateString()}</div>`;
      labelHTML += `<div class="barcode-row"><img src="${generateBarcode(product.sku || product.id.toString())}" alt="Barcode" class="barcode"/></div>`;
      labelHTML += "</div>";

      printWindow.document.write(`
        <html><head><title>Label - ${product.name}</title>
        <style>
          @page { size: 50mm 30mm; margin: 2mm; }
          body { font-family: Arial; font-size: 9px; padding: 8px; margin: 0; }
          .label-content { width: 100%; }
          .header-row { display: flex; justify-content: space-between; font-size: 7px; margin-bottom: 6px; }
          .company-name { text-align: center; font-size: 18px; font-weight: bold; margin: 4px 0; }
          .company-address { text-align: center; font-size: 7px; line-height: 1.3; margin-bottom: 8px; }
          .product-name-large { text-align: center; font-size: 16px; font-weight: bold; margin: 10px 0; }
          .two-column-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
          .detail-row { margin: 3px 0; font-size: 8px; line-height: 1.4; }
          .ingredients-box { border: 2px solid #000; padding: 6px; width: 100%; font-size: 7px; }
          .barcode { max-width: 80%; height: auto; margin: 0 auto; display: block; margin-top: 8px; }
        </style>
        </head><body>${labelHTML}</body></html>
      `);
      printWindow.print();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label printed successfully" });
      setPrintDialog({ ...printDialog, isOpen: false });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredProducts = (productsData || []).filter((p) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return p.name?.toLowerCase().includes(search) || p.sku?.toLowerCase().includes(search);
  });

  const handlePrintClick = (product: Product) => {
    setPrintDialog({
      isOpen: true,
      product,
      mfdDate: new Date().toISOString().split("T")[0],
      expDays: 4,
      batchCheckbox: true,
      copies: 1,
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
        {/* Products List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No products found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.sku || "N/A"}</TableCell>
                        <TableCell>Rs. {parseFloat(p.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setSelectedProduct(p)} title="Preview">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => handlePrintClick(p)} title="Print">
                              <Printer className="w-4 h-4" />
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

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-300 p-4 bg-white rounded-lg min-h-[300px] text-sm">
              {selectedProduct ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-2">
                    <div><strong>Reg. No.:</strong> 11752/081/82</div>
                    <div><strong>PAN:</strong> 163133265</div>
                  </div>
                  <div className="text-center font-bold text-lg">Aakarsak Food</div>
                  <div className="text-center text-xs">Saudol, Tathali -09, Bhaktapur</div>
                  <div className="text-center font-bold">{selectedProduct.name}</div>
                  <div className="text-xs">
                    <div><strong>Batch:</strong> {selectedProduct.sku || "N/A"}</div>
                    <div><strong>Weight:</strong> {selectedProduct.unit || "N/A"}</div>
                    <div><strong>Price:</strong> Rs. {parseFloat(selectedProduct.price).toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Select product to preview</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Dialog */}
      <Dialog open={printDialog.isOpen} onOpenChange={(open) => setPrintDialog({ ...printDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Label - {printDialog.product?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Manufactured Date</Label>
              <Input
                type="date"
                value={printDialog.mfdDate}
                onChange={(e) => setPrintDialog({ ...printDialog, mfdDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Expiry Days</Label>
              <Input
                type="number"
                value={printDialog.expDays}
                onChange={(e) => setPrintDialog({ ...printDialog, expDays: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={printDialog.batchCheckbox}
                onCheckedChange={(checked) =>
                  setPrintDialog({ ...printDialog, batchCheckbox: checked as boolean })
                }
              />
              <Label>Auto-increment Batch/SKU</Label>
            </div>
            <div>
              <Label>Number of Copies</Label>
              <Input
                type="number"
                min="1"
                value={printDialog.copies}
                onChange={(e) => setPrintDialog({ ...printDialog, copies: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialog({ ...printDialog, isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={() => printMutation.mutate()} disabled={printMutation.isPending}>
              {printMutation.isPending ? "Printing..." : "Print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
