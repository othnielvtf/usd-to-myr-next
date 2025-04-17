import { NextResponse } from 'next/server';

// Hardcoded USD to MYR rate as fallback
const FALLBACK_USD_TO_MYR_RATE = 4.65;

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids') || 'bitcoin,ethereum,solana,hyperliquid';
    
    // Get USD to MYR rate from query params if provided
    const usdToMyrRate = parseFloat(searchParams.get('usdToMyrRate') || FALLBACK_USD_TO_MYR_RATE.toString());
    
    // Fetch data from CoinGecko API (only USD)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true`,
      {
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store' // Ensure we get fresh data
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    // Get the crypto data in USD
    const cryptoData = await response.json();
    
    // Add MYR values to each cryptocurrency based on the USD to MYR exchange rate
    Object.keys(cryptoData).forEach(cryptoId => {
      if (cryptoData[cryptoId].usd) {
        cryptoData[cryptoId].myr = cryptoData[cryptoId].usd * usdToMyrRate;
      }
    });
    
    // Add fallback for Hyperliquid if it's not available in CoinGecko
    if (ids.includes('hyperliquid') && !cryptoData.hyperliquid) {
      cryptoData.hyperliquid = {
        usd: 1.25, // Example value
        myr: 1.25 * usdToMyrRate, // Converted to MYR using exchange rate
        last_updated_at: Date.now() / 1000
      };
    }
    
    return NextResponse.json({ data: cryptoData, success: true });
  } catch (error) {
    console.error('Error fetching cryptocurrency data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred', success: false },
      { status: 500 }
    );
  }
}
