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

const FUNNEL_STEPS = [
  "Démarré",
  "Identité",
  "Niveau",
  "Objectif",
  "Blocage",
  "Budget",
  "Complété",
];

// Tools definitions for OpenAI function calling (READ-ONLY)
const tools = [
  {
    type: "function",
    function: {
      name: "get_diagnostic_leads",
      description: "Récupère les leads du funnel diagnostic (table diagnostic_leads). Peut filtrer par période et statut de complétion.",
      parameters: {
        type: "object",
        properties: {
          completed_only: { type: "boolean", description: "Si true, ne renvoie que les diagnostics terminés (par défaut: false)" },
          days: { type: "number", description: "Nombre de jours en arrière à inclure (par défaut: 30)" },
          limit: { type: "number", description: "Nombre max de résultats (par défaut: 50)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_express_analyses",
      description: "Récupère les Analyses Express TikTok (table express_analyses). Peut filtrer par statut et période.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtre par statut (pending, processing, completed, failed)" },
          days: { type: "number", description: "Nombre de jours en arrière (par défaut: 30)" },
          limit: { type: "number", description: "Nombre max de résultats (par défaut: 50)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_premium_applications",
      description: "Récupère les candidatures Wav Premium (table wav_premium_applications).",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Nombre de jours en arrière (par défaut: 30)" },
          limit: { type: "number", description: "Nombre max de résultats (par défaut: 50)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_marketing_stats",
      description: "Agrège les stats de trafic depuis page_views : visiteurs uniques, top pages, durée moyenne, sources, UTM (source/medium/campagne) sur une période.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Nombre de jours à analyser (par défaut: 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_monthly_revenue",
      description: "Récupère le chiffre d'affaires du mois en cours (somme des bookings payés en euros).",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_funnel_stats",
      description: "Calcule les étapes du funnel diagnostic : nombre de leads ayant atteint chaque étape, et taux de conversion.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Nombre de jours en arrière (par défaut: 30, 0 = tout l'historique)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_image",
      description: "Analyse une image avec GPT-4 Vision (capture de stats TikTok/Instagram, screenshot, etc.) et retourne une analyse détaillée.",
      parameters: {
        type: "object",
        properties: {
          image_url: { type: "string", description: "URL de l'image à analyser" },
          context: { type: "string", description: "Contexte pour guider l'analyse" }
        },
        required: ["image_url"]
      }
    }
  }
];

const systemPrompt = `Tu es l'assistant analytique de Fred Wav, expert en stratégie TikTok et coaching business.

Tu as accès en LECTURE SEULE aux données suivantes :
- Leads du funnel diagnostic (diagnostic_leads)
- Analyses Express TikTok (express_analyses)
- Candidatures Wav Premium (wav_premium_applications)
- Stats marketing & trafic (page_views, sources UTM, top pages)
- Chiffre d'affaires (bookings payés)
- Étapes du funnel diagnostic

Tu peux aussi analyser des images (captures d'écran TikTok, stats, screenshots) via analyze_image.

INSTRUCTIONS IMPORTANTES :
- Réponds de manière concise et professionnelle en français
- Présente les chiffres clés en gras quand c'est utile
- Quand on te demande "cette semaine" ou "ce mois", utilise les filtres temporels adaptés
- Pour les comparaisons, agrège plusieurs sources si pertinent (ex: total leads = candidatures + diagnostics complétés + analyses express)
- Si tu n'as pas l'info, dis-le clairement plutôt que d'inventer

Date actuelle : ${new Date().toISOString().split('T')[0]}`;

async function executeTool(supabase: any, toolName: string, args: any): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case 'get_diagnostic_leads': {
        const days = args.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        let query = supabase
          .from('diagnostic_leads')
          .select('*')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(args.limit || 50);

        if (args.completed_only) {
          query = query.eq('completed', true);
        }

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data?.length || 0, leads: data });
      }

      case 'get_express_analyses': {
        const days = args.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        let query = supabase
          .from('express_analyses')
          .select('*')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(args.limit || 50);

        if (args.status) {
          query = query.eq('status', args.status);
        }

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data?.length || 0, analyses: data });
      }

      case 'get_premium_applications': {
        const days = args.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
          .from('wav_premium_applications')
          .select('*')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(args.limit || 50);

        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data?.length || 0, applications: data });
      }

      case 'get_marketing_stats': {
        const days = args.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data: pageViews, error } = await supabase
          .from('page_views')
          .select('*')
          .gte('entered_at', since.toISOString())
          .limit(5000);

        if (error) return JSON.stringify({ error: error.message });

        const visitors = new Set<string>();
        const pathStats: Record<string, { views: number; totalDuration: number }> = {};
        const sourceStats: Record<string, number> = {};
        const utmSource: Record<string, number> = {};
        const utmMedium: Record<string, number> = {};
        const utmCampaign: Record<string, number> = {};
        let totalDuration = 0;
        let durationCount = 0;

        (pageViews || []).forEach((pv: any) => {
          if (pv.visitor_id) visitors.add(pv.visitor_id);

          const path = pv.path || '/';
          if (!pathStats[path]) pathStats[path] = { views: 0, totalDuration: 0 };
          pathStats[path].views++;
          pathStats[path].totalDuration += pv.duration_seconds || 0;

          if (pv.duration_seconds > 0) {
            totalDuration += pv.duration_seconds;
            durationCount++;
          }

          let src = pv.utm_source || '';
          if (!src && pv.referrer) {
            try {
              src = new URL(pv.referrer).hostname;
            } catch {
              src = pv.referrer;
            }
          }
          if (!src) src = 'Direct';
          sourceStats[src] = (sourceStats[src] || 0) + 1;

          if (pv.utm_source) utmSource[pv.utm_source] = (utmSource[pv.utm_source] || 0) + 1;
          if (pv.utm_medium) utmMedium[pv.utm_medium] = (utmMedium[pv.utm_medium] || 0) + 1;
          if (pv.utm_campaign) utmCampaign[pv.utm_campaign] = (utmCampaign[pv.utm_campaign] || 0) + 1;
        });

        const topPages = Object.entries(pathStats)
          .map(([path, s]) => ({
            path,
            views: s.views,
            avg_duration_seconds: s.views > 0 ? Math.round(s.totalDuration / s.views) : 0
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);

        const topSources = Object.entries(sourceStats)
          .map(([name, value]) => ({ name, visits: value }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 10);

        return JSON.stringify({
          period_days: days,
          page_views: pageViews?.length || 0,
          unique_visitors: visitors.size,
          avg_duration_seconds: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
          top_pages: topPages,
          top_sources: topSources,
          utm_sources: Object.entries(utmSource).map(([name, value]) => ({ name, views: value })).sort((a, b) => b.views - a.views),
          utm_mediums: Object.entries(utmMedium).map(([name, value]) => ({ name, views: value })).sort((a, b) => b.views - a.views),
          utm_campaigns: Object.entries(utmCampaign).map(([name, value]) => ({ name, views: value })).sort((a, b) => b.views - a.views)
        });
      }

      case 'get_monthly_revenue': {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('bookings')
          .select('amount_cents')
          .eq('payment_status', 'paid')
          .gte('paid_at', monthStart.toISOString());

        if (error) return JSON.stringify({ error: error.message });

        const totalCents = (data || []).reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0);
        return JSON.stringify({
          month_start: monthStart.toISOString().slice(0, 10),
          paid_bookings_count: data?.length || 0,
          revenue_euros: totalCents / 100
        });
      }

      case 'get_funnel_stats': {
        const days = args.days ?? 30;
        let query = supabase
          .from('diagnostic_leads')
          .select('current_step, completed')
          .limit(5000);

        if (days > 0) {
          const since = new Date();
          since.setDate(since.getDate() - days);
          query = query.gte('created_at', since.toISOString());
        }

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });

        const total = data?.length || 0;
        const steps = FUNNEL_STEPS.map((label, stepIndex) => {
          const count = (data || []).filter((d: any) => {
            if (stepIndex === 6) return d.completed;
            return (d.current_step ?? 0) >= stepIndex;
          }).length;
          return {
            step: label,
            count,
            rate_percent: total > 0 ? Math.round((count / total) * 100) : 0
          };
        });

        return JSON.stringify({ period_days: days, total_leads: total, steps });
      }

      case 'analyze_image': {
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

Extrais toutes les informations pertinentes :
- Si c'est une capture de stats (TikTok, Instagram, etc.) : vues, likes, commentaires, partages, engagement, followers
- Si c'est un screenshot : informations clés visibles
- Sinon : description structurée

Retourne un JSON :
{
  "summary": "résumé en une phrase",
  "type": "stats|screenshot|other",
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
          return JSON.stringify({ error: "Erreur lors de l'analyse de l'image" });
        }

        const visionData = await visionResponse.json();
        const analysisText = visionData.choices[0]?.message?.content || '';

        let analysisJson: any = { raw_analysis: analysisText };
        try {
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisJson = JSON.parse(jsonMatch[0]);
          }
        } catch {
          // fallback raw
        }

        return JSON.stringify(analysisJson);
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let currentToolCalls: any[] = [];

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

                  openaiMessages = [
                    ...openaiMessages,
                    { role: 'assistant', tool_calls: currentToolCalls },
                    ...toolResults
                  ];

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
                        } catch {
                          // ignore parse errors
                        }
                      }
                    }
                  }
                }
              } catch {
                // ignore parse errors for incomplete JSON
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
