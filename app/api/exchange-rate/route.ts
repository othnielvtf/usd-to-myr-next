import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.bnm.gov.my/public/exchange-rate?session=0900&quote=rm', {
      headers: {
        'accept': 'application/vnd.BNM.API.v1+json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to only return USD data
    const usdRate = data.data.find((currency: any) => currency.currency_code === 'USD');
    
    if (!usdRate) {
      throw new Error('USD exchange rate not found in the response');
    }
    
    return NextResponse.json({ data: usdRate, meta: data.meta });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate data' },
      { status: 500 }
    );
  }
}
