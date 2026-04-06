// Sample pharmaceutical/scientific RDF ontology for ISN
export const SAMPLE_ONTOLOGY_RDF = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:owl="http://www.w3.org/2002/07/owl#"
  xmlns:isn="http://isn-ontology.org/pharma#"
>

  <!-- Ontology declaration -->
  <owl:Ontology rdf:about="http://isn-ontology.org/pharma">
    <rdfs:label>ISN Pharmaceutical Development Ontology</rdfs:label>
    <rdfs:comment>Ontology for solid-form pharmaceutical development workflows</rdfs:comment>
  </owl:Ontology>

  <!-- ════════════════════════════════════════════ -->
  <!-- Top-level classes                           -->
  <!-- ════════════════════════════════════════════ -->

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Compound">
    <rdfs:label>Compound</rdfs:label>
    <rdfs:comment>A chemical compound under investigation</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#SolidForm">
    <rdfs:label>Solid Form</rdfs:label>
    <rdfs:comment>A specific solid-state form of a compound (polymorph, salt, co-crystal, amorphous)</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#Compound"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Polymorph">
    <rdfs:label>Polymorph</rdfs:label>
    <rdfs:comment>A crystalline polymorph</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Salt">
    <rdfs:label>Salt</rdfs:label>
    <rdfs:comment>A salt form of the compound</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#CoCrystal">
    <rdfs:label>Co-Crystal</rdfs:label>
    <rdfs:comment>A co-crystal form</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#AmorphousForm">
    <rdfs:label>Amorphous Form</rdfs:label>
    <rdfs:comment>An amorphous solid dispersion</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:Class>

  <!-- ════════════════════════════════════════════ -->
  <!-- Experiment & Analysis classes               -->
  <!-- ════════════════════════════════════════════ -->

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Experiment">
    <rdfs:label>Experiment</rdfs:label>
    <rdfs:comment>A laboratory experiment or study</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#CrystallizationScreen">
    <rdfs:label>Crystallization Screen</rdfs:label>
    <rdfs:comment>Screening for new solid forms via crystallization</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#Experiment"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#StabilityStudy">
    <rdfs:label>Stability Study</rdfs:label>
    <rdfs:comment>Long-term or accelerated stability testing</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#Experiment"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#SolubilityStudy">
    <rdfs:label>Solubility Study</rdfs:label>
    <rdfs:comment>Aqueous or pH-dependent solubility measurement</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#Experiment"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#AnalyticalMethod">
    <rdfs:label>Analytical Method</rdfs:label>
    <rdfs:comment>An analytical characterization technique</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#XRPD">
    <rdfs:label>XRPD</rdfs:label>
    <rdfs:comment>X-ray Powder Diffraction</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#DSC">
    <rdfs:label>DSC</rdfs:label>
    <rdfs:comment>Differential Scanning Calorimetry</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#TGA">
    <rdfs:label>TGA</rdfs:label>
    <rdfs:comment>Thermogravimetric Analysis</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#NMR">
    <rdfs:label>NMR</rdfs:label>
    <rdfs:comment>Nuclear Magnetic Resonance Spectroscopy</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#HPLC">
    <rdfs:label>HPLC</rdfs:label>
    <rdfs:comment>High-Performance Liquid Chromatography</rdfs:comment>
    <rdfs:subClassOf rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:Class>

  <!-- ════════════════════════════════════════════ -->
  <!-- Risk & Decision classes                     -->
  <!-- ════════════════════════════════════════════ -->

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Risk">
    <rdfs:label>Risk</rdfs:label>
    <rdfs:comment>An identified risk in the development process</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Mitigation">
    <rdfs:label>Mitigation</rdfs:label>
    <rdfs:comment>A strategy to mitigate a risk</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Decision">
    <rdfs:label>Decision</rdfs:label>
    <rdfs:comment>A key decision point in the development workflow</rdfs:comment>
  </owl:Class>

  <!-- ════════════════════════════════════════════ -->
  <!-- Formulation & Manufacturing classes         -->
  <!-- ════════════════════════════════════════════ -->

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Formulation">
    <rdfs:label>Formulation</rdfs:label>
    <rdfs:comment>A drug product formulation</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Excipient">
    <rdfs:label>Excipient</rdfs:label>
    <rdfs:comment>An inactive ingredient in a formulation</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#ManufacturingProcess">
    <rdfs:label>Manufacturing Process</rdfs:label>
    <rdfs:comment>A process step in drug product manufacturing</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#Specification">
    <rdfs:label>Specification</rdfs:label>
    <rdfs:comment>Quality specification or acceptance criteria</rdfs:comment>
  </owl:Class>

  <owl:Class rdf:about="http://isn-ontology.org/pharma#RegulatorySubmission">
    <rdfs:label>Regulatory Submission</rdfs:label>
    <rdfs:comment>A filing or submission to a regulatory agency</rdfs:comment>
  </owl:Class>

  <!-- ════════════════════════════════════════════ -->
  <!-- Object Properties (edges)                   -->
  <!-- ════════════════════════════════════════════ -->

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#hasForm">
    <rdfs:label>has form</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Compound"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#characterizedBy">
    <rdfs:label>characterized by</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#testedIn">
    <rdfs:label>tested in</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Experiment"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#usesMethod">
    <rdfs:label>uses method</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Experiment"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#AnalyticalMethod"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#identifiesRisk">
    <rdfs:label>identifies risk</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Experiment"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Risk"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#mitigatedBy">
    <rdfs:label>mitigated by</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Risk"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Mitigation"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#informsDecision">
    <rdfs:label>informs decision</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Risk"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Decision"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#usedIn">
    <rdfs:label>used in</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Formulation"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#containsExcipient">
    <rdfs:label>contains excipient</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Formulation"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Excipient"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#manufacturedVia">
    <rdfs:label>manufactured via</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Formulation"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#ManufacturingProcess"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#meetsSpecification">
    <rdfs:label>meets specification</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Formulation"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#Specification"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#submittedTo">
    <rdfs:label>submitted to</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Formulation"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#RegulatorySubmission"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://isn-ontology.org/pharma#discoveredIn">
    <rdfs:label>discovered in</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
    <rdfs:range rdf:resource="http://isn-ontology.org/pharma#CrystallizationScreen"/>
  </owl:ObjectProperty>

  <!-- ════════════════════════════════════════════ -->
  <!-- Datatype Properties                         -->
  <!-- ════════════════════════════════════════════ -->

  <owl:DatatypeProperty rdf:about="http://isn-ontology.org/pharma#meltingPoint">
    <rdfs:label>melting point (C)</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://isn-ontology.org/pharma#solubility">
    <rdfs:label>solubility (mg/mL)</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#SolidForm"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://isn-ontology.org/pharma#severity">
    <rdfs:label>severity</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Risk"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://isn-ontology.org/pharma#likelihood">
    <rdfs:label>likelihood</rdfs:label>
    <rdfs:domain rdf:resource="http://isn-ontology.org/pharma#Risk"/>
  </owl:DatatypeProperty>

</rdf:RDF>`;
