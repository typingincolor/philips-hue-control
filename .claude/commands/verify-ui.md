# Verify UI

Take a screenshot of the current browser state and perform a critical visual review.

## Steps

1. **Capture screenshot** of the component/page that was just modified
2. **Describe what you see** - be specific about layout, colors, spacing, text
3. **Identify any issues** using this checklist:

### Layout & Structure
- [ ] Elements are properly aligned (no unexpected shifts)
- [ ] Spacing is consistent (margins, padding, gaps)
- [ ] Nothing is overlapping that shouldn't be
- [ ] Content fits within its container

### Text & Readability
- [ ] All text is fully visible (no truncation unless intentional)
- [ ] Font sizes are appropriate and readable
- [ ] Text has sufficient contrast against background
- [ ] Long content wraps or truncates gracefully

### Visual Polish
- [ ] Colors match the design system
- [ ] Borders/shadows are consistent with other components
- [ ] Icons are properly sized and aligned with text
- [ ] Hover/active states work correctly (if applicable)

### Functionality Indicators
- [ ] Buttons look clickable
- [ ] Interactive elements have appropriate cursor styles
- [ ] Loading states look intentional
- [ ] Error states are clearly communicated

### Responsive (if applicable)
- [ ] Check at 375px width for mobile
- [ ] Check at 768px for tablet
- [ ] No horizontal scrolling unless intended

## Output

After reviewing, provide:

1. **Screenshot description**: What does the UI actually show?
2. **Issues found**: List any problems with severity (critical/minor)
3. **Fixes needed**: What specific changes would resolve each issue?
4. **Verdict**: PASS (ready to commit) or FAIL (needs fixes)

If FAIL, make the fixes and run this verification again.