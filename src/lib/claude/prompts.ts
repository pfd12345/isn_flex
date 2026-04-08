import { getBasePrompt, getStageConfig, getWorkflowTemplate, getWorkflowStages } from '@/lib/config';
import { getWorkstreamStages as getDbStages } from '@/lib/db';

export async function buildSystemPrompt(
  stageId: string,
  projectName: string,
  workstreamName: string,
  templateId: string,
  workstreamId: string
): Promise<string> {
  const stage = getStageConfig(stageId);
  const template = getWorkflowTemplate(templateId);
  if (!stage || !template) return getBasePrompt();

  const resolvedStages = getWorkflowStages(templateId);
  const sequentialStages = resolvedStages.filter((s) => !s.parallel);
  const currentPosition = sequentialStages.findIndex((s) => s.id === stageId) + 1;

  // Get skipped stages from DB
  const dbStages = await getDbStages(workstreamId);
  const skippedStages = dbStages
    .filter((s) => s.status === 'skipped')
    .map((s) => `${s.stage_name} (skipped: ${s.skip_reason || 'no reason given'})`)
    .join('; ');

  return getBasePrompt()
    .replace('{stage_name}', stage.name)
    .replace('{stage_id}', stage.id)
    .replace('{project_name}', projectName)
    .replace('{workstream_name}', workstreamName)
    .replace('{workflow_template_name}', template.name)
    .replace('{total_stages}', String(sequentialStages.length))
    .replace('{stage_position}', String(currentPosition || 1))
    .replace('{skipped_stages}', skippedStages || 'none')
    .replace('{stage_system_prompt_context}', stage.system_prompt_context || '');
}
