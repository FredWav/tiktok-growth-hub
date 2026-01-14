import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, Lock } from "lucide-react";

interface ClientNotesTabProps {
  clientId: string;
  initialNotes: string;
  onSave: (notes: string) => void;
  isSaving: boolean;
}

export const ClientNotesTab: React.FC<ClientNotesTabProps> = ({
  clientId,
  initialNotes,
  onSave,
  isSaving,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Reset notes when client changes
  useEffect(() => {
    setNotes(initialNotes);
    setHasChanges(false);
  }, [clientId, initialNotes]);

  // Debounced save
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      onSave(notes);
      setHasChanges(false);
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, hasChanges, onSave]);

  const handleChange = useCallback((value: string) => {
    setNotes(value);
    setHasChanges(true);
  }, []);

  return (
    <Card className="bg-noir-light border-primary/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-cream">Notes internes</h3>
            <p className="text-sm text-cream/60">
              Visibles uniquement par l'admin, jamais par le client
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-cream/60">Sauvegarde...</span>
            </>
          ) : hasChanges ? (
            <span className="text-cream/60">Modifications non sauvegardées</span>
          ) : lastSaved ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Sauvegardé</span>
            </>
          ) : null}
        </div>
      </div>

      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Ajoutez des notes privées sur ce client... Ces notes ne seront jamais visibles par le client."
        className="min-h-[300px] bg-noir border-primary/30 text-cream resize-y"
      />

      <p className="mt-4 text-xs text-cream/40">
        💡 Ces notes sont automatiquement sauvegardées après 1 seconde d'inactivité.
        Elles sont protégées par les règles de sécurité et ne sont accessibles qu'à l'admin.
      </p>
    </Card>
  );
};
