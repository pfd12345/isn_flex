import type { ChatMessage } from '@/types';

const MOCK_RESPONSES: Record<string, string> = {
  risk_identification: `I've analyzed the available data and generated a prioritized risk register for this molecule.

\`\`\`artifact {"type": "risk_register", "data": {"title": "Risk Register — Molecule Assessment", "risks": [{"id": "R1", "category": "Polymorphism", "severity": "High", "likelihood": "Medium", "description": "Multiple polymorphic forms identified in preliminary screening. Form II shows higher thermodynamic stability but lower bioavailability.", "mitigation": "Conduct full polymorph screen including slurry experiments at multiple temperatures.", "source": "Initial crystallography data"}, {"id": "R2", "category": "Hygroscopicity", "severity": "Medium", "likelihood": "High", "description": "DVS data suggests significant moisture uptake above 60% RH, which could affect stability and processing.", "mitigation": "Evaluate salt/co-crystal forms with lower hygroscopicity profiles.", "source": "DVS screening results"}, {"id": "R3", "category": "Particle Size", "severity": "Medium", "likelihood": "Medium", "description": "Current milling process produces broad PSD that may affect content uniformity in low-dose formulations.", "mitigation": "Optimize milling parameters or evaluate micronization.", "source": "PSD analysis"}, {"id": "R4", "category": "Chemical Stability", "severity": "Low", "likelihood": "Low", "description": "Minor degradation product detected at 0.15% after 4 weeks accelerated stability. Within ICH limits but trending.", "mitigation": "Monitor in ongoing stability studies. Consider antioxidant if trend continues.", "source": "Stability study Week 4"}]}}
\`\`\`

The register contains 4 identified risks ranked by severity. **R1 (Polymorphism)** is the highest priority item requiring immediate attention. Would you like to review any specific risk in more detail, or shall we proceed to discuss mitigation strategies?`,

  solid_form_risk_review: `I've cross-referenced the risk register against our database of prior runs on similar molecules.

\`\`\`artifact {"type": "approval_card", "data": {"title": "Prior Run Recommendation: Polymorph Screening", "risk_id": "R1", "recommendation": "Apply the extended polymorph screening protocol used for Compound X (2023), which successfully identified 3 stable forms in a structurally similar scaffold.", "prior_run": "Compound X — Extended Polymorph Screen (Run #2023-0847)", "confidence": "High", "estimated_time": "4 weeks", "status": "pending"}}
\`\`\`

For **R1 (Polymorphism)**, we have a strong analogue. The protocol from Compound X's polymorph screen is highly relevant and can be adapted with minimal modifications.

For **R2 (Hygroscopicity)**, I recommend commissioning new in-silico modelling since we don't have a close prior analogue for this specific moisture uptake profile.

Would you like to approve the prior run recommendation for R1, or would you like more details first?`,

  in_silico_runs: `I've set up the in-silico modeling request for the hygroscopicity risk.

\`\`\`artifact {"type": "data_table", "data": {"title": "In-Silico Model Run Results", "columns": ["Model", "Parameter", "Predicted Value", "Confidence", "Status"], "rows": [["Crystal Packing Energy", "Lattice Energy (Form I)", "-142.3 kJ/mol", "High", "Complete"], ["Crystal Packing Energy", "Lattice Energy (Form II)", "-138.7 kJ/mol", "High", "Complete"], ["Moisture Sorption Model", "Critical RH Threshold", "58% RH", "Medium", "Complete"], ["Solubility Prediction", "Aqueous Solubility (pH 6.8)", "0.23 mg/mL", "Medium", "Complete"], ["Mechanical Properties", "Tabletability Index", "0.72", "Low", "Inconclusive"]]}}
\`\`\`

Key findings:
- **Crystal packing** confirms Form I has higher lattice energy, supporting its use as the development form
- **Moisture sorption** model predicts critical RH at 58%, consistent with experimental DVS data
- **Tabletability** results are inconclusive — the model confidence is low for this compound class

The inconclusive tabletability result means we'll need wet-lab verification. Shall I flag this for the gap analysis?`,

  gap_analysis: `Based on all outstanding risks and the inconclusive in-silico results, here's the gap analysis:

\`\`\`artifact {"type": "data_table", "data": {"title": "Gap Analysis Summary", "columns": ["Gap ID", "Description", "Source", "Wet Lab Required", "Priority"], "rows": [["G1", "Tabletability of Form I under manufacturing conditions", "In-silico (inconclusive)", "Yes", "High"], ["G2", "Long-term stability of Form I at 25°C/60% RH", "Risk R4 trending", "Yes", "Medium"], ["G3", "Salt form screening for reduced hygroscopicity", "Risk R2 mitigation", "Yes", "Medium"], ["G4", "Particle size optimization for content uniformity", "Risk R3", "Yes", "Low"]]}}
\`\`\`

Four gaps require wet-lab resolution. I recommend prioritizing **G1 (Tabletability)** as it directly affects manufacturability. Would you like me to help scope the experimental protocols for these gaps?`,

  study_definition: `Let me guide you through defining the experimental protocol. Based on the gap analysis, I'll start with the tabletability study.

\`\`\`artifact {"type": "data_table", "data": {"title": "Experiment Protocol: Tabletability Assessment", "columns": ["Parameter", "Value"], "rows": [["Study ID", "TAB-2024-001"], ["Objective", "Assess tabletability of Form I under representative manufacturing conditions"], ["API Form", "Form I (confirmed by XRPD)"], ["Compression Forces", "5, 10, 15, 20, 25 kN"], ["Tablet Tooling", "10mm round flat-faced"], ["Lubricant", "MgSt 0.5% w/w, 2 min blend"], ["Replicates", "n=6 per compression force"], ["Measurements", "Tensile strength, porosity, disintegration time"], ["Acceptance Criteria", "Tensile strength ≥ 1.5 MPa at ≤ 15 kN"], ["Duration", "2 days"]]}}
\`\`\`

Does this protocol look correct? Would you like to modify any parameters before we finalize?`,

  instrument_data_capture: `I'm ready to receive instrument data. You can upload CSV, JSON, image files (PNG/JPEG/TIFF), or PDF reports.

Once uploaded, I'll automatically parse and visualise the data. Supported instruments include:
- **XRPD** — diffraction patterns
- **DSC/TGA** — thermal analysis
- **DVS** — moisture sorption isotherms
- **Compression** — force-displacement curves
- **HPLC** — chromatographic data

Please upload your instrument data files to get started.`,

  experiment_context: `I'm ready to capture experimental context. You can:

1. **Type observations** directly — I'll timestamp and link them to the protocol
2. **Upload results** — images, data files, or reports
3. **Record deviations** — any departures from the protocol

All entries will be linked back to the active experiment protocol for full traceability. What would you like to record?`,

  insight_interpretation: `I'll compare the wet-lab outcomes against our in-silico predictions once data is available.

\`\`\`artifact {"type": "data_chart", "data": {"title": "In-Silico vs Wet-Lab Comparison", "chart_type": "bar", "x_label": "Parameter", "y_label": "Value", "categories": ["Lattice Energy (kJ/mol)", "Critical RH (%)", "Solubility (mg/mL)"], "series": [{"name": "In-Silico Prediction", "values": [142.3, 58, 0.23]}, {"name": "Wet-Lab Result", "values": [139.8, 62, 0.19]}]}}
\`\`\`

The comparison shows generally good agreement, with the largest discrepancy in critical RH (58% predicted vs 62% measured). This suggests the moisture sorption model may slightly underpredict the threshold. Would you like a deeper analysis of any specific parameter?`,

  decision_capture: `Let's formally capture the key decisions from this workstream.

\`\`\`artifact {"type": "decision_capture", "data": {"title": "Decision Record: Form Selection", "decision_id": "DEC-2024-001", "statement": "Form I is selected as the development candidate for progression to Phase II", "rationale": "Form I demonstrates adequate thermodynamic stability, acceptable hygroscopicity profile, and sufficient tabletability for manufacturing.", "evidence": ["Polymorph screen confirmed 3 forms; Form I most stable below 150°C", "DVS shows acceptable moisture uptake below 60% RH", "Tabletability meets acceptance criteria at 10 kN compression force", "4-week accelerated stability within ICH limits"], "risks_accepted": ["Minor degradation trending at 0.15% — monitor in ongoing stability"], "approvers": [], "status": "pending_approval"}}
\`\`\`

Please review the decision record above. You can approve it, request changes, or add additional evidence items.`,

  regulatory_authoring: `I'll compile all approved artifacts and the decision trail into a regulatory document outline.

\`\`\`artifact {"type": "data_table", "data": {"title": "Regulatory Document Outline", "columns": ["Section", "Content Source", "Status"], "rows": [["1. Introduction", "Project description + molecule overview", "Draft"], ["2. Solid Form Screening", "Risk register + polymorph screen results", "Ready"], ["3. Physicochemical Characterization", "XRPD, DSC, DVS, solubility data", "Ready"], ["4. Form Selection Rationale", "Decision record DEC-2024-001", "Pending Approval"], ["5. Manufacturing Feasibility", "Tabletability study results", "Ready"], ["6. Stability Summary", "Accelerated stability data", "In Progress"], ["7. Conclusions", "Gap analysis + risk summary", "Draft"]]}}
\`\`\`

Sections 2, 3, and 5 are ready for compilation. Section 4 is pending your approval of the decision record. Would you like me to generate a draft for any specific section?`,

  tacit_knowledge: `I'm continuously monitoring for tacit knowledge. You can share:

- **Meeting notes** or transcripts
- **Email threads** with key decisions
- **Observations** or "lessons learned"
- **Surprising findings** that changed your thinking

I'll extract structured knowledge cards from anything you share. What would you like to capture?

\`\`\`artifact {"type": "knowledge_card", "data": {"title": "Knowledge Card: Milling Sensitivity", "card_type": "lesson_learned", "content": "Form I is sensitive to high-energy milling — extended milling times (>30 min) can induce partial conversion to amorphous phase. Recommend gentle milling with monitoring.", "tags": ["milling", "form-stability", "processing"], "confidence": "High", "source": "Lab observation during particle size reduction"}}
\`\`\``,
};

const DEFAULT_MOCK = `Thank you for your message. I'm the ISN assistant and I'm here to help you progress through this workflow stage.

Could you provide more details about what you'd like to work on? I can help with:
- Analyzing uploaded data
- Generating structured artifacts
- Reviewing and summarizing findings
- Guiding you through the current stage's objectives

What would you like to focus on?`;

export async function mockStreamChat(
  systemPrompt: string,
  chatMessages: ChatMessage[],
  stageId?: string
): Promise<ReadableStream<Uint8Array>> {
  const responseText = (stageId && MOCK_RESPONSES[stageId]) || DEFAULT_MOCK;
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // Simulate streaming by sending chunks with small delays
      const words = responseText.split(' ');
      let chunk = '';

      for (let i = 0; i < words.length; i++) {
        chunk += (i === 0 ? '' : ' ') + words[i];

        // Send every few words to simulate streaming
        if (chunk.length > 20 || i === words.length - 1) {
          controller.enqueue(encoder.encode(chunk));
          chunk = '';
          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }

      controller.close();
    },
  });
}
