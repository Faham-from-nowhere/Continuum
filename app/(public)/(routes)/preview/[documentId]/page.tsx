"use client";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import dynamic from "next/dynamic";
import { use, useMemo } from "react";

interface DocumentIdPageProps {
    params: Promise<{
        documentId:Id<"documents">;
    }>;
};

const DocumentIdPage = ({
    params: paramsPromise
}: DocumentIdPageProps) => {
    const Editor = useMemo(()=> dynamic(()=>import("@/components/editor"), {ssr: false}), []);
    const params = use(paramsPromise);
    const documentId = params.documentId;
    const document = useQuery(api.documents.getById, {
        documentId
    });
    const update = useMutation(api.documents.update);

    const handleEditorChange = (content: string) => {
        update({
            id: documentId,
            content
        });
    };

    if(document === undefined){
       return ( <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
            <div className="space-y-4 pl-8 pt-4">
                <Skeleton className="h-14 w-[50%]"/>
                <Skeleton className="h-4 w-[80%]"/>
                <Skeleton className="h-4 w-[40%]"/>
                <Skeleton className="h-4 w-[60%]"/>
            </div>
        </div>
        </div>  )
    }

    if(document === null){
        return ( <div>Not found</div> )
    }

    return (
     <div className="pb-40">
      <Cover preview url={document.coverImage}/>
      <div className="md:max-w-3xl lg:md-max-w-4xl mx-auto">
        <Toolbar preview initialData={document}/>
        <Editor editable={false} liveblocks={false} onChange={handleEditorChange} initialContent={document.content} />
      </div>
    </div>
)
};

export default DocumentIdPage;
