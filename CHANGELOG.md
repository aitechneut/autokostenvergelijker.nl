# Changelog - AutoKosten Vergelijker

Alle belangrijke wijzigingen in dit project worden gedocumenteerd in dit bestand.

Het formaat is gebaseerd op [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
en dit project volgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Calculator brandstofverbruik integratie met RDW NEDC data
- Tweede calculator: "Privé een auto leasen"
- Remaining 4 auto financieringsopties
- PDF export functionaliteit

## [1.7] - 2025-08-19 - Chat #08 + #09 Deployment

### 🚀 Major Features Added
- **NEDC Brandstofverbruik Integration**: RDW API now fetches NEDC fuel consumption data
- **Auto Comparison System**: Compare multiple vehicles side-by-side  
- **Enhanced Data Quality**: NEDC data prioritized for Dutch tax compliance

### 🔧 Technical Improvements
- **RDW API Upgrade**: 4 parallel API calls (added NEDC dataset dqbz-ecw7)
- **Fuel Type Mapping**: Improved brandstof type recognition and normalization
- **Error Handling**: Graceful degradation when NEDC data unavailable
- **Performance**: Maintained caching and rate limiting with additional dataset

### 🇳🇱 Dutch Tax Compliance
- **NEDC Priority**: Dutch tax calculations now use NEDC values when available
- **WLTP Fallback**: Automatic fallback to WLTP for newer vehicles
- **Youngtimer Support**: Enhanced handling for 15-30 year old vehicles

### 📊 Data Structure Enhancements
- **New Fields**: nedcBrandstofverbruik, nedcCo2Uitstoot, hasNedcData
- **Improved Fields**: verbruikGemengd now uses best available data (NEDC > WLTP)
- **Quality Assessment**: Enhanced scoring system favoring NEDC data

### 🎯 Business Impact
- More accurate fuel cost calculations
- Better compliance with Dutch tax regulations
- Professional-grade data quality assessment
- Enhanced user experience with automatic data lookup

## [1.6] - 2025-08-18 - Chat #07 + #08 Features

### Planned
- RDW API integratie voor automatische voertuiggegevens
- Eerste berekeningsmodule: auto-prive-kopen-en-zakelijk-gebruiken
- Admin backend voor formule management
- Multi-auto vergelijkingsfunctionaliteit
- PDF export functionaliteit

## [1.0.0] - 2025-08-18

### Added
- ✅ **Project Infrastructuur**
  - Complete folder structuur opgezet
  - Git repository geconfigureerd
  - Basis HTML/CSS/JS framework

- ✅ **Hoofdpagina (index.html)**
  - Enterprise-level design met Nederlandse kleuren
  - Uitleg over alle 6 financieringsopties
  - SEO-geoptimaliseerde structuur
  - Mobile-first responsive design

- ✅ **CSS Framework**
  - Modern gradient design systeem
  - Nederlandse kleurenpalet (oranje/blauw)
  - Complete responsive breakpoints
  - Print-vriendelijke layouts
  - Accessibility features (reduced motion, high contrast)

- ✅ **JavaScript Foundation**
  - Core utilities (formatting, validatie)
  - Nederlandse kenteken validatie
  - Geavanceerd navigatiesysteem met mobile support
  - Performance monitoring
  - Error handling

- ✅ **Navigation System**
  - Responsive mobile hamburger menu
  - Smooth scrolling tussen secties
  - Breadcrumb systeem voor sub-paginas
  - Active navigation highlighting
  - Keyboard accessibility

- ✅ **Development Tools**
  - Auto-deployment script voor Hostinger
  - Git workflow configuratie
  - Project status tracking systeem

### Technical Details
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Hosting**: Hostinger met auto-deployment
- **API**: RDW Open Data API (voorbereid)
- **Design**: Mobile-first, Nederlandse UX patterns

### File Structure
```
autokostenvergelijker.nl/
├── index.html              # Complete hoofdpagina
├── assets/
│   ├── css/
│   │   ├── styles.css      # Main design system
│   │   └── responsive.css  # Mobile-first responsive
│   └── js/
│       ├── main.js         # Core JavaScript
│       └── navigation.js   # Advanced navigation
├── deploy.sh               # Auto-deployment script
├── README.md               # Project documentatie
├── CHANGELOG.md            # Dit bestand
└── .gitignore             # Git configuratie
```

### Performance
- ⚡ Load time target: <3 seconden
- 📱 Mobile-optimized met 60fps animations
- 🎨 Modern CSS with gradient design
- ♿ Accessibility compliant (WCAG guidelines)

---

## Development Notes

### Branch Strategy
- `main` - Production branch (auto-deploys naar live site)
- `develop` - Development branch voor nieuwe features
- `feature/*` - Feature branches voor specifieke ontwikkeling

### Commit Convention
```
feat: nieuwe feature
fix: bug fix
docs: documentatie wijzigingen
style: CSS/design wijzigingen
refactor: code refactoring
test: test wijzigingen
chore: maintenance taken
```

### Deployment Process
1. Development in `/Projects/autokostenvergelijker.nl/`
2. Test lokaal via `php -S localhost:8000`
3. Sync naar `/GitHub/autokostenvergelijker.nl/`
4. Run `./deploy.sh "commit message"`
5. Auto-deploy naar autokostenvergelijker.nl

---

**Maintained by Richard Surie - PianoManOnTour.nl**