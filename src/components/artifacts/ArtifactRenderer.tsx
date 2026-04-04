'use client';

import type { ComponentType } from 'react';
import RiskRegister from './RiskRegister';
import ApprovalCard from './ApprovalCard';
import DataTable from './DataTable';
import DataChart from './DataChart';
import DecisionCapture from './DecisionCapture';
import KnowledgeCard from './KnowledgeCard';
import GenericArtifact from './GenericArtifact';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ARTIFACT_COMPONENTS: Record<string, ComponentType<{ data: any }>> = {
  risk_register: RiskRegister,
  approval_card: ApprovalCard,
  data_table: DataTable,
  data_chart: DataChart,
  decision_capture: DecisionCapture,
  knowledge_card: KnowledgeCard,
};

interface ArtifactRendererProps {
  type: string;
  data: Record<string, unknown>;
}

export default function ArtifactRenderer({ type, data }: ArtifactRendererProps) {
  const Component = ARTIFACT_COMPONENTS[type];

  if (Component) {
    return <Component data={data} />;
  }

  return <GenericArtifact type={type} data={data} />;
}
