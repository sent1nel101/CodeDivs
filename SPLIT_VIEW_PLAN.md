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

### Task 1: HTML Structure (Commit 1)
- [x] Restructure editor-container to support dual editors
  - Create editor-panel-1 and editor-panel-2
  - Add split-toggle UI control
  - Add resizable divider element

### Task 2: CSS - Layout Foundation (Commit 2)
- [ ] Grid-based layout for dual editors
- [ ] Resizable divider styling
- [ ] Split-toggle button styling
- [ ] Responsive behavior (horizontal/vertical)

### Task 3: JavaScript - Split Mode Toggle (Commit 3)
- [ ] Add splitMode state to VFS
- [ ] Implement toggleSplitView() function
- [ ] Update renderTabs() for dual panel display
- [ ] Add split-toggle button event listener

### Task 4: JavaScript - Dual Panel Management (Commit 4)
- [ ] Track activeTab1 and activeTab2 separately
- [ ] Modify switchToTab() for target panel
- [ ] Update tab UI to show which panel is active
- [ ] Handle tab closing in split mode

### Task 5: JavaScript - Resizable Divider (Commit 5)
- [ ] Implement drag-to-resize divider
- [ ] Store panel widths/heights in VFS
- [ ] Update layout on resize
- [ ] Persist sizes to localStorage

### Task 6: JavaScript - Output Integration (Commit 6)
- [ ] Update updateOutput() to handle dual editors
- [ ] Sync output preview (combined view)
- [ ] Handle output window with split editors
- [ ] Ensure both editors' code is available in output

### Task 7: Responsive Design (Commit 7)
- [ ] Handle vertical layout split (stacked editors)
- [ ] Adjust split toggle button visibility
- [ ] Test at various breakpoints
- [ ] Ensure mobile experience remains unchanged

### Task 8: Testing & Polish (Commit 8)
- [ ] Keyboard shortcuts for split mode
- [ ] Prevent editor duplication
- [ ] Handle edge cases (file deletion, etc.)
- [ ] Performance optimization

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
