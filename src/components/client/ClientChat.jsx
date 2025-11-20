"use client"

import React, { useMemo, useRef, useState, useEffect } from "react"
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientTopBar } from "@/components/client/ClientTopBar"
import { SendHorizontal, Paperclip, CheckCircle2 } from "lucide-react"

const conversations = [
  {
    id: "nova",
    name: "Nova Design Lab",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80",
    unread: 2,
  },
  {
    id: "atlas",
    name: "Atlas Collective",
    avatar:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=256&q=80",
    unread: 0,
  },
  {
    id: "beacon",
    name: "Beacon Ventures",
    avatar:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=256&q=80",
    unread: 1,
  },
]

const initialMessages = {
  nova: [
    {
      id: "1",
      sender: "other",
      content: "Sharing updated timelines for the microsite rollout.",
      timestamp: "Today · 10:12 AM",
    },
    {
      id: "2",
      sender: "user",
      content: "Great—looping in our product lead for review.",
      timestamp: "Today · 10:15 AM",
    },
  ],
  atlas: [
    {
      id: "3",
      sender: "other",
      content: "Contracts signed. Sending the onboarding packet.",
      timestamp: "Yesterday · 4:31 PM",
    },
  ],
  beacon: [
    {
      id: "4",
      sender: "other",
      content: "Reminder: we are waiting on budget approval.",
      timestamp: "Mon · 11:02 AM",
    },
  ],
}

const ChatArea = ({
  conversation,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
}) => {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background to-background/70 ">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/40 bg-card/60 px-8 py-5 backdrop-blur-xl">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={conversation.avatar || "/placeholder.svg"}
            alt={conversation.name}
          />
          <AvatarFallback className="bg-primary/20 text-primary">
            {conversation.name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{conversation.name}</p>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-sm rounded-2xl px-4 py-3 text-sm ${
                message.sender === "user"
                  ? "rounded-br-none bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30"
                  : "rounded-bl-none border border-border/50 bg-card text-foreground"
              } flex flex-col gap-1`}
            >
              <p className="leading-relaxed">{message.content}</p>
              <span
                className={`self-end text-right text-xs ${
                  message.sender === "user"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {message.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/40 px-6 py-5">
        <div className="flex items-center gap-3 rounded-full bg-card/60 px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(event) => onMessageInputChange(event.target.value)}
            onKeyDown={handleKeyPress}
            className="border-none bg-transparent focus-visible:ring-0"
          />
          <Button
            onClick={onSendMessage}
            size="icon"
            className="rounded-full bg-primary"
          >
            <SendHorizontal className="h-5 w-5 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const ClientChatContent = () => {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0]
  )
  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState(initialMessages)

  const activeMessages = useMemo(
    () => messages[selectedConversation.id] ?? [],
    [messages, selectedConversation.id]
  )

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    setMessages((prev) => ({
      ...prev,
      [selectedConversation.id]: [
        ...(prev[selectedConversation.id] ?? []),
        {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : String(Date.now()),
          sender: "user",
          content: messageInput.trim(),
          timestamp: "Just now",
        },
      ],
    }))
    setMessageInput("")
  }

  return (
    <div className="flex h-screen flex-col gap-6 overflow-hidden p-6">
      <ClientTopBar />

      <div className="grid h-full gap-6 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border border-border/50 bg-card/70">
          <CardContent className="flex h-full flex-col gap-4 overflow-hidden p-4">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {conversations.map((conversation) => {
                const isActive = conversation.id === selectedConversation.id
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {conversation.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated recently
                        </p>
                      </div>
                      {conversation.unread > 0 ? (
                        <Badge className="bg-primary text-primary-foreground">
                          {conversation.unread}
                        </Badge>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <ChatArea
          conversation={selectedConversation}
          messages={activeMessages}
          messageInput={messageInput}
          onMessageInputChange={setMessageInput}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}

const ClientChat = () => {
  return (
    <RoleAwareSidebar>
      <ClientChatContent />
    </RoleAwareSidebar>
  )
}

export default ClientChat
