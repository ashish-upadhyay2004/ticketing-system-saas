import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, name, email, role, created_at")
      .in("role", ["agent", "admin"])
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setAgents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Admin — Agents</h1>
        <p className="text-muted-foreground">View all agents & admins</p>
      </div>

      <Card className="bento-card">
        <CardHeader>
          <CardTitle>Agents List</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : agents.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              No agents found.
            </p>
          ) : (
            <div className="space-y-3">
              {agents.map((a) => (
                <div
                  key={a.user_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-xl p-4 hover:bg-muted/40 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{a.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {a.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
