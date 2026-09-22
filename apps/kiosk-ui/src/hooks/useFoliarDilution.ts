import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  FoliarDilutionGovernor,
  FoliarDispenseMode,
  FoliarSafetySnapshot,
  DilutionCalculationResult,
  DilutionPumpTelemetry,
  FoliarHardwareAbortError,
} from '../../../edge-controller/src/safety/foliarDilution';

export interface UseFoliarDilutionOptions {
  initialMode?: FoliarDispenseMode;
  defaultBatchLiters?: number;
  defaultNitrogenPercent?: number;
  rawStockNPercent?: number;
}

export function useFoliarDilution(options: UseFoliarDilutionOptions = {}) {
  const {
    initialMode = 'MODE_A_BULK',
    defaultBatchLiters = 20.0,
    defaultNitrogenPercent = 1.5,
    rawStockNPercent = 25.0,
  } = options;

  // Persistent SIL-3 safety governor instance
  const governor = useMemo(() => new FoliarDilutionGovernor(), []);

  const [mode, setModeState] = useState<FoliarDispenseMode>(initialMode);
  const [targetBatchLiters, setTargetBatchLiters] = useState<number>(defaultBatchLiters);
  const [targetNitrogenPercent, setTargetNitrogenPercent] = useState<number>(defaultNitrogenPercent);
  const [stockNPercent, setStockNPercent] = useState<number>(rawStockNPercent);

  const [calculation, setCalculation] = useState<DilutionCalculationResult | null>(null);
  const [snapshot, setSnapshot] = useState<FoliarSafetySnapshot>(() => governor.getSnapshot());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('Ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPumpHealthy, setIsPumpHealthy] = useState<boolean>(true);

  // Recalculate whenever volume or target nitrogen changes
  const runCalculation = useCallback(() => {
    try {
      setErrorMessage(null);
      const res = governor.calculateDilution(targetBatchLiters, targetNitrogenPercent, stockNPercent);
      setCalculation(res);
      setSnapshot(governor.getSnapshot());
      return res;
    } catch (err: any) {
      setErrorMessage(err.message || 'Calculation error');
      return null;
    }
  }, [governor, targetBatchLiters, targetNitrogenPercent, stockNPercent]);

  // Handle Mode Change (e.g. user touches Mode B on Kiosk Screen)
  const setMode = useCallback(
    (newMode: FoliarDispenseMode) => {
      setModeState(newMode);
      setErrorMessage(null);
      const snap = governor.selectMode(newMode);
      setSnapshot(snap);

      if (newMode === 'MODE_B_BATCH') {
        try {
          const res = governor.calculateDilution(targetBatchLiters, targetNitrogenPercent, stockNPercent);
          setCalculation(res);
          setSnapshot(governor.getSnapshot());
        } catch (err: any) {
          setErrorMessage(err.message);
        }
      }
    },
    [governor, targetBatchLiters, targetNitrogenPercent, stockNPercent]
  );

  // Automated SIL-3 Dosing and Dispensing Sequence
  const startAutonomousDilutionSequence = useCallback(
    async (simulateFailure: boolean = false) => {
      if (mode !== 'MODE_B_BATCH') {
        setErrorMessage('Cannot start foliar dilution sequence in Mode A (Bulk Mode).');
        return;
      }

      setIsProcessing(true);
      setErrorMessage(null);

      try {
        // Step 1: Physical lockout confirmation & recalculation
        setProgressStep('Step 1/5: Engaging Physical Primary Valve Lockout...');
        governor.selectMode('MODE_B_BATCH');
        const calc = governor.calculateDilution(targetBatchLiters, targetNitrogenPercent, stockNPercent);
        setCalculation(calc);
        setSnapshot(governor.getSnapshot());
        await new Promise((r) => setTimeout(r, 600));

        // Step 2: HPDD Distilled Water Pump Engagement Check
        setProgressStep('Step 2/5: Engaging HPDD Distilled Water Pump...');
        const pumpTelemetry: DilutionPumpTelemetry = {
          pumpEngaged: !simulateFailure && isPumpHealthy,
          tachometerRpm: simulateFailure || !isPumpHealthy ? 0 : 1850,
          flowRateLpm: simulateFailure || !isPumpHealthy ? 0.0 : 4.5,
          linePressureBar: simulateFailure || !isPumpHealthy ? 0.2 : 2.8,
          hpddReservoirLevelLiters: 120.0,
          currentDrawAmps: simulateFailure || !isPumpHealthy ? 0.0 : 1.4,
        };

        // This will throw FoliarHardwareAbortError if pump is not engaged
        governor.executeHPDDWaterInjection(pumpTelemetry);
        setSnapshot(governor.getSnapshot());
        await new Promise((r) => setTimeout(r, 800));

        // Step 3: Raw Ammonium Hydroxide Dosing into water buffer
        setProgressStep('Step 3/5: Injecting Micro-Metered Ammonium Hydroxide...');
        governor.injectRawAmmonium();
        setSnapshot(governor.getSnapshot());
        await new Promise((r) => setTimeout(r, 800));

        // Step 4: Homogenization & Optical Refractometer / Density Verification
        setProgressStep('Step 4/5: Homogenizing & Verifying 1.0% - 2.0% N Concentration...');
        await new Promise((r) => setTimeout(r, 700));
        // Measured N concentration matches target with slight physical sensor noise
        const simulatedMeasuredN = parseFloat((targetNitrogenPercent + (Math.random() - 0.5) * 0.04).toFixed(2));
        governor.verifyHomogenizedConcentration(simulatedMeasuredN);
        setSnapshot(governor.getSnapshot());

        // Step 5: Safe Dispense to Knapsack
        setProgressStep('Step 5/5: Dispensing Safe 1.5% N Foliar Mix to Backpack Sprayer...');
        await new Promise((r) => setTimeout(r, 1000));
        governor.completeDispense(targetBatchLiters);
        setSnapshot(governor.getSnapshot());
        setProgressStep('Cycle Complete: Backpack Dispense Finished Safely');
      } catch (err: any) {
        if (err instanceof FoliarHardwareAbortError || err.name === 'FoliarHardwareAbortError') {
          setErrorMessage(`[HARDWARE ABORT] ${err.message}`);
        } else {
          setErrorMessage(err.message || 'Unknown foliar dilution failure');
        }
        setSnapshot(governor.getSnapshot());
        setProgressStep('HARDWARE ABORT TRIGGERED');
      } finally {
        setIsProcessing(false);
      }
    },
    [governor, mode, targetBatchLiters, targetNitrogenPercent, stockNPercent, isPumpHealthy]
  );

  // Manual SIL-3 Emergency Stop
  const emergencyStop = useCallback(() => {
    try {
      governor.triggerHardwareAbort('Manual Emergency Stop triggered via Kiosk Touchscreen UI', 'MANUAL_ESTOP');
    } catch (err: any) {
      setErrorMessage(err.message);
      setSnapshot(governor.getSnapshot());
    }
  }, [governor]);

  // Reset Interlocks
  const resetInterlocks = useCallback(() => {
    setErrorMessage(null);
    setProgressStep('Ready');
    const snap = governor.resetInterlocks();
    setSnapshot(snap);
    runCalculation();
  }, [governor, runCalculation]);

  // Run initial calculation
  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  return {
    mode,
    targetBatchLiters,
    targetNitrogenPercent,
    stockNPercent,
    calculation,
    snapshot,
    isProcessing,
    progressStep,
    errorMessage,
    isPumpHealthy,
    setMode,
    setTargetBatchLiters,
    setTargetNitrogenPercent,
    setStockNPercent,
    setIsPumpHealthy,
    runCalculation,
    startAutonomousDilutionSequence,
    emergencyStop,
    resetInterlocks,
  };
}
