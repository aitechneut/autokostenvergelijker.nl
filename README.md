# AutoKosten Vergelijker

**Enterprise-level webapplicatie voor Nederlandse ondernemers om 6 auto financieringsopties te vergelijken**

🌐 **Live Website:** [autokostenvergelijker.nl](https://autokostenvergelijker.nl)

## 🎯 Project Overzicht

AutoKosten Vergelijker helpt Nederlandse ondernemers bij het maken van de juiste keuze tussen 6 verschillende auto financieringsopties:

1. **Auto privé kopen + zakelijk gebruiken** - €0,23/km aftrek
2. **Privé een auto leasen** - Private lease kosten
3. **Auto op de zaak <500km/jaar** - Geen bijtelling
4. **Auto op de zaak >500km/jaar** - Wel bijtelling
5. **Zakelijk leasen via de zaak** - Operational lease
6. **Auto van de zaak leasen als werknemer** - Werknemer lease

## ✨ Key Features

- 🚗 **RDW API Integratie** - Automatische voertuiggegevens via kenteken
- 📊 **Real-time Vergelijkingen** - Directe kostenvergelijking tussen opties
- 📱 **Mobile-First Design** - Optimaal op alle apparaten
- 💰 **Nederlandse Belastingregels** - Actuele bijtelling en aftrek berekeningen
- 📈 **Visualisaties** - Grafieken en staafdiagrammen
- 🔄 **Multi-Auto Support** - Vergelijk meerdere auto's tegelijk
- 🖨️ **Export Functionaliteit** - PDF exports voor besluitvorming

## 🛠️ Technische Stack

- **Frontend:** HTML5, CSS3 (Gradient Design), Vanilla JavaScript
- **Backend:** PHP 8.4+
- **API:** RDW Open Data API (gratis, geen key nodig)
- **Hosting:** Hostinger met auto-deployment
- **Version Control:** Git/GitHub

## 📁 Project Structuur

```
autokostenvergelijker.nl/
├── index.html                 # Hoofdpagina
├── assets/
│   ├── css/
│   │   ├── styles.css         # Main styles
│   │   └── responsive.css     # Mobile-first responsive
│   ├── js/
│   │   ├── main.js           # Core JavaScript
│   │   └── navigation.js     # Navigation system
│   └── images/               # Static assets
├── tools/                    # 6 Berekeningstools
│   ├── auto-prive-kopen-en-zakelijk-gebruiken/
│   ├── prive-een-auto-leasen/
│   ├── auto-op-de-zaak-zonder-bijtelling/
│   ├── auto-op-de-zaak-met-bijtelling/
│   ├── zakelijk-leasen/
│   └── auto-van-de-zaak-leasen-via-werkgever/
├── api/                      # Backend PHP scripts
│   ├── rdw.php              # RDW API integration
│   └── calculations.php     # Berekeningslogica
├── admin/                   # Admin backend
└── docs/                    # Documentatie
```

## 🚀 Development Workflow

### Lokale Development
```bash
# Clone repository
git clone https://github.com/[username]/autokostenvergelijker.nl.git

# Development server (PHP built-in)
php -S localhost:8000

# Of gebruik MAMP/XAMPP voor volledige environment
```

### Deployment
```bash
# Auto-deployment naar live server
./deploy.sh "Update message"
```

## 📊 De 6 Financieringsopties

### 1. Auto Privé Kopen + Zakelijk Gebruiken
- **Voordeel:** €0,23 per kilometer aftrekbaar (2025 tarief)
- **Geschikt voor:** Veel zakelijke kilometers, lagere aankoopprijs
- **Berekening:** Totale kosten - (zakelijke km × €0,23)

### 2. Privé Auto Leasen
- **Voordeel:** Vaste maandlasten, geen afschrijvingsrisico
- **Geschikt voor:** Voorspelbare kosten, nieuwe auto's
- **Berekening:** Maandleasing + brandstof + extra's

### 3. Auto op de Zaak (<500km privé/jaar)
- **Voordeel:** Geen bijtelling, volledige aftrek
- **Geschikt voor:** Echt alleen zakelijk gebruik
- **Berekening:** Alle kosten aftrekbaar, geen bijtelling

### 4. Auto op de Zaak (>500km privé/jaar)
- **Voordeel:** Aftrek kosten minus bijtelling
- **Geschikt voor:** Mix zakelijk/privé gebruik
- **Berekening:** Kosten aftrekbaar - bijtelling × belastingtarief

### 5. Zakelijk Leasen via de Zaak
- **Voordeel:** Operational lease, volledige aftrek
- **Geschikt voor:** Nieuwe auto's, service inclusief
- **Berekening:** Lease aftrekbaar - bijtelling × belastingtarief

### 6. Auto van de Zaak Leasen als Werknemer
- **Voordeel:** Netto loonkorting vs bruto bijtelling
- **Geschikt voor:** Werknemers met auto van de zaak optie
- **Berekening:** Bijtelling - netto lease inhouding

## 🇳🇱 Nederlandse Belastingregels (2025)

### Bijtelling Percentages
- **Elektrische Auto's:** 17% tot €30.000, daarna 22%
- **Alle Andere Auto's:** 22% (benzine, diesel, hybride, LPG, CNG)
- **Youngtimers:** 35% over dagwaarde (15-30 jaar oud)

### Kilometervergoeding
- **Zakelijke Reizen:** €0,23 per kilometer
- **Maximaal Aftrekbaar:** €0,23 per zakelijke kilometer

### MRB (Motorrijtuigenbelasting)
- **Elektrische Auto's:** 25% korting in 2025, 100% vanaf 2026
- **Berekening:** (gewicht_kg ÷ 100) × 8 ≈ MRB per maand

## 🔧 Admin Backend Features

- **Formule Management:** Bekijk/wijzig berekeningsformules
- **Jaar Configuratie:** Nieuwe belastingjaren toevoegen
- **Regelgeving Updates:** Jaarlijkse tarieven/percentages aanpassen

## 📈 Performance Metrics

- **Load Time Target:** <3 seconden
- **API Response:** <2 seconden RDW lookup
- **Mobile Performance:** 60fps smooth scrolling
- **Cross-browser:** Safari, Chrome, Firefox support

## 🤝 Contributing

Dit is een privé project van Richard Surie. Voor vragen of suggesties:

- **Website:** [PianoManOnTour.nl](https://PianoManOnTour.nl)
- **Business:** Muziekschool + Development + AI Tech
- **Email:** Via website contact form

## 📝 License

© 2025 Richard Surie - Alle rechten voorbehouden

## 🔄 Version History

- **v1.0.0** - Initial release met 6 berekeningstools
- **v1.1.0** - Admin backend implementatie
- **v1.2.0** - Multi-auto vergelijking features
- **v2.0.0** - Advanced visualisaties en export functionaliteit

---

**Gebouwd met ❤️ voor Nederlandse ondernemers**