import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ObservationType = 'note' | 'measure' | 'milestone' | 'concern' | 'image_analysis';

export interface Observation {
  id: string;
  client_id: string;
  type: ObservationType;
  title: string | null;
  content: string;
  image_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateObservationData {
  client_id: string;
  type: ObservationType;
  title?: string;
  content: string;
  image_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateObservationData {
  id: string;
  type?: ObservationType;
  title?: string;
  content?: string;
  image_url?: string;
  metadata?: Record<string, any>;
}

export const useClientObservations = (clientId: string | undefined, type?: ObservationType) => {
  return useQuery({
    queryKey: ['observations', clientId, type],
    queryFn: async () => {
      if (!clientId) return [];
      
      let query = supabase
        .from('client_observations')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Observation[];
    },
    enabled: !!clientId,
  });
};

export const useCreateObservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (observation: CreateObservationData) => {
      const { data, error } = await supabase
        .from('client_observations')
        .insert({
          client_id: observation.client_id,
          type: observation.type,
          title: observation.title || null,
          content: observation.content,
          image_url: observation.image_url || null,
          metadata: observation.metadata || {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['observations', data.client_id] });
    },
  });
};

export const useUpdateObservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (observation: UpdateObservationData) => {
      const updates: any = {};
      if (observation.type !== undefined) updates.type = observation.type;
      if (observation.title !== undefined) updates.title = observation.title;
      if (observation.content !== undefined) updates.content = observation.content;
      if (observation.image_url !== undefined) updates.image_url = observation.image_url;
      if (observation.metadata !== undefined) updates.metadata = observation.metadata;
      
      const { data, error } = await supabase
        .from('client_observations')
        .update(updates)
        .eq('id', observation.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['observations', data.client_id] });
    },
  });
};

export const useDeleteObservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_observations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['observations', data.clientId] });
    },
  });
};

export const useUploadObservationImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('observations')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data, error: signError } = await supabase.storage
        .from('observations')
        .createSignedUrl(filePath, 3600);
      
      if (signError || !data?.signedUrl) throw signError || new Error('Failed to create signed URL');
      return data.signedUrl;
    },
  });
};
