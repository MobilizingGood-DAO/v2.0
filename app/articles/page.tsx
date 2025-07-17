"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Clock, BookOpen, Heart } from "lucide-react"
import Link from "next/link"

export default function Articles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", "Anxiety", "Depression", "Mindfulness", "Sleep", "Stress", "Relationships", "Self-Care"]

  const articles = [
    {
      id: 1,
      title: "Understanding Anxiety: A Comprehensive Guide",
      description: "Learn about the different types of anxiety disorders and effective coping strategies.",
      category: "Anxiety",
      readTime: "8 min",
      difficulty: "Beginner",
      image: "/placeholder.svg?height=200&width=300",
      featured: true,
    },
    {
      id: 2,
      title: "Building Healthy Sleep Habits",
      description: "Discover evidence-based techniques for improving your sleep quality and mental health.",
      category: "Sleep",
      readTime: "6 min",
      difficulty: "Beginner",
      image: "/placeholder.svg?height=200&width=300",
      featured: false,
    },
    {
      id: 3,
      title: "Mindfulness in Daily Life",
      description: "Simple mindfulness practices you can incorporate into your everyday routine.",
      category: "Mindfulness",
      readTime: "5 min",
      difficulty: "Beginner",
      image: "/placeholder.svg?height=200&width=300",
      featured: true,
    },
    {
      id: 4,
      title: "Managing Depression: Tools and Techniques",
      description: "Professional strategies for managing depression symptoms and building resilience.",
      category: "Depression",
      readTime: "12 min",
      difficulty: "Intermediate",
      image: "/placeholder.svg?height=200&width=300",
      featured: false,
    },
    {
      id: 5,
      title: "Stress Management at Work",
      description: "Practical approaches to handling workplace stress and maintaining work-life balance.",
      category: "Stress",
      readTime: "7 min",
      difficulty: "Beginner",
      image: "/placeholder.svg?height=200&width=300",
      featured: false,
    },
    {
      id: 6,
      title: "Building Stronger Relationships",
      description: "Communication skills and strategies for healthier personal relationships.",
      category: "Relationships",
      readTime: "10 min",
      difficulty: "Intermediate",
      image: "/placeholder.svg?height=200&width=300",
      featured: false,
    },
    {
      id: 7,
      title: "Self-Care Isn't Selfish",
      description: "Understanding the importance of self-care and how to practice it effectively.",
      category: "Self-Care",
      readTime: "4 min",
      difficulty: "Beginner",
      image: "/placeholder.svg?height=200&width=300",
      featured: true,
    },
    {
      id: 8,
      title: "Cognitive Behavioral Therapy Basics",
      description: "An introduction to CBT techniques you can practice on your own.",
      category: "Anxiety",
      readTime: "15 min",
      difficulty: "Advanced",
      image: "/placeholder.svg?height=200&width=300",
      featured: false,
    },
  ]

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredArticles = articles.filter((article) => article.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mental Health Articles</h1>
            <p className="text-gray-600">Educational resources for your wellness journey</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Articles */}
        {selectedCategory === "All" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{article.category}</Badge>
                      <Badge variant="outline" className="text-xs">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{article.readTime}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {article.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
            <span className="text-sm text-gray-500">({filteredArticles.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-t-lg"></div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{article.category}</Badge>
                    {article.featured && (
                      <Badge variant="outline" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{article.readTime}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {article.difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredArticles.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
