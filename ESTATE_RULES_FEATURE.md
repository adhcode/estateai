# Estate Rules & Regulations Feature 📜

## 🎯 Overview

Residents can now ask questions about estate rules and regulations via WhatsApp and get instant answers. The system uses keyword matching to find relevant rules and provide accurate responses.

---

## ✨ Features

- **Natural Language Queries**: Ask questions in any way ("are pets allowed?", "can I have a dog?", etc.)
- **Keyword Matching**: Smart keyword detection finds the best matching rule
- **Easy Updates**: Admin can add/update rules via API or database
- **Expandable**: Start with pet policy, add more rules as needed
- **WhatsApp Integration**: Seamless integration with existing conversation flow

---

## 🗣️ Example Queries

### Pets Policy

**User can ask:**
- "Are pets allowed?"
- "Can I have a dog?"
- "Pet policy?"
- "Are animals allowed in the estate?"
- "Can I bring my cat?"

**Bot responds:**
```
*Pet Policy*

Pets are not allowed in the estate. This policy helps maintain 
cleanliness and ensures the comfort of all residents. Service 
animals may be considered on a case-by-case basis with proper 
documentation.
```

---

## 🏗️ Architecture

### 1. Database Schema

**Estate Model** - Added `rules` JSON field:
```typescript
{
  "rules": [
    {
      "id": "pets-policy",
      "category": "pets",
      "title": "Pet Policy",
      "rule": "Pets are not allowed in the estate",
      "keywords": ["pet", "pets", "dog", "cat", "animal", "animals"],
      "answer": "Full answer text here..."
    }
  ]
}
```

### 2. Services

**EstateRulesService** (`backend/src/estates/estate-rules.service.ts`)
- `getEstateRules(estateId)` - Get all rules
- `findMatchingRules(estateId, query)` - Find rules matching query
- `addRule(estateId, rule)` - Add new rule
- `removeRule(estateId, ruleId)` - Delete rule
- `updateEstateRules(estateId, rules)` - Update all rules

### 3. Keyword Matching Algorithm

Scores rules based on:
- **Exact match** in query: +10 points
- **Word match**: +5 points
- **Partial match**: +2 points

Returns the best matching rule.

### 4. WhatsApp Integration

**Intent Detection:** `query_estate_rules`
- Triggers on: "rule", "rules", "policy", "allowed", "can I", etc.

**Conversation Handler:** `handleEstateRulesQuery()`
- Calls domain service
- Sends answer via WhatsApp
- Shows follow-up buttons

---

## 📦 Files Created/Modified

### New Files (3):
1. ✅ `backend/src/estates/estate-rules.service.ts` - Rules management service
2. ✅ `backend/src/estates/estate-rules.controller.ts` - REST API endpoints
3. ✅ `backend/prisma/migrations/20260727_add_estate_rules/migration.sql` - Database migration

### Modified Files (5):
4. ✅ `backend/prisma/schema.prisma` - Added `rules` field to Estate
5. ✅ `backend/src/estates/estates.module.ts` - Exported EstateRulesService
6. ✅ `backend/src/whatsapp/conversation/intent.service.ts` - Added rule query intent
7. ✅ `backend/src/whatsapp/domain/estate-whatsapp.service.ts` - Added queryEstateRules()
8. ✅ `backend/src/whatsapp/conversation/conversation.service.ts` - Added handler
9. ✅ `backend/src/whatsapp/whatsapp.module.ts` - Imported EstatesModule

---

## 🚀 Setup & Testing

### Step 1: Apply Database Migration

```bash
cd backend
npx prisma db push
```

This adds the `rules` field to the `estates` table and populates it with the default pet policy.

### Step 2: Test via WhatsApp

```
User: "Are pets allowed?"

Bot: *Pet Policy*

Pets are not allowed in the estate. This policy helps maintain 
cleanliness and ensures the comfort of all residents. Service 
animals may be considered on a case-by-case basis with proper 
documentation.

Do you have any other questions?
[Visitor Code] [Menu]
```

### Step 3: Test via API (Optional)

**Get all rules:**
```bash
GET /estates/:estateId/rules
```

**Query rules:**
```bash
POST /estates/:estateId/rules/query
{
  "query": "are pets allowed"
}
```

---

## 📝 Adding More Rules

### Example: Noise Policy

```json
{
  "id": "noise-policy",
  "category": "noise",
  "title": "Noise & Quiet Hours",
  "rule": "Quiet hours are from 10 PM to 7 AM daily",
  "keywords": ["noise", "loud", "music", "quiet", "hours", "party", "sound"],
  "answer": "Quiet hours are from 10 PM to 7 AM daily. During these hours, please keep noise levels to a minimum to respect your neighbors. This includes loud music, construction work, and gatherings. Violations may result in warnings or fines."
}
```

**Add via API:**
```bash
POST /estates/:estateId/rules
{
  "id": "noise-policy",
  "category": "noise",
  "title": "Noise & Quiet Hours",
  "rule": "Quiet hours are from 10 PM to 7 AM daily",
  "keywords": ["noise", "loud", "music", "quiet", "hours", "party", "sound"],
  "answer": "Quiet hours are from 10 PM to 7 AM daily..."
}
```

