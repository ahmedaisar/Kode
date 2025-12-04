'use server';

import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase-server';
import type { Project, LoadProjectResult, SaveProjectInput } from '@/types/persistence';

/**
 * Save or update a project with its files
 * If projectId is provided, updates existing project
 * Otherwise, creates a new project
 */
export async function saveProject(input: SaveProjectInput): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createSupabaseServerClient();

    // Start a transaction-like operation
    let projectId = input.projectId;

    if (projectId) {
      // Update existing project
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: input.projectName,
          last_modified: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating project:', updateError);
        return { success: false, error: 'Failed to update project' };
      }
    } else {
      // Create new project
      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: input.projectName,
        })
        .select()
        .single();

      if (insertError || !newProject) {
        console.error('Error creating project:', insertError);
        return { success: false, error: 'Failed to create project' };
      }

      projectId = newProject.id;
    }

    // Delete existing files for this project (to handle deletions)
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error deleting old files:', deleteError);
      // Continue anyway, might be first save
    }

    // Insert all files
    if (input.files.length > 0) {
      const filesToInsert = input.files.map(file => ({
        project_id: projectId,
        path: file.path,
        content: file.content,
      }));

      const { error: filesError } = await supabase
        .from('files')
        .insert(filesToInsert);

      if (filesError) {
        console.error('Error saving files:', filesError);
        return { success: false, error: 'Failed to save files' };
      }
    }

    return { success: true, projectId };
  } catch (error) {
    console.error('Error in saveProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Load a project with all its files
 */
export async function loadProject(projectId: string): Promise<{ success: boolean; data?: LoadProjectResult; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createSupabaseServerClient();

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error('Error loading project:', projectError);
      return { success: false, error: 'Project not found' };
    }

    // Fetch files
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('path, content')
      .eq('project_id', projectId)
      .order('path', { ascending: true });

    if (filesError) {
      console.error('Error loading files:', filesError);
      return { success: false, error: 'Failed to load files' };
    }

    return {
      success: true,
      data: {
        project,
        files: files || [],
      },
    };
  } catch (error) {
    console.error('Error in loadProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * List all projects for the current user
 */
export async function listProjects(): Promise<{ success: boolean; data?: Project[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createSupabaseServerClient();

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('last_modified', { ascending: false });

    if (error) {
      console.error('Error listing projects:', error);
      return { success: false, error: 'Failed to load projects' };
    }

    return { success: true, data: projects || [] };
  } catch (error) {
    console.error('Error in listProjects:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a project and all its files
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createSupabaseServerClient();

    // Delete project (files will be cascade deleted)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: 'Failed to delete project' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
