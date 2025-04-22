"use client";

import { useEffect, useState, useRef } from "react";

type ExchangeRateData = {
  currency_code: string;
  unit: number;
  rate: {
    date: string;
    buying_rate: number;
    selling_rate: number;
    middle_rate: number;
  };
};

type ApiResponse = {
  data: ExchangeRateData;
  meta: {
    quote: string;
    session: string;
    last_updated: string;
  };
};

// Individual crypto currency data
interface CryptoData {
  usd: number;
  myr: number;
  last_updated_at?: number;
}

// Response structure from CoinGecko
interface CryptoRatesData {
  [cryptoId: string]: CryptoData;
}

type CryptoApiResponse = {
  data: CryptoRatesData;
  success: boolean;
};

// Currency types
type CurrencyType = 'fiat' | 'crypto';

// Available currencies
const FIAT_CURRENCIES = ['USD', 'MYR'];
const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'SOL', 'HLQ']; // HLQ for Hyperliquid

// Map crypto symbols to CoinGecko IDs
const CRYPTO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'HLQ': 'hyperliquid' // Assuming this is the correct ID for Hyperliquid
};

export default function Home() {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateData | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(600);
  const [fromCurrency, setFromCurrency] = useState("MYR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isHoveringSwap, setIsHoveringSwap] = useState(false);
  
  // Determine currency types
  const getType = (currency: string): CurrencyType => {
    if (FIAT_CURRENCIES.includes(currency)) return 'fiat';
    if (CRYPTO_CURRENCIES.includes(currency)) return 'crypto';
    return 'fiat'; // Default to fiat if unknown
  };
  
  // Compute currency types based on selected currencies
  const fromType = getType(fromCurrency);
  const toType = getType(toCurrency);
  
  // Function to update URL parameters
  const updateUrlParams = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('value', amount.toString());
      url.searchParams.set('from', fromCurrency.toLowerCase());
      url.searchParams.set('to', toCurrency.toLowerCase());
      window.history.pushState({}, '', url.toString());
    }
  };

  // Read URL parameters on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const valueParam = params.get('value');
      const fromParam = params.get('from');
      const toParam = params.get('to');
      
      if (valueParam) {
        const parsedValue = parseFloat(valueParam);
        if (!isNaN(parsedValue)) {
          setAmount(parsedValue);
        }
      }
      
      if (fromParam) {
        setFromCurrency(fromParam.toUpperCase());
      }
      
      if (toParam) {
        setToCurrency(toParam.toUpperCase());
      }
    }
  }, []);

  // Fetch both fiat and crypto exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch fiat exchange rate first
        const fiatResponse = await fetch('/api/exchange-rate');
        if (!fiatResponse.ok) {
          throw new Error(`Fiat API error! Status: ${fiatResponse.status}`);
        }
        const fiatData: ApiResponse = await fiatResponse.json();
        setExchangeRate(fiatData.data);
        
        // Get the USD to MYR exchange rate
        const usdToMyrRate = fiatData.data.rate.middle_rate;
        
        // Fetch crypto data with the exchange rate
        const cryptoIds = Object.values(CRYPTO_ID_MAP).join(',');
        const cryptoResponse = await fetch(`/api/crypto?ids=${cryptoIds}&usdToMyrRate=${usdToMyrRate}`);
        if (!cryptoResponse.ok) {
          throw new Error(`Crypto API error! Status: ${cryptoResponse.status}`);
        }
        const cryptoData: CryptoApiResponse = await cryptoResponse.json();
        if (cryptoData.success && cryptoData.data) {
          setCryptoData(cryptoData.data as CryptoRatesData);
        } else {
          throw new Error('Failed to fetch cryptocurrency data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching exchange rates:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if ((fromType === 'fiat' && toType === 'fiat' && exchangeRate) || 
        ((fromType === 'crypto' || toType === 'crypto') && cryptoData)) {
      calculateConversion();
    }
  }, [amount, fromCurrency, toCurrency, exchangeRate, cryptoData, fromType, toType]);

  const calculateConversion = () => {
    // Reset converted amount if data is missing
    if ((fromType === 'fiat' && toType === 'fiat' && !exchangeRate) || 
        ((fromType === 'crypto' || toType === 'crypto') && !cryptoData)) {
      setConvertedAmount(null);
      return;
    }

    // Fiat to Fiat conversion
    if (fromType === 'fiat' && toType === 'fiat' && exchangeRate) {
      const rate = exchangeRate.rate.middle_rate;
      
      if (fromCurrency === "MYR" && toCurrency === "USD") {
        // MYR to USD: divide by the rate
        setConvertedAmount(parseFloat((amount / rate).toFixed(2)));
      } else if (fromCurrency === "USD" && toCurrency === "MYR") {
        // USD to MYR: multiply by the rate
        setConvertedAmount(parseFloat((amount * rate).toFixed(2)));
      }
      return;
    }
    
    // Crypto conversions
    if (cryptoData) {
      // Crypto to Fiat
      if (fromType === 'crypto' && toType === 'fiat') {
        const cryptoId = CRYPTO_ID_MAP[fromCurrency];
        const cryptoInfo = cryptoData[cryptoId];
        
        if (cryptoInfo) {
          if (toCurrency.toLowerCase() === 'usd') {
            // Direct conversion from crypto to USD
            setConvertedAmount(parseFloat((amount * cryptoInfo.usd).toFixed(2)));
          } else if (toCurrency.toLowerCase() === 'myr') {
            // Direct conversion from crypto to MYR
            setConvertedAmount(parseFloat((amount * cryptoInfo.myr).toFixed(2)));
          }
        }
      }
      // Fiat to Crypto
      else if (fromType === 'fiat' && toType === 'crypto') {
        const cryptoId = CRYPTO_ID_MAP[toCurrency];
        const cryptoInfo = cryptoData[cryptoId];
        
        if (cryptoInfo) {
          if (fromCurrency.toLowerCase() === 'usd') {
            // Direct conversion from USD to crypto
            setConvertedAmount(parseFloat((amount / cryptoInfo.usd).toFixed(8)));
          } else if (fromCurrency.toLowerCase() === 'myr') {
            // Direct conversion from MYR to crypto
            setConvertedAmount(parseFloat((amount / cryptoInfo.myr).toFixed(8)));
          }
        }
      }
      // Crypto to Crypto
      else if (fromType === 'crypto' && toType === 'crypto') {
        const fromCryptoId = CRYPTO_ID_MAP[fromCurrency];
        const toCryptoId = CRYPTO_ID_MAP[toCurrency];
        
        const fromCryptoInfo = cryptoData[fromCryptoId];
        const toCryptoInfo = cryptoData[toCryptoId];
        
        if (fromCryptoInfo && toCryptoInfo) {
          // Convert through USD as the common denominator
          const fromValueInUsd = fromCryptoInfo.usd * amount;
          const toValuePerUsd = 1 / toCryptoInfo.usd;
          setConvertedAmount(parseFloat((fromValueInUsd * toValuePerUsd).toFixed(8)));
        }
      }
    }
  };

  const handleSwapCurrencies = () => {
    // Swap currencies
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    
    // Update URL with new parameters (after a small delay to ensure state is updated)
    setTimeout(() => {
      updateUrlParams();
    }, 10);
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to get currency display info
  const getCurrencyDisplay = (currency: string) => {
    switch(currency) {
      case 'USD':
        return {
          symbol: 'US',
          bgColor: 'bg-blue-500',
          label: 'USD'
        };
      case 'MYR':
        return {
          symbol: 'MY',
          bgColor: 'bg-red-500',
          label: 'MYR'
        };
      case 'BTC':
        return {
          symbol: '₿',
          bgColor: 'bg-orange-500',
          label: 'BTC'
        };
      case 'ETH':
        return {
          symbol: 'Ξ',
          bgColor: 'bg-purple-500',
          label: 'ETH'
        };
      case 'SOL':
        return {
          symbol: '◎',
          bgColor: 'bg-green-500',
          label: 'SOL'
        };
      case 'HLQ':
        return {
          symbol: 'H',
          bgColor: 'bg-indigo-500',
          label: 'HLQ'
        };
      default:
        return {
          symbol: currency.substring(0, 2),
          bgColor: 'bg-gray-500',
          label: currency
        };
    }
  };
  
  // Currency selection dropdown component using HTML select for better reliability
  const CurrencySelector = ({ 
    value, 
    onChange, 
    id 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    id: string 
  }) => {
    const currencyInfo = getCurrencyDisplay(value);
    
    return (
      <div className="relative inline-block">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-1 sm:px-2 py-1">
          <span className={`rounded-full overflow-hidden inline-block w-4 h-4 sm:w-5 sm:h-5 ${currencyInfo.bgColor} text-white text-xs flex items-center justify-center`}>
            {currencyInfo.symbol}
          </span> 
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none bg-transparent border-none text-gray-700 text-xs sm:text-sm font-medium focus:outline-none pr-6 sm:pr-8 py-1"
          >
            <optgroup label="Fiat Currencies">
              {FIAT_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cryptocurrencies">
              {CRYPTO_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 sm:px-2 text-gray-700">
            <svg className="fill-current h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-black p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-xl relative border border-gray-100">
        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>
        
        <div className="p-3 sm:p-4">
          <h1 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center text-gray-800">MYR Currency Converter</h1>
          
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 mb-3"></div>
                <div className="h-3 w-28 bg-gray-200 rounded mb-2"></div>
              </div>
              <p className="text-gray-500 mt-2 text-sm">Loading exchange rate data...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 border-l-4 border-red-500 text-center bg-red-50 rounded-lg">
              <p className="text-red-500 font-semibold text-sm">Error: {error}</p>
            </div>
          )}
          {exchangeRate && !loading && !error && (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-grow"></div>
                  </div>
                  {/* Responsive layout for currency converter */}
                  <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-2 justify-center">
                    <div className="w-full md:w-[40%] relative rounded-full border border-gray-300 overflow-hidden shadow-sm">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full py-3 px-3 text-lg md:text-xl font-bold focus:outline-none bg-gray-100 text-gray-800"
                      />
                      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
                        <CurrencySelector 
                          value={fromCurrency} 
                          onChange={(value) => {
                            setFromCurrency(value);
                            updateUrlParams();
                          }}
                          id="from-currency"
                        />
                      </div>
                    </div>
                    
                    {/* Swap button for mobile - shown between inputs */}
                    <button 
                      onClick={handleSwapCurrencies}
                      className="md:hidden px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors flex items-center space-x-1 shadow-md w-1/2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                      </svg>
                      <span>Swap</span>
                    </button>
                    
                    <div className="w-full md:w-[40%] relative rounded-full border border-gray-300 overflow-hidden shadow-sm">
                      <input
                        type="text"
                        value={convertedAmount !== null ? 
                          // Use more decimal places for crypto
                          toType === 'crypto' ? 
                            convertedAmount.toFixed(8) : 
                            convertedAmount.toFixed(2) 
                          : ''}
                        readOnly
                        className="w-full py-3 px-3 text-lg md:text-xl font-bold focus:outline-none bg-gray-100 text-gray-800"
                      />
                      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
                        <CurrencySelector 
                          value={toCurrency} 
                          onChange={(value) => {
                            setToCurrency(value);
                            updateUrlParams();
                          }}
                          id="to-currency"
                        />
                      </div>
                    </div>
                    
                    {/* Swap button for desktop - shown between inputs */}
                    <button 
                      onClick={handleSwapCurrencies}
                      className="hidden md:flex px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors items-center space-x-1 shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                      </svg>
                      <span>Swap</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center items-center mt-4 mb-3">
                <div className="text-sm text-center">
                  <span className="font-bold text-xs sm:text-sm">RM1.000 MYR = <span className="text-blue-600">${(1 / exchangeRate.rate.middle_rate).toFixed(4)}</span> USD</span>
                  <div className="text-xs text-gray-500">Mid-market exchange rate at {formatTime()}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs font-medium text-gray-500">Buying Rate</div>
                    <div className="text-lg font-bold">{exchangeRate.rate.buying_rate}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">Middle Rate</div>
                    <div className="text-lg font-bold text-blue-600">{exchangeRate.rate.middle_rate}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">Selling Rate</div>
                    <div className="text-lg font-bold">{exchangeRate.rate.selling_rate}</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-3">
                <p>Data provided by Bank Negara Malaysia • {exchangeRate.rate.date}</p> 
                <a href="https://apikijangportal.bnm.gov.my/openapi" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">(Open API)</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
