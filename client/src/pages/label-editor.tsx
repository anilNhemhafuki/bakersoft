import { useState, useEffect, useRef, useCallback, useMemo } from "react"; // ✅ Added useMemo
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  FolderOpen,
  Save,
  Printer,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Search,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Image,
  Square,
  Circle,
  Minus,
  ArrowRight,
  QrCode,
  Barcode,
  Grid3X3,
  Trash2,
  Move,
  Maximize2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  Palette,
  PenTool,
  MousePointer,
  Hand,
  Plus,
  Download,
  Upload,
  Settings,
  HelpCircle,
  MoreHorizontal,
  Triangle,
  Star,
  Hexagon,
  PaintBucket,
  Pipette,
  Eraser,
  LayoutGrid,
  Home,
} from "lucide-react";

interface LabelElement {
  id: string;
  type:
    | "text"
    | "barcode"
    | "qrcode"
    | "image"
    | "line"
    | "rectangle"
    | "ellipse"
    | "triangle"
    | "star";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  textAlign: "left" | "center" | "right" | "justify";
  verticalAlign: "top" | "middle" | "bottom";
  content: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: "solid" | "dashed" | "dotted" | "none";
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

interface LabelTemplate {
  id?: number;
  name: string;
  width: number;
  height: number;
  unit: "mm" | "px" | "in" | "cm";
  elements: LabelElement[];
  margins: { top: number; right: number; bottom: number; left: number };
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  backgroundColor: string;
}

const FONTS = [
  "Arial",
  "Arial Black",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Impact",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Palatino Linotype",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "4BARCODE Font 3",
  "Code 39",
  "Code 128",
  "EAN-13",
];

const FONT_SIZES = [
  6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
];

const LINE_WIDTHS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];

const COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FFFFFF",
  "#FF0000",
  "#FF6600",
  "#FFCC00",
  "#00FF00",
  "#00CCFF",
  "#0000FF",
  "#9900FF",
  "#FF00FF",
  "#FF6699",
  "#CC9966",
  "#663300",
  "#006600",
];

const createDefaultElement = (
  type: LabelElement["type"],
  id: string,
): LabelElement => ({
  id,
  type,
  label: `New ${type}`,
  x: 50,
  y: 50,
  width:
    type === "line"
      ? 150
      : type === "barcode"
        ? 150
        : type === "qrcode"
          ? 80
          : 100,
  height:
    type === "line"
      ? 2
      : type === "barcode"
        ? 40
        : type === "qrcode"
          ? 80
          : type === "text"
            ? 24
            : 60,
  rotation: 0,
  fontSize: 12,
  fontFamily: "Arial",
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  textAlign: "left",
  verticalAlign: "middle",
  content: type === "text" ? "Text" : "",
  color: "#000000",
  backgroundColor: "transparent",
  borderColor: "#000000",
  borderWidth:
    type === "line" ? 1 : type === "rectangle" || type === "ellipse" ? 1 : 0,
  borderStyle: "solid",
  opacity: 100,
  visible: true,
  locked: false,
  zIndex: 0,
});

const defaultElements: LabelElement[] = [
  {
    ...createDefaultElement("text", "company-name"),
    label: "Company Name",
    x: 50,
    y: 10,
    width: 200,
    height: 30,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    content: "Aakarsak Food",
  },
  {
    ...createDefaultElement("text", "product-name"),
    label: "Product Name",
    x: 50,
    y: 50,
    width: 200,
    height: 25,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    content: "Product Name",
  },
  {
    ...createDefaultElement("text", "batch-no"),
    label: "Batch No",
    x: 10,
    y: 85,
    width: 140,
    height: 15,
    fontSize: 10,
    content: "Batch No: 001",
  },
  {
    ...createDefaultElement("text", "net-weight"),
    label: "Net Weight",
    x: 10,
    y: 105,
    width: 140,
    height: 15,
    fontSize: 10,
    content: "Net Weight: 500g",
  },
  {
    ...createDefaultElement("text", "price"),
    label: "Price",
    x: 10,
    y: 125,
    width: 140,
    height: 15,
    fontSize: 10,
    content: "MRP Rs. 100/-",
  },
  {
    ...createDefaultElement("text", "mfg-date"),
    label: "Mfg Date",
    x: 10,
    y: 145,
    width: 140,
    height: 15,
    fontSize: 10,
    content: "Mfd. Date: 12/02/2025",
  },
  {
    ...createDefaultElement("text", "exp-date"),
    label: "Exp Date",
    x: 10,
    y: 165,
    width: 140,
    height: 15,
    fontSize: 10,
    content: "Exp. Date: 12/10/2025",
  },
  {
    ...createDefaultElement("text", "ingredients"),
    label: "Ingredients",
    x: 160,
    y: 85,
    width: 130,
    height: 95,
    fontSize: 8,
    content: "Ingredients: List here",
  },
  {
    ...createDefaultElement("barcode", "barcode"),
    label: "Barcode",
    x: 75,
    y: 190,
    width: 150,
    height: 40,
  },
];

type ToolType =
  | "select"
  | "pan"
  | "text"
  | "rectangle"
  | "ellipse"
  | "line"
  | "triangle"
  | "star"
  | "image"
  | "barcode"
  | "qrcode";

