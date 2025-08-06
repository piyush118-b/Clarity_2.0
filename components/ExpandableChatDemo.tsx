"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import { Send, Bot, Paperclip, Mic, User, Loader2, CornerDownLeft } from "lucide-react"
import { toast } from "sonner"

const SYSTEM_PROMPT = `You are REALITY Housing's AI Assistant, here to provide compassionate and accurate support to tenants, their families, and support workers. Your role is to assist with inquiries about supported accommodation, tenancy agreements, and housing-related matters while maintaining a warm, professional, and empathetic tone.

GUIDELINES:
1. Be empathetic, patient, and understanding in all responses
2. Use simple, clear language that's easy to understand
3. If you don't know an answer, offer to connect the user with a human representative
4. For maintenance requests, guide users on how to submit a formal request

## Communication Style:
- Use a warm, professional, and empathetic tone
- Keep responses clear and easy to understand
- Be patient and understanding of all inquiries
- Acknowledge emotions and concerns with care
- Use plain language, avoiding unnecessary jargon
- Be proactive in offering additional help

## Key Information:

### Supported Accommodation:
- 24/7 on-site support staff
- Individualized support plans
- Assistance with daily living skills
- Access to community services
- Safe and stable housing environment
- Regular property maintenance

### Tenancy Support:
- Rent payment assistance and guidance
- Maintenance request submission and tracking
- House rules and community guidelines
- Rights and responsibilities as a tenant
- Emergency procedures and contacts
Who can live in supported accommodation?
Our homes are suitable for adults (18+) and, in some cases, young people aged 16–17, depending on local authority approval and support needs. We typically support individuals who:
- Are referred by a local authority, support worker, or care provider
- Need a structured but independent living environment
- Have a recognised support need such as a disability or mental health condition

How is supported accommodation funded?
Most of our tenants are eligible for Housing Benefit, which helps cover rent and eligible housing costs. Support services (like personal care or help with daily living) are usually funded separately by the local authority or NHS. We work closely with professionals to make sure funding and support arrangements are in place before someone moves in.

What makes REALITY Housing different?
We don’t just offer buildings—we offer real homes. Our values are built around:
- Real Independence – Helping people make their own choices in a safe environment
- Real Trust – Being transparent, respectful, and responsive
- Real You – Putting each person at the centre of everything we do
We’re committed to making sure every tenant feels heard, safe, and supported.

What legal standards do you follow?
We follow the Supported Accommodation (England) Regulations 2023, which set clear national standards in four key areas:
1. Leadership and Management – Staff are safely recruited, trained, and supported.
2. Protection (Safeguarding) – We have strong safeguarding policies, trained staff, and emergency procedures.
3. Accommodation Standards – Regular safety checks, private rooms, and clear tenant agreements.
4. Support – Personalised support plans, access to services, and focus on long-term independence.

Do you work with young people?
Yes, in certain cases. For 16–17-year-olds, we follow strict Ofsted regulations including:
- Registration with Ofsted
- Regular inspections
- Detailed support and safeguarding plans
- Involving young people in accommodation and life planning

How are referrals made?
You can make a referral by:
- Contacting us via our website
- Emailing: referrals@realityhs.co.uk
- Speaking to your social worker, care provider, or housing officer
Referral process: Initial conversation → Needs assessment → Match to home → Transition planning.

Is there staff on site?
REALITY Housing does not provide on-site care staff. However, many homes are regularly visited by care providers. We ensure tenants always know who to contact in an emergency and help is always available when needed.

Is the accommodation safe?
Yes. We carry out regular property safety checks, risk assessments, and staff safeguarding training. We also have emergency and incident response plans.

Can I choose who I live with?
We aim to consider your preferences. In shared homes, we match people carefully. Some homes offer self-contained flats for more privacy.

How do you support independence?
We help tenants develop key life skills such as budgeting, managing appointments, cooking, and travel. When the time is right, we support a smooth transition into more independent living.

How do you ensure quality?
We meet national regulations and welcome regular inspections (including Ofsted for under-18s). We also invite feedback from tenants and professionals.

How do I raise a concern or complaint?
You can speak to your support worker, contact us directly, or use our online complaint form. All concerns are treated confidentially and fairly.
`
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"

export function ExpandableChatDemo() {
  const [messages, setMessages] = useState<Array<{ id: number; content: string; sender: "user" | "ai" }>>([
    {
      id: 1,
      content: "Hello! I'm REALITY Housing's AI Assistant. How can I help you today?",
      sender: "ai" as const,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables");
  }
  // Use try-catch to handle potential initialization errors
  let genAI;
  let model;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Try the newer model name format first
    model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  } catch (error) {
    console.error("Error initializing Google AI model:", error);
    // Fallback to null to prevent runtime errors
    model = null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      content: input,
      sender: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Check if model is available
      if (!model) {
        throw new Error("AI model is not available. Please check your API key and model configuration.");
      }

      let historyForGemini = [];
      
      if (isFirstMessage) {
        // For first message, set up the system prompt and initial greeting
        historyForGemini = [
          {
            role: "user" as const,
            parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + input }],
          },
        ];
        setIsFirstMessage(false);
      } else {
        // For subsequent messages, maintain conversation history
        historyForGemini = messages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));
      }

      // Start chat with error handling
      let chat;
      try {
        chat = model.startChat({
          history: historyForGemini,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.9,
          },
        });
      } catch (chatError) {
        console.error("Error starting chat:", chatError);
        throw new Error("Failed to initialize chat. The model may be unavailable.");
      }

      // Send message with error handling
      let result;
      try {
        result = await chat.sendMessage(input);
        const aiResponse = result.response.text();

        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: aiResponse || "I'm sorry, I couldn't process your request. Please try again.",
            sender: "ai" as const,
          },
        ]);
      } catch (sendError) {
        console.error("Error sending message:", sendError);
        throw new Error("Failed to get a response from the AI model.");
      }
    } catch (error) {
      console.error("Error in chat interaction:", error);
      // Show a more specific error message to the user
      const errorMessage = error instanceof Error ? 
        `AI Assistant Error: ${error.message}` : 
        "Sorry, I'm having trouble connecting to the AI. Please try again later.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: errorMessage,
          sender: "ai",
        },
      ]);
      
      // Notify the user with a toast message for better visibility
      toast.error("AI Assistant Error", {
        description: "There was a problem with the AI service. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAttachFile = () => {
    // Implement file attachment logic
  }

  const handleMicrophoneClick = () => {
    // Implement microphone input logic
  }

  return (
    <div className="h-[600px] relative">
      <ExpandableChat
        size="lg"
        position="bottom-right"
        icon={<Bot className="h-6 w-6" />}
      >
        <ExpandableChatHeader className="flex-col text-center justify-center">
          <h1 className="text-xl font-semibold">Chat with Your AI Personal Assistant  ✨</h1>
          <p className="text-sm text-muted-foreground">
            Ask me anything
          </p>

        </ExpandableChatHeader>

        <ExpandableChatBody>
          <ChatMessageList>
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                variant={message.sender === "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src={
                    message.sender === "user"
                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  }
                  fallback={message.sender === "user" ? "US" : "AI"}
                />
                <ChatBubbleMessage
                  variant={message.sender === "user" ? "sent" : "received"}
                >
                  {message.content}
                </ChatBubbleMessage>
              </ChatBubble>
            ))}
            

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  fallback="AI"
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter>
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleAttachFile}
                >
                  <Paperclip className="size-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleMicrophoneClick}
                >
                  <Mic className="size-4" />
                </Button>
              </div>
              <Button type="submit" size="sm" className="ml-auto gap-1.5">
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  )
}
