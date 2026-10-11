import React, { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  isDossierModalOpenAtom,
  clientProjectNameAtom,
  housePlanAtom,
  styleThemeAtom,
  atmosphereMoodAtom,
  roomDimensionsAtom,
  roomAreaAtom,
  roomVolumeAtom,
  projectBudgetAtom
} from '../../store/atoms';
import { PLAN_SPECS, STYLES, ATMOSPHERE_MOODS } from '../../data/constants';
import { playChime } from '../../audio/audioSystem';

export default function DossierModal() {
  const [isOpen, setIsOpen] = useAtom(isDossierModalOpenAtom);
  const [projectName, setProjectName] = useAtom(clientProjectNameAtom);
  const housePlan = useAtomValue(housePlanAtom);
  const styleTheme = useAtomValue(styleThemeAtom);
  const atmosphereMood = useAtomValue(atmosphereMoodAtom);
  const roomDimensions = useAtomValue(roomDimensionsAtom);
  const roomArea = useAtomValue(roomAreaAtom);
  const roomVolume = useAtomValue(roomVolumeAtom);
  const budget = useAtomValue(projectBudgetAtom);

  const [snapshotImg, setSnapshotImg] = useState(null);
  const [docRefCode, setDocRefCode] = useState('WW-2026-VILLA-01');

  const planSpec = PLAN_SPECS[housePlan] || PLAN_SPECS.villa;
  const styleSpec = STYLES[styleTheme] || STYLES.scandi;
  const moodSpec = ATMOSPHERE_MOODS[atmosphereMood] || ATMOSPHERE_MOODS.day;

  // Generate reference code and capture render snapshot when opened
  useEffect(() => {
    if (!isOpen) return;

    setDocRefCode(`WW-2026-${housePlan.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);

    // Capture render snapshot from WebGL canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
        setSnapshotImg(dataUrl);
      } catch (err) {
        console.warn('Canvas snapshot capture error:', err);
      }
    }
  }, [isOpen, housePlan]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    playChime(350);
  };

  const handlePrint = () => {
    playChime(620);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadRender = () => {
    if (!snapshotImg) return;
    const a = document.createElement('a');
    a.href = snapshotImg;
    a.download = `${projectName.replace(/\s+/g, '_')}_Render.jpg`;
    a.click();
    playChime(740);
  };

  return (
    <div className="dossier-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="dossier-title">
      <div className="dossier-modal-sheet" id="dossier-printable-document">
        {/* Document Header */}
        <header className="dossier-header">
          <div className="dossier-brand-block">
            <div className="dossier-kicker">WOLFITWAY ARCHITECTURAL SPATIAL DESIGN</div>
            <h2 className="dossier-main-title" id="dossier-title">Executive Project Specification & Investment Dossier</h2>
            <div className="dossier-ref-strip">
              <span><strong>Doc Ref:</strong> {docRefCode}</span>
              <span className="dot-sep">&bull;</span>
              <span><strong>Issued:</strong> {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="dot-sep">&bull;</span>
              <span><strong>Status:</strong> Client Presentation Verified</span>
            </div>
          </div>
          <button className="dossier-close-btn no-print" onClick={handleClose} title="Close Dossier">
            &times;
          </button>
        </header>

        {/* Client Project Name Banner */}
        <div className="dossier-client-bar">
          <label htmlFor="client-project-input" className="dossier-client-label">PROJECT / CLIENT DESIGNATION:</label>
          <input
            id="client-project-input"
            className="dossier-client-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter Client or Estate Name..."
          />
        </div>

        {/* 3D High-Res Visual Render Plate */}
        <section className="dossier-render-plate">
          {snapshotImg ? (
            <div className="dossier-render-frame">
              <img src={snapshotImg} alt="Architectural 3D Render" className="dossier-render-img" />
              <div className="dossier-render-stamp">
                <span>PREVIEW 3D BIM REAL-TIME CAPTURE</span>
                <span className="stamp-sub">{styleSpec.name} &bull; {moodSpec.name}</span>
              </div>
            </div>
          ) : (
            <div className="dossier-render-placeholder">
              <span>Generating Render Snapshot...</span>
            </div>
          )}
        </section>

        {/* Spatial Architecture & BIM Specifications */}
        <section className="dossier-section">
          <h3 className="dossier-section-heading">Spatial & Structural Parameters</h3>
          <div className="dossier-metrics-grid">
            <div className="dossier-metric-card">
              <span className="metric-label">House Floorplan</span>
              <strong className="metric-value">{planSpec.name}</strong>
              <span className="metric-sub">{planSpec.subtitle}</span>
            </div>
            <div className="dossier-metric-card">
              <span className="metric-label">Gross Floor Area (GFA)</span>
              <strong className="metric-value">{roomArea} m&sup2;</strong>
              <span className="metric-sub">{roomDimensions.width}m width &times; {roomDimensions.depth}m depth</span>
            </div>
            <div className="dossier-metric-card">
              <span className="metric-label">Clear Ceiling Height</span>
              <strong className="metric-value">{roomDimensions.height} m</strong>
              <span className="metric-sub">Net Volume: {roomVolume} m&sup3;</span>
            </div>
            <div className="dossier-metric-card">
              <span className="metric-label">Atmospheric Calibration</span>
              <strong className="metric-value">{moodSpec.name}</strong>
              <span className="metric-sub">Dynamic ACES Filmic Tone Mapping</span>
            </div>
          </div>
        </section>

        {/* Material & Finish Schedule */}
        <section className="dossier-section">
          <h3 className="dossier-section-heading">Curated Materials & Finishes Schedule</h3>
          <table className="dossier-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Material Specification</th>
                <th>Aesthetic Finish / Treatment</th>
                <th>Thermal & Sustainability</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primary Flooring</strong></td>
                <td>Wide-plank Scandinavian Oak / Sandstone Composite</td>
                <td>Brushed Matte Polyurethane, Ultra-Low VOC</td>
                <td>Underfloor Radiant Compatible &bull; PEFC Certified</td>
              </tr>
              <tr>
                <td><strong>Architectural Walls</strong></td>
                <td>Limewash Venetian Plaster & Acoustical Batts</td>
                <td>Mineral Textured Warm Eggshell</td>
                <td>Breathable Hypoallergenic &bull; STC 54 Sound Rating</td>
              </tr>
              <tr>
                <td><strong>Perimeter Glazing</strong></td>
                <td>Thermally Broken Anodized Aluminum Mullions</td>
                <td>Double-Glazed Low-E Argon Filled Glass</td>
                <td>U-Value: 0.92 W/m&sup2;K &bull; 72% Solar Rejection</td>
              </tr>
              <tr>
                <td><strong>Custom Millwork</strong></td>
                <td>Rift-Cut Natural Oak & Fluted Ceramic Island</td>
                <td>Satin Lacquer & Honed Granite Countertop</td>
                <td>FSC-Certified Architectural Joinery</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Investment Summary */}
        <section className="dossier-section">
          <h3 className="dossier-section-heading">Investment Breakdown & Budget Summary</h3>
          <div className="dossier-budget-summary">
            <div className="budget-summary-table">
              <div className="summary-row">
                <span>Base Construction & Structural Envelope ({roomArea} m&sup2; @ ${budget.ratePerSqm}/m&sup2;)</span>
                <strong>${budget.baseConstruction.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Curated Architectural Finishes Package ({budget.styleName})</span>
                <strong>${budget.styleCost.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Custom Architectural Millwork & Spatial Joinery</span>
                <strong>${budget.joineryCost.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Bespoke Loose Furnishings & Specialized Fittings ({budget.customPropsCount} items)</span>
                <strong>${budget.customPropsCost.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>BIM Engineering, Clash Detection & Architectural Supervision (8%)</span>
                <strong>${budget.engineeringFee.toLocaleString()}</strong>
              </div>
              <div className="summary-row grand-total">
                <span>TOTAL ESTIMATED ARCHITECTURAL INVESTMENT</span>
                <span className="total-figure">${budget.total.toLocaleString()} USD</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer & Actions */}
        <footer className="dossier-footer">
          <div className="dossier-footer-note">
            Wolfitway Spatial Architecture Platform &bull; All structural calculations subject to local municipal building codes &bull; Confidential client dossier.
          </div>
          <div className="dossier-actions-bar no-print">
            <button className="dossier-btn primary" onClick={handlePrint}>
              <span>🖨️ Print / Save as PDF</span>
            </button>
            <button className="dossier-btn secondary" onClick={handleDownloadRender}>
              <span>📷 Download Render (PNG)</span>
            </button>
            <button className="dossier-btn outline" onClick={handleClose}>
              <span>Close Dossier</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
