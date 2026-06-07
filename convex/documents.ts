import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const archive = mutation({
    args:{id:v.id("documents")},
    handler:async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id);
        if(!existingDocument){
            throw new Error("Not found");
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }
        const recursiveArchive = async(documentId:Id<"documents">)=>{
            const children = await ctx.db
            .query("documents")
            .withIndex("by_user_parent", (q)=>(
                q
                .eq("userId", userId)
                .eq("parentDocument", documentId)
            ))
            .collect();
            for(const child of children){
                await ctx.db.patch(child._id, {
                    isArchived:true
                });
                await recursiveArchive(child._id);
            }
        }
        const document = await ctx.db.patch(args.id, {
            isArchived:true,
        });
        await recursiveArchive(args.id);
        return document;
    }
})

export const getSidebar = query({
    args:{
        parentDocument:v.optional(v.id("documents"))
    },
    handler:async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const documents = await ctx.db.query("documents").withIndex("by_user_parent", (q)=>
        q
        .eq("userId", userId)
        .eq("parentDocument", args.parentDocument)
    )
    .filter((q)=>
    q.eq(q.field("isArchived"), false)
    )
    .order("desc")
    .collect();
       return documents;
    },
});

export const getChildren = query({
    args:{
        parentDocument:v.id("documents")
    },
    handler:async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const documents = await ctx.db.query("documents").withIndex("by_user_parent", (q)=>
            q
            .eq("userId", userId)
            .eq("parentDocument", args.parentDocument)
        )
        .filter((q)=>
            q.eq(q.field("isArchived"), false)
        )
        .order("desc")
        .collect();
       return documents;
    },
});

export const create = mutation({
    args:{
        title:v.string(),
        parentDocument:v.optional(v.id("documents")),
    },
    handler: async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const document = await ctx.db.insert("documents", {
            title:args.title,
            parentDocument:args.parentDocument,
            userId,
            isArchived:false,
            isPublished:false,
        });
        return document;
    }
});

export const getTrash = query({
    handler: async(ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const documents = await ctx.db.query("documents").withIndex("by_user", (q)=>q.eq("userId", userId))
        .filter((q)=>q.eq(q.field("isArchived"), true),)
        .order("desc")
        .collect();
        return documents;
    }
});

export const restore = mutation({
    args:{id:v.id("documents")},
    handler:async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id);
        if(!existingDocument){
            throw new Error("Not found");
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }
        const recursiveRestore = async(documentId:Id<"documents">)=>{
            const children = await ctx.db
            .query("documents")
            .withIndex("by_user_parent", (q)=>(
                q
                .eq("userId", userId)
                .eq("parentDocument", documentId)
            ))
            .collect();
            for(const child of children){
                await ctx.db.patch(child._id, {
                    isArchived:false
                });
                await recursiveRestore(child._id);
            }
        }
        const options:Partial<Doc<"documents">> = {
            isArchived:false,
        };

        if(existingDocument.parentDocument){
            const parent =await ctx.db.get(existingDocument.parentDocument);
            if(parent?.isArchived){
                options.parentDocument = undefined;
            }
        }
        const document = await ctx.db.patch(args.id, options);
        await recursiveRestore(args.id);
        return document;
    }
});

export const remove = mutation({
    args:{id:v.id("documents")},
    handler:async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id);
        if(!existingDocument){
            throw new Error("Not found");
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }
        const document = await ctx.db.delete(args.id);
        return document;
    }
});

export const getSearch = query({
    handler: async(ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const documents = await ctx.db.query("documents").withIndex("by_user", (q)=>q.eq("userId", userId))
        .filter((q)=>q.eq(q.field("isArchived"), false),
    )
    .order("desc").collect()
    return documents;
    }
});

export const getById = query({
    args:{documentId:v.id("documents")},
    handler:async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const document = await ctx.db.get(args.documentId);
        if(!document){
            throw new Error("Not found");
        }
        if(document.isPublished && !document.isArchived){
            return document;
        }
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        if(document.userId !== userId){
            throw new Error("Unauthorized");
        }
        return document;
    }
});

export const update = mutation({
    args:{
        id:v.id("documents"),
        title:v.optional(v.string()),
        content:v.optional(v.string()),
        coverImage:v.optional(v.string()),
        icon:v.optional(v.string()),
        isPublished:v.optional(v.boolean()),
        status: v.optional(v.string()),
        dueDate: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async(ctx, args)=> {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const {id, ...rest} = args;//extract id separately and keep and update rest if required cuz they're all optional
        const existingDocument = await ctx.db.get(args.id);
        if(!existingDocument){
            throw new Error("Not found");
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }
        const document = await ctx.db.patch(args.id, {
            ...rest,
        });

        if (args.content) {
            const lastVersion = await ctx.db
                .query("versions")
                .withIndex("by_document_timestamp", (q) => q.eq("documentId", args.id))
                .order("desc")
                .first();

            const fiveMinutes = 5 * 60 * 1000;
            const now = Date.now();

            if (!lastVersion || now - lastVersion.timestamp > fiveMinutes) {
                await ctx.db.insert("versions", {
                    documentId: args.id,
                    content: args.content,
                    userId,
                    timestamp: now,
                });
            }
        }

        return document;
    }
});

export const getVersions = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.documentId);
        if (!existingDocument) {
            throw new Error("Not found");
        }
        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const versions = await ctx.db
            .query("versions")
            .withIndex("by_document_timestamp", (q) => q.eq("documentId", args.documentId))
            .order("desc")
            .collect();
            
        return versions;
    }
});

export const removeIcon = mutation({
    args:{id:v.id("documents")},
    handler: async(ctx, args)=> {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id);
        if(!existingDocument){
            throw new Error("Not found");
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }
        const document = await ctx.db.patch(args.id, {
            icon: undefined
        });
        return document;
    }
});

export const removeCoverImage = mutation({
    args:{id:v.id("documents")},
    handler: async(ctx, args)=> {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id);
        if(!existingDocument){
            throw new Error("Not found");
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }
        const document = await ctx.db.patch(args.id, {
            coverImage: undefined
        });
        return document;
    }
})