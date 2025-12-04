import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Printer, RotateCcw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product } from "@shared/schema";

// Generate barcode data URL (simple implementation)
const generateBarcode = (
  text: string,
  width: number = 200,
  height: number = 50,
) => {
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

// Generate QR Code data URL (simple implementation)
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

export default function LabelPrinting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [labelNotes, setLabelNotes] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [productDrafts, setProductDrafts] = useState<Record<number, any>>({});
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [mfdDate, setMfdDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDays, setExpDays] = useState("30");
  const [batchCheckbox, setBatchCheckbox] = useState(true);
  const [noCopies, setNoCopies] = useState("1");

  // Field selection state
  const [labelFields, setLabelFields] = useState<LabelField[]>([
    { id: "productName", label: "Product Name", checked: true },
    { id: "batchNo", label: "Batch No", checked: true },
    { id: "netWeight", label: "Net Weight", checked: true },
    { id: "price", label: "Price", checked: true },
    { id: "mfgDate", label: "Mfg Date", checked: true },
    { id: "expiryDate", label: "Expiry Date", checked: true },
    { id: "barcode", label: "Barcode", checked: true },
    { id: "qrCode", label: "QR Code", checked: false },
    { id: "notes", label: "Notes", checked: false },
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
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search)
    );
  });

  // Toggle field visibility
  const toggleField = (fieldId: string) => {
    setLabelFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, checked: !field.checked } : field,
      ),
    );
  };

  // Save default template
  const saveDefaultTemplate = () => {
    localStorage.setItem("labelFieldsTemplate", JSON.stringify(labelFields));
    toast({
      title: "Template Saved",
      description: "Your field preferences have been saved as default",
    });
  };

  // Load default template on mount
  useEffect(() => {
    const savedTemplate = localStorage.getItem("labelFieldsTemplate");
    if (savedTemplate) {
      try {
        setLabelFields(JSON.parse(savedTemplate));
      } catch (e) {
        console.error("Failed to load saved template:", e);
      }
    }

    // Load saved label templates
    const templates: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("labelTemplate_")) {
        const template = JSON.parse(localStorage.getItem(key) || "{}");
        templates.push({ id: key, name: template.name });
      }
    }
    setSavedTemplates(templates);

    // Load product drafts
    const drafts = localStorage.getItem("productLabelDrafts");
    if (drafts) {
      try {
        setProductDrafts(JSON.parse(drafts));
      } catch (e) {
        console.error("Failed to load drafts:", e);
      }
    }
  }, []);

  const saveDraft = (productId: number, draftData: any) => {
    const newDrafts = { ...productDrafts, [productId]: draftData };
    setProductDrafts(newDrafts);
    localStorage.setItem("productLabelDrafts", JSON.stringify(newDrafts));
    toast({ title: "Draft Saved", description: "Product label details saved" });
  };

  // Preview label
  const handlePreview = (product: Product) => {
    setSelectedProduct(product);
    toast({
      title: "Preview Updated",
      description: `Showing label preview for ${product.name}`,
    });
  };

  // Calculate expiry date
  const calculateExpDate = () => {
    const mfd = new Date(mfdDate);
    const days = parseInt(expDays) || 30;
    const exp = new Date(mfd);
    exp.setDate(exp.getDate() + days);
    return exp.toISOString().split("T")[0];
  };

  // Open print dialog
  const openPrintDialog = (product: Product) => {
    setPrintProduct(product);
    setMfdDate(new Date().toISOString().split("T")[0]);
    setExpDays("30");
    setBatchCheckbox(true);
    setNoCopies("1");
    setShowPrintDialog(true);
  };

  // Handle print with dialog confirmation
  const confirmAndPrint = async () => {
    if (!printProduct) return;

    try {
      const expDate = calculateExpDate();
      const copies = parseInt(noCopies) || 1;

      // If batch checkbox is checked, increment the SKU
      if (batchCheckbox && printProduct.sku) {
        const currentBatch = parseInt(printProduct.sku) || 0;
        const newBatch = currentBatch + 1;
        await apiRequest("PATCH", `/api/products/${printProduct.id}`, {
          sku: newBatch.toString(),
        });
      }

      // Save printed label record
      await apiRequest("POST", "/api/printed-labels", {
        productId: printProduct.id,
        mfdDate,
        expDate,
        noOfCopies: copies,
        printedBy: "User",
      });

      // Close dialog and execute print
      setShowPrintDialog(false);
      await handlePrint(printProduct, false, mfdDate, expDate);
    } catch (error) {
      console.error("Error saving print record:", error);
      toast({
        title: "Error",
        description: "Failed to save print record",
        variant: "destructive",
      });
    }
  };

  // Print label with system settings
  const handlePrint = async (
    product: Product,
    isReprint: boolean = false,
    customMfdDate?: string,
    customExpDate?: string,
  ) => {
    try {
      // Fetch system print settings
      const settingsResponse = await fetch("/api/settings");
      const settingsData = await settingsResponse.json();
      const settings = settingsData?.settings || settingsData || {};

      // Log printer configuration
      if (settings.defaultPrinter) {
        console.log("🖨️ Using configured printer:", settings.defaultPrinter);
      }

      const printWindow = window.open("", "_blank");
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
        batchNo: product.sku || "N/A",
        netWeight: product.netWeight ? `${product.netWeight}g` : (product.unit || "N/A"),
        price: product.price
          ? `Rs.${parseFloat(product.price).toFixed(2)}`
          : "N/A",
        mfgDate: customMfdDate
          ? new Date(customMfdDate).toLocaleDateString()
          : new Date().toLocaleDateString(),
        expiryDate: customExpDate
          ? new Date(customExpDate).toLocaleDateString()
          : "N/A",
        barcode: product.sku || product.id.toString(),
        notes: labelNotes || product.description || "",
      };

      const barcodeImage = labelFields.find((f) => f.id === "barcode")?.checked
        ? generateBarcode(labelData.barcode)
        : "";

      const qrCodeImage = labelFields.find((f) => f.id === "qrCode")?.checked
        ? generateQRCode(
            JSON.stringify({
              name: product.name,
              sku: product.sku,
              price: product.price,
            }),
          )
        : "";

      // Get paper dimensions from system settings
      let paperWidth = "50mm";
      let paperHeight = "30mm";

      const labelSize = settings.labelSize || "small";
      const orientation = settings.labelOrientation || "portrait";

      switch (labelSize) {
        case "small":
          paperWidth = "50mm";
          paperHeight = "30mm";
          break;
        case "medium":
          paperWidth = "75mm";
          paperHeight = "50mm";
          break;
        case "large":
          paperWidth = "100mm";
          paperHeight = "75mm";
          break;
        case "custom_40x30":
          paperWidth = "40mm";
          paperHeight = "30mm";
          break;
        case "A6":
          paperWidth = "105mm";
          paperHeight = "148mm";
          break;
        case "A5":
          paperWidth = "148mm";
          paperHeight = "210mm";
          break;
        case "A4":
          paperWidth = "210mm";
          paperHeight = "297mm";
          break;
        default:
          if (settings.customLabelWidth && settings.customLabelHeight) {
            paperWidth = `${settings.customLabelWidth}mm`;
            paperHeight = `${settings.customLabelHeight}mm`;
          }
      }

      // Swap dimensions for landscape
      if (orientation === "landscape") {
        [paperWidth, paperHeight] = [paperHeight, paperWidth];
      }

      // Get margins
      const marginTop = `${settings.labelMarginTop || "2"}mm`;
      const marginRight = `${settings.labelMarginRight || "2"}mm`;
      const marginBottom = `${settings.labelMarginBottom || "2"}mm`;
      const marginLeft = `${settings.labelMarginLeft || "2"}mm`;

      let labelHTML = '<div class="label-content">';

      // Header with Reg and PAN
      labelHTML += `
        <div class="header-row">
          <div><strong>Reg. No.:</strong> 11752/081/82</div>
          <div><strong>PAN No.:</strong> 163133265</div>
        </div>
      `;

      // Company Name
      labelHTML += `<div class="company-name">Aakarsak Food</div>`;

      // Company Address
      labelHTML += `
        <div class="company-address">
          <div>Saudol, Tathali -09,</div>
          <div>Changunarayan Municipality, Bhaktapur</div>
        </div>
      `;

      // Product Name
      labelHTML += `<div class="product-name-large">${labelData.productName}</div>`;

      // Two Column Layout
      labelHTML += '<div class="two-column-layout">';

      // Left Column - Product Details
      labelHTML += '<div class="left-column">';
      labelHTML += '<div class="detail-row"><strong>DFTQ No.:</strong></div>';

      if (labelFields.find((f) => f.id === "batchNo")?.checked) {
        labelHTML += `<div class="detail-row"><strong>Batch No.:</strong> ${labelData.batchNo}</div>`;
      }
      if (labelFields.find((f) => f.id === "netWeight")?.checked) {
        labelHTML += `<div class="detail-row"><strong>Net Weight:</strong> ${labelData.netWeight}</div>`;
      }
      if (labelFields.find((f) => f.id === "price")?.checked) {
        labelHTML += `<div class="detail-row"><strong>MRP Rs.:</strong> ${labelData.price}/-</div>`;
      }
      if (labelFields.find((f) => f.id === "mfgDate")?.checked) {
        labelHTML += `<div class="detail-row"><strong>Mfd. Date:</strong> ${labelData.mfgDate}</div>`;
      }
      labelHTML += "</div>";

      // Right Column - Ingredients Box
      labelHTML += '<div class="right-column">';
      labelHTML += '<div class="ingredients-box">';
      labelHTML +=
        '<div class="ingredients-title"><strong>Ingredients:</strong></div>';
      if (
        labelData.notes &&
        labelFields.find((f) => f.id === "notes")?.checked
      ) {
        labelHTML += `<div class="ingredients-content">${labelData.notes}</div>`;
      }
      labelHTML += "</div>";
      labelHTML += "</div>";

      labelHTML += "</div>"; // Close two-column-layout

      // Expiry Date
      if (labelFields.find((f) => f.id === "expiryDate")?.checked) {
        labelHTML += `<div class="detail-row"><strong>Exp. Date:</strong> ${labelData.expiryDate}</div>`;
      }

      // Barcode
      if (
        labelFields.find((f) => f.id === "barcode")?.checked &&
        barcodeImage
      ) {
        labelHTML += `<div class="barcode-row"><img src="${barcodeImage}" alt="Barcode" class="barcode"/></div>`;
      }

      // QR Code
      if (labelFields.find((f) => f.id === "qrCode")?.checked && qrCodeImage) {
        labelHTML += `<div class="qr-row"><img src="${qrCodeImage}" alt="QR Code" class="qr-code"/></div>`;
      }

      labelHTML += "</div>";

      printWindow.document.write(`
        <html>
          <head>
            <title>Product Label - ${product.name}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              @page {
                size: ${paperWidth} ${paperHeight};
                margin: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft};
              }

              html, body {
                width: ${paperWidth};
                height: ${paperHeight};
                margin: 0;
                padding: 0;
              }

              body { 
                font-family: Arial, sans-serif; 
                font-size: 9px;
                padding: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
              }

              .label-content {
                width: 100%;
              }

              .header-row {
                display: flex;
                justify-content: space-between;
                font-size: 7px;
                margin-bottom: 6px;
              }

              .company-name {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                margin: 4px 0;
              }

              .company-address {
                text-align: center;
                font-size: 7px;
                line-height: 1.3;
                margin-bottom: 8px;
              }

              .product-name-large {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 10px 0;
              }

              .two-column-layout {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin: 10px 0;
              }

              .left-column {
                font-size: 8px;
              }

              .detail-row {
                margin: 3px 0;
                font-size: 8px;
                line-height: 1.4;
              }

              .right-column {
                display: flex;
                align-items: flex-start;
              }

              .ingredients-box {
                border: 2px solid #000;
                padding: 6px;
                min-height: 80px;
                width: 100%;
                font-size: 7px;
              }

              .ingredients-title {
                font-weight: bold;
                margin-bottom: 4px;
              }

              .ingredients-content {
                font-size: 7px;
                line-height: 1.3;
              }

              .barcode-row {
                text-align: center;
                margin-top: 8px;
              }

              .barcode { 
                max-width: 80%;
                height: auto; 
                margin: 0 auto;
                display: block;
              }

              .qr-row {
                text-align: center;
                margin-top: 8px;
              }

              .qr-code { 
                width: 60px;
                height: 60px; 
                margin: 0 auto;
                display: block;
              }

              strong {
                font-weight: 600;
                color: #000;
              }

              @media print { 
                html, body {
                  width: ${paperWidth};
                  height: ${paperHeight};
                }
                body { 
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  padding: 8px;
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
        description: `Label for ${product.name} sent to printer (${paperWidth} × ${paperHeight})`,
      });
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Print Failed",
        description: "Failed to load print settings. Using defaults.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
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
              <div className="text-center py-8 text-gray-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? "No products found matching your search"
                  : "No products available"}
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
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.sku || "N/A"}</TableCell>
                        <TableCell>
                          ${parseFloat(product.price).toFixed(2)}
                        </TableCell>
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
                              onClick={() => openPrintDialog(product)}
                              title="Print Label"
                              data-testid="button-print-label"
                            >
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

        {/* Live Label Preview & Field Selection */}
        <div className="space-y-6">
          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Label Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 p-6 bg-white rounded-lg shadow-sm min-h-[400px]">
                {selectedProduct ? (
                  <div className="space-y-3 text-sm">
                    {/* Header with Reg and PAN */}
                    <div className="flex justify-between text-xs mb-2">
                      <div>
                        <strong>Reg. No.:</strong> 11752/081/82
                      </div>
                      <div>
                        <strong>PAN No.:</strong> 163133265
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="text-center text-2xl font-bold mb-1">
                      Aakarsak Food
                    </div>

                    {/* Company Address */}
                    <div className="text-center text-xs space-y-0.5 mb-3">
                      <div>Saudol, Tathali -09,</div>
                      <div>Changunarayan Municipality, Bhaktapur</div>
                    </div>

                    {/* Product Name - Large */}
                    <div className="text-center text-xl font-bold my-4">
                      {selectedProduct.name}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column - Product Details */}
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <strong>DFTQ No.:</strong>
                        </div>
                        {labelFields.find((f) => f.id === "batchNo")
                          ?.checked && (
                          <div>
                            <strong>Batch No.:</strong>{" "}
                            {selectedProduct.sku || "N/A"}
                          </div>
                        )}
                        {labelFields.find((f) => f.id === "netWeight")
                          ?.checked && (
                          <div>
                            <strong>Net Weight:</strong>{" "}
                            {selectedProduct.netWeight ? `${selectedProduct.netWeight}g` : (selectedProduct.unit || "N/A")}
                          </div>
                        )}
                        {labelFields.find((f) => f.id === "price")?.checked && (
                          <div>
                            <strong>MRP Rs.:</strong>{" "}
                            Rs.{parseFloat(selectedProduct.price || "0").toFixed(2)}/-
                          </div>
                        )}
                        {labelFields.find((f) => f.id === "mfgDate")
                          ?.checked && (
                          <div>
                            <strong>Mfd. Date:</strong>{" "}
                            {new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right Column - Ingredients Box */}
                      <div className="border-2 border-black p-2 text-xs h-32 overflow-hidden">
                        <div className="font-bold mb-1">Ingredients:</div>
                        {labelFields.find((f) => f.id === "notes")?.checked ? (
                          <div className="text-xs">
                            {labelNotes || selectedProduct.description || "List ingredients here"}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs italic">
                            Enable 'Notes' field to display
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expiry Date Below Grid */}
                    {labelFields.find((f) => f.id === "expiryDate")
                      ?.checked && (
                      <div className="text-xs">
                        <strong>Exp. Date:</strong> Dec 10, 2025
                      </div>
                    )}

                    {/* Barcode */}
                    {labelFields.find((f) => f.id === "barcode")?.checked && (
                      <div className="text-center mt-3">
                        <img
                          src={generateBarcode(
                            selectedProduct.sku ||
                              selectedProduct.id.toString(),
                          )}
                          alt="Barcode"
                          className="mx-auto"
                          style={{ maxWidth: "180px" }}
                        />
                      </div>
                    )}

                    {/* QR Code */}
                    {labelFields.find((f) => f.id === "qrCode")?.checked && (
                      <div className="text-center mt-3">
                        <img
                          src={generateQRCode(
                            JSON.stringify({
                              name: selectedProduct.name,
                              sku: selectedProduct.sku,
                            }),
                          )}
                          alt="QR Code"
                          className="mx-auto"
                          style={{ width: "80px", height: "80px" }}
                        />
                      </div>
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
              <div>
                <Label htmlFor="template-selector">Label Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger id="template-selector">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Template</SelectItem>
                    {savedTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {labelFields.map((field) => (
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

              {labelFields.find((f) => f.id === "notes")?.checked && (
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

              {selectedProduct && (
                <div className="space-y-2 pt-3 border-t">
                  <Label>Product Details Draft</Label>
                  <Input
                    placeholder="Custom name"
                    defaultValue={
                      productDrafts[selectedProduct.id]?.customName ||
                      selectedProduct.name
                    }
                    onChange={(e) =>
                      saveDraft(selectedProduct.id, {
                        ...productDrafts[selectedProduct.id],
                        customName: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Custom batch no"
                    defaultValue={
                      productDrafts[selectedProduct.id]?.customBatch ||
                      selectedProduct.sku
                    }
                    onChange={(e) =>
                      saveDraft(selectedProduct.id, {
                        ...productDrafts[selectedProduct.id],
                        customBatch: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Custom weight"
                    defaultValue={
                      productDrafts[selectedProduct.id]?.customWeight ||
                      selectedProduct.unit
                    }
                    onChange={(e) =>
                      saveDraft(selectedProduct.id, {
                        ...productDrafts[selectedProduct.id],
                        customWeight: e.target.value,
                      })
                    }
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

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Label - {printProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mfd-date">Manufacturing Date</Label>
              <Input
                id="mfd-date"
                type="date"
                value={mfdDate}
                onChange={(e) => setMfdDate(e.target.value)}
                data-testid="input-mfd-date"
              />
            </div>
            <div>
              <Label htmlFor="exp-days">Expiry Days</Label>
              <Input
                id="exp-days"
                type="number"
                min="1"
                max="365"
                value={expDays}
                onChange={(e) => setExpDays(e.target.value)}
                placeholder="e.g., 30, 60"
                data-testid="input-exp-days"
              />
              <p className="text-sm text-gray-500 mt-1">
                Exp. Date: {new Date(calculateExpDate()).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="batch-checkbox"
                checked={batchCheckbox}
                onCheckedChange={(checked) => setBatchCheckbox(!!checked)}
                data-testid="checkbox-batch"
              />
              <Label htmlFor="batch-checkbox" className="cursor-pointer">
                Increment Batch/SKU by 1
              </Label>
            </div>
            <div>
              <Label htmlFor="no-copies">Number of Copies</Label>
              <Input
                id="no-copies"
                type="number"
                min="1"
                max="100"
                value={noCopies}
                onChange={(e) => setNoCopies(e.target.value)}
                data-testid="input-no-copies"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrintDialog(false)}
              data-testid="button-dialog-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAndPrint}
              data-testid="button-dialog-print"
            >
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
