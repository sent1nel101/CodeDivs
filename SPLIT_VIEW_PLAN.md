# Split-View Editor Implementation Plan

## Overview
Enable users to view and edit two tabs simultaneously in side-by-side or stacked layout.

## Architecture Changes

### Current State
- Single `editor-container` with one textarea
- Single active tab at a time
- Tab switching replaces content

### New State
- Two editor panels (left/right or top/bottom)
- Two independent active tabs
- Resizable divider between panels
- Unified output that reflects both editors

## Task Breakdown

### Task 1: HTML Structure (Commit 1) ✅ COMPLETE
- [x] Restructure editor-container to support dual editors
  - [x] Create editor-panel-1 and editor-panel-2
  - [x] Add split-toggle UI control
  - [x] Add resizable divider element

### Task 2: CSS - Layout Foundation (Commit 2) ✅ COMPLETE
- [x] Grid-based layout for dual editors
- [x] Resizable divider styling
- [x] Split-toggle button styling
- [x] Responsive behavior (horizontal/vertical)

### Task 3: JavaScript - Split Mode Toggle (Commit 3) ✅ COMPLETE
- [x] Add splitMode state to VFS
- [x] Implement toggleSplitView() function
- [x] Update renderTabs() for dual panel display
- [x] Add split-toggle button event listener

### Task 4: JavaScript - Dual Panel Management (Commit 4) ✅ COMPLETE
- [x] Track activeTab1 and activeTab2 separately
- [x] Modify switchToTab() for target panel
- [x] Update tab UI to show which panel is active
- [x] Handle tab closing in split mode

### Task 5: JavaScript - Resizable Divider (Commit 5) ✅ COMPLETE
- [x] Implement drag-to-resize divider
- [x] Store panel widths/heights in VFS
- [x] Update layout on resize
- [x] Persist sizes to localStorage

### Task 6: JavaScript - Output Integration (Commit 6) ✅ COMPLETE
- [x] Update updateOutput() to handle dual editors
- [x] Sync output preview (combined view)
- [x] Handle output window with split editors
- [x] Ensure both editors' code is available in output

### Task 7: Responsive Design (Commit 7) ✅ COMPLETE
- [x] Handle vertical layout split (stacked editors)
- [x] Switch split orientation with toggle-view button
- [x] Update grid layout dynamically
- [x] Ensure mobile experience remains unchanged

### Task 8: Testing & Polish (Commit 8) 🔄 IN PROGRESS
- [x] Output integration with dual editors
- [x] localStorage persistence for split state
- [ ] Edge case: File deletion in split mode
- [ ] Performance optimization for dual editors
- [ ] Mobile: Keep split mode disabled on mobile
- [ ] Keyboard navigation between panels

## State Structure

```javascript
splitMode: false,              // Is split view active?
splitOrientation: 'horizontal', // 'horizontal' or 'vertical'
panel1: {
  activeTab: fileId,
  width: 50                    // percentage
},
panel2: {
  activeTab: fileId,
  width: 50                    // percentage
}
```

## UI Elements to Add

1. **Split Toggle Button** - In tab-bar or editor header
2. **Split Divider** - Draggable divider between panels
3. **Panel Indicators** - Show which tab is in which panel

## Notes
- Each panel has independent tab switching
- Output updates based on both panels
- Resize state persisted to localStorage
- Mobile: disable split mode or show warning
- Keyboard nav: Tab key switches between panels in split mode
