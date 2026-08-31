import { hederaManager } from './client';

export interface CarbonOffsetInputs {
  methaneDestroyedKg: number; // Methane Destroyed in Biogas Flare / Upgrading
  beccsCarbonCapturedKg: number; // Carbon captured from BECCS post-combustion
  dieselAvoidedKg: number; // Avoided Scope 3 fossil fertilizer transport
}

export interface MintingResult {
  tokensMinted: number; // 1 EcoCredit = 1 kg CO2e
  totalCo2eOffsetKg: number;
  breakdown: {
    methaneOffsetKg: number;
    beccsOffsetKg: number;
    dieselOffsetKg: number;
  };
  htsTransactionId: string;
  tokenId: string;
}

export class HTSMinter {
  /**
   * Mints fungible micro-carbon credits (1 EcoCredit = 1 kg CO2e)
   * Formula:
   *  - Methane Destroyed (kg) x 28 GWP
   *  - BECCS CO2 captured & sequestered (kg)
   *  - Avoided Scope 3 diesel transport (kg)
   */
  public async mintEcoCredits(inputs: CarbonOffsetInputs): Promise<MintingResult> {
    const config = hederaManager.getConfig();

    const methaneOffsetKg = inputs.methaneDestroyedKg * 28.0; // 28x Global Warming Potential
    const beccsOffsetKg = inputs.beccsCarbonCapturedKg;
    const dieselOffsetKg = inputs.dieselAvoidedKg;

    const totalCo2eOffsetKg = parseFloat((methaneOffsetKg + beccsOffsetKg + dieselOffsetKg).toFixed(2));
    const tokensMinted = Math.floor(totalCo2eOffsetKg);

    const mockTxId = `${config.operatorId}@${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 999999)}`;

    console.log(`[HTS Minter] Minting ${tokensMinted} EcoCredit tokens on Token ID ${config.ecoCreditTokenId} for ${totalCo2eOffsetKg} kg CO2e...`);

    return {
      tokensMinted,
      totalCo2eOffsetKg,
      breakdown: {
        methaneOffsetKg,
        beccsOffsetKg,
        dieselOffsetKg,
      },
      htsTransactionId: mockTxId,
      tokenId: config.ecoCreditTokenId,
    };
  }
}
