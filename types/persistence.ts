export interface Project {
  id: string;
  user_id: string;
  name: string;
  last_modified: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithFiles extends Project {
  files: ProjectFile[];
}

export interface SaveProjectInput {
  projectId?: string;
  projectName: string;
  files: {
    path: string;
    content: string;
  }[];
}

export interface LoadProjectResult {
  project: Project;
  files: {
    path: string;
    content: string;
  }[];
}
