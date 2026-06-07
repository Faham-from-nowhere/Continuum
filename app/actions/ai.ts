"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function summarizeText(content: string) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Summarize the following notes in a concise manner. Return ONLY the summary.\n\n${content}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function rewriteText(content: string, tone?: string) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const toneStr = tone ? ` in a ${tone} tone` : "";
  const prompt = `Rewrite the following text${toneStr} to improve clarity, grammar, and flow. Return ONLY the rewritten text without conversational filler.\n\n${content}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateTasks(content: string) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Extract a list of actionable tasks or to-dos from the following notes. Return ONLY a markdown checklist (e.g. - [ ] task):\n\n${content}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
