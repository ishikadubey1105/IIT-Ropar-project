# 🌌 Atmosphera

## Project Overview
Atmosphera is a context-aware, emotionally intelligent book recommendation system that curates reading experiences based on the reader’s current moment rather than static popularity or genre metadata.

The system aligns books with environmental and emotional context such as weather, time of day, mental energy, and reading intent to reduce decision fatigue and improve discovery quality.

### 🚀 Live Demo
Experience the application live at **[https://atmosphera-app.vercel.app/](https://atmosphera-app.vercel.app/)**. 
This deployment showcases the full atmospheric intelligence engine, allowing you to explore context-aware book recommendations directly in your browser. No installation is required to experience the real-time weather integration and neural curation features.

---

## Problem Statement
- Traditional book recommendation systems rely on ratings, reviews, and historical popularity.
- The same books are repeatedly shown across categories such as Bestsellers, Classics, and Romance.
- These systems ignore situational factors like mood, weather, and cognitive readiness.

---

## Solution Approach
- Atmosphera uses prompt-orchestrated AI reasoning instead of static tags.
- Section titles act as strict constraints, not keywords.
- Each recommendation is justified by both contextual fit and section qualification.

---

## Core Features

### 🌍 Global Sensations (Live Grounded Discovery)
- Uses Google Search Grounding to surface books trending in real time.
- Avoids stale or misleading “bestseller” lists.
- Ensures semantic correctness by validating that books ARE bestsellers, not ABOUT them.

### ☁️ Atmospheric Calibration Engine
- Incorporates weather, time of day, emotional state, and mental energy.
- Recommends books that fit the reader’s current cognitive and emotional capacity.

### 🎭 Character Echoes
- Enables conversational interaction with AI personas inspired by the book’s narrative voice.
- Allows pre-reading immersion without spoilers.

### 🎙️ Live Librarian
- Voice-based discovery using Gemini Live API.
- Readers can describe preferences naturally through speech.

### 🎨 Procedural Cover Art
- Generates minimalist AI-based covers for books without digital artwork.
- Uses title and emotional tone to maintain visual consistency.

---

## Recommendation Philosophy
- Short, high-signal explanations only.
- No ratings, reviews, or social feeds.
- No popularity scores or engagement metrics.
- Focus on “Why this book fits now”.

---

## Section Integrity Enforcement
- Section titles are treated as constraints.
- Books are validated by attribute, not keyword matching.
- Example (Global Bestsellers):
  - Book must have proven commercial success or chart recognition.
  - Books about “how to write a bestseller” are strictly excluded.

---

## Book Detail Page Intelligence
- One-line experiential identity.
- Contextual “Why this fits now” explanation.
- Reading commitment (attention, emotional weight, pacing).
- Emotional arc preview.
- Read / Avoid guidance.
- Micro-synopsis (≤ 40 words).
- Contextual “Read-differently” insight.

---

## Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS (custom cinematic theme)

### AI & Intelligence
- Gemini 3 Pro (reasoning & curation)
- Gemini 2.5 Flash (voice, vision, low-latency)
- Google Search Grounding (real-time discovery)

### Audio
- Gemini Live API
- Text-to-Speech

---

## Deployment
- Hosted on Google Cloud
- HTTPS enabled
- PWA-ready
- Android distribution via Trusted Web Activity (Play Store compatible)

---

## Privacy & Ethics
- No user data storage
- No tracking or profiling
- Session-based context only
- Explainable AI outputs

---

## What Atmosphera Is Not
- A popularity leaderboard
- A review or rating platform
- A social reading network
- A genre-only recommender

---

## One-Line Summary
Atmosphera is a context-aware, weather-driven book recommendation system designed to deliver the right book for the right moment.
