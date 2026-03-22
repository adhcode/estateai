# 🤖 AI-Powered Estate Management System

## 📋 **System Overview**

Your estate management system now includes a comprehensive AI layer that processes natural language messages and routes them to appropriate backend functions. This is perfect for WhatsApp integration where residents can interact using everyday language.

## 🏗️ **Architecture**

```
WhatsApp Message → AI Parser → Intent Router → Backend Service → Response + QR Codes
```

### **Core Components:**

1. **Intent Parser Service** - Understands natural language
2. **LLM Intent Parser** - Enhanced with Gemini AI (optional)
3. **Message Router Service** - Routes to correct handlers
4. **WhatsApp Service** - Handles WhatsApp integration
5. **QR Code Service** - Generates shareable QR codes

## 🎯 **Supported Intents**

### **1. Generate Visitor Code**
- `"Generate code for John"`
- `"Create code for Sarah tomorrow at 10am"`
- `"John is coming today"`
- `"Need a code for Mike visiting"`

**Response:** Visitor code + QR codes + WhatsApp share link

### **2. Verify Visitor Code**
- `"Check code ABC123"`
- `"Is XDF456 still valid?"`
- `"Verify code 789012 for Alice"`

**Response:** Validation status + visitor details

### **3. List Visitors**
- `"List my visitors"`
- `"Show all my codes"`
- `"My active visitor codes"`
- `"Who is coming today?"`

**Response:** Formatted list of visitor codes

### **4. Cancel Visitor Code**
- `"Cancel code ABC123"`
- `"Revoke XDF456"`
- `"Delete code 789012"`

**Response:** Cancellation confirmation

### **5. Help**
- `"Help"`
- `"What can you do?"`
- `"How do I generate a code?"`

**Response:** Comprehensive help menu

## 🔧 **API Endpoints**

### **Testing Endpoints:**
```
POST /ai-message/test
POST /ai-message/process
GET  /ai-message/intents
GET  /ai-message/test-examples
```

### **WhatsApp Integration:**
```
POST /ai-message/whatsapp-webhook    # For webhook integration
POST /ai-message/whatsapp-manual     # For manual testing
```

## 📱 **WhatsApp Integration Features**

### **1. Natural Language Processing**
- Residents send messages in plain English
- AI understands context and intent
- Responds with formatted WhatsApp messages

### **2. QR Code Generation**
- **Verification QR**: For security scanning
- **WhatsApp Share QR**: For easy forwarding to visitors
- **Security QR**: Simple verification for guards

### **3. Shareable Content**
When a visitor code is generated, residents get:
- The access code
- QR code for verification
- WhatsApp share link
- Pre-formatted message for forwarding

## 🚀 **Setup Instructions**

### **1. Environment Variables**
Add to your `.env` file:
```env
# Optional: For enhanced AI parsing
GEMINI_API_KEY=your_gemini_api_key

# For WhatsApp integration (choose one)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# OR
WHATSAPP_ACCESS_TOKEN=your_meta_token

# Frontend URL for QR codes
FRONTEND_URL=http://localhost:3000
```

### **2. WhatsApp Webhook Setup**
1. **Twilio**: Set webhook URL to `https://yourdomain.com/ai-message/whatsapp-webhook`
2. **Meta Business API**: Configure webhook endpoint
3. **Test locally**: Use ngrok for development

## 🧪 **Testing Examples**

### **Generate Code:**
```bash
curl -X POST http://localhost:3001/ai-message/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate code for Alice tomorrow at 2pm",
    "occupantId": "your_occupant_id"
  }'
```

### **Check Code:**
```bash
curl -X POST http://localhost:3001/ai-message/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Check code ABC123 for Alice",
    "occupantId": "your_occupant_id"
  }'
```

## 📊 **Response Format**

```json
{
  "success": true,
  "message": "✅ Visitor code generated for Alice!\n\n🔑 Code: *285592*\n⏰ Valid until: 7/22/2025, 9:45:23 PM",
  "data": {
    "code": "285592",
    "visitorName": "Alice",
    "qrCodes": {
      "verification": "data:image/png;base64,iVBOR...",
      "whatsappShare": "data:image/png;base64,iVBOR...",
      "whatsappShareLink": "https://wa.me/?text=...",
      "shareMessage": "🏠 Estate Name - Visitor Access..."
    }
  },
  "intent": "generateVisitorCode",
  "confidence": 0.95,
  "processingTime": 1234
}
```

## 🔄 **WhatsApp Flow Example**

1. **Resident sends:** `"Generate code for John coming tomorrow"`
2. **System processes:** Intent parsing + code generation + QR creation
3. **Resident receives:** 
   - Visitor code
   - QR code image
   - WhatsApp share link
   - Pre-formatted message
4. **Resident forwards:** Clicks WhatsApp share link → sends to visitor
5. **Visitor receives:** Complete access information with QR code

## 🎨 **QR Code Features**

### **Verification QR Code**
- Contains verification URL
- Can be scanned by security
- Links to verification page

### **WhatsApp Share QR Code**
- Contains WhatsApp share link
- Resident scans to share with visitor
- Pre-formatted with all details

### **Security QR Code**
- Simple verification data
- Quick scan for guards
- Contains code + timestamp

## 🔮 **Future Enhancements**

1. **Voice Messages**: Process WhatsApp voice messages
2. **Multi-language**: Support local languages
3. **Smart Scheduling**: AI-powered visit scheduling
4. **Photo Recognition**: Process visitor photos
5. **Integration**: Connect with gate systems
6. **Analytics**: Usage patterns and insights

## 🛡️ **Security Features**

- Phone number verification
- Estate-specific access
- Code expiration
- Usage tracking
- Audit logs

## 📈 **Benefits**

1. **User-Friendly**: Natural language interaction
2. **Mobile-First**: WhatsApp integration
3. **Shareable**: QR codes and links
4. **Secure**: Proper validation and expiration
5. **Scalable**: Handles multiple estates
6. **Intelligent**: AI-powered understanding

Your estate management system is now ready for production WhatsApp integration with AI-powered natural language processing! 🚀