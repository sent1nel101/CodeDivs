# Split-View Testing Plan - Simplified Architecture

## Test Scenario 1: Single File Opening
**Steps:**
1. Open application
2. Observe first file is loaded

**Expected Results:**
- [ ] Only 1 panel visible
- [ ] Tab shows active file
- [ ] Content displayed correctly
- [ ] No divider visible

---

## Test Scenario 2: Opening Second File
**Steps:**
1. Start with 1 file open
2. Click file from explorer to open second file

**Expected Results:**
- [ ] Panel 2 automatically appears (divider between panels)
- [ ] Panel 1 shows first file
- [ ] Panel 2 shows second file  
- [ ] Both tabs visible with panel indicators
- [ ] splitMode enabled

---

## Test Scenario 3: Closing a File
**Steps:**
1. Have 2 files open in split view
2. Click X on one tab

**Expected Results:**
- [ ] Remaining file displayed in single panel
- [ ] Panel 2 disappears
- [ ] Divider disappears
- [ ] splitMode disabled
- [ ] Only 1 tab visible

---

## Test Scenario 4: Divider Resize
**Steps:**
1. Have 2 files open in split view
2. Position cursor on divider (should show resize cursor)
3. Drag divider left/right

**Expected Results:**
- [ ] No text selection in panels during drag
- [ ] Panel 1 shrinks, Panel 2 grows (or vice versa)
- [ ] Both panels stay visible
- [ ] Content doesn't shift unexpectedly

---

## Test Scenario 5: State Persistence
**Steps:**
1. Open 2 files (split view active)
2. Resize panels to custom sizes
3. Change layout (horizontal/vertical)
4. Refresh browser

**Expected Results:**
- [ ] Both files remain open
- [ ] Split view restored
- [ ] Panel sizes preserved
- [ ] Layout preference remembered

---

## Test Scenario 6: Max File Limit
**Steps:**
1. Open file 1
2. Open file 2
3. Try to open file 3

**Expected Results:**
- [ ] Alert appears: "Maximum 2 files can be open at once"
- [ ] File 3 not opened
- [ ] Still in split view with files 1 & 2

---

## Test Scenario 7: Edit Both Files
**Steps:**
1. Have 2 files open in split view
2. Edit file 1 in panel 1
3. Edit file 2 in panel 2
4. Refresh page

**Expected Results:**
- [ ] Both edited versions persist
- [ ] No content lost
- [ ] Both panels load correct files
- [ ] Layout remembered

---

## Test Scenario 8: Single to Dual and Back
**Steps:**
1. Start with 1 file
2. Open 2nd file
3. Close 1st file  
4. Open 1st file again
5. Close 2nd file

**Expected Results:**
- [ ] Each step properly transitions panel layout
- [ ] No state corruption
- [ ] Tab count always matches openTabs.length
- [ ] Content correct at each step
