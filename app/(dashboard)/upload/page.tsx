import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ManualTradeForm } from "@/components/upload/ManualTradeForm";
import { CSVUpload } from "@/components/upload/CSVUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Upload</h1>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <ManualTradeForm />
        </TabsContent>

        <TabsContent value="csv">
          <CSVUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}

