import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type {
  ISNConfig,
  StageDefinition,
  WorkflowTemplateDefinition,
  ResolvedStage,
} from '@/types';

let cachedConfig: ISNConfig | null = null;

function loadConfig(): ISNConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = path.join(process.cwd(), 'config', 'isn.yaml');
  const fileContents = fs.readFileSync(configPath, 'utf8');
  cachedConfig = yaml.load(fileContents) as ISNConfig;
  return cachedConfig;
}

export function getConfig(): ISNConfig {
  return loadConfig();
}

export function getAllStages(): StageDefinition[] {
  return getConfig().stages;
}

export function getStageConfig(stageId: string): StageDefinition | undefined {
  return getConfig().stages.find((s) => s.id === stageId);
}

export function getWorkflowTemplates(): WorkflowTemplateDefinition[] {
  return getConfig().workflow_templates;
}

export function getWorkflowTemplate(
  templateId: string
): WorkflowTemplateDefinition | undefined {
  return getConfig().workflow_templates.find((t) => t.id === templateId);
}

export function getDefaultWorkflowTemplate(): WorkflowTemplateDefinition {
  const templates = getWorkflowTemplates();
  return templates.find((t) => t.default) || templates[0];
}

/**
 * Resolves stages for a workflow template — merges stage definitions
 * from the global stages list with per-template overrides (required, skippable, parallel).
 * Returns stages in the order defined by the template.
 */
export function getWorkflowStages(templateId: string): ResolvedStage[] {
  const config = getConfig();
  const template = config.workflow_templates.find((t) => t.id === templateId);
  if (!template) return [];

  const defaults = config.stage_defaults;

  return template.stages
    .map((ref, index) => {
      const stageDef = config.stages.find((s) => s.id === ref.id);
      if (!stageDef) return null;

      return {
        ...stageDef,
        required: ref.required ?? stageDef.required ?? defaults.required,
        skippable: ref.skippable ?? stageDef.skippable ?? defaults.skippable,
        parallel: ref.parallel ?? stageDef.parallel ?? defaults.parallel,
        position: index,
      } as ResolvedStage;
    })
    .filter((s): s is ResolvedStage => s !== null);
}

export function getBasePrompt(): string {
  return getConfig().prompts.system_base;
}

export function getPrompts() {
  return getConfig().prompts;
}

export function getTheme() {
  return getConfig().theme;
}

export function getLabels() {
  return getConfig().labels;
}

export function getChatConfig() {
  return getConfig().chat;
}
