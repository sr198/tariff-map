# US Trade Tariffs Map

An interactive visualization of US trade relationships and tariffs with countries around the world. This application provides a map-based interface where users can:

- View a world map colored by tariff rates
- Hover over countries to see basic trade information
- Click on countries to view detailed trade statistics
- Explore trade balances and tariff relationships

## Features

- Interactive world map visualization
- Real-time country data on hover
- Detailed trade statistics for each country
- Responsive design for all screen sizes
- Color-coded visualization of tariff rates

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm 9.0 or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tariff-map.git
cd tariff-map
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development

The application is built with:

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Simple Maps
- Material-UI

### Project Structure

```
src/
  ├── app/              # Next.js app directory
  ├── components/       # React components
  │   ├── WorldMap.tsx     # Interactive map component
  │   └── CountryDetails.tsx # Country information display
  └── types/           # TypeScript type definitions
```

## API Integration

The application is designed to work with a REST API that provides trade data. Currently using mock data, but ready to integrate with your API when available.

Expected API response format:

```typescript
interface CountryData {
  usImportTariff: number;
  countryExportTariff: number;
  tradeBalance: number;
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
