"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";

import { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { 
  FormattingToolbarController, 
  FormattingToolbar, 
  BasicTextStyleButton, 
  BlockTypeSelect, 
  ColorStyleButton, 
  CreateLinkButton, 
  FileCaptionButton, 
  FileReplaceButton, 
  NestBlockButton, 
  TextAlignButton, 
  UnnestBlockButton,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core";
import { Sparkles, List, Loader2, Wand2 } from "lucide-react";
import { summarizeText, rewriteText, generateTasks } from "@/app/actions/ai";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  liveblocks?: boolean;
}

export default function Editor({
  onChange,
  initialContent,
  editable = true,
  liveblocks = true,
}: EditorProps) {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const hasLiveblocks = !!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

  if (hasLiveblocks && liveblocks) {
    return (
      <LiveblocksEditor 
        onChange={onChange} 
        initialContent={initialContent} 
        editable={editable} 
        resolvedTheme={resolvedTheme} 
        edgestore={edgestore} 
      />
    );
  }

  return (
    <LocalEditor 
      onChange={onChange} 
      initialContent={initialContent} 
      editable={editable} 
      resolvedTheme={resolvedTheme} 
      edgestore={edgestore} 
    />
  );
}

function EditorChild({ onChange, initialContent, editable, resolvedTheme, edgestore, doc, provider }: any) {
  const userInfo = useSelf((me) => me.info);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: (userInfo?.name as string) || "Anonymous",
        color: (userInfo?.color as string) || "#ff0000",
      },
    },
    uploadFile: handleUpload,
  });

  useEffect(() => {
    let synced = false;
    const handleSync = () => {
      if (synced) return;
      synced = true;
      if (initialContent) {
        try {
          const parsed = JSON.parse(initialContent);
          if (editor.document.length === 1 && !editor.document[0].content) {
            editor.replaceBlocks(editor.document, parsed);
          }
        } catch(e) {}
      }
    };
    provider.on('synced', handleSync);
    return () => provider.off('synced', handleSync);
  }, [editor, provider, initialContent]);

  const handleAiAction = async (actionType: "summarize" | "rewrite" | "tasks") => {
    const selectedBlocks = editor.getSelection()?.blocks || [];
    if (selectedBlocks.length === 0) {
      toast.error("Please select some text first.");
      return;
    }
    
    const textContent = selectedBlocks.map(b => {
      // @ts-ignore
      if (b.content && Array.isArray(b.content)) return b.content.map(c => c.text).join("");
      return "";
    }).join("\n");

    if (!textContent) {
      toast.error("No text found in selection.");
      return;
    }

    setIsAiLoading(true);
    const toastId = toast.loading("AI is thinking...");
    
    try {
      let result = "";
      if (actionType === "summarize") {
        result = await summarizeText(textContent);
      } else if (actionType === "rewrite") {
        result = await rewriteText(textContent);
      } else if (actionType === "tasks") {
        result = await generateTasks(textContent);
      }

      const lastBlock = selectedBlocks[selectedBlocks.length - 1];
      editor.insertBlocks([{
        type: "paragraph",
        content: `✨ AI Output: ${result}`
      }], lastBlock, "after");
      
      toast.success("AI generated successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI response.", { id: toastId });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getCustomSlashMenuItems = (editor: any) => [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: "Ask AI to Summarize",
      onItemClick: async () => {
        // Find the block above the cursor to summarize
        const currentBlock = editor.getTextCursorPosition().block;
        const prevBlock = editor.document[editor.document.indexOf(currentBlock) - 1];
        if (!prevBlock) return toast.error("No text above to summarize.");
        
        setIsAiLoading(true);
        const toastId = toast.loading("AI is summarizing...");
        try {
          // @ts-ignore
          const content = Array.isArray(prevBlock.content) ? prevBlock.content.map(c => c.text).join("") : "";
          const result = await summarizeText(content);
          editor.insertBlocks([{ type: "paragraph", content: `✨ ${result}` }], currentBlock, "after");
          toast.success("Summarized!", { id: toastId });
        } catch (e) {
          toast.error("Failed to summarize.", { id: toastId });
        } finally {
          setIsAiLoading(false);
        }
      },
      aliases: ["ai", "magic", "summarize"],
      group: "Magic AI",
      icon: <Sparkles size={18} />,
      subtext: "Summarize the previous block with Gemini."
    },
    {
      title: "Ask AI for Tasks",
      onItemClick: async () => {
        const currentBlock = editor.getTextCursorPosition().block;
        const prevBlock = editor.document[editor.document.indexOf(currentBlock) - 1];
        if (!prevBlock) return toast.error("No text above to process.");
        
        setIsAiLoading(true);
        const toastId = toast.loading("AI is extracting tasks...");
        try {
          // @ts-ignore
          const content = Array.isArray(prevBlock.content) ? prevBlock.content.map(c => c.text).join("") : "";
          const result = await generateTasks(content);
          editor.insertBlocks([{ type: "paragraph", content: `✨ ${result}` }], currentBlock, "after");
          toast.success("Tasks extracted!", { id: toastId });
        } catch (e) {
          toast.error("Failed to extract tasks.", { id: toastId });
        } finally {
          setIsAiLoading(false);
        }
      },
      aliases: ["ai", "magic", "tasks"],
      group: "Magic AI",
      icon: <List size={18} />,
      subtext: "Extract tasks from the previous block."
    }
  ];

  return (
    <div className="relative group/editor">
      {/* External AI Toolbar that won't be swallowed by BlockNote's event system */}
      <div className="relative z-50 flex items-center gap-2 mb-4 bg-muted/50 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <span className="text-xs text-muted-foreground mr-2 pl-1 font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Ask AI
        </span>
        <button 
          onClick={(e) => { e.preventDefault(); handleAiAction("summarize"); }} 
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted text-purple-500 font-medium whitespace-nowrap cursor-pointer transition"
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <List className="h-3 w-3" />} Summarize
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); handleAiAction("rewrite"); }} 
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted text-blue-500 font-medium whitespace-nowrap cursor-pointer transition"
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Rewrite
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); handleAiAction("tasks"); }} 
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted text-green-500 font-medium whitespace-nowrap cursor-pointer transition"
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Tasks
        </button>
      </div>

      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        editable={editable && !isAiLoading}
        onChange={() => {
          if (onChange) {
            onChange(JSON.stringify(editor.document, null, 2));
          }
        }}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
}

