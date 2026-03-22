# Kira UI Design System

## Design Philosophy
- **Minimal**: Remove unnecessary elements
- **Beautiful**: Clean, modern aesthetics
- **Consistent**: Same patterns across all pages
- **Functional**: Focus on what estate admins need

## Color Palette
```
Primary: #000000 (Black)
Secondary: #3b82f6 (Blue)
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Error: #ef4444 (Red)
Background: #f8fafc (Slate-50)
Card: #ffffff (White)
Border: #e2e8f0 (Slate-200)
Text Primary: #0f172a (Slate-900)
Text Secondary: #64748b (Slate-500)
```

## Typography
- **Font**: Bricolage Grotesque
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Small**: Regular, 12-14px

## Components

### Cards
- White background
- Rounded corners (16px)
- Subtle border (1px slate-200)
- No shadows (minimal design)
- Padding: 24px

### Buttons
- Primary: Black background, white text
- Secondary: White background, black border
- Rounded: 8px
- Height: 40px
- Padding: 12px 24px

### Tables
- Clean rows with hover states
- No borders between rows
- Alternating row colors (optional)
- Action buttons on right

### Forms
- Clean inputs with borders
- Labels above inputs
- Validation messages below
- Consistent spacing

## Layout Structure

### Page Layout
```
┌─────────────────────────────────────┐
│ Header (Page Title + Actions)      │
├─────────────────────────────────────┤
│                                     │
│ Stats Cards (if applicable)        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Main Content (Table/List/Form)     │
│                                     │
└─────────────────────────────────────┘
```

### Sidebar Navigation
- Fixed left sidebar
- Logo at top
- User info below logo
- Navigation items
- Logout at bottom

## Estate Admin Pages

### 1. Dashboard
- Welcome message
- Quick stats (4 cards)
- Quick actions
- Recent activity

### 2. Occupants
- List of all occupants
- Add new occupant button
- Search and filter
- Edit/Delete actions

### 3. Visitors
- Active visitor codes
- Generate new code button
- Search by name/code
- Cancel code action

### 4. Visitor History
- Past visitors
- Filter by date
- Export functionality

### 5. Security Staff
- List of security personnel
- Add new staff button
- Edit/Delete actions

## Consistency Rules

1. **All pages use same card style**
2. **All tables have same structure**
3. **All forms have same layout**
4. **All buttons have same styling**
5. **All spacing is consistent (4px, 8px, 16px, 24px, 32px)**
6. **All colors from defined palette**
7. **All text uses Bricolage Grotesque**

## Implementation Priority

1. Create reusable components
2. Update dashboard layout
3. Redesign occupants page
4. Redesign visitors page
5. Redesign visitor history
6. Redesign security staff
7. Ensure consistency across all pages
