'use client';

import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, Settings, Cloud } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';

interface ToolbarProps {
  nodeTitle: string;
  onNodeTitleChange: (value: string) => void;
  onAddNode: () => void;
  onAddSubnode: () => void;
  onCollapseToNode?: () => void;
  selectedNodeId: number | null;
  selectedNodes: Set<number>;
  isCreatingEdge: boolean;
  onToggleEdgeCreate: () => void;
  isAutocompleteModeActive: boolean;
  onToggleAutocomplete: () => void;
  autocompleteMode: 'start' | 'goal' | null;
  isAutocompleteLoading: boolean;
  isTimelineActive: boolean;
  onTimelineToggle: (active: boolean) => void;
  timelineStartDate: Date;
  onTimelineStartDateChange: (date: Date) => void;
  isCalendarSyncEnabled: boolean;
  onCalendarSyncToggle: (enabled: boolean) => void;
  isCalendarAuthenticated: boolean;
  onCalendarLogin: () => void;
  isCalendarInitializing?: boolean;
  calendarError?: Error | null;
}

export function Toolbar({
  nodeTitle,
  onNodeTitleChange,
  onAddNode,
  onAddSubnode,
  onCollapseToNode,
  selectedNodeId,
  selectedNodes,
  isCreatingEdge,
  onToggleEdgeCreate,
  isAutocompleteModeActive,
  onToggleAutocomplete,
  autocompleteMode,
  isAutocompleteLoading,
  isTimelineActive,
  onTimelineToggle,
  timelineStartDate,
  onTimelineStartDateChange,
  isCalendarSyncEnabled,
  onCalendarSyncToggle,
  isCalendarAuthenticated,
  onCalendarLogin,
  isCalendarInitializing = false,
  calendarError = null
}: ToolbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <>
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex gap-2 items-center flex-1">
          <input
            type="text"
            value={nodeTitle}
            onChange={(e) => onNodeTitleChange(e.target.value)}
            placeholder="Node title..."
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={onAddNode}>Add Node</Button>
          {selectedNodes.size > 1 ? (
            <Button 
              onClick={onCollapseToNode}
              disabled={!nodeTitle.trim()}
            >
              Collapse to Node
            </Button>
          ) : (
            <Button 
              onClick={onAddSubnode}
              disabled={!selectedNodeId || !nodeTitle.trim()}
            >
              Add Subnode
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Button 
            variant={isCreatingEdge ? "secondary" : "outline"}
            onClick={onToggleEdgeCreate}
          >
            {isCreatingEdge ? 'Cancel Edge' : 'Create Edge'}
          </Button>

          <Button
            variant={isAutocompleteModeActive ? "secondary" : "outline"}
            onClick={onToggleAutocomplete}
            disabled={isAutocompleteLoading}
          >
            {isAutocompleteLoading ? 'Generating...' : 
             isAutocompleteModeActive ? 
                (autocompleteMode === 'start' ? 'Select Start Node' : 'Select Goal Node') : 
                'Autocomplete'}
          </Button>

          <div className="flex items-center gap-2 ml-4 border-l pl-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="timeline"
                checked={isTimelineActive}
                onCheckedChange={onTimelineToggle}
              />
              <label
                htmlFor="timeline"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Timeline
              </label>
            </div>

            {isTimelineActive && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={timelineStartDate}
                      onSelect={(date) => date && onTimelineStartDateChange(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2 ml-2">
                  <Checkbox
                    id="calendar-sync"
                    checked={isCalendarSyncEnabled}
                    onCheckedChange={onCalendarSyncToggle}
                    disabled={!isCalendarAuthenticated}
                  />
                  <label
                    htmlFor="calendar-sync"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sync to Calendar
                  </label>
                  {!isCalendarAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCalendarLogin}
                      disabled={isCalendarInitializing}
                      className="ml-2"
                    >
                      <Cloud className={`h-4 w-4 ${isCalendarInitializing ? 'animate-spin' : ''}`} />
                      {isCalendarInitializing ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                  {calendarError && (
                    <span className="text-sm text-red-500 ml-2" title={calendarError.message}>
                      Connection error
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-l pl-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}