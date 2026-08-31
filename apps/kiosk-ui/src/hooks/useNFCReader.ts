import { useState, useCallback, useEffect } from 'react';

export interface NFCCardUser {
  cardId: string;
  farmerName: string;
  allocatedCrop: 'maize' | 'coffee' | 'wheat' | 'corn' | 'soybean';
  allocatedVolumeLiters: number;
  cooperativeName: string;
  ecoCreditsBalance: number;
}

export function useNFCReader(onCardTapped?: (user: NFCCardUser) => void) {
  const [isReading, setIsReading] = useState(false);
  const [currentUser, setCurrentUser] = useState<NFCCardUser | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  // Web NFC API Hardware Interface with fallback simulator
  const startScanning = useCallback(async () => {
    setIsReading(true);
    if ('NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        ndef.addEventListener('reading', ({ serialNumber }: any) => {
          handleCardDetected(serialNumber || 'NFC-JUMA-8821');
        });
      } catch (err) {
        console.warn('Hardware Web NFC unavailable, falling back to instant tap triggers:', err);
      }
    }
  }, []);

  const handleCardDetected = (serialNumber: string) => {
    setLastScannedId(serialNumber);
    // Mock user mapping
    const userData: NFCCardUser = {
      cardId: serialNumber,
      farmerName: serialNumber.includes('JUMA') ? 'Juma Kibet' : 'Maria Santos',
      allocatedCrop: serialNumber.includes('JUMA') ? 'maize' : 'coffee',
      allocatedVolumeLiters: 20,
      cooperativeName: 'Rift Valley Eco-Growers Coop',
      ecoCreditsBalance: 42,
    };
    setCurrentUser(userData);
    onCardTapped?.(userData);
  };

  const simulateTap = (farmer: 'JUMA' | 'MARIA' = 'JUMA') => {
    const cardId = farmer === 'JUMA' ? 'NFC-JUMA-8821' : 'NFC-MARIA-4029';
    handleCardDetected(cardId);
  };

  const clearSession = () => {
    setCurrentUser(null);
    setLastScannedId(null);
  };

  return {
    isReading,
    currentUser,
    lastScannedId,
    startScanning,
    simulateTap,
    clearSession,
  };
}
