import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PassKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPassKeyUpdated: () => void;
}

export function PassKeyModal({ open, onOpenChange, onPassKeyUpdated }: PassKeyModalProps) {
  const [passKey, setPassKey] = useState("");
  const [currentPassKey, setCurrentPassKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCurrentPassKey();
    }
  }, [open]);

  const fetchCurrentPassKey = async () => {
    try {
      const { data, error } = await supabase
        .from('pass_key')
        .select('pass_key')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentPassKey(data[0].pass_key);
        setPassKey(data[0].pass_key);
      }
    } catch (error) {
      console.error('Error fetching pass key:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (passKey.length !== 10) {
      setError("Pass key must be exactly 10 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('set_pass_key', {
        new_pass_key: passKey
      });

      if (error) throw error;

      toast({
        title: "Pass key updated",
        description: "The pass key has been successfully updated.",
      });

      onOpenChange(false);
      onPassKeyUpdated();
    } catch (error) {
      console.error('Error updating pass key:', error);
      setError("Failed to update pass key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Pass Key</DialogTitle>
          <DialogDescription>
            Set the 10-character pass key that teams need to discover.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {currentPassKey && (
            <Alert>
              <AlertDescription>
                Current pass key: <strong>{currentPassKey}</strong>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="passKey">New Pass Key (10 characters)</Label>
            <Input
              id="passKey"
              value={passKey}
              onChange={(e) => setPassKey(e.target.value.slice(0, 10))}
              placeholder="Enter 10-character pass key"
              maxLength={10}
              required
              className="font-mono text-center text-lg tracking-widest"
            />
            <p className="text-sm text-muted-foreground">
              {passKey.length}/10 characters
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || passKey.length !== 10}>
              {loading ? "Updating..." : "Update Pass Key"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}