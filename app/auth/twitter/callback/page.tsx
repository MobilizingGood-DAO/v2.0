"use client"

export default function TwitterCallback() {
  if (typeof window !== "undefined") {
    window.location.href = "/"
  }
  return null
}
