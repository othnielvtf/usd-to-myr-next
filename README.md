# USD to MYR Cryptocurrency Converter

![MYR Currency Converter](https://i.imgur.com/example-screenshot.png)

A comprehensive currency conversion web application that supports both fiat currencies (USD, MYR) and cryptocurrencies (BTC, ETH, SOL, HLQ). This application provides real-time exchange rates, maintains a clean and intuitive user interface, and supports URL parameter-based sharing of conversion settings.

## Features

### Fiat Currency Conversion
- USD ↔ MYR conversion using Bank Negara Malaysia API
- Accurate mid-market exchange rates
- Real-time rate updates

### Cryptocurrency Conversion
- Support for BTC (Bitcoin), ETH (Ethereum), SOL (Solana), HLQ (Hyperliquid)
- Conversion between:
  * Fiat to Crypto
  * Crypto to Fiat
  * Crypto to Crypto
- Uses CoinGecko API for cryptocurrency pricing

### User Interface
- Clean, modern interface with responsive design
- Intuitive currency selection dropdowns
- One-click currency swap functionality
- URL parameter support for sharing conversion settings

## Technical Details

### Built With
- [Next.js](https://nextjs.org) - React framework for server-side rendering
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org) - Typed JavaScript

### API Integration
- **Bank Negara Malaysia API** - For USD/MYR exchange rates
- **CoinGecko API** - For cryptocurrency pricing

## Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/othnielvtf/usd-to-myr-next.git
cd usd-to-myr-next
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## Deployment

The application can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Visit [Vercel](https://vercel.com) and import your repository
3. Follow the deployment steps

## Usage

1. Enter an amount in the input field
2. Select the currency you're converting from using the dropdown
3. Select the currency you're converting to using the dropdown
4. View the converted amount
5. Use the swap button to quickly reverse the conversion

## URL Parameters

You can share specific conversion settings using URL parameters:

- `value`: The amount to convert (e.g., `value=100`)
- `from`: The source currency (e.g., `from=usd`)
- `to`: The target currency (e.g., `to=btc`)

Example: `http://localhost:3000/?value=100&from=usd&to=btc`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Bank Negara Malaysia](https://www.bnm.gov.my) for providing exchange rate data
- [CoinGecko](https://www.coingecko.com) for cryptocurrency pricing data