export default function LabelEditor() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [templateName, setTemplateName] = useState("Custom Label Template");
  const [labelWidth, setLabelWidth] = useState(300);
  const [labelHeight, setLabelHeight] = useState(250);
  const [unit, setUnit] = useState<"mm" | "px" | "in" | "cm">("px");
  const [elements, setElements] = useState<LabelElement[]>(defaultElements);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [zoom, setZoom] = useState(100);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [showRulers, setShowRulers] = useState(true);
  const [canvasBackground, setCanvasBackground] = useState("#FFFFFF");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<LabelElement[][]>([defaultElements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState<LabelElement[]>([]);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentFontSize, setCurrentFontSize] = useState(12);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentBgColor, setCurrentBgColor] = useState("transparent");
  const [currentBorderColor, setCurrentBorderColor] = useState("#000000");
  const [currentBorderWidth, setCurrentBorderWidth] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesListOpen, setTemplatesListOpen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<LabelTemplate[]>([]);

  // ✅ FIXED: effectiveDesignScale at component level
  const effectiveDesignScale = useMemo(() => {
    switch (unit) {
      case "mm":
        return 10; // 1mm → 10px (e.g., 4mm = 40px)
      case "cm":
        return 40; // 1cm → 40px
      case "in":
        return 96; // 1in = 96px
      case "px":
      default:
        return 1;
    }
  }, [unit]);

  const selected = elements.filter((el) => selectedElements.includes(el.id));
  const singleSelected = selected.length === 1 ? selected[0] : null;

  const pushHistory = useCallback(
    (newElements: LabelElement[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const updateElement = useCallback(
    (id: string, updates: Partial<LabelElement>) => {
      setElements((prev) => {
        const newElements = prev.map((el) =>
          el.id === id ? { ...el, ...updates } : el,
        );
        pushHistory(newElements);
        return newElements;
      });
    },
    [pushHistory],
  );

  const updateSelectedElements = useCallback(
    (updates: Partial<LabelElement>) => {
      if (selectedElements.length === 0) return;
      setElements((prev) => {
        const newElements = prev.map((el) =>
          selectedElements.includes(el.id) ? { ...el, ...updates } : el,
        );
        pushHistory(newElements);
        return newElements;
      });
    },
    [selectedElements, pushHistory],
  );

  const addElement = useCallback(
    (type: LabelElement["type"]) => {
      const newId = `element-${Date.now()}`;
      const newElement = createDefaultElement(type, newId);
      newElement.zIndex = elements.length;
      setElements((prev) => {
        const newElements = [...prev, newElement];
        pushHistory(newElements);
        return newElements;
      });
      setSelectedElements([newId]);
      setActiveTool("select");
    },
    [elements.length, pushHistory],
  );

  const deleteSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    setElements((prev) => {
      const newElements = prev.filter(
        (el) => !selectedElements.includes(el.id),
      );
      pushHistory(newElements);
      return newElements;
    });
    setSelectedElements([]);
  }, [selectedElements, pushHistory]);

  const copySelected = useCallback(() => {
    const copied = elements.filter((el) => selectedElements.includes(el.id));
    setClipboard(copied);
    toast({
      title: "Copied",
      description: `${copied.length} element(s) copied to clipboard`,
    });
  }, [elements, selectedElements, toast]);

  const cutSelected = useCallback(() => {
    copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  const paste = useCallback(() => {
    if (clipboard.length === 0) return;
    const newElements = clipboard.map((el) => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: elements.length,
    }));
    setElements((prev) => {
      const updated = [...prev, ...newElements];
      pushHistory(updated);
      return updated;
    });
    setSelectedElements(newElements.map((el) => el.id));
  }, [clipboard, elements.length, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    const toDuplicate = elements.filter((el) =>
      selectedElements.includes(el.id),
    );
    const duplicated = toDuplicate.map((el) => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: elements.length,
    }));
    setElements((prev) => {
      const updated = [...prev, ...duplicated];
      pushHistory(updated);
      return updated;
    });
    setSelectedElements(duplicated.map((el) => el.id));
  }, [elements, selectedElements, pushHistory]);

  const bringToFront = useCallback(() => {
    if (selectedElements.length === 0) return;
    setElements((prev) => {
      const maxZ = Math.max(...prev.map((el) => el.zIndex));
      const newElements = prev.map((el) =>
        selectedElements.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el,
      );
      pushHistory(newElements);
      return newElements;
    });
  }, [selectedElements, pushHistory]);

  const sendToBack = useCallback(() => {
    if (selectedElements.length === 0) return;
    setElements((prev) => {
      const minZ = Math.min(...prev.map((el) => el.zIndex));
      const newElements = prev.map((el) =>
        selectedElements.includes(el.id) ? { ...el, zIndex: minZ - 1 } : el,
      );
      pushHistory(newElements);
      return newElements;
    });
  }, [selectedElements, pushHistory]);

  const alignElements = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (selectedElements.length < 2) return;
      const selectedEls = elements.filter((el) =>
        selectedElements.includes(el.id),
      );
      let updates: { [id: string]: Partial<LabelElement> } = {};
      switch (alignment) {
        case "left":
          const minX = Math.min(...selectedEls.map((el) => el.x));
          selectedEls.forEach((el) => {
            updates[el.id] = { x: minX };
          });
          break;
        case "center":
          const avgCenterX =
            selectedEls.reduce((sum, el) => sum + el.x + el.width / 2, 0) /
            selectedEls.length;
          selectedEls.forEach((el) => {
            updates[el.id] = { x: avgCenterX - el.width / 2 };
          });
          break;
        case "right":
          const maxRight = Math.max(
            ...selectedEls.map((el) => el.x + el.width),
          );
          selectedEls.forEach((el) => {
            updates[el.id] = { x: maxRight - el.width };
          });
          break;
        case "top":
          const minY = Math.min(...selectedEls.map((el) => el.y));
          selectedEls.forEach((el) => {
            updates[el.id] = { y: minY };
          });
          break;
        case "middle":
          const avgCenterY =
            selectedEls.reduce((sum, el) => sum + el.y + el.height / 2, 0) /
            selectedEls.length;
          selectedEls.forEach((el) => {
            updates[el.id] = { y: avgCenterY - el.height / 2 };
          });
          break;
        case "bottom":
          const maxBottom = Math.max(
            ...selectedEls.map((el) => el.y + el.height),
          );
          selectedEls.forEach((el) => {
            updates[el.id] = { y: maxBottom - el.height };
          });
          break;
      }
      setElements((prev) => {
        const newElements = prev.map((el) =>
          updates[el.id] ? { ...el, ...updates[el.id] } : el,
        );
        pushHistory(newElements);
        return newElements;
      });
    },
    [elements, selectedElements, pushHistory],
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === "pan") {
        setIsPanning(true);
        setPanStart({
          x: e.clientX - panOffset.x,
          y: e.clientY - panOffset.y,
        });
        return;
      }
      if (activeTool !== "select") return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      // ✅ FIXED: scale mouse coords using effectiveDesignScale
      const x = (e.clientX - rect.left) / ((zoom / 100) * effectiveDesignScale);
      const y = (e.clientY - rect.top) / ((zoom / 100) * effectiveDesignScale);
      const clickedElement = [...elements]
        .sort((a, b) => b.zIndex - a.zIndex)
        .find(
          (el) =>
            el.visible &&
            !el.locked &&
            x >= el.x &&
            x <= el.x + el.width &&
            y >= el.y &&
            y <= el.y + el.height,
        );
      if (clickedElement) {
        if (e.shiftKey) {
          setSelectedElements((prev) =>
            prev.includes(clickedElement.id)
              ? prev.filter((id) => id !== clickedElement.id)
              : [...prev, clickedElement.id],
          );
        } else if (!selectedElements.includes(clickedElement.id)) {
          setSelectedElements([clickedElement.id]);
        }
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setElementStart({
          x: clickedElement.x,
          y: clickedElement.y,
          width: clickedElement.width,
          height: clickedElement.height,
        });
      } else {
        setSelectedElements([]);
      }
    },
    [
      activeTool,
      elements,
      zoom,
      selectedElements,
      panOffset,
      effectiveDesignScale,
    ], // ✅ dependency added
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }
      if (!isDragging && !isResizing) return;
      // ✅ FIXED: scale dx/dy using effectiveDesignScale
      const dx =
        (e.clientX - dragStart.x) / (zoom / 100) / effectiveDesignScale;
      const dy =
        (e.clientY - dragStart.y) / (zoom / 100) / effectiveDesignScale;

      if (isDragging && singleSelected) {
        let newX = elementStart.x + dx;
        let newY = elementStart.y + dy;
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }
        newX = Math.max(0, Math.min(labelWidth - singleSelected.width, newX));
        newY = Math.max(0, Math.min(labelHeight - singleSelected.height, newY));
        setElements((prev) =>
          prev.map((el) =>
            el.id === singleSelected.id ? { ...el, x: newX, y: newY } : el,
          ),
        );
      }
      if (isResizing && singleSelected && resizeHandle) {
        let newWidth = elementStart.width;
        let newHeight = elementStart.height;
        let newX = elementStart.x;
        let newY = elementStart.y;
        if (resizeHandle.includes("e"))
          newWidth = Math.max(10, elementStart.width + dx);
        if (resizeHandle.includes("w")) {
          newWidth = Math.max(10, elementStart.width - dx);
          newX = elementStart.x + dx;
        }
        if (resizeHandle.includes("s"))
          newHeight = Math.max(10, elementStart.height + dy);
        if (resizeHandle.includes("n")) {
          newHeight = Math.max(10, elementStart.height - dy);
          newY = elementStart.y + dy;
        }
        setElements((prev) =>
          prev.map((el) =>
            el.id === singleSelected.id
              ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
              : el,
          ),
        );
      }
    },
    [
      isPanning,
      panStart,
      isDragging,
      isResizing,
      dragStart,
      elementStart,
      zoom,
      snapToGrid,
      gridSize,
      labelWidth,
      labelHeight,
      singleSelected,
      resizeHandle,
      effectiveDesignScale, // ✅ dependency added
    ],
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      pushHistory(elements);
    }
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setResizeHandle(null);
  }, [isDragging, isResizing, elements, pushHistory]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation();
      if (!singleSelected) return;
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({ x: e.clientX, y: e.clientY });
      setElementStart({
        x: singleSelected.x,
        y: singleSelected.y,
        width: singleSelected.width,
        height: singleSelected.height,
      });
    },
    [singleSelected],
  );

  const saveTemplate = useCallback(() => {
    const template: LabelTemplate = {
      name: templateName,
      width: labelWidth,
      height: labelHeight,
      unit,
      elements,
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
      gridEnabled,
      gridSize,
      snapToGrid,
      backgroundColor: canvasBackground,
    };
    const timestamp = Date.now();
    localStorage.setItem(`labelTemplate_${timestamp}`, JSON.stringify(template));
    localStorage.setItem("labelTemplate", JSON.stringify(template)); // Keep default
    loadSavedTemplates();
    toast({
      title: "Template Saved",
      description: "Your label template has been saved successfully",
    });
  }, [
    templateName,
    labelWidth,
    labelHeight,
    unit,
    elements,
    gridEnabled,
    gridSize,
    snapToGrid,
    canvasBackground,
    toast,
  ]);

  const loadTemplate = useCallback(() => {
    const saved = localStorage.getItem("labelTemplate");
    if (saved) {
      try {
        const template: LabelTemplate = JSON.parse(saved);
        setTemplateName(template.name);
        setLabelWidth(template.width);
        setLabelHeight(template.height);
        setUnit(template.unit);
        setElements(template.elements);
        setGridEnabled(template.gridEnabled ?? true);
        setGridSize(template.gridSize ?? 10);
        setSnapToGrid(template.snapToGrid ?? true);
        setCanvasBackground(template.backgroundColor ?? "#FFFFFF");
        setHistory([template.elements]);
        setHistoryIndex(0);
        toast({
          title: "Template Loaded",
          description: "Template loaded successfully",
        });
      } catch (e) {
        toast({
          title: "Load Failed",
          description: "Failed to load template",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const exportTemplate = useCallback(() => {
    const template: LabelTemplate = {
      name: templateName,
      width: labelWidth,
      height: labelHeight,
      unit,
      elements,
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
      gridEnabled,
      gridSize,
      snapToGrid,
      backgroundColor: canvasBackground,
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    templateName,
    labelWidth,
    labelHeight,
    unit,
    elements,
    gridEnabled,
    gridSize,
    snapToGrid,
    canvasBackground,
  ]);

  const importTemplate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const template: LabelTemplate = JSON.parse(
            event.target?.result as string,
          );
          setTemplateName(template.name);
          setLabelWidth(template.width);
          setLabelHeight(template.height);
          setUnit(template.unit);
          setElements(template.elements);
          setGridEnabled(template.gridEnabled ?? true);
          setGridSize(template.gridSize ?? 10);
          setSnapToGrid(template.snapToGrid ?? true);
          setCanvasBackground(template.backgroundColor ?? "#FFFFFF");
          setHistory([template.elements]);
          setHistoryIndex(0);
          toast({
            title: "Template Imported",
            description: "Template loaded successfully",
          });
        } catch {
          toast({
            title: "Import Failed",
            description: "Invalid template file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [toast],
  );

  const newTemplate = useCallback(() => {
    setTemplateName("New Label Template");
    setElements([]);
    setSelectedElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
    toast({
      title: "New Template",
      description: "Started a new blank template",
    });
  }, [toast]);

  const printLabel = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow pop-ups",
        variant: "destructive",
      });
      return;
    }
    let elementsHtml = elements
      .filter((el) => el.visible)
      .map((el) => {
        const style = `
        position: absolute;
        left: ${el.x}px;
        top: ${el.y}px;
        width: ${el.width}px;
        height: ${el.height}px;
        font-family: ${el.fontFamily};
        font-size: ${el.fontSize}px;
        font-weight: ${el.fontWeight};
        font-style: ${el.fontStyle};
        text-decoration: ${el.textDecoration};
        text-align: ${el.textAlign};
        color: ${el.color};
        background-color: ${el.backgroundColor};
        border: ${el.borderWidth}px ${el.borderStyle} ${el.borderColor};
        opacity: ${el.opacity / 100};
        transform: rotate(${el.rotation}deg);
        display: flex;
        align-items: ${el.verticalAlign === "top" ? "flex-start" : el.verticalAlign === "bottom" ? "flex-end" : "center"};
        overflow: hidden;
      `;
        if (el.type === "text") {
          return `<div style="${style}">${el.content}</div>`;
        } else if (el.type === "barcode") {
          return `<div style="${style}; background: repeating-linear-gradient(90deg, black, black 2px, white 2px, white 4px);"></div>`;
        } else if (el.type === "qrcode") {
          return `<div style="${style}; background: linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%); background-size: 8px 8px;"></div>`;
        } else if (el.type === "rectangle") {
          return `<div style="${style}"></div>`;
        } else if (el.type === "ellipse") {
          return `<div style="${style}; border-radius: 50%;"></div>`;
        } else if (el.type === "line") {
          return `<div style="${style}; background: ${el.color};"></div>`;
        } else if (el.type === "image") {
          return el.content
            ? `<div style="${style}"><img src="${el.content}" style="max-width: 100%; max-height: 100%; object-fit: contain;" /></div>`
            : `<div style="${style}; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">Image</div>`;
        } else if (el.type === "triangle") {
          return `<div style="${style}"><div style="width: 0; height: 0; border-left: ${el.width / 2}px solid transparent; border-right: ${el.width / 2}px solid transparent; border-bottom: ${el.height}px solid ${el.backgroundColor || el.color};"></div></div>`;
        } else if (el.type === "star") {
          return `<div style="${style}; font-size: ${el.height}px; line-height: 1;">&#9733;</div>`;
        }
        return "";
      })
      .join("");
    printWindow.document.write(`
      <html>
        <head>
          <title>Label - ${templateName}</title>
          <style>
            @page { size: ${labelWidth}px ${labelHeight}px; margin: 0; }
            body { margin: 0; padding: 0; }
            .label { 
              width: ${labelWidth}px; 
              height: ${labelHeight}px; 
              position: relative;
              background: ${canvasBackground};
            }
          </style>
        </head>
        <body>
          <div class="label">${elementsHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }, [
    elements,
    templateName,
    labelWidth,
    labelHeight,
    canvasBackground,
    toast,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            e.shiftKey ? redo() : undo();
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
          case "c":
            e.preventDefault();
            copySelected();
            break;
          case "x":
            e.preventDefault();
            cutSelected();
            break;
          case "v":
            e.preventDefault();
            paste();
            break;
          case "d":
            e.preventDefault();
            duplicateSelected();
            break;
          case "s":
            e.preventDefault();
            saveTemplate();
            break;
          case "a":
            e.preventDefault();
            setSelectedElements(elements.map((el) => el.id));
            break;
        }
      } else {
        switch (e.key) {
          case "Delete":
          case "Backspace":
            if (selectedElements.length > 0) {
              e.preventDefault();
              deleteSelected();
            }
            break;
          case "Escape":
            setSelectedElements([]);
            setActiveTool("select");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    copySelected,
    cutSelected,
    paste,
    duplicateSelected,
    saveTemplate,
    deleteSelected,
    elements,
    selectedElements,
  ]);

  useEffect(() => {
    loadTemplate();
    loadSavedTemplates();
  }, []);

  const loadSavedTemplates = () => {
    try {
      const templates: LabelTemplate[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('labelTemplate_')) {
          const template = JSON.parse(localStorage.getItem(key) || '{}');
          templates.push({ ...template, id: parseInt(key.replace('labelTemplate_', '')) });
        }
      }
      setSavedTemplates(templates);
    } catch (e) {
      console.error('Failed to load saved templates:', e);
    }
  };

  const ToolbarButton = ({
    icon: Icon,
    label,
    onClick,
    active,
    disabled,
  }: {
    icon: any;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant={active ? "default" : "ghost"}
          onClick={onClick}
          disabled={disabled}
          className="h-7 w-7"
          data-testid={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  const ToolbarSeparator = () => (
    <Separator orientation="vertical" className="h-6 mx-1" />
  );

  const renderElement = (el: LabelElement) => {
    const isSelected = selectedElements.includes(el.id);
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      transform: `rotate(${el.rotation}deg)`,
      opacity: el.opacity / 100,
      cursor: el.locked
        ? "not-allowed"
        : activeTool === "select"
          ? "move"
          : "default",
      zIndex: el.zIndex,
      display: el.visible ? "flex" : "none",
      alignItems:
        el.verticalAlign === "top"
          ? "flex-start"
          : el.verticalAlign === "bottom"
            ? "flex-end"
            : "center",
      justifyContent:
        el.textAlign === "center"
          ? "center"
          : el.textAlign === "right"
            ? "flex-end"
            : "flex-start",
    };

    const renderContent = () => {
      switch (el.type) {
        case "text":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                fontFamily: el.fontFamily,
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle,
                textDecoration: el.textDecoration,
                textAlign: el.textAlign,
                color: el.color,
                backgroundColor: el.backgroundColor,
                display: "flex",
                alignItems:
                  el.verticalAlign === "top"
                    ? "flex-start"
                    : el.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center",
                overflow: "hidden",
                padding: "2px",
              }}
            >
              {el.content}
            </div>
          );
        case "barcode":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 2,
              }}
            >
              <span
                style={{ fontSize: 8, background: "#fff", padding: "0 4px" }}
              >
                BARCODE
              </span>
            </div>
          );
        case "qrcode":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `
                  linear-gradient(45deg, #000 25%, transparent 25%),
                  linear-gradient(-45deg, #000 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #000 75%),
                  linear-gradient(-45deg, transparent 75%, #000 75%)
                `,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
            />
          );
        case "rectangle":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: el.backgroundColor,
                border: `${el.borderWidth}px ${el.borderStyle} ${el.borderColor}`,
              }}
            />
          );
        case "ellipse":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: el.backgroundColor,
                border: `${el.borderWidth}px ${el.borderStyle} ${el.borderColor}`,
                borderRadius: "50%",
              }}
            />
          );
        case "line":
          return (
            <div
              style={{
                width: "100%",
                height: el.borderWidth || 2,
                backgroundColor: el.color,
              }}
            />
          );
        case "triangle":
          return (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${el.width / 2}px solid transparent`,
                borderRight: `${el.width / 2}px solid transparent`,
                borderBottom: `${el.height}px solid ${
                  el.backgroundColor || el.color
                }`,
              }}
            />
          );
        case "star":
          return (
            <div
              style={{ fontSize: el.height, color: el.color, lineHeight: 1 }}
            >
              &#9733;
            </div>
          );
        case "image":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: el.backgroundColor || "#f0f0f0",
                border: `${el.borderWidth}px ${el.borderStyle} ${el.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {el.content ? (
                <img
                  src={el.content}
                  alt="Label image"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 text-xs">
                  <Image className="h-8 w-8 mb-1" />
                  <span>Image</span>
                </div>
              )}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        key={el.id}
        style={baseStyle}
        onMouseDown={(e) => {
          if (el.locked) return;
          e.stopPropagation();
          if (e.shiftKey) {
            setSelectedElements((prev) =>
              prev.includes(el.id)
                ? prev.filter((id) => id !== el.id)
                : [...prev, el.id],
            );
          } else if (!selectedElements.includes(el.id)) {
            setSelectedElements([el.id]);
          }
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          setElementStart({
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          });
        }}
        className={`${isSelected ? "ring-2 ring-blue-500" : ""}`}
        data-testid={`element-${el.id}`}
      >
        {renderContent()}
        {isSelected && !el.locked && (
          <>
            <div
              className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
            />
            <div
              className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
            />
            <div
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, "se")}
            />
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 cursor-n-resize"
              onMouseDown={(e) => handleResizeStart(e, "n")}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 cursor-s-resize"
              onMouseDown={(e) => handleResizeStart(e, "s")}
            />
            <div
              className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-blue-500 cursor-w-resize"
              onMouseDown={(e) => handleResizeStart(e, "w")}
            />
            <div
              className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-blue-500 cursor-e-resize"
              onMouseDown={(e) => handleResizeStart(e, "e")}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col bg-gray-100"
      data-testid="label-editor-page"
    >
      {/* Main Toolbar Row 1 - File Operations */}
      <div className="bg-white border-b px-2 py-1 flex items-center gap-1 flex-wrap">
        <ToolbarButton icon={FileText} label="New" onClick={newTemplate} />
        <label>
          <ToolbarButton icon={FolderOpen} label="Open" onClick={() => {}} />
          <input
            type="file"
            accept=".json"
            onChange={importTemplate}
            className="hidden"
            data-testid="input-import-file"
          />
        </label>
        <ToolbarButton icon={Save} label="Save" onClick={saveTemplate} />
        <Dialog open={templatesListOpen} onOpenChange={setTemplatesListOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7" data-testid="button-templates">
              <FolderOpen className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Saved Templates</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {savedTemplates.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No saved templates</p>
                ) : (
                  savedTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">{template.width} × {template.height} {template.unit}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setTemplateName(template.name);
                          setLabelWidth(template.width);
                          setLabelHeight(template.height);
                          setUnit(template.unit);
                          setElements(template.elements);
                          setGridEnabled(template.gridEnabled ?? true);
                          setGridSize(template.gridSize ?? 10);
                          setSnapToGrid(template.snapToGrid ?? true);
                          setCanvasBackground(template.backgroundColor ?? "#FFFFFF");
                          setHistory([template.elements]);
                          setHistoryIndex(0);
                          setTemplatesListOpen(false);
                          toast({ title: "Template Loaded", description: template.name });
                        }}>
                          Load
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          localStorage.removeItem(`labelTemplate_${template.id}`);
                          loadSavedTemplates();
                          toast({ title: "Template Deleted" });
                        }}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={exportTemplate}
        />
        <ToolbarButton icon={Printer} label="Print" onClick={printLabel} />
        <ToolbarSeparator />
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={historyIndex <= 0}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={Scissors}
          label="Cut (Ctrl+X)"
          onClick={cutSelected}
          disabled={selectedElements.length === 0}
        />
        <ToolbarButton
          icon={Copy}
          label="Copy (Ctrl+C)"
          onClick={copySelected}
          disabled={selectedElements.length === 0}
        />
        <ToolbarButton
          icon={Clipboard}
          label="Paste (Ctrl+V)"
          onClick={paste}
          disabled={clipboard.length === 0}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={ZoomOut}
          label="Zoom Out"
          onClick={() => setZoom(Math.max(25, zoom - 25))}
        />
        <span className="text-xs w-12 text-center">{zoom}%</span>
        <ToolbarButton
          icon={ZoomIn}
          label="Zoom In"
          onClick={() => setZoom(Math.min(400, zoom + 25))}
        />
        <ToolbarButton
          icon={Home}
          label="Reset View"
          onClick={() => {
            setZoom(100);
            setPanOffset({ x: 0, y: 0 });
          }}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={MousePointer}
          label="Select Tool"
          onClick={() => setActiveTool("select")}
          active={activeTool === "select"}
        />
        <ToolbarButton
          icon={Hand}
          label="Pan Tool"
          onClick={() => setActiveTool("pan")}
          active={activeTool === "pan"}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={Type}
          label="Add Text"
          onClick={() => addElement("text")}
        />
        <ToolbarButton
          icon={Barcode}
          label="Add Barcode"
          onClick={() => addElement("barcode")}
        />
        <ToolbarButton
          icon={QrCode}
          label="Add QR Code"
          onClick={() => addElement("qrcode")}
        />
        <ToolbarButton
          icon={Image}
          label="Add Image"
          onClick={() => addElement("image")}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={Square}
          label="Add Rectangle"
          onClick={() => addElement("rectangle")}
        />
        <ToolbarButton
          icon={Circle}
          label="Add Ellipse"
          onClick={() => addElement("ellipse")}
        />
        <ToolbarButton
          icon={Minus}
          label="Add Line"
          onClick={() => addElement("line")}
        />
        <ToolbarButton
          icon={Triangle}
          label="Add Triangle"
          onClick={() => addElement("triangle")}
        />
        <ToolbarButton
          icon={Star}
          label="Add Star"
          onClick={() => addElement("star")}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={Grid3X3}
          label="Toggle Grid"
          onClick={() => setGridEnabled(!gridEnabled)}
          active={gridEnabled}
        />
        <ToolbarButton
          icon={LayoutGrid}
          label="Snap to Grid"
          onClick={() => setSnapToGrid(!snapToGrid)}
          active={snapToGrid}
        />
        <div className="flex-1" />
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" data-testid="button-settings">
              <Settings className="h-4 w-4 mr-1" /> Page Setup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Label Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  data-testid="input-template-name"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={labelWidth}
                    onChange={(e) => setLabelWidth(Number(e.target.value))}
                    data-testid="input-label-width"
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={labelHeight}
                    onChange={(e) => setLabelHeight(Number(e.target.value))}
                    data-testid="input-label-height"
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                    <SelectTrigger data-testid="select-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="px">Pixels</SelectItem>
                      <SelectItem value="mm">Millimeters</SelectItem>
                      <SelectItem value="cm">Centimeters</SelectItem>
                      <SelectItem value="in">Inches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Grid Size</Label>
                  <Input
                    type="number"
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    data-testid="input-grid-size"
                  />
                </div>
                <div>
                  <Label>Background</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={canvasBackground}
                      onChange={(e) => setCanvasBackground(e.target.value)}
                      className="w-12 h-9 p-1"
                      data-testid="input-canvas-bg"
                    />
                    <Input
                      value={canvasBackground}
                      onChange={(e) => setCanvasBackground(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Toolbar Row 2 - Text Formatting */}
      <div className="bg-white border-b px-2 py-1 flex items-center gap-1 flex-wrap">
        <Select
          value={singleSelected?.fontFamily || currentFont}
          onValueChange={(v) => {
            setCurrentFont(v);
            updateSelectedElements({ fontFamily: v });
          }}
        >
          <SelectTrigger className="w-40 h-7 text-xs" data-testid="select-font">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(singleSelected?.fontSize || currentFontSize)}
          onValueChange={(v) => {
            setCurrentFontSize(Number(v));
            updateSelectedElements({ fontSize: Number(v) });
          }}
        >
          <SelectTrigger
            className="w-16 h-7 text-xs"
            data-testid="select-font-size"
          >
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolbarSeparator />
        <ToolbarButton
          icon={Bold}
          label="Bold"
          onClick={() =>
            updateSelectedElements({
              fontWeight:
                singleSelected?.fontWeight === "bold" ? "normal" : "bold",
            })
          }
          active={singleSelected?.fontWeight === "bold"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          onClick={() =>
            updateSelectedElements({
              fontStyle:
                singleSelected?.fontStyle === "italic" ? "normal" : "italic",
            })
          }
          active={singleSelected?.fontStyle === "italic"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarButton
          icon={Underline}
          label="Underline"
          onClick={() =>
            updateSelectedElements({
              textDecoration:
                singleSelected?.textDecoration === "underline"
                  ? "none"
                  : "underline",
            })
          }
          active={singleSelected?.textDecoration === "underline"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          onClick={() =>
            updateSelectedElements({
              textDecoration:
                singleSelected?.textDecoration === "line-through"
                  ? "none"
                  : "line-through",
            })
          }
          active={singleSelected?.textDecoration === "line-through"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarSeparator />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1"
              data-testid="button-text-color"
            >
              <Type className="h-4 w-4" />
              <div
                className="w-4 h-2 border"
                style={{
                  backgroundColor: singleSelected?.color || currentColor,
                }}
              />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setCurrentColor(color);
                    updateSelectedElements({ color });
                  }}
                  data-testid={`color-${color}`}
                />
              ))}
            </div>
            <Input
              type="color"
              value={singleSelected?.color || currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                updateSelectedElements({ color: e.target.value });
              }}
              className="w-full h-8 mt-2"
              data-testid="input-custom-color"
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1"
              data-testid="button-bg-color"
            >
              <PaintBucket className="h-4 w-4" />
              <div
                className="w-4 h-2 border"
                style={{
                  backgroundColor:
                    singleSelected?.backgroundColor || currentBgColor,
                }}
              />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              <button
                className="w-6 h-6 rounded border hover:scale-110 transition-transform bg-white relative overflow-hidden"
                onClick={() => {
                  setCurrentBgColor("transparent");
                  updateSelectedElements({
                    backgroundColor: "transparent",
                  });
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-red-500 to-transparent transform rotate-45"
                  style={{ height: "1px", top: "50%" }}
                />
              </button>
              {COLORS.slice(1).map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setCurrentBgColor(color);
                    updateSelectedElements({ backgroundColor: color });
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <ToolbarSeparator />
        <ToolbarButton
          icon={AlignLeft}
          label="Align Left"
          onClick={() => updateSelectedElements({ textAlign: "left" })}
          active={singleSelected?.textAlign === "left"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarButton
          icon={AlignCenter}
          label="Align Center"
          onClick={() => updateSelectedElements({ textAlign: "center" })}
          active={singleSelected?.textAlign === "center"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarButton
          icon={AlignRight}
          label="Align Right"
          onClick={() => updateSelectedElements({ textAlign: "right" })}
          active={singleSelected?.textAlign === "right"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarButton
          icon={AlignJustify}
          label="Justify"
          onClick={() => updateSelectedElements({ textAlign: "justify" })}
          active={singleSelected?.textAlign === "justify"}
          disabled={!singleSelected || singleSelected.type !== "text"}
        />
        <ToolbarSeparator />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1"
              data-testid="button-border"
            >
              <Square className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Border Width</Label>
                <Select
                  value={String(
                    singleSelected?.borderWidth || currentBorderWidth,
                  )}
                  onValueChange={(v) => {
                    setCurrentBorderWidth(Number(v));
                    updateSelectedElements({ borderWidth: Number(v) });
                  }}
                >
                  <SelectTrigger className="h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINE_WIDTHS.map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w} pt
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Border Style</Label>
                <Select
                  value={singleSelected?.borderStyle || "solid"}
                  onValueChange={(v: any) =>
                    updateSelectedElements({ borderStyle: v })
                  }
                >
                  <SelectTrigger className="h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Border Color</Label>
                <Input
                  type="color"
                  value={singleSelected?.borderColor || currentBorderColor}
                  onChange={(e) => {
                    setCurrentBorderColor(e.target.value);
                    updateSelectedElements({ borderColor: e.target.value });
                  }}
                  className="w-full h-8"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <ToolbarSeparator />
        <ToolbarButton
          icon={Layers}
          label="Bring to Front"
          onClick={bringToFront}
          disabled={selectedElements.length === 0}
        />
        <ToolbarButton
          icon={Layers}
          label="Send to Back"
          onClick={sendToBack}
          disabled={selectedElements.length === 0}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={singleSelected?.locked ? Lock : Unlock}
          label={singleSelected?.locked ? "Unlock" : "Lock"}
          onClick={() =>
            updateSelectedElements({ locked: !singleSelected?.locked })
          }
          disabled={!singleSelected}
        />
        <ToolbarButton
          icon={singleSelected?.visible ? Eye : EyeOff}
          label={singleSelected?.visible ? "Hide" : "Show"}
          onClick={() =>
            updateSelectedElements({ visible: !singleSelected?.visible })
          }
          disabled={!singleSelected}
        />
        <ToolbarButton
          icon={Trash2}
          label="Delete"
          onClick={deleteSelected}
          disabled={selectedElements.length === 0}
        />
        <ToolbarSeparator />
        <ToolbarButton
          icon={FlipHorizontal}
          label="Flip Horizontal"
          onClick={() => {}}
          disabled={!singleSelected}
        />
        <ToolbarButton
          icon={FlipVertical}
          label="Flip Vertical"
          onClick={() => {}}
          disabled={!singleSelected}
        />
        <ToolbarButton
          icon={RotateCw}
          label="Rotate 90°"
          onClick={() =>
            updateSelectedElements({
              rotation: (singleSelected?.rotation || 0) + 90,
            })
          }
          disabled={!singleSelected}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 overflow-auto p-4 flex items-center justify-center"
        >
          <div
            className="relative shadow-2xl"
            style={{
              width: labelWidth * effectiveDesignScale * (zoom / 100),
              height: labelHeight * effectiveDesignScale * (zoom / 100),
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: "center",
            }}
          >
            {/* Canvas */}
            <div
              ref={canvasRef}
              className="absolute inset-0 overflow-hidden"
              style={{
                backgroundColor: canvasBackground,
                backgroundImage: gridEnabled
                  ? `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`
                  : "none",
                backgroundSize: gridEnabled
                  ? `${gridSize * effectiveDesignScale * (zoom / 100)}px ${gridSize * effectiveDesignScale * (zoom / 100)}px`
                  : "auto",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                width: labelWidth * effectiveDesignScale,
                height: labelHeight * effectiveDesignScale,
                cursor:
                  activeTool === "select"
                    ? "default"
                    : activeTool === "pan"
                      ? isPanning
                        ? "grabbing"
                        : "grab"
                      : "crosshair",
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              data-testid="canvas-area"
            >
              {elements.sort((a, b) => a.zIndex - b.zIndex).map(renderElement)}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-white border-l overflow-y-auto">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">Properties</h3>
          </div>
          {singleSelected ? (
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={singleSelected.label}
                    onChange={(e) =>
                      updateElement(singleSelected.id, {
                        label: e.target.value,
                      })
                    }
                    className="h-8"
                    data-testid="input-element-label"
                  />
                </div>
                {singleSelected.type === "text" && (
                  <div>
                    <Label className="text-xs">Content</Label>
                    <Input
                      value={singleSelected.content}
                      onChange={(e) =>
                        updateElement(singleSelected.id, {
                          content: e.target.value,
                        })
                      }
                      className="h-8"
                      data-testid="input-element-content"
                    />
                  </div>
                )}
                {singleSelected.type === "image" && (
                  <div>
                    <Label className="text-xs">Image URL</Label>
                    <Input
                      value={singleSelected.content}
                      onChange={(e) =>
                        updateElement(singleSelected.id, {
                          content: e.target.value,
                        })
                      }
                      placeholder="Enter image URL..."
                      className="h-8"
                      data-testid="input-image-url"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste an image URL or leave empty for placeholder
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={Math.round(singleSelected.x)}
                      onChange={(e) =>
                        updateElement(singleSelected.id, {
                          x: Number(e.target.value),
                        })
                      }
                      className="h-8"
                      data-testid="input-element-x"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(singleSelected.y)}
                      onChange={(e) =>
                        updateElement(singleSelected.id, {
                          y: Number(e.target.value),
                        })
                      }
                      className="h-8"
                      data-testid="input-element-y"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={Math.round(singleSelected.width)}
                      onChange={(e) =>
                        updateElement(singleSelected.id, {
                          width: Number(e.target.value),
                        })
                      }
                      className="h-8"
                      data-testid="input-element-width"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={Math.round(singleSelected.height)}
                      onChange={(e) =>
                        updateElement(singleSelected.id, {
                          height: Number(e.target.value),
                        })
                      }
                      className="h-8"
                      data-testid="input-element-height"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Rotation (°)</Label>
                  <Input
                    type="number"
                    value={singleSelected.rotation}
                    onChange={(e) =>
                      updateElement(singleSelected.id, {
                        rotation: Number(e.target.value),
                      })
                    }
                    className="h-8"
                    data-testid="input-element-rotation"
                  />
                </div>
                <div>
                  <Label className="text-xs">Opacity (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={singleSelected.opacity}
                    onChange={(e) =>
                      updateElement(singleSelected.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                    className="h-8"
                    data-testid="input-element-opacity"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={singleSelected.visible}
                    onCheckedChange={(checked) =>
                      updateElement(singleSelected.id, { visible: !!checked })
                    }
                    data-testid="checkbox-visible"
                  />
                  <Label className="text-xs">Visible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={singleSelected.locked}
                    onCheckedChange={(checked) =>
                      updateElement(singleSelected.id, { locked: !!checked })
                    }
                    data-testid="checkbox-locked"
                  />
                  <Label className="text-xs">Locked</Label>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Select an element to edit its properties
            </div>
          )}

          {/* Elements List */}
          <div className="border-t">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">
                Elements ({elements.length})
              </h3>
            </div>
            <ScrollArea className="h-48">
              <div className="p-2 space-y-1">
                {elements
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((el) => (
                    <div
                      key={el.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                        selectedElements.includes(el.id)
                          ? "bg-orange-100"
                          : "hover:bg-orange-100"
                      }`}
                      onClick={() => setSelectedElements([el.id])}
                      data-testid={`list-element-${el.id}`}
                    >
                      {el.type === "text" && <Type className="h-3 w-3" />}
                      {el.type === "barcode" && <Barcode className="h-3 w-3" />}
                      {el.type === "qrcode" && <QrCode className="h-3 w-3" />}
                      {el.type === "rectangle" && (
                        <Square className="h-3 w-3" />
                      )}
                      {el.type === "ellipse" && <Circle className="h-3 w-3" />}
                      {el.type === "line" && <Minus className="h-3 w-3" />}
                      {el.type === "triangle" && (
                        <Triangle className="h-3 w-3" />
                      )}
                      {el.type === "star" && <Star className="h-3 w-3" />}
                      {el.type === "image" && <Image className="h-3 w-3" />}
                      <span className="flex-1 truncate">{el.label}</span>
                      {el.locked && <Lock className="h-3 w-3 text-gray-400" />}
                      {!el.visible && (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t px-4 py-1 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span>
          Canvas: {labelWidth} x {labelHeight} {unit}
        </span>
        <span>Zoom: {zoom}%</span>
        <span>Elements: {elements.length}</span>
        <span>Selected: {selectedElements.length}</span>
        {singleSelected && (
          <span>
            Position: ({Math.round(singleSelected.x)},{" "}
            {Math.round(singleSelected.y)})
          </span>
        )}
        <div className="flex-1" />
        <span>
          Grid: {gridEnabled ? "On" : "Off"} ({gridSize}px)
        </span>
        <span>Snap: {snapToGrid ? "On" : "Off"}</span>
      </div>
    </div>
  );
}
