"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VisualEditorOverlayProps {
  enabled: boolean;
  onToggle: () => void;
}

export function VisualEditorOverlay({ enabled, onToggle }: VisualEditorOverlayProps) {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Remove all visual editor styles
      document.querySelectorAll("[data-visual-editable]").forEach((el) => {
        (el as HTMLElement).style.outline = "";
        (el as HTMLElement).style.cursor = "";
      });
      return;
    }

    // Add visual editor mode
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-visual-editable")) {
        target.style.outline = "2px dashed #3b82f6";
        target.style.cursor = "pointer";
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-visual-editable") && target !== selectedElement) {
        target.style.outline = "";
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-visual-editable")) {
        setSelectedElement(target);
        // Open editor panel
        console.log("Edit element:", target);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("click", handleClick, true);
    };
  }, [enabled, selectedElement]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Visual Editor</h3>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        Click on any element to edit
      </p>
      {selectedElement && (
        <div className="mt-2 p-2 bg-muted rounded text-xs">
          <p>Selected: {selectedElement.tagName}</p>
          <p>Class: {selectedElement.className}</p>
        </div>
      )}
    </div>
  );
}

