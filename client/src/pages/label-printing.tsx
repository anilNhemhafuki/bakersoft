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
  const [mfdDate, setMfdDate] = useState(
    new Date().toISOString().split("T")[0],
  );
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
        console.log("🔍 Fetching products for label printing...");
        const res = await apiRequest("GET", "/api/products");
        console.log("📦 Products response:", res);

        // Handle wrapped response with success flag
        if (res?.success && res?.data) {
          const products = Array.isArray(res.data) ? res.data : [];
          console.log(
            `✅ Found ${products.length} products in success response`,
          );
          return products;
        }

        // Handle old format with products key
        if (res?.products) {
          const products = Array.isArray(res.products) ? res.products : [];
          console.log(`✅ Found ${products.length} products in products key`);
          return products;
        }

        // Handle direct array response
        if (Array.isArray(res)) {
          console.log(`✅ Found ${res.length} products in direct array`);
          return res;
        }

        console.warn("⚠️ No products found in response");
        return [];
      } catch (error) {
        console.error("❌ Failed to fetch products:", error);
        if (isUnauthorizedError(error)) {
          throw error;
        }
        return [];
      }
    },
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const products = Array.isArray(productsData) ? productsData : [];

  // Fetch settings for company information
  const { data: settingsData } = useQuery({
    queryKey: ["/settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/settings");
        return res?.settings || res || {};
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        return {};
      }
    },
  });

  const settings = settingsData || {};

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
    console.log("🖨️ confirmAndPrint called");
    console.log("📦 printProduct:", printProduct);

    if (!printProduct) {
      console.error("❌ No product selected for printing");
      return;
    }

    try {
      const expDate = calculateExpDate();
      const copies = parseInt(noCopies) || 1;

      console.log("📝 Print details:", {
        productId: printProduct.id,
        productName: printProduct.name,
        mfdDate,
        expDate,
        copies,
        batchCheckbox,
        currentSKU: printProduct.sku,
      });

      // If batch checkbox is checked, increment the SKU
      if (batchCheckbox && printProduct.sku) {
        const currentBatch = parseInt(printProduct.sku) || 0;
        const newBatch = currentBatch + 1;
        console.log(`📊 Updating batch from ${currentBatch} to ${newBatch}`);

        await apiRequest("PUT", `/api/products/${printProduct.id}`, {
          sku: newBatch.toString(),
        });
        console.log("✅ Batch updated successfully");
      }

      // Save printed label record to database
      console.log("💾 Saving print record to database...");
      const printRecordPayload = {
        productId: printProduct.id,
        mfdDate,
        expDate,
        noOfCopies: copies,
        printedBy: "User",
      };
      console.log("📤 Print record payload:", printRecordPayload);

      const printRecordResponse = await apiRequest(
        "POST",
        "/api/printed-labels",
        printRecordPayload,
      );
      console.log("📥 Print record response:", printRecordResponse);

      if (!printRecordResponse.success) {
        console.error("❌ Print record save failed:", printRecordResponse);
        throw new Error("Failed to save print record");
      }

      console.log(
        "✅ Print record saved successfully:",
        printRecordResponse.data,
      );

      // Close dialog and execute print with the saved data
      console.log("🔄 Closing dialog and initiating print...");
      setShowPrintDialog(false);

      console.log("🖨️ Calling handlePrint with:", {
        product: printProduct.name,
        mfdDate,
        expDate,
      });
      await handlePrint(printProduct, false, mfdDate, expDate);

      console.log("✅ Print process completed");
      toast({
        title: "Success",
        description: `Print record saved and label printed successfully`,
      });
    } catch (error) {
      console.error("❌ Error in confirmAndPrint:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        error,
      });
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
    console.log("🖨️ handlePrint function called with:", {
      productName: product.name,
      productId: product.id,
      isReprint,
      customMfdDate,
      customExpDate,
    });

    try {
      // Fetch system print settings
      console.log("⚙️ Fetching system settings...");
      const settingsResponse = await fetch("/api/settings");
      console.log("📥 Settings response status:", settingsResponse.status);

      const settingsData = await settingsResponse.json();
      console.log("📄 Settings data received:", settingsData);

      const settings = settingsData?.settings || settingsData || {};
      console.log("⚙️ Parsed settings:", settings);

      // Log printer configuration
      if (settings.defaultPrinter) {
        console.log("🖨️ Using configured printer:", settings.defaultPrinter);
      } else {
        console.log("ℹ️ No default printer configured");
      }

      console.log("🪟 Opening print window...");
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        console.error("❌ Failed to open print window - popup blocked");
        toast({
          title: "Print Failed",
          description: "Please allow pop-ups for printing",
          variant: "destructive",
        });
        return;
      }
      console.log("✅ Print window opened successfully");

      const labelData = {
        productName: product.name,
        batchNo: product.sku || "N/A",
        netWeight: product.netWeight
          ? `${product.netWeight}g`
          : product.unit || "N/A",
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

      console.log("📋 Label data prepared:", labelData);

      const barcodeImage = labelFields.find((f) => f.id === "barcode")?.checked
        ? generateBarcode(labelData.barcode)
        : "";

      console.log("🔳 Barcode generated:", barcodeImage ? "Yes" : "No");

      const qrCodeImage = labelFields.find((f) => f.id === "qrCode")?.checked
        ? generateQRCode(
            JSON.stringify({
              name: product.name,
              sku: product.sku,
              price: product.price,
            }),
          )
        : "";

      console.log("📱 QR Code generated:", qrCodeImage ? "Yes" : "No");

      // Get paper dimensions from system settings
      // Default to 1.6" x 1.2" label size matching label printer driver settings
      let paperWidth = "1.6in";
      let paperHeight = "1.2in";
      let templateWidth = "1.5in";
      let templateHeight = "1.2in";
      let cornerRadius = "0.125in";

      const labelSize = settings.labelSize || "label_1_6x1_2";
      const orientation = settings.labelOrientation || "portrait";

      console.log("📏 Label configuration:", {
        labelSize,
        orientation,
        customWidth: settings.customLabelWidth,
        customHeight: settings.customLabelHeight,
      });

      switch (labelSize) {
        case "label_1_6x1_2":
          // Match label printer driver: Portrait orientation (1.6" wide x 1.2" tall)
          paperWidth = "1.6in";
          paperHeight = "1.2in";
          templateWidth = "1.5in";
          templateHeight = "1.2in";
          cornerRadius = "0.125in";
          break;
        case "small":
          paperWidth = "50mm";
          paperHeight = "30mm";
          templateWidth = "48mm";
          templateHeight = "28mm";
          cornerRadius = "2mm";
          break;
        case "medium":
          paperWidth = "75mm";
          paperHeight = "50mm";
          templateWidth = "73mm";
          templateHeight = "48mm";
          cornerRadius = "3mm";
          break;
        case "large":
          paperWidth = "100mm";
          paperHeight = "75mm";
          templateWidth = "98mm";
          templateHeight = "73mm";
          cornerRadius = "3mm";
          break;
        case "custom_4x3":
          paperWidth = "4mm";
          paperHeight = "3mm";
          templateWidth = "3.9mm";
          templateHeight = "2.9mm";
          cornerRadius = "0.5mm";
          break;
        case "A6":
          paperWidth = "105mm";
          paperHeight = "148mm";
          templateWidth = "103mm";
          templateHeight = "146mm";
          cornerRadius = "3mm";
          break;
        case "A5":
          paperWidth = "148mm";
          paperHeight = "210mm";
          templateWidth = "146mm";
          templateHeight = "208mm";
          cornerRadius = "3mm";
          break;
        case "A4":
          paperWidth = "210mm";
          paperHeight = "297mm";
          templateWidth = "208mm";
          templateHeight = "295mm";
          cornerRadius = "3mm";
          break;
        default:
          if (settings.customLabelWidth && settings.customLabelHeight) {
            paperWidth = `${settings.customLabelWidth}mm`;
            paperHeight = `${settings.customLabelHeight}mm`;
            templateWidth = `${parseFloat(settings.customLabelWidth) - 2}mm`;
            templateHeight = `${parseFloat(settings.customLabelHeight) - 2}mm`;
            cornerRadius = "3mm";
          }
      }

      console.log("📐 Final paper dimensions:", {
        paperWidth,
        paperHeight,
        templateWidth,
        templateHeight,
        orientation,
      });

      // Get margins - matching label printer driver: Top: 0.0", Bottom: 0.0", Left: 0.05", Right: 0.05"
      const marginTop = settings.labelMarginTop !== undefined ? `${settings.labelMarginTop}in` : "0in";
      const marginRight = settings.labelMarginRight !== undefined ? `${settings.labelMarginRight}in` : "0.05in";
      const marginBottom = settings.labelMarginBottom !== undefined ? `${settings.labelMarginBottom}in` : "0in";
      const marginLeft = settings.labelMarginLeft !== undefined ? `${settings.labelMarginLeft}in` : "0.05in";

      console.log("📏 Margins:", {
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
      });

      let labelHTML = '<div class="label-content">';

      // Header with Reg and PAN from settings
      labelHTML += `
        <div class="header-row">
          <div><strong>Reg. No.:</strong> ${settings.companyRegNo || 'N/A'}</div>
          <div><strong>PAN No.:</strong> ${settings.companyPanNo || 'N/A'}</div>
        </div>
      `;

      // Company Name from settings
      labelHTML += `<div class="company-name">${settings.companyName || 'Company Name'}</div>`;

      // Company Address from settings
      labelHTML += `
        <div class="company-address">
          <div>${settings.companyAddress || 'Company Address'}</div>
        </div>
      `;

      // DFTQ Number from settings
      if (settings.companyDtqocNo) {
        labelHTML += `
          <div class="dftq-row">
            <strong>DFTQ No.:</strong> ${settings.companyDtqocNo}
          </div>
        `;
      }

      // Product Name
      labelHTML += `<div class="product-name-large">${labelData.productName}</div>`;

      // Two Column Layout
      labelHTML += '<div class="two-column-layout">';

      // Left Column - Product Details
      labelHTML += '<div class="left-column">';

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

      console.log("📝 Generating HTML for print window...");
      console.log(
        "🎨 Label fields to include:",
        labelFields.filter((f) => f.checked).map((f) => f.id),
      );

      const htmlContent = `
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
                margin: 0;
              }

              html, body {
                width: ${paperWidth};
                height: ${paperHeight};
                margin: 0;
                padding: 0;
                background: white;
                overflow: hidden;
              }

              body { 
                font-family: Arial, sans-serif; 
                font-size: 5pt;
              }

              .label-wrapper {
                width: ${paperWidth};
                height: ${paperHeight};
                background: white;
                padding: 0;
                margin: 0;
                overflow: hidden;
              }

              .label-content {
                width: 100%;
                height: 100%;
                padding: 1mm;
              }

              .header-row {
                display: flex;
                justify-content: space-between;
                font-size: 4pt;
                line-height: 1;
              }

              .company-name {
                text-align: center;
                font-size: 6pt;
                font-weight: bold;
                line-height: 1;
              }

              .company-address {
                text-align: center;
                font-size: 4pt;
                line-height: 1;
              }

              .dftq-row {
                font-size: 4pt;
                line-height: 1;
              }

              .product-name-large {
                text-align: center;
                font-size: 6pt;
                font-weight: bold;
                line-height: 1.1;
              }

              .two-column-layout {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1mm;
              }

              .left-column {
                font-size: 4pt;
              }

              .detail-row {
                font-size: 4pt;
                line-height: 1.1;
              }

              .right-column {
                display: flex;
                align-items: flex-start;
              }

              .ingredients-box {
                border: 0.5pt solid #000;
                padding: 1mm;
                width: 100%;
                font-size: 4pt;
                line-height: 1.1;
              }

              .ingredients-title {
                font-weight: bold;
                font-size: 4pt;
              }

              .ingredients-content {
                font-size: 4pt;
                line-height: 1.1;
              }

              .barcode-row {
                text-align: center;
              }

              .barcode { 
                max-width: 60%;
                height: 8mm; 
                display: block;
                margin: 0 auto;
              }

              .qr-row {
                text-align: center;
              }

              .qr-code { 
                width: 8mm;
                height: 8mm; 
                display: block;
                margin: 0 auto;
              }

              strong {
                font-weight: bold;
              }

              @media print { 
                html, body {
                  width: ${paperWidth};
                  height: ${paperHeight};
                  margin: 0;
                  padding: 0;
                }
                body { 
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .label-wrapper {
                  width: ${paperWidth};
                  height: ${paperHeight};
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="label-wrapper">
              ${labelHTML}
            </div>
          </body>
        </html>
      `;

      console.log("📄 Writing HTML to print window...");
      printWindow.document.write(htmlContent);
      console.log("✅ HTML content written to print window");
      printWindow.document.close();
      console.log("📄 Print window document closed");

      printWindow.focus();
      console.log("🎯 Print window focused");

      console.log("⏱️ Setting 250ms timeout before calling print()...");
      setTimeout(() => {
        console.log("🖨️ Calling printWindow.print()...");
        try {
          printWindow.print();
          console.log("✅ Print dialog should now be visible");
        } catch (printError) {
          console.error("❌ Error calling print():", printError);
        }
      }, 250);

      toast({
        title: isReprint ? "Reprinting Label" : "Printing Label",
        description: `Label for ${product.name} sent to printer (${paperWidth} × ${paperHeight})`,
      });
      console.log("✅ Toast notification shown");
    } catch (error) {
      console.error("❌ Print error in handlePrint:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        error,
      });
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
                      <TableHead>Selling Price</TableHead>
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
                          Rs. {parseFloat(product.price).toFixed(2)}
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
                    {/* Header with Reg and PAN from settings */}
                    <div className="flex justify-between text-xs mb-2">
                      <div>
                        <strong>Reg. No.:</strong> {settings?.companyRegNo || 'N/A'}
                      </div>
                      <div>
                        <strong>PAN No.:</strong> {settings?.companyPanNo || 'N/A'}
                      </div>
                    </div>

                    {/* Company Name from settings */}
                    <div className="text-center text-2xl font-bold mb-1">
                      {settings?.companyName || 'Company Name'}
                    </div>

                    {/* Company Address from settings */}
                    <div className="text-center text-xs space-y-0.5 mb-3">
                      <div>{settings?.companyAddress || 'Company Address'}</div>
                    </div>

                    {/* DFTQ Number from settings */}
                    {settings?.companyDtqocNo && (
                      <div className="text-xs mb-2">
                        <strong>DFTQ No.:</strong> {settings.companyDtqocNo}
                      </div>
                    )}

                    {/* Product Name - Large */}
                    <div className="text-center text-xl font-bold my-4">
                      {selectedProduct.name}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column - Product Details */}
                      <div className="space-y-1.5 text-xs">
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
                            {selectedProduct.netWeight
                              ? `${selectedProduct.netWeight}g`
                              : selectedProduct.unit || "N/A"}
                          </div>
                        )}
                        {labelFields.find((f) => f.id === "price")?.checked && (
                          <div>
                            <strong>MRP Rs.:</strong> Rs.
                            {parseFloat(selectedProduct.price || "0").toFixed(
                              2,
                            )}
                            /-
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
                            {labelNotes ||
                              selectedProduct.description ||
                              "List ingredients here"}
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
            <Button onClick={confirmAndPrint} data-testid="button-dialog-print">
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
