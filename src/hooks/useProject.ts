import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Project, DirectorInputs, ControlSliders } from '../types';

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [directorInputs, setDirectorInputs] = useState<DirectorInputs | null>(null);
  const [sliders, setSliders] = useState<ControlSliders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (projectError) throw projectError;
        setProject(projectData);

        if (projectData) {
          const { data: inputsData, error: inputsError } = await supabase
            .from('director_inputs')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

          if (!inputsError) setDirectorInputs(inputsData);

          const { data: slidersData, error: slidersError } = await supabase
            .from('control_sliders')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

          if (!slidersError) setSliders(slidersData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load project';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const updateProject = async (updates: Partial<Project>) => {
    if (!projectId) return { error: 'No project ID' };

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      setProject(data);
      return { data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      setError(message);
      return { error: message };
    }
  };

  const updateDirectorInputs = async (inputs: Partial<DirectorInputs>) => {
    if (!projectId) return { error: 'No project ID' };

    try {
      if (directorInputs?.id) {
        const { data, error } = await supabase
          .from('director_inputs')
          .update(inputs)
          .eq('id', directorInputs.id)
          .select()
          .single();

        if (error) throw error;
        setDirectorInputs(data);
        return { data };
      } else {
        const { data, error } = await supabase
          .from('director_inputs')
          .insert([{ project_id: projectId, ...inputs }])
          .select()
          .single();

        if (error) throw error;
        setDirectorInputs(data);
        return { data };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update director inputs';
      setError(message);
      return { error: message };
    }
  };

  const updateSliders = async (newSliders: Partial<ControlSliders>) => {
    if (!projectId) return { error: 'No project ID' };

    try {
      if (sliders?.id) {
        const { data, error } = await supabase
          .from('control_sliders')
          .update(newSliders)
          .eq('id', sliders.id)
          .select()
          .single();

        if (error) throw error;
        setSliders(data);
        return { data };
      } else {
        const { data, error } = await supabase
          .from('control_sliders')
          .insert([{ project_id: projectId, ...newSliders }])
          .select()
          .single();

        if (error) throw error;
        setSliders(data);
        return { data };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update sliders';
      setError(message);
      return { error: message };
    }
  };

  return {
    project,
    directorInputs,
    sliders,
    loading,
    error,
    updateProject,
    updateDirectorInputs,
    updateSliders,
  };
}
