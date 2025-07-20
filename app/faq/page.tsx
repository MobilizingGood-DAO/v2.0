"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { BookOpen, Users, HelpCircle, Send } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"

const OFFICIAL_FAQ = [
  {
    question: "What is GOOD CARE Network?",
    answer: "A purpose-driven blockchain platform focused on mental health, transparency, and regenerative finance. Users can track their mental health, earn care points, maintain daily streaks, and participate in community activities."
  },
  {
    question: "How do I earn CARE points?",
    answer: "You earn CARE points by logging your mood, writing journal entries, posting in the community, and maintaining daily streaks. Bonus points are awarded for streaks and engagement."
  },
  {
    question: "What is the purpose of streaks?",
    answer: "Streaks reward you for consistency. The longer your streak, the higher your points multiplier."
  },
  {
    question: "How do I connect my wallet?",
    answer: "Click 'Connect Wallet' on the home page and follow the prompts to link your MetaMask wallet."
  },
  {
    question: "Is my journal private?",
    answer: "Yes, your journal entries are private by default. You can optionally mint a hash of your entry on-chain for proof of gratitude."
  },
  {
    question: "How does the leaderboard work?",
    answer: "The leaderboard ranks users by total CARE points earned."
  },
  {
    question: "What is the Community tab?",
    answer: "The Community tab lets you share gratitude, goals, and support others. You can like, comment, and tip posts."
  },
  {
    question: "Where can I get help?",
    answer: "Ask a question below or contact the GOOD CARE team via the official website."
  },
]

export default function FAQPage() {
  // Community Q&A state (local only for now)
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [answerInputs, setAnswerInputs] = useState<{ [key: number]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAsk = async () => {
    if (!newQuestion.trim()) return
    setIsSubmitting(true)
    setQuestions([{ q: newQuestion.trim(), answers: [] }, ...questions])
    setNewQuestion("")
    // Award points if logged in
    if (user) {
      try {
        const res = await fetch("/api/community/faq-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, question: newQuestion.trim() }),
        })
        const data = await res.json()
        if (data.success) {
          toast({
            title: "Question Submitted!",
            description: `You earned 3 CARE points!`,
            variant: "default",
          })
          await refreshUser()
        } else {
          toast({
            title: "Question Submitted!",
            description: "But there was an error awarding points.",
            variant: "default",
          })
        }
      } catch {
        toast({
          title: "Question Submitted!",
          description: "But there was an error awarding points.",
          variant: "default",
        })
      }
    } else {
      toast({
        title: "Question Submitted!",
        description: "Sign in to earn CARE points for your questions.",
        variant: "default",
      })
    }
    setIsSubmitting(false)
  }

  const handleAnswer = (idx: number) => {
    const answer = answerInputs[idx]?.trim()
    if (!answer) return
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, answers: [...q.answers, answer] } : q))
    setAnswerInputs((prev) => ({ ...prev, [idx]: "" }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="bg-white/90 backdrop-blur-sm border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" /> GOOD CARE FAQ</CardTitle>
            <CardDescription>Official answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {OFFICIAL_FAQ.map((item, idx) => (
                <AccordionItem key={idx} value={"faq-" + idx}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-green-500" /> Community Q&amp;A</CardTitle>
            <CardDescription>Ask a question or help others by answering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ask a question for the community..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAsk} variant="default" disabled={isSubmitting || !newQuestion.trim()}><Send className="w-4 h-4 mr-1" /> Ask</Button>
            </div>
            {questions.length === 0 ? (
              <div className="text-gray-500 text-center">No questions yet. Be the first to ask!</div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={idx} className="border-b pb-4">
                    <div className="font-medium text-gray-900 mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> {q.q}</div>
                    <div className="ml-6 space-y-2">
                      {q.answers.length === 0 ? (
                        <div className="text-sm text-gray-500">No answers yet.</div>
                      ) : (
                        q.answers.map((a: string, aidx: number) => (
                          <div key={aidx} className="text-sm text-green-700 bg-green-50 rounded p-2">{a}</div>
                        ))
                      )}
                      <div className="flex gap-2 mt-2">
                        <Textarea
                          placeholder="Write an answer..."
                          value={answerInputs[idx] || ""}
                          onChange={(e) => setAnswerInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                          className="flex-1"
                          rows={2}
                        />
                        <Button onClick={() => handleAnswer(idx)} variant="secondary"><Send className="w-4 h-4 mr-1" /> Answer</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 