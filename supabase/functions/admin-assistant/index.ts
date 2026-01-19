import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tools definitions for OpenAI function calling
const tools = [
  {
    type: "function",
    function: {
      name: "get_all_clients",
      description: "Récupère la liste de tous les clients avec leurs informations de base",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_client_details",
      description: "Récupère les détails complets d'un client incluant sessions, tâches, livrables ET observations",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client pour recherche" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_clients",
      description: "Recherche des clients par nom, entreprise ou tags",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Terme de recherche" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_client_notes",
      description: "Met à jour les notes internes d'un client",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client" },
          notes: { type: "string", description: "Les nouvelles notes à ajouter ou remplacer" },
          append: { type: "boolean", description: "Si true, ajoute aux notes existantes, sinon remplace" }
        },
        required: ["notes"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_client_info",
      description: "Modifie les informations d'un client (téléphone, instagram, website, company, tags, status, offer)",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client" },
          phone: { type: "string" },
          instagram: { type: "string" },
          website: { type: "string" },
          company: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["prospect", "active", "completed", "cancelled"] },
          offer: { type: "string", enum: ["one_shot", "45_jours", "vip"] }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_session",
      description: "Crée un nouveau rendez-vous pour un client",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client" },
          scheduled_at: { type: "string", description: "Date et heure du RDV au format ISO 8601" },
          type: { type: "string", enum: ["discovery", "strategy", "review", "closing"], description: "Type de session" },
          duration_minutes: { type: "number", description: "Durée en minutes (défaut: 60)" },
          notes: { type: "string", description: "Notes pour la session" },
          meeting_link: { type: "string", description: "Lien de réunion" }
        },
        required: ["scheduled_at", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_session",
      description: "Modifie un rendez-vous existant (date, statut, notes)",
      parameters: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "L'ID de la session" },
          client_name: { type: "string", description: "Le nom du client pour trouver la session" },
          scheduled_at: { type: "string", description: "Nouvelle date/heure" },
          status: { type: "string", enum: ["scheduled", "completed", "cancelled", "no_show"] },
          notes: { type: "string" },
          admin_notes: { type: "string" },
          meeting_link: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_session",
      description: "Supprime/annule un rendez-vous",
      parameters: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "L'ID de la session" },
          client_name: { type: "string", description: "Le nom du client" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_upcoming_sessions",
      description: "Liste les prochains rendez-vous",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Nombre de jours à regarder (défaut: 7)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Crée une nouvelle tâche pour un client",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          client_name: { type: "string" },
          title: { type: "string", description: "Titre de la tâche" },
          description: { type: "string" },
          due_date: { type: "string", description: "Date limite au format YYYY-MM-DD" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Modifie une tâche existante",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          client_name: { type: "string" },
          task_title: { type: "string", description: "Titre de la tâche pour la retrouver" },
          title: { type: "string" },
          description: { type: "string" },
          due_date: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Supprime une tâche",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          client_name: { type: "string" },
          task_title: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Récupère les statistiques du dashboard (clients actifs, tâches en retard, revenus, etc.)",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "create_deliverable",
      description: "Ajoute un livrable pour un client",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          client_name: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          file_url: { type: "string" },
          file_name: { type: "string" },
          file_type: { type: "string" },
          is_visible_to_client: { type: "boolean" }
        },
        required: ["title"]
      }
    }
  },
  // ========== NEW OBSERVATION TOOLS ==========
  {
    type: "function",
    function: {
      name: "add_observation",
      description: "Ajoute une observation/note pour un client. Types: note (note libre), measure (mesure/stat), milestone (étape atteinte), concern (point d'attention), image_analysis (analyse d'image)",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client" },
          type: { 
            type: "string", 
            enum: ["note", "measure", "milestone", "concern", "image_analysis"],
            description: "Type d'observation"
          },
          title: { type: "string", description: "Titre court de l'observation" },
          content: { type: "string", description: "Contenu détaillé de l'observation" },
          image_url: { type: "string", description: "URL d'une image associée (optionnel)" },
          metadata: { 
            type: "object", 
            description: "Données structurées (ex: {weight: 75, followers: 15000, engagement: 2.3})",
            additionalProperties: true
          },
          is_private: { type: "boolean", description: "Si true, l'observation n'est pas visible par le client (défaut: false)" }
        },
        required: ["type", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_client_observations",
      description: "Récupère les observations d'un client, optionnellement filtrées par type",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client" },
          type: { 
            type: "string", 
            enum: ["note", "measure", "milestone", "concern", "image_analysis"],
            description: "Filtrer par type d'observation"
          },
          limit: { type: "number", description: "Nombre max d'observations (défaut: 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_observations",
      description: "Recherche dans les observations de tous les clients ou d'un client spécifique",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Terme de recherche (dans titre et contenu)" },
          client_id: { type: "string", description: "Optionnel: restreindre à un client" },
          client_name: { type: "string", description: "Optionnel: nom du client pour restreindre" },
          type: { type: "string", description: "Optionnel: filtrer par type" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_observation",
      description: "Modifie une observation existante",
      parameters: {
        type: "object",
        properties: {
          observation_id: { type: "string", description: "L'ID de l'observation" },
          title: { type: "string" },
          content: { type: "string" },
          type: { type: "string", enum: ["note", "measure", "milestone", "concern", "image_analysis"] },
          metadata: { type: "object", additionalProperties: true },
          is_private: { type: "boolean" }
        },
        required: ["observation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_observation",
      description: "Supprime une observation",
      parameters: {
        type: "object",
        properties: {
          observation_id: { type: "string", description: "L'ID de l'observation" }
        },
        required: ["observation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_image",
      description: "Analyse une image avec l'IA (stats TikTok, screenshots, photos de progression) et retourne une analyse détaillée. Peut optionnellement sauvegarder l'analyse comme observation.",
      parameters: {
        type: "object",
        properties: {
          image_url: { type: "string", description: "URL de l'image à analyser" },
          context: { type: "string", description: "Contexte pour guider l'analyse (ex: 'stats TikTok', 'photo de progression', 'capture d'écran')" },
          client_id: { type: "string", description: "Optionnel: ID du client concerné" },
          client_name: { type: "string", description: "Optionnel: nom du client concerné" },
          save_as_observation: { type: "boolean", description: "Si true, sauvegarde l'analyse comme observation" }
        },
        required: ["image_url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_client_evolution",
      description: "Génère un résumé de l'évolution d'un client sur une période, basé sur les observations, sessions et tâches",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "L'ID du client" },
          client_name: { type: "string", description: "Le nom du client" },
          days: { type: "number", description: "Période en jours (défaut: 30)" }
        }
      }
    }
  }
];

const systemPrompt = `Tu es l'assistant personnel de Fred Wav, expert en stratégie TikTok et coaching business.
Tu as accès complet à la base de données clients et tu peux :
- Consulter et rechercher des informations sur tous les clients
- Gérer les rendez-vous (créer, modifier, annuler)
- Gérer les tâches des clients
- Prendre des notes et observations détaillées sur les clients
- Analyser des images (captures d'écran de stats, photos de progression)
- Créer des livrables
- Répondre à toutes les questions sur l'activité

SYSTÈME D'OBSERVATIONS :
Tu disposes d'un système complet de suivi client avec différents types d'observations :
- "note" : Notes libres sur le client
- "measure" : Mesures et statistiques (followers, engagement, vues, etc.)
- "milestone" : Étapes importantes atteintes
- "concern" : Points d'attention, problèmes à surveiller
- "image_analysis" : Analyses d'images avec extraction de données

Quand on te demande de noter quelque chose sur un client, utilise add_observation.
Quand on te demande l'évolution ou le suivi d'un client, utilise get_client_observations et get_client_evolution.

ANALYSE D'IMAGES :
Quand on te partage une image (URL), tu peux l'analyser avec analyze_image.
Tu peux extraire des données de captures d'écran TikTok, Instagram, etc.
Propose toujours de sauvegarder l'analyse comme observation.

INSTRUCTIONS IMPORTANTES :
- Réponds de manière concise et professionnelle en français
- Quand tu effectues une action, confirme ce que tu as fait
- Si tu cherches un client par nom, utilise search_clients d'abord
- Pour les dates, utilise le format ISO 8601 (ex: 2025-01-20T14:00:00Z)
- Sois proactif : si quelque chose manque dans une demande, demande les détails
- Pour les observations avec des données numériques, utilise le champ metadata

Date actuelle : ${new Date().toISOString().split('T')[0]}`;

// Helper to find client by name
async function findClientByName(supabase: any, name: string) {
  const { data: clients } = await supabase
    .from('clients')
    .select('id, user_id, profiles:user_id(full_name)')
    .order('created_at', { ascending: false });
  
  if (!clients) return null;
  
  const searchLower = name.toLowerCase();
  return clients.find((c: any) => 
    c.profiles?.full_name?.toLowerCase().includes(searchLower)
  );
}

// Execute tool calls
async function executeTool(supabase: any, toolName: string, args: any): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case 'get_all_clients': {
        const { data: clients } = await supabase
          .from('clients')
          .select(`
            id, status, offer, company, phone, instagram, website, tags, internal_notes, start_date, end_date,
            profiles:user_id(full_name)
          `)
          .order('created_at', { ascending: false });
        
        return JSON.stringify(clients?.map((c: any) => ({
          id: c.id,
          name: c.profiles?.full_name || 'Sans nom',
          status: c.status,
          offer: c.offer,
          company: c.company,
          phone: c.phone,
          instagram: c.instagram,
          website: c.website,
          tags: c.tags,
          notes: c.internal_notes,
          start_date: c.start_date,
          end_date: c.end_date
        })) || []);
      }

      case 'get_client_details': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        const [clientRes, sessionsRes, tasksRes, deliverablesRes, observationsRes] = await Promise.all([
          supabase.from('clients').select('*, profiles:user_id(full_name)').eq('id', clientId).single(),
          supabase.from('sessions').select('*').eq('client_id', clientId).order('scheduled_at', { ascending: false }),
          supabase.from('tasks').select('*').eq('client_id', clientId).order('due_date'),
          supabase.from('deliverables').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
          supabase.from('client_observations').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(10)
        ]);
        
        return JSON.stringify({
          client: { ...clientRes.data, name: clientRes.data?.profiles?.full_name },
          sessions: sessionsRes.data,
          tasks: tasksRes.data,
          deliverables: deliverablesRes.data,
          recent_observations: observationsRes.data
        });
      }

      case 'search_clients': {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, status, offer, company, tags, profiles:user_id(full_name)')
          .order('created_at', { ascending: false });
        
        const query = args.query.toLowerCase();
        const filtered = clients?.filter((c: any) => 
          c.profiles?.full_name?.toLowerCase().includes(query) ||
          c.company?.toLowerCase().includes(query) ||
          c.tags?.some((t: string) => t.toLowerCase().includes(query))
        );
        
        return JSON.stringify(filtered?.map((c: any) => ({
          id: c.id,
          name: c.profiles?.full_name,
          status: c.status,
          offer: c.offer,
          company: c.company,
          tags: c.tags
        })) || []);
      }

      case 'update_client_notes': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        let newNotes = args.notes;
        if (args.append) {
          const { data: existing } = await supabase.from('clients').select('internal_notes').eq('id', clientId).single();
          newNotes = (existing?.internal_notes ? existing.internal_notes + '\n\n' : '') + `[${new Date().toLocaleDateString('fr-FR')}] ${args.notes}`;
        }
        
        const { error } = await supabase.from('clients').update({ internal_notes: newNotes }).eq('id', clientId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Notes mises à jour' });
      }

      case 'update_client_info': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        const updates: any = {};
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.instagram !== undefined) updates.instagram = args.instagram;
        if (args.website !== undefined) updates.website = args.website;
        if (args.company !== undefined) updates.company = args.company;
        if (args.tags !== undefined) updates.tags = args.tags;
        if (args.status !== undefined) updates.status = args.status;
        if (args.offer !== undefined) updates.offer = args.offer;
        
        const { error } = await supabase.from('clients').update(updates).eq('id', clientId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Client mis à jour', updates });
      }

      case 'create_session': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        const { data, error } = await supabase.from('sessions').insert({
          client_id: clientId,
          scheduled_at: args.scheduled_at,
          type: args.type,
          duration_minutes: args.duration_minutes || 60,
          notes: args.notes,
          meeting_link: args.meeting_link,
          status: 'scheduled'
        }).select().single();
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Session créée', session: data });
      }

      case 'update_session': {
        let sessionId = args.session_id;
        if (!sessionId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (client) {
            const { data: sessions } = await supabase
              .from('sessions')
              .select('id')
              .eq('client_id', client.id)
              .eq('status', 'scheduled')
              .order('scheduled_at')
              .limit(1);
            sessionId = sessions?.[0]?.id;
          }
        }
        
        if (!sessionId) return JSON.stringify({ error: 'Session non trouvée' });
        
        const updates: any = {};
        if (args.scheduled_at) updates.scheduled_at = args.scheduled_at;
        if (args.status) updates.status = args.status;
        if (args.notes) updates.notes = args.notes;
        if (args.admin_notes) updates.admin_notes = args.admin_notes;
        if (args.meeting_link) updates.meeting_link = args.meeting_link;
        
        const { error } = await supabase.from('sessions').update(updates).eq('id', sessionId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Session mise à jour' });
      }

      case 'delete_session': {
        let sessionId = args.session_id;
        if (!sessionId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (client) {
            const { data: sessions } = await supabase
              .from('sessions')
              .select('id')
              .eq('client_id', client.id)
              .eq('status', 'scheduled')
              .order('scheduled_at')
              .limit(1);
            sessionId = sessions?.[0]?.id;
          }
        }
        
        if (!sessionId) return JSON.stringify({ error: 'Session non trouvée' });
        
        const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Session supprimée' });
      }

      case 'get_upcoming_sessions': {
        const days = args.days || 7;
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        
        const { data } = await supabase
          .from('sessions')
          .select('*, clients!inner(id, profiles:user_id(full_name))')
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', future.toISOString())
          .order('scheduled_at');
        
        return JSON.stringify(data?.map((s: any) => ({
          id: s.id,
          client_name: s.clients?.profiles?.full_name,
          type: s.type,
          scheduled_at: s.scheduled_at,
          duration_minutes: s.duration_minutes,
          meeting_link: s.meeting_link,
          notes: s.notes
        })) || []);
      }

      case 'create_task': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        const { data, error } = await supabase.from('tasks').insert({
          client_id: clientId,
          title: args.title,
          description: args.description,
          due_date: args.due_date,
          status: args.status || 'todo'
        }).select().single();
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Tâche créée', task: data });
      }

      case 'update_task': {
        let taskId = args.task_id;
        if (!taskId && args.client_name && args.task_title) {
          const client = await findClientByName(supabase, args.client_name);
          if (client) {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('client_id', client.id)
              .ilike('title', `%${args.task_title}%`)
              .limit(1);
            taskId = tasks?.[0]?.id;
          }
        }
        
        if (!taskId) return JSON.stringify({ error: 'Tâche non trouvée' });
        
        const updates: any = {};
        if (args.title) updates.title = args.title;
        if (args.description) updates.description = args.description;
        if (args.due_date) updates.due_date = args.due_date;
        if (args.status) updates.status = args.status;
        
        const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Tâche mise à jour' });
      }

      case 'delete_task': {
        let taskId = args.task_id;
        if (!taskId && args.client_name && args.task_title) {
          const client = await findClientByName(supabase, args.client_name);
          if (client) {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('client_id', client.id)
              .ilike('title', `%${args.task_title}%`)
              .limit(1);
            taskId = tasks?.[0]?.id;
          }
        }
        
        if (!taskId) return JSON.stringify({ error: 'Tâche non trouvée' });
        
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Tâche supprimée' });
      }

      case 'get_dashboard_stats': {
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const today = now.toISOString().split('T')[0];
        
        const [clientsRes, sessionsRes, tasksRes, bookingsRes] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('sessions').select('*', { count: 'exact', head: true })
            .eq('status', 'scheduled')
            .gte('scheduled_at', now.toISOString())
            .lte('scheduled_at', weekFromNow.toISOString()),
          supabase.from('tasks').select('*', { count: 'exact', head: true })
            .lt('due_date', today)
            .neq('status', 'done'),
          supabase.from('bookings').select('amount_cents')
            .eq('payment_status', 'paid')
            .gte('paid_at', startOfMonth.toISOString())
        ]);
        
        const monthlyRevenue = bookingsRes.data?.reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0) || 0;
        
        return JSON.stringify({
          active_clients: clientsRes.count || 0,
          upcoming_sessions: sessionsRes.count || 0,
          overdue_tasks: tasksRes.count || 0,
          monthly_revenue_euros: monthlyRevenue / 100
        });
      }

      case 'create_deliverable': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        const { data, error } = await supabase.from('deliverables').insert({
          client_id: clientId,
          title: args.title,
          description: args.description,
          file_url: args.file_url,
          file_name: args.file_name,
          file_type: args.file_type,
          is_visible_to_client: args.is_visible_to_client !== false
        }).select().single();
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Livrable créé', deliverable: data });
      }

      // ========== NEW OBSERVATION TOOLS IMPLEMENTATION ==========
      
      case 'add_observation': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        if (!clientId) return JSON.stringify({ error: 'Client non spécifié' });
        
        const metadata = args.metadata || {};
        if (args.is_private) metadata.is_private = true;
        
        const { data, error } = await supabase.from('client_observations').insert({
          client_id: clientId,
          type: args.type,
          title: args.title || null,
          content: args.content,
          image_url: args.image_url || null,
          metadata
        }).select().single();
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ 
          success: true, 
          message: `Observation de type "${args.type}" ajoutée`, 
          observation: data 
        });
      }
      
      case 'get_client_observations': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        if (!clientId) return JSON.stringify({ error: 'Client non spécifié' });
        
        let query = supabase
          .from('client_observations')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(args.limit || 20);
        
        if (args.type) {
          query = query.eq('type', args.type);
        }
        
        const { data, error } = await query;
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      
      case 'search_observations': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (client) clientId = client.id;
        }
        
        let query = supabase
          .from('client_observations')
          .select('*, clients!inner(id, profiles:user_id(full_name))')
          .or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%`)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (clientId) {
          query = query.eq('client_id', clientId);
        }
        
        if (args.type) {
          query = query.eq('type', args.type);
        }
        
        const { data, error } = await query;
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data?.map((o: any) => ({
          ...o,
          client_name: o.clients?.profiles?.full_name
        })));
      }
      
      case 'update_observation': {
        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.content !== undefined) updates.content = args.content;
        if (args.type !== undefined) updates.type = args.type;
        if (args.metadata !== undefined) updates.metadata = args.metadata;
        if (args.is_private !== undefined) {
          updates.metadata = { ...updates.metadata, is_private: args.is_private };
        }
        
        const { error } = await supabase
          .from('client_observations')
          .update(updates)
          .eq('id', args.observation_id);
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Observation mise à jour' });
      }
      
      case 'delete_observation': {
        const { error } = await supabase
          .from('client_observations')
          .delete()
          .eq('id', args.observation_id);
        
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: 'Observation supprimée' });
      }
      
      case 'analyze_image': {
        // Use OpenAI GPT-4 Vision to analyze the image
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyse cette image${args.context ? ` (contexte: ${args.context})` : ''}. 
                    
Extrais toutes les informations pertinentes, notamment :
- Si c'est une capture de stats (TikTok, Instagram, etc.) : vues, likes, commentaires, partages, engagement, followers
- Si c'est une photo de progression : observations visuelles
- Si c'est un screenshot : informations clés visibles

Retourne un JSON structuré avec :
{
  "summary": "résumé en une phrase",
  "type": "stats|progression|screenshot|other",
  "data": { /* données extraites */ },
  "insights": ["insight 1", "insight 2"]
}`
                  },
                  {
                    type: 'image_url',
                    image_url: { url: args.image_url }
                  }
                ]
              }
            ],
            max_tokens: 1000
          }),
        });
        
        if (!visionResponse.ok) {
          const errorText = await visionResponse.text();
          console.error('Vision API error:', errorText);
          return JSON.stringify({ error: 'Erreur lors de l\'analyse de l\'image' });
        }
        
        const visionData = await visionResponse.json();
        const analysisText = visionData.choices[0]?.message?.content || '';
        
        // Try to parse as JSON
        let analysisJson: any = { raw_analysis: analysisText };
        try {
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisJson = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Keep raw analysis if JSON parsing fails
        }
        
        // Optionally save as observation
        if (args.save_as_observation) {
          let clientId = args.client_id;
          if (!clientId && args.client_name) {
            const client = await findClientByName(supabase, args.client_name);
            if (client) clientId = client.id;
          }
          
          if (clientId) {
            await supabase.from('client_observations').insert({
              client_id: clientId,
              type: 'image_analysis',
              title: analysisJson.summary || 'Analyse d\'image',
              content: analysisText,
              image_url: args.image_url,
              metadata: { 
                analysis_data: analysisJson.data,
                insights: analysisJson.insights,
                context: args.context
              }
            });
            analysisJson.saved_as_observation = true;
          }
        }
        
        return JSON.stringify(analysisJson);
      }
      
      case 'get_client_evolution': {
        let clientId = args.client_id;
        if (!clientId && args.client_name) {
          const client = await findClientByName(supabase, args.client_name);
          if (!client) return JSON.stringify({ error: `Client "${args.client_name}" non trouvé` });
          clientId = client.id;
        }
        
        if (!clientId) return JSON.stringify({ error: 'Client non spécifié' });
        
        const days = args.days || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        
        const [clientRes, observationsRes, sessionsRes, tasksRes] = await Promise.all([
          supabase.from('clients').select('*, profiles:user_id(full_name)').eq('id', clientId).single(),
          supabase.from('client_observations')
            .select('*')
            .eq('client_id', clientId)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false }),
          supabase.from('sessions')
            .select('*')
            .eq('client_id', clientId)
            .gte('scheduled_at', since.toISOString())
            .order('scheduled_at', { ascending: false }),
          supabase.from('tasks')
            .select('*')
            .eq('client_id', clientId)
            .order('updated_at', { ascending: false })
        ]);
        
        const completedTasks = tasksRes.data?.filter((t: any) => t.status === 'done') || [];
        const completedSessions = sessionsRes.data?.filter((s: any) => s.status === 'completed') || [];
        
        return JSON.stringify({
          client: { 
            name: clientRes.data?.profiles?.full_name,
            status: clientRes.data?.status,
            offer: clientRes.data?.offer
          },
          period_days: days,
          observations: observationsRes.data,
          observations_count: observationsRes.data?.length || 0,
          sessions_completed: completedSessions.length,
          tasks_completed: completedTasks.length,
          milestones: observationsRes.data?.filter((o: any) => o.type === 'milestone'),
          concerns: observationsRes.data?.filter((o: any) => o.type === 'concern'),
          measures: observationsRes.data?.filter((o: any) => o.type === 'measure')
        });
      }

      default:
        return JSON.stringify({ error: `Outil inconnu: ${toolName}` });
    }
  } catch (error) {
    console.error(`Error in tool ${toolName}:`, error);
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Accès réservé aux administrateurs' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages, image_url } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY non configurée');
    }

    // If an image URL is provided, add it to the last message
    let processedMessages = [...messages];
    if (image_url && processedMessages.length > 0) {
      const lastMessage = processedMessages[processedMessages.length - 1];
      processedMessages[processedMessages.length - 1] = {
        role: lastMessage.role,
        content: [
          { type: 'text', text: lastMessage.content },
          { type: 'image_url', image_url: { url: image_url } }
        ]
      };
    }

    // Initial OpenAI request with tools
    let openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...processedMessages
    ];

    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        tools,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    // Handle streaming with tool calls
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let currentToolCalls: any[] = [];
        let contentBuffer = '';
        let toolCallsInProgress = false;

        const reader = response.body!.getReader();
        
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line === 'data: [DONE]') continue;
              if (!line.startsWith('data: ')) continue;

              try {
                const json = JSON.parse(line.slice(6));
                const delta = json.choices[0]?.delta;
                const finishReason = json.choices[0]?.finish_reason;

                if (delta?.content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
                }

                if (delta?.tool_calls) {
                  toolCallsInProgress = true;
                  for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index;
                    if (!currentToolCalls[index]) {
                      currentToolCalls[index] = { id: '', type: 'function', function: { name: '', arguments: '' } };
                    }
                    if (toolCall.id) currentToolCalls[index].id = toolCall.id;
                    if (toolCall.function?.name) currentToolCalls[index].function.name = toolCall.function.name;
                    if (toolCall.function?.arguments) currentToolCalls[index].function.arguments += toolCall.function.arguments;
                  }
                }

                if (finishReason === 'tool_calls' && currentToolCalls.length > 0) {
                  // Execute tool calls
                  const toolResults = [];
                  for (const toolCall of currentToolCalls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      tool_call: { name: toolCall.function.name, args } 
                    })}\n\n`));
                    
                    const result = await executeTool(supabaseAdmin, toolCall.function.name, args);
                    toolResults.push({
                      tool_call_id: toolCall.id,
                      role: 'tool',
                      content: result
                    });
                  }

                  // Continue conversation with tool results
                  openaiMessages = [
                    ...openaiMessages,
                    { role: 'assistant', tool_calls: currentToolCalls },
                    ...toolResults
                  ];

                  // Make another request to get final response
                  const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${OPENAI_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'gpt-4o',
                      messages: openaiMessages,
                      tools,
                      tool_choice: 'auto',
                      stream: true,
                    }),
                  });

                  if (followUpResponse.ok) {
                    const followUpReader = followUpResponse.body!.getReader();
                    currentToolCalls = [];
                    
                    while (true) {
                      const { done: followDone, value: followValue } = await followUpReader.read();
                      if (followDone) break;

                      const followChunk = decoder.decode(followValue);
                      const followLines = followChunk.split('\n').filter(l => l.trim() !== '');

                      for (const followLine of followLines) {
                        if (followLine === 'data: [DONE]') continue;
                        if (!followLine.startsWith('data: ')) continue;

                        try {
                          const followJson = JSON.parse(followLine.slice(6));
                          const followDelta = followJson.choices[0]?.delta;
                          
                          if (followDelta?.content) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: followDelta.content })}\n\n`));
                          }
                        } catch (e) {
                          // Ignore parse errors
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        };

        await processStream();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in admin-assistant:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
