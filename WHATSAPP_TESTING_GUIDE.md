# WhatsApp System Testing Guide

This guide provides step-by-step instructions for testing the WhatsApp visitor management system.

## Prerequisites

1. Backend server running (`npm run start:dev` in backend folder)
2. WhatsApp provider configured (Twilio or Meta)
3. At least one registered resident with phone number
4. WhatsApp account for testing

## Test Scenarios

### 1. Household Member Management

#### 1.1 Add Household Member
**Steps:**
1. Send: `Hi` or `Hello`
2. Click: "Household Members" button
3. Click: "Add Member" button
4. Enter member name: `John Doe`
5. Enter phone number: `+1234567890`
6. Click: "Yes, Save" to confirm

**Expected Result:**
- Member added successfully
- Confirmation message displayed
- Member can now generate visitor codes using their phone

#### 1.2 List Household Members
**Steps:**
1. Send: `list household members`
2. Or click: "Household Members" → "List Members"

**Expected Result:**
- List of all household members displayed
- Each member shows name and phone number
- Instructions to edit members shown

#### 1.3 Edit Household Member Phone Number
**Steps:**
1. Send: `edit John Doe` or `edit John`
2. Enter new phone number: `+9876543210`
3. Click: "Yes, Update" to confirm

**Expected Result:**
- Phone number updated successfully
- Old number stops working
- New number can now generate codes

**Alternative Flow:**
1. Send: `list household members`
2. Send: `edit [member name from list]`
3. Follow prompts

#### 1.4 Remove Household Member
**Steps:**
1. Send: `remove John Doe`
2. Or: "Household Members" → "Remove Member"
3. Enter member name when prompted

**Expected Result:**
- Member removed successfully
- Member's phone can no longer generate codes

---

### 2. Visitor Code Generation

#### 2.1 Generate Code with Name
**Steps:**
1. Send: `generate code for Sarah`
2. Or: `Sarah is coming to visit`

**Expected Result:**
- Visitor code generated
- Code sent to resident
- Visitor card image sent (if configured)

#### 2.2 Generate Code - Interactive Flow
**Steps:**
1. Send: `generate code`
2. Enter visitor name when prompted: `Michael`

**Expected Result:**
- Code generated for Michael
- Follow-up options displayed

#### 2.3 Visitor at Gate Flow
**Steps:**
1. Send: `Sarah is at the gate`
2. Click: "Generate Code" button

**Expected Result:**
- System acknowledges visitor at gate
- Code generated using stored name
- No need to re-enter name

---

### 3. Visitor Entry and Notifications

#### 3.1 Security Validates Code
**Steps:**
1. Security staff opens verification page
2. Enters visitor code and name
3. Clicks "Verify"

**Expected Result:**
- Code validated successfully
- Resident receives simple notification:
  ```
  Sarah is on the way to your place.
  
  Please notify us when they're leaving.
  ```
- No excessive emojis or details
- Human-friendly message

---

### 4. Visitor Departure

#### 4.1 Mark Visitor as Departed (by name)
**Steps:**
1. Send: `Sarah has left`
2. Or: `Sarah is leaving`

**Expected Result:**
- Visitor marked as departed
- Confirmation message:
  ```
  Sarah has been marked as departed.
  
  Thank you for updating!
  ```

#### 4.2 Mark Visitor as Departed (by code)
**Steps:**
1. Send: `ABC123 has left`
2. Or: `code ABC123 departed`

**Expected Result:**
- Visitor marked as departed
- Confirmation with visitor name

#### 4.3 Departure Flow Issues to Test
**Test Cases:**
- Try to mark departure before visitor enters (should fail)
- Try to mark departure twice (should fail)
- Try with wrong visitor name (should fail with helpful message)
- Try with expired code (should fail)

---

### 5. List and Cancel Visitors

#### 5.1 List Active Visitors
**Steps:**
1. Send: `list my visitors`
2. Or click: "Visitors" → "My Visitors"

**Expected Result:**
- All active visitor codes displayed
- Shows: name, code, status, expiry time

#### 5.2 Cancel Visitor Code
**Steps:**
1. Send: `cancel code`
2. Click button to cancel most recent visitor
3. Or click "Cancel Other" and enter code/name

**Expected Result:**
- Code cancelled successfully
- Visitor can no longer enter

---

### 6. Error Handling

#### 6.1 Unregistered User
**Steps:**
1. Use phone number not in system
2. Send: `generate code`

**Expected Result:**
- Friendly error message
- Instructions to contact estate admin
- No system crash

#### 6.2 Invalid Commands
**Steps:**
1. Send random text: `xyz abc 123`

**Expected Result:**
- Fallback message displayed
- Menu buttons shown
- System remains responsive

---

## Testing Checklist

### Household Management
- [ ] Add household member works
- [ ] List household members shows all members
- [ ] Edit member phone number updates correctly
- [ ] Old phone stops working after edit
- [ ] New phone works after edit
- [ ] Remove member works
- [ ] Removed member cannot generate codes

### Visitor Management
- [ ] Generate code with name works
- [ ] Generate code interactive flow works
- [ ] Visitor at gate flow works
- [ ] Code validation by security works
- [ ] Arrival notification is simple and human-friendly
- [ ] No excessive emojis in arrival message
- [ ] Departure by name works
- [ ] Departure by code works
- [ ] Cannot mark departure before entry
- [ ] Cannot mark departure twice
- [ ] List visitors shows correct data
- [ ] Cancel code works

### Message Quality
- [ ] Arrival message is concise
- [ ] Departure message is friendly
- [ ] No unnecessary technical details
- [ ] Messages feel natural and human

### Edge Cases
- [ ] Unregistered user gets helpful message
- [ ] Invalid commands handled gracefully
- [ ] Expired codes handled correctly
- [ ] System recovers from errors

---

## Common Issues and Solutions

### Issue: Edit household member not working
**Solution:** Make sure to use exact member name or partial match. System is case-insensitive.

### Issue: Departure not working
**Solution:** Visitor must have entered first (code status = USED). Check visitor has been validated by security.

### Issue: Notifications not received
**Solution:** 
1. Check WhatsApp provider configuration
2. Verify phone numbers include country code
3. Check backend logs for errors

### Issue: Code validation fails
**Solution:**
1. Check code hasn't expired
2. Verify visitor name matches (partial match allowed)
3. Check code hasn't been used already

---

## Debug Mode

For testing, you can enable debug mode:

```bash
# In backend/.env
NODE_ENV=development
```

Debug mode allows:
- Expired codes to work
- Name validation bypass
- More detailed logging

---

## Quick Test Commands

```
# Greeting
Hi

# Household
add household member
list household members
edit John Doe
remove John Doe

# Visitors
generate code for Sarah
Sarah is at the gate
list my visitors
cancel code

# Departure
Sarah has left
ABC123 departed
```

---

## Support

If you encounter issues:
1. Check backend logs: `npm run start:dev`
2. Verify database state
3. Check WhatsApp provider status
4. Review error messages in console