function LiveblocksEditor(props: any) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<any>();

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setDoc(yDoc);
    setProvider(yProvider);
  }, [room]);

  if (!doc || !provider) {
    return null;
  }

  return <EditorChild {...props} doc={doc} provider={provider} />;
}



function LocalEditor({ onChange, initialContent, editable, resolvedTheme, edgestore }: any) {
  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };

  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  });

  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiAction = async (actionType: "summarize" | "rewrite" | "tasks") => {
    const selectedBlocks = editor.getSelection()?.blocks || [];
    if (selectedBlocks.length === 0) {
      toast.error("Please select some text first.");
      return;
    }
    
    const textContent = selectedBlocks.map(b => {
      // @ts-ignore
      if (b.content && Array.isArray(b.content)) return b.content.map(c => c.text).join("");
      return "";
    }).join("\n");

    if (!textContent) {
      toast.error("No text found in selection.");
      return;
    }

    setIsAiLoading(true);
    const toastId = toast.loading("AI is thinking...");
    
    try {
      let result = "";
      if (actionType === "summarize") {
        result = await summarizeText(textContent);
      } else if (actionType === "rewrite") {
        result = await rewriteText(textContent);
      } else if (actionType === "tasks") {
        result = await generateTasks(textContent);
      }

      const lastBlock = selectedBlocks[selectedBlocks.length - 1];
      editor.insertBlocks([{
        type: "paragraph",
        content: `✨ AI Output: ${result}`
      }], lastBlock, "after");
      
      toast.success("AI generated successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI response.", { id: toastId });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getCustomSlashMenuItems = (editor: any) => [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: "Ask AI to Summarize",
      onItemClick: async () => {
        const currentBlock = editor.getTextCursorPosition().block;
        const prevBlock = editor.document[editor.document.indexOf(currentBlock) - 1];
        if (!prevBlock) return toast.error("No text above to summarize.");
        
        setIsAiLoading(true);
        const toastId = toast.loading("AI is summarizing...");
        try {
          // @ts-ignore
          const content = Array.isArray(prevBlock.content) ? prevBlock.content.map(c => c.text).join("") : "";
          const result = await summarizeText(content);
          editor.insertBlocks([{ type: "paragraph", content: `✨ ${result}` }], currentBlock, "after");
          toast.success("Summarized!", { id: toastId });
        } catch (e) {
          toast.error("Failed to summarize.", { id: toastId });
        } finally {
          setIsAiLoading(false);
        }
      },
      aliases: ["ai", "magic", "summarize"],
      group: "Magic AI",
      icon: <Sparkles size={18} />,
      subtext: "Summarize the previous block with Gemini."
    },
    {
      title: "Ask AI for Tasks",
      onItemClick: async () => {
        const currentBlock = editor.getTextCursorPosition().block;
        const prevBlock = editor.document[editor.document.indexOf(currentBlock) - 1];
        if (!prevBlock) return toast.error("No text above to process.");
        
        setIsAiLoading(true);
        const toastId = toast.loading("AI is extracting tasks...");
        try {
          // @ts-ignore
          const content = Array.isArray(prevBlock.content) ? prevBlock.content.map(c => c.text).join("") : "";
          const result = await generateTasks(content);
          editor.insertBlocks([{ type: "paragraph", content: `✨ ${result}` }], currentBlock, "after");
          toast.success("Tasks extracted!", { id: toastId });
        } catch (e) {
          toast.error("Failed to extract tasks.", { id: toastId });
        } finally {
          setIsAiLoading(false);
        }
      },
      aliases: ["ai", "magic", "tasks"],
      group: "Magic AI",
      icon: <List size={18} />,
      subtext: "Extract tasks from the previous block."
    }
  ];

  return (
    <div className="relative group/editor">
      {/* External AI Toolbar that won't be swallowed by BlockNote's event system */}
      <div className="relative z-50 flex items-center gap-2 mb-4 bg-muted/50 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <span className="text-xs text-muted-foreground mr-2 pl-1 font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Ask AI
        </span>
        <button 
          onClick={(e) => { e.preventDefault(); handleAiAction("summarize"); }} 
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted text-purple-500 font-medium whitespace-nowrap cursor-pointer transition"
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <List className="h-3 w-3" />} Summarize
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); handleAiAction("rewrite"); }} 
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted text-blue-500 font-medium whitespace-nowrap cursor-pointer transition"
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Rewrite
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); handleAiAction("tasks"); }} 
          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted text-green-500 font-medium whitespace-nowrap cursor-pointer transition"
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Tasks
        </button>
      </div>

      <BlockNoteView
        editor={editor}
        editable={editable && !isAiLoading}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={() => {
          onChange(JSON.stringify(editor.document, null, 2));
        }}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
}