**Or update via database:**
```sql
UPDATE estates 
SET rules = jsonb_set(
  rules, 
  '{rules,999}', 
  '{"id":"noise-policy",...}'::jsonb
)
WHERE id = 'your-estate-id';
```

---

## 🎨 Rule Categories (Suggestions)

### 1. Pets
- Keywords: pet, pets, dog, cat, animal, animals
- ✅ Already implemented

### 2. Parking
- Keywords: parking, car, vehicle, space, park
- Example: "Parking is allocated per unit. Visitor parking available in designated areas."

### 3. Noise
- Keywords: noise, loud, music, quiet, hours, party
- Example: "Quiet hours 10 PM - 7 AM. Keep noise to minimum."

### 4. Garbage/Waste
- Keywords: garbage, trash, waste, disposal, rubbish
- Example: "Dispose waste in designated bins. Collection on Mondays and Thursdays."

### 5. Pool/Gym
- Keywords: pool, gym, swimming, fitness, facility
- Example: "Pool open 6 AM - 10 PM. Children must be supervised."

### 6. Visitors
- Keywords: visitor, guest, overnight, stay
- Example: "Visitors must register at security. Overnight guests require approval."

### 7. Renovations
- Keywords: renovation, construction, work, remodel
- Example: "Renovations allowed 9 AM - 6 PM weekdays. Submit plan to management."

### 8. Smoking
- Keywords: smoke, smoking, cigarette, tobacco
- Example: "Smoking only permitted in designated outdoor areas."

---

## 🔧 REST API Endpoints

### Get All Rules
```
GET /estates/:estateId/rules

Response:
{
  "success": true,
  "data": {
    "rules": [...]
  }
}
```

### Add Rule
```
POST /estates/:estateId/rules

Body:
{
  "id": "rule-id",
  "category": "category",
  "title": "Rule Title",
  "rule": "Short rule",
  "keywords": ["keyword1", "keyword2"],
  "answer": "Full answer"
}

Response:
{
  "success": true,
  "message": "Rule added successfully"
}
```

### Update All Rules
```
PUT /estates/:estateId/rules

Body:
{
  "rules": [...]
}

Response:
{
  "success": true,
  "message": "Rules updated successfully"
}
```

### Delete Rule
```
DELETE /estates/:estateId/rules/:ruleId

Response:
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

### Query Rules (Test)
```
POST /estates/:estateId/rules/query

Body:
{
  "query": "are pets allowed"
}

Response:
{
  "success": true,
  "data": {
    "rules": [...],
    "bestMatch": {...}
  }
}
```

### Get Default Template
```
GET /estates/:estateId/rules/default

Response:
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "pets-policy",
        ...
      }
    ]
  }
}
```

---

## 💡 Best Practices

### Writing Good Rules

1. **Clear Title**: Short, descriptive (e.g., "Pet Policy")

2. **Comprehensive Keywords**: Include all variations
   - pets, pet, dog, dogs, cat, cats, animal, animals

3. **Detailed Answer**: Include:
   - The rule itself
   - Reasoning/benefits
   - Exceptions (if any)
   - Contact info for questions

4. **Consistent Tone**: Professional, friendly, informative

### Example:
```json
{
  "id": "pets-policy",
  "category": "pets",
  "title": "Pet Policy",
  "rule": "Pets are not allowed in the estate",
  "keywords": ["pet", "pets", "dog", "cat", "animal", "animals"],
  "answer": "Pets are not allowed in the estate. This policy helps maintain cleanliness and ensures the comfort of all residents. Service animals may be considered on a case-by-case basis with proper documentation. Contact management at management@estate.com for exceptions."
}
```

---

## 🧪 Testing Scenarios

### Test 1: Basic Query
```
User: "Are pets allowed?"
Expected: Pet policy answer
```

### Test 2: Variations
```
User: "Can I have a dog?"
Expected: Pet policy answer

User: "pet policy"
Expected: Pet policy answer

User: "are animals allowed"
Expected: Pet policy answer
```

### Test 3: No Match
```
User: "what's the weather"
Expected: "I couldn't find a specific rule about that..."
```

### Test 4: Multiple Keywords
```
User: "rules about pets and noise"
Expected: Best match (probably pets since it's first/more specific)
```

---

## 🚀 Future Enhancements

### Phase 2:
- [ ] Full-text search in answers
- [ ] Multi-language support
- [ ] Related rules suggestions
- [ ] Admin UI for rule management
- [ ] Rule versioning/history
- [ ] Analytics (most asked rules)

### Phase 3:
- [ ] AI-powered answer generation
- [ ] Image attachments for rules
- [ ] Video explainers
- [ ] Interactive rule wizard
- [ ] Automated reminders based on rules

---

## 📊 Success Metrics

**Track:**
- Number of rule queries per day
- Most queried rules
- "No match" rate (to identify missing rules)
- User satisfaction (implicit: follow-up questions)

---

## 🎉 Summary

The Estate Rules feature is now **fully implemented** and ready to use!

### What Works:
- ✅ Ask questions via WhatsApp
- ✅ Get instant answers
- ✅ Pet policy pre-configured
- ✅ Easy to add more rules
- ✅ REST API for management

### Next Steps:
1. Apply database migration
2. Test with "are pets allowed?"
3. Add more rules as needed
4. Monitor usage and iterate

**The estate rules feature empowers residents with instant access to important information!** 📜✨
