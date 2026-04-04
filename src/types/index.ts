// ─── YAML Config Types ───────────────────────────────────────

export interface ISNConfig {
  app: AppConfig;
  theme: ThemeConfig;
  stage_defaults: StageDefaults;
  stages: StageDefinition[];
  workflow_templates: WorkflowTemplateDefinition[];
  prompts: PromptsConfig;
  chat: ChatConfig;
  labels: Record<string, string>;
}

export interface AppConfig {
  name: string;
  short_name: string;
  description: string;
  logo_path: string;
}

export interface ThemeConfig {
  mode: string;
  font_family: string;
  border_radius: string;
  colors: Record<string, string>;
}

export interface StageDefaults {
  required: boolean;
  skippable: boolean;
  parallel: boolean;
}

export interface StageDefinition {
  id: string;
  name: string;
  short_name: string;
  icon: string;
  description: string;
  required?: boolean;
  skippable?: boolean;
  parallel?: boolean;
  system_prompt_context: string;
  artifact_types: string[];
  completion_criteria: string;
}

export interface WorkflowTemplateDefinition {
  id: string;
  name: string;
  description: string;
  default?: boolean;
  stages: WorkflowStageRef[];
}

export interface WorkflowStageRef {
  id: string;
  required?: boolean;
  skippable?: boolean;
  parallel?: boolean;
}

export interface PromptsConfig {
  system_base: string;
  welcome_message: string;
  stage_transition: string;
  stage_skip: string;
}

export interface ChatConfig {
  placeholder: string;
  file_upload_label: string;
  send_label: string;
  max_file_size_mb: number;
  allowed_file_types: string[];
}

// ─── Database Entity Types ───────────────────────────────────

export type StageStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'always_active';
export type TransitionType = 'advance' | 'skip' | 'reopen' | 'jump_back' | 'initial';

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Workstream {
  id: string;
  project_id: string;
  name: string;
  owner: string;
  workflow_template_id: string;
  active_stage_id: string;
  created_at: string;
}

export interface WorkstreamStage {
  id: string;
  workstream_id: string;
  stage_id: string;
  stage_name: string;
  position: number;
  status: StageStatus;
  required: boolean;
  skippable: boolean;
  parallel: boolean;
  skip_reason?: string;
  completed_at?: string;
  skipped_at?: string;
  reopened_at?: string;
}

export interface Message {
  id: string;
  workstream_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  stage_id?: string;
  created_at: string;
}

export interface Artifact {
  id: string;
  workstream_id: string;
  message_id: string;
  type: string;
  data: Record<string, unknown>;
  stage_id?: string;
  status: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  workstream_id: string;
  name: string;
  blob_url: string;
  mime_type: string;
  size_bytes: number;
  stage_id?: string;
  uploaded_at: string;
}

export interface StageTransition {
  id: string;
  workstream_id: string;
  from_stage_id?: string;
  to_stage_id: string;
  transition_type: TransitionType;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

export interface Decision {
  id: string;
  workstream_id: string;
  artifact_id: string;
  statement: string;
  rationale?: string;
  approved_by: string[];
  approved_at?: string;
  created_at: string;
}

export interface KnowledgeCard {
  id: string;
  workstream_id: string;
  card_type: string;
  content: string;
  source_message_id?: string;
  validated: boolean;
  validated_by?: string;
  created_at: string;
}

// ─── Chat Types ──────────────────────────────────────────────

export interface ParsedArtifact {
  type: string;
  data: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ─── Settings ────────────────────────────────────────────────

export interface AppSettings {
  mockMode: boolean;
  hasApiKey?: boolean;
}

// ─── Resolved stage (stage definition merged with workflow overrides) ──

export interface ResolvedStage extends StageDefinition {
  required: boolean;
  skippable: boolean;
  parallel: boolean;
  position: number;
}
