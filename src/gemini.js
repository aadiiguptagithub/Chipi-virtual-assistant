import { GoogleGenerativeAI } from "@google/generative-ai";

// Enhanced API key handling for production
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Gemini API key not found in environment variables');
    throw new Error('API key not configured. Please set VITE_GEMINI_API_KEY in your environment.');
  }
  
  console.log('✅ API Key loaded successfully');
  return apiKey;
};

const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 200,
  responseMimeType: "text/plain",
};

// Language detection helper
function detectLanguage(text) {
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text) ? 'hindi' : 'english';
}

// Create system prompt for natural conversation
function createSystemPrompt(userInput, detectedLang) {
  const basePrompt = detectedLang === 'hindi' 
    ? `आप Chipi हैं, एक मित्रवत AI असिस्टेंट जो Aditya Gupta द्वारा बनाया गया है। बातचीत को प्राकृतिक और मानवीय बनाएं। केवल एक उपयुक्त, संक्षिप्त उत्तर दें। हिंदी और अंग्रेजी दोनों का उपयोग कर सकते हैं।`
    : `You are Chipi, a friendly AI assistant created by Aditya Gupta. Keep responses natural and human-like. Give only one appropriate, concise answer. You can use both Hindi and English as needed.`;
  
  return `${basePrompt}\n\nUser: ${userInput}\nAssistant:`;
}

// Enhanced error handling for production
export async function generateResponse(prompt) {
  try {
    console.log('🤖 Generating response for:', prompt);
    
    // Handle name-related questions directly
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('what is your name') || 
        lowerPrompt.includes("what's your name") || 
        lowerPrompt.includes('who are you') ||
        lowerPrompt.includes('tumhara naam kya hai') ||
        lowerPrompt.includes('aapka naam kya hai') ||
        lowerPrompt.includes('your name') ||
        lowerPrompt.includes('naam kya hai')) {
      return "My name is Chipi. I'm your virtual AI assistant created by Aditya Gupta.";
    }
    
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig 
    });

    console.log('📡 Sending request to Gemini...');
    
    // Detect language and create appropriate system prompt
    const detectedLang = detectLanguage(prompt);
    const systemPrompt = createSystemPrompt(prompt, detectedLang);
    
    
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();
    
    console.log('✅ Response received:', text.substring(0, 100) + '...');
    
    // Clean up response text
    text = text.split('\n')[0].trim();
    text = text.replace(/^(Assistant:|AI:|Bot:)/i, '').trim();
    text = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\n+/g, ' ')
      .trim();
      
    return text;
      
  } catch (error) {
    console.error('❌ Error generating response:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('API key')) {
      return "I'm having trouble connecting to my AI brain. Please check the API configuration.";
    } else if (error.message.includes('quota')) {
      return "I'm currently at capacity. Please try again in a few minutes.";
    } else if (error.message.includes('network')) {
      return "I'm having network connectivity issues. Please check your internet connection.";
    } else {
      return "I'm having trouble processing your request right now. Please try again.";
    }
  }
}

