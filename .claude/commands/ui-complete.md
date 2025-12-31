# UI Task Complete Checklist

Before marking any UI task as complete, run through this verification.

## Required Steps

### 1. Visual Verification
Take screenshots of:
- [ ] The main state of the component/feature
- [ ] Empty state (if applicable)
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)
- [ ] Mobile width (375px) if responsive

### 2. For Each Screenshot, Verify:

**Does it look correct?**
- Layout matches what was requested
- Spacing and alignment are consistent
- Colors are correct
- Text is readable and not cut off

**Does it look professional?**
- Would you be comfortable showing this to the user who requested it?
- Does it match the quality of existing components in the app?
- Are there any rough edges or "placeholder" looking elements?

**Does it handle edge cases?**
- Very long text content
- Missing/null data
- Rapid state changes

### 3. Console Check
Open browser dev tools and verify:
- [ ] No JavaScript errors in console
- [ ] No React warnings
- [ ] No failed network requests

### 4. Interaction Test
If the component is interactive:
- [ ] Click/tap targets work
- [ ] Hover states appear
- [ ] Keyboard navigation works (if applicable)
- [ ] Form inputs accept input correctly

## Final Verdict

Only mark the task complete if ALL of the above pass.

If anything fails:
1. Document the specific issue
2. Fix it
3. Re-run this checklist

**Remember: "It works" is not the same as "It's done". The UI must look polished and professional.**