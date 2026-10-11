import React, { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  activeDrawerAtom,
  isBudgetDrawerOpenAtom,
  projectBudgetAtom,
  roomDimensionsAtom,
  housePlanAtom,
  styleThemeAtom,
  isDossierModalOpenAtom,
  clientProjectNameAtom
} from '../../store/atoms';
import { PLAN_SPECS, STYLES } from '../../data/constants';
import { playChime } from '../../audio/audioSystem';

export default function BudgetDrawer() {
  const [activeDrawer, setActiveDrawer] = useAtom(activeDrawerAtom);
  const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useAtom(isBudgetDrawerOpenAtom);
  const budget = useAtomValue(projectBudgetAtom);
  const roomDimensions = useAtomValue(roomDimensionsAtom);
  const housePlan = useAtomValue(housePlanAtom);
  const styleTheme = useAtomValue(styleThemeAtom);
  const setIsDossierModalOpen = useSetAtom(isDossierModalOpenAtom);
  const clientProjectName = useAtomValue(clientProjectNameAtom);

  const [currency, setCurrency] = useState('USD');
  const [specTier, setSpecTier] = useState('signature'); // 'signature' | 'bespoke'

  const isOpen = activeDrawer === 'budget' || isBudgetDrawerOpen;

  const handleClose = () => {
    setActiveDrawer(null);
    setIsBudgetDrawerOpen(false);
    playChime(360);
  };

  const handleOpenDossier = () => {
    handleClose();
    setIsDossierModalOpen(true);
    playChime(680);
  };

  // Currency multiplier
  const currencyRates = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 }
  };
  const currentRate = currencyRates[currency] || currencyRates.USD;

  // Spec tier multiplier
  const tierMultiplier = specTier === 'bespoke' ? 1.25 : 1.0;

  const formatCost = (val) => {
    const adjusted = Math.round(val * currentRate.rate * tierMultiplier);
    return `${currentRate.symbol}${adjusted.toLocaleString()}`;
  };

  const totalCalculated = budget.total * tierMultiplier;
  const monthlyEst = Math.round((totalCalculated * 0.8 * (0.058 / 12)) / (1 - Math.pow(1 + 0.058 / 12, -360)));

  const handleExportCsv = () => {
    const planName = PLAN_SPECS[housePlan]?.name || 'Villa Suite';
    const styleName = STYLES[styleTheme]?.name || 'Scandinavian';
    const csvContent = [
      `"Project","${clientProjectName}"`,
      `"Date","${new Date().toLocaleDateString()}"`,
      `"Architecture Plan","${planName}"`,
      `"Aesthetic Style","${styleName}"`,
      `"Floor Area (sqm)","${budget.area}"`,
      `"Currency","${currency}"`,
      `"Tier","${specTier.toUpperCase()}"`,
      `""`,
      `"Line Item","Category","Estimated Cost"`,
      `"Structural Foundation & Shell Construction","Base Construction","${formatCost(budget.baseConstruction)}"`,
      `"Interior Finishes & Architectural Cladding","${budget.styleName}","${formatCost(budget.styleCost)}"`,
      `"Bespoke Millwork & Integrated Joinery","Custom Joinery","${formatCost(budget.joineryCost)}"`,
      `"Catalog Furnishings & Specialized Fixtures","Loose Furniture (${budget.customPropsCount} items)","${formatCost(budget.customPropsCost)}"`,
      `"BIM Management & Engineering Oversight","Professional Services (8%)","${formatCost(budget.engineeringFee)}"`,
      `"TOTAL ESTIMATED INVESTMENT","Grand Total","${formatCost(budget.total)}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Wolfitway_Budget_Breakdown_${housePlan}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    playChime(750);
  };

  return (
    <div className={`panel-drawer right-drawer budget-drawer ${isOpen ? 'open' : ''}`} id="budget-drawer">
      <div className="drawer-header">
        <div>
          <h3>Investment & Cost Feasibility</h3>
          <span className="drawer-subtitle">Dynamic Real-Time BIM Architectural Calculator</span>
        </div>
        <button className="close-btn" id="close-budget-btn" onClick={handleClose}>
          &times;
        </button>
      </div>

      <div className="drawer-body">
        <p className="catalog-hint">
          Live cost estimate dynamically reacts to parametric room scaling ({roomDimensions.width}m &times; {roomDimensions.depth}m), aesthetic palette selection, and custom spatial fixtures.
        </p>

        {/* Currency & Tier Selector */}
        <div className="budget-controls-bar">
          <div className="budget-currency-group">
            {['USD', 'EUR', 'GBP'].map((c) => (
              <button
                key={c}
                className={`budget-currency-pill ${currency === c ? 'active' : ''}`}
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="budget-tier-group">
            <button
              className={`budget-tier-btn ${specTier === 'signature' ? 'active' : ''}`}
              onClick={() => setSpecTier('signature')}
              title="Architectural Master Grade Specification"
            >
              Signature
            </button>
            <button
              className={`budget-tier-btn ${specTier === 'bespoke' ? 'active' : ''}`}
              onClick={() => setSpecTier('bespoke')}
              title="Ultra-Luxury Bespoke Custom Finish (+25%)"
            >
              Bespoke (+25%)
            </button>
          </div>
        </div>

        {/* Big Total Hero Display */}
        <div className="budget-hero-card">
          <div className="budget-hero-kicker">TOTAL ESTIMATED INVESTMENT</div>
          <div className="budget-hero-amount" id="budget-grand-total">
            {formatCost(budget.total)}
          </div>
          <div className="budget-hero-meta">
            <span>{budget.area} m&sup2; GFA</span>
            <span className="dot-sep">&bull;</span>
            <span>Est. ~{formatCost(monthlyEst)} / mo financing</span>
          </div>
        </div>

        {/* Itemized Line Breakdown */}
        <div className="budget-items-list">
          <h4 className="budget-list-title">Itemized Project Breakdown</h4>

          <div className="budget-item-row">
            <div className="budget-item-info">
              <strong>Base Shell & Structural Glazing</strong>
              <span>{budget.area} m&sup2; @ ${budget.ratePerSqm}/m&sup2;</span>
            </div>
            <div className="budget-item-val">{formatCost(budget.baseConstruction)}</div>
          </div>

          <div className="budget-item-row highlight">
            <div className="budget-item-info">
              <strong>{budget.styleName}</strong>
              <span>Curated architectural material palette</span>
            </div>
            <div className="budget-item-val">{formatCost(budget.styleCost)}</div>
          </div>

          <div className="budget-item-row">
            <div className="budget-item-info">
              <strong>Integrated Millwork & Joinery</strong>
              <span>Architectural cabinetry, sliding screens & kitchen island</span>
            </div>
            <div className="budget-item-val">{formatCost(budget.joineryCost)}</div>
          </div>

          <div className="budget-item-row">
            <div className="budget-item-info">
              <strong>Specialized Loose Furnishings</strong>
              <span>{budget.customPropsCount} catalog fixtures deployed</span>
            </div>
            <div className="budget-item-val">{formatCost(budget.customPropsCost)}</div>
          </div>

          <div className="budget-item-row">
            <div className="budget-item-info">
              <strong>BIM Supervision & Engineering (8%)</strong>
              <span>Structural signoff & parametric clash inspection</span>
            </div>
            <div className="budget-item-val">{formatCost(budget.engineeringFee)}</div>
          </div>
        </div>

        {/* Conversion Action Buttons */}
        <div className="budget-actions-cluster">
          <button
            className="budget-primary-cta"
            id="budget-generate-dossier-btn"
            onClick={handleOpenDossier}
          >
            <span>📄 Generate Client Proposal Dossier</span>
          </button>

          <button
            className="budget-secondary-cta"
            id="budget-export-csv-btn"
            onClick={handleExportCsv}
          >
            <span>📊 Export Cost Breakdown (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
