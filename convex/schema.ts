import { v } from "convex/values"
import { defineSchema, defineTable } from "convex/server"

export default defineSchema({
    documents: defineTable({
        title: v.string(),
        userId: v.string(),
        isArchived:v.boolean(),
        parentDocument:v.optional(v.id("documents")),
        content:v.optional(v.string()),
        coverImage:v.optional(v.string()),
        icon:v.optional(v.string()),
        isPublished:v.boolean(),
        status: v.optional(v.string()), // For Kanban board
        dueDate: v.optional(v.number()), // For Calendar view
        tags: v.optional(v.array(v.string())), // For advanced filtering
    })
    .index("by_user", ["userId"]) //indices for faster querying
    .index("by_user_parent", ["userId", "parentDocument"]),

    versions: defineTable({
        documentId: v.id("documents"),
        content: v.string(),
        userId: v.string(),
        timestamp: v.number(),
    })
    .index("by_document", ["documentId"])
    .index("by_document_timestamp", ["documentId", "timestamp"])
});