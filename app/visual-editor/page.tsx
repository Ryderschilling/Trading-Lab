"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditableElement {
  id: string;
  type: string;
  content: string;
  style: React.CSSProperties;
  path: string;
}

export default function VisualEditorPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [elements, setElements] = useState<EditableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);

  useEffect(() => {
    // Enable visual editing mode
    document.body.style.cursor = "crosshair";
    document.body.setAttribute("data-visual-editor", "true");

    return () => {
      document.body.style.cursor = "";
      document.body.removeAttribute("data-visual-editor");
    };
  }, []);

  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const id = target.getAttribute("data-editable-id") || `element-${Date.now()}`;
    
    const element: EditableElement = {
      id,
      type: target.tagName.toLowerCase(),
      content: target.textContent || "",
      style: {
        color: window.getComputedStyle(target).color,
        fontSize: window.getComputedStyle(target).fontSize,
        fontWeight: window.getComputedStyle(target).fontWeight,
        padding: window.getComputedStyle(target).padding,
        margin: window.getComputedStyle(target).margin,
      },
      path: target.className || "",
    };

    setSelectedElement(element);
    setEditing(id);
  };

  const handleSave = () => {
    if (selectedElement) {
      const element = document.querySelector(`[data-editable-id="${selectedElement.id}"]`);
      if (element) {
        (element as HTMLElement).textContent = selectedElement.content;
        Object.assign((element as HTMLElement).style, selectedElement.style);
      }
    }
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b p-4 bg-muted sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visual Editor</h1>
            <p className="text-sm text-muted-foreground">
              Click on any element below to edit it visually
            </p>
          </div>
          <Button onClick={() => window.location.href = "/dashboard"}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Preview Area */}
        <div className="lg:col-span-2 border rounded-lg p-4 bg-white">
          <div className="space-y-4">
            <Card data-editable-id="card-1" onClick={handleElementClick} className="cursor-pointer hover:ring-2 hover:ring-primary">
              <CardHeader>
                <CardTitle data-editable-id="title-1" onClick={handleElementClick} className="cursor-pointer">
                  Sample Card Title
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p data-editable-id="content-1" onClick={handleElementClick} className="cursor-pointer">
                  Click on any element to edit it visually
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label data-editable-id="label-1" onClick={handleElementClick} className="cursor-pointer">
                Sample Label
              </Label>
              <Input 
                data-editable-id="input-1" 
                onClick={handleElementClick} 
                placeholder="Click to edit placeholder"
                className="cursor-pointer"
              />
              <Button data-editable-id="button-1" onClick={handleElementClick} className="cursor-pointer">
                Click to Edit Button Text
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="border rounded-lg p-4 bg-muted sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Edit Element</h2>
          
          {selectedElement ? (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label>Text Content</Label>
                  <Input
                    value={selectedElement.content}
                    onChange={(e) => setSelectedElement({ ...selectedElement, content: e.target.value })}
                    placeholder="Element content"
                  />
                </div>
                <div>
                  <Label>Element Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedElement.type}</p>
                </div>
                <div>
                  <Label>CSS Classes</Label>
                  <Input
                    value={selectedElement.path}
                    onChange={(e) => setSelectedElement({ ...selectedElement, path: e.target.value })}
                    placeholder="CSS classes"
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4 mt-4">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    type="text"
                    value={selectedElement.style.fontSize || ""}
                    onChange={(e) => setSelectedElement({
                      ...selectedElement,
                      style: { ...selectedElement.style, fontSize: e.target.value }
                    })}
                    placeholder="16px, 1rem, etc."
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedElement.style.color?.replace(/rgb\([^)]+\)/g, "#000000") || "#000000"}
                      onChange={(e) => setSelectedElement({
                        ...selectedElement,
                        style: { ...selectedElement.style, color: e.target.value }
                      })}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={selectedElement.style.color || ""}
                      onChange={(e) => setSelectedElement({
                        ...selectedElement,
                        style: { ...selectedElement.style, color: e.target.value }
                      })}
                      placeholder="#000000 or rgb()"
                    />
                  </div>
                </div>

                <div>
                  <Label>Font Weight</Label>
                  <Select
                    value={selectedElement.style.fontWeight || "normal"}
                    onValueChange={(value) => setSelectedElement({
                      ...selectedElement,
                      style: { ...selectedElement.style, fontWeight: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Padding</Label>
                  <Input
                    type="text"
                    value={selectedElement.style.padding || ""}
                    onChange={(e) => setSelectedElement({
                      ...selectedElement,
                      style: { ...selectedElement.style, padding: e.target.value }
                    })}
                    placeholder="8px, 1rem, etc."
                  />
                </div>

                <div>
                  <Label>Margin</Label>
                  <Input
                    type="text"
                    value={selectedElement.style.margin || ""}
                    onChange={(e) => setSelectedElement({
                      ...selectedElement,
                      style: { ...selectedElement.style, margin: e.target.value }
                    })}
                    placeholder="8px, 1rem, etc."
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-2">
                👆 Click on any element in the preview to start editing
              </p>
              <p className="text-xs text-muted-foreground">
                Elements will highlight when you hover over them
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

