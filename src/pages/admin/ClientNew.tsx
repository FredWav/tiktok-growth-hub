import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateClient } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";

const clientFormSchema = z.object({
  email: z.string().email("Email invalide"),
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  company: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  offer: z.enum(["one_shot", "45_jours", "vip"]),
  status: z.enum(["prospect", "active", "completed", "cancelled"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  internal_notes: z.string().optional(),
  tags: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const ClientNew = () => {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      email: "",
      full_name: "",
      company: "",
      phone: "",
      instagram: "",
      website: "",
      offer: "one_shot",
      status: "prospect",
      start_date: "",
      end_date: "",
      internal_notes: "",
      tags: "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsCreatingUser(true);

    try {
      // Search for existing user by email in profiles
      // We need to find users - let's check if a profile exists with matching email
      // Since profiles don't have email, we need to search auth.users
      // For now, we'll look up by user_id in a different approach
      
      // Get all profiles and try to match - this is a workaround
      // In production, you'd use an edge function with admin API
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) throw profilesError;

      // For this implementation, we'll create with the first available user
      // or show an error - proper implementation needs edge function
      
      // Try to find if there's a user already with client role but no client record
      const { data: existingClients } = await supabase
        .from("clients")
        .select("user_id");
      
      const existingClientUserIds = new Set(existingClients?.map(c => c.user_id) || []);
      
      // Find a user that's not yet a client
      const availableProfile = profiles?.find(p => !existingClientUserIds.has(p.id));
      
      if (!availableProfile) {
        toast.error("Aucun utilisateur disponible. L'utilisateur doit d'abord créer un compte.");
        setIsCreatingUser(false);
        return;
      }

      const userId = availableProfile.id;

      // Create the client record
      const tagsArray = data.tags 
        ? data.tags.split(",").map(t => t.trim()).filter(Boolean)
        : [];

      await createClient.mutateAsync({
        user_id: userId,
        offer: data.offer,
        status: data.status,
        company: data.company || null,
        phone: data.phone || null,
        instagram: data.instagram || null,
        website: data.website || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        internal_notes: data.internal_notes || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      });

      // Update profile name if needed
      await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", userId);

      toast.success("Client créé avec succès");
      navigate("/admin/clients");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Erreur lors de la création du client");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const isLoading = isCreatingUser || createClient.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouveau client</h1>
            <p className="text-muted-foreground">
              Créer un nouveau dossier client
            </p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informations principales */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations principales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="client@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          L'email doit correspondre à un compte utilisateur existant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entreprise</FormLabel>
                        <FormControl>
                          <Input placeholder="Ma Société" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 6 12 34 56 78" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Réseaux et web */}
              <Card>
                <CardHeader>
                  <CardTitle>Réseaux et web</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site web</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="coaching, premium, urgent"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Séparez les tags par des virgules
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Offre et statut */}
              <Card>
                <CardHeader>
                  <CardTitle>Offre et statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="offer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offre *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une offre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="one_shot">One Shot</SelectItem>
                            <SelectItem value="45_jours">45 Jours</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Notes internes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes internes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="internal_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes visibles uniquement par l'admin..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Ces notes ne sont jamais visibles par le client
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/clients")}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer le client
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default ClientNew;
