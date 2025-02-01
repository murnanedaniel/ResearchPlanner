import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronRight, ChevronLeft, Plus, GitMerge, Calendar as CalendarIcon, Save, Upload, Network, Loader2, Cloud, Check } from "lucide-react";
import { format } from "date-fns";

interface SideToolbarProps {
  // Node Operations
  nodeTitle: string;
  onNodeTitleChange: (value: string) => void;
  onAddNode: () => void;
  onAddSubnode: () => void;
  onCollapseToNode: () => void;
  selectedNodeId: number | null;
  selectedNodes: Set<number>;

  // Edge Operations
  isCreatingEdge: boolean;
  onToggleEdgeCreate: () => void;

  // Autocomplete
  isAutocompleteModeActive: boolean;
  onToggleAutocomplete: () => void;
  autocompleteMode: 'start' | 'goal' | null;
  isAutocompleteLoading: boolean;

  // Timeline
  isTimelineActive: boolean;
  onTimelineToggle: (value: boolean) => void;
  timelineStartDate: Date;
  onTimelineStartDateChange: (date: Date) => void;

  // Calendar Integration
  isCalendarSyncEnabled: boolean;
  onCalendarSyncToggle: (value: boolean) => void;
  isCalendarAuthenticated: boolean;
  onCalendarLogin: () => void;
  onCalendarSignOut: () => void;
  isCalendarInitializing: boolean;
  calendarError: string | null;
  isSyncing: boolean;
  dirtyNodesCount: number;

  // File Operations
  onSaveToFile: () => void;
  onLoadFromFile: () => void;

  // Panel State
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function SideToolbar({
  // Node Operations
  nodeTitle,
  onNodeTitleChange,
  onAddNode,
  onAddSubnode,
  onCollapseToNode,
  selectedNodeId,
  selectedNodes,

  // Edge Operations
  isCreatingEdge,
  onToggleEdgeCreate,

  // Autocomplete
  isAutocompleteModeActive,
  onToggleAutocomplete,
  autocompleteMode,
  isAutocompleteLoading,

  // Timeline
  isTimelineActive,
  onTimelineToggle,
  timelineStartDate,
  onTimelineStartDateChange,

  // Calendar Integration
  isCalendarSyncEnabled,
  onCalendarSyncToggle,
  isCalendarAuthenticated,
  onCalendarLogin,
  onCalendarSignOut,
  isCalendarInitializing,
  calendarError,
  isSyncing,
  dirtyNodesCount,

  // File Operations
  onSaveToFile,
  onLoadFromFile,

  // Panel State
  isExpanded,
  onToggleExpand,
}: SideToolbarProps) {
  return (
    <div className={`h-full border-r bg-white transition-all duration-300 flex flex-col ${isExpanded ? 'w-80' : 'w-12'}`}>
      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        className="w-12 h-12 flex items-center justify-center"
        onClick={onToggleExpand}
      >
        {isExpanded ? <ChevronLeft /> : <ChevronRight />}
      </Button>

      {/* Sync Status - Always visible in collapsed state */}
      {!isExpanded && (
        <div className="w-12 h-12 flex items-center justify-center border-t">
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          ) : dirtyNodesCount > 0 ? (
            <div className="relative">
              <Cloud className="h-4 w-4 text-slate-500" />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
            </div>
          ) : (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex-1 p-4 overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            {/* Node Operations */}
            <AccordionItem value="nodes">
              <AccordionTrigger className="text-sm font-medium">
                Node Operations
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={nodeTitle}
                      onChange={(e) => onNodeTitleChange(e.target.value)}
                      placeholder="Enter node title..."
                    />
                    <Button onClick={onAddNode} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Node
                    </Button>
                    {selectedNodeId && (
                      <Button onClick={onAddSubnode} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subnode
                      </Button>
                    )}
                    {selectedNodes.size > 1 && (
                      <Button onClick={onCollapseToNode} className="w-full">
                        <GitMerge className="mr-2 h-4 w-4" />
                        Collapse to Node
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Edge Operations */}
            <AccordionItem value="edges">
              <AccordionTrigger className="text-sm font-medium">
                Edge Operations
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isCreatingEdge}
                      onCheckedChange={onToggleEdgeCreate}
                    />
                    <Label>Edge Creation Mode</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Autocomplete */}
            <AccordionItem value="autocomplete">
              <AccordionTrigger className="text-sm font-medium">
                AI Autocomplete
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isAutocompleteModeActive}
                      onCheckedChange={onToggleAutocomplete}
                      disabled={isAutocompleteLoading}
                    />
                    <Label>
                      {isAutocompleteLoading
                        ? "Generating..."
                        : autocompleteMode
                        ? `Select ${autocompleteMode} node`
                        : "Autocomplete Mode"}
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Timeline */}
            <AccordionItem value="timeline">
              <AccordionTrigger className="text-sm font-medium">
                Timeline
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isTimelineActive}
                      onCheckedChange={onTimelineToggle}
                    />
                    <Label>Show Timeline</Label>
                  </div>
                  {isTimelineActive && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {format(timelineStartDate, 'PP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={timelineStartDate}
                              onSelect={(date) => date && onTimelineStartDateChange(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Calendar Integration */}
            <AccordionItem value="calendar">
              <AccordionTrigger className="text-sm font-medium">
                Calendar Integration
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {isCalendarAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isCalendarSyncEnabled}
                          onCheckedChange={onCalendarSyncToggle}
                        />
                        <Label>Auto-sync with Calendar</Label>
                      </div>
                      {isSyncing && <div>Syncing... ({dirtyNodesCount} items)</div>}
                      <Button onClick={onCalendarSignOut} variant="outline" className="w-full">
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={onCalendarLogin} 
                      disabled={isCalendarInitializing}
                      className="w-full"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Connect Calendar
                    </Button>
                  )}
                  {calendarError && (
                    <div className="text-red-500 text-sm">{calendarError}</div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* File Operations */}
            <AccordionItem value="file">
              <AccordionTrigger className="text-sm font-medium">
                File Operations
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Button onClick={onSaveToFile} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save to File
                  </Button>
                  <Button onClick={onLoadFromFile} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Load from File
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
} 