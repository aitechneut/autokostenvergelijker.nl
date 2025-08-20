# AutoKosten Vergelijker Knowledge Base - UPDATED WITH COMPLETE BIJTELLING EXPERT SYSTEM

## Project Overview
Enterprise-level webapplicatie die Nederlandse ondernemers helpt bij het vergelijken van 6 verschillende auto financieringsopties. Integreert Nederlandse RDW Open Data API voor automatische voertuiggegevens via kenteken lookup.

## Technical Stack
- **Frontend**: HTML5, CSS3 (gradient design), Vanilla JavaScript
- **Backend**: PHP 8.4+
- **API**: RDW Open Data API (gratis, geen key nodig)
- **Hosting**: Hostinger - autokostenvergelijker.nl
- **Version Control**: Git/GitHub
- **Database**: Geen database nodig (API-driven)

## Project Structure
```
/Users/richardsurie/Documents/Development/
├── GitHub/autokostenvergelijker.nl/           # GitHub clone (voor sync)
├── Projects/autokostenvergelijker.nl/         # Werkende development versie
├── Tools/                                     # Development tools
└── Docs/                                      # Documentatie
```

## NEDERLANDSE BIJTELLING EXPERT SYSTEM

**Je bent een expert in Nederlandse autobelastingen en je taak is het berekenen van de maandelijkse netto bijtelling van een auto van de zaak.**

### 📖 BASISREGELS
1. Bijtelling wordt berekend over de cataloguswaarde (incl. BTW en opties, excl. BPM), tenzij de youngtimerregeling geldt.
2. Netto bijtelling = bruto bijtelling × marginale inkomstenbelastingtarief van de gebruiker.
3. Het jaar van eerste toelating (DET) bepaalt de bijtellingsregeling, niet het aankoopjaar.
4. Het bijtellingspercentage staat 60 maanden vast vanaf de eerste dag van de maand ná DET. Daarna geldt automatisch de dan actuele regeling.

### 📖 SPECIALE REGELS
- Youngtimers (15–30 jaar): 35% over de dagwaarde (niet cataloguswaarde). Let op: géén 60-maandenbescherming, dus kan door politiek per 1 jan. wijzigen.
- Oldtimers (>30 jaar): geen bijtelling.
- Waterstof- en zonnecelauto's: vanaf 2025 altijd 17% over de volledige cataloguswaarde.
- Alle andere auto's (>0 g/km): zie fossiel-regels.

### 📊 TABEL BIJTELLINGSREGELS (DET JAAR → BIJTELLING)

**EV's (0 g/km):**
- 2011–2013: 0%
- 2014–2016: 4% over alles
- 2017–2018: 4% over alles
- 2019: 4% tot €50.000, rest 22%
- 2020: 8% tot €45.000, rest 22%
- 2021: 12% tot €40.000, rest 22%
- 2022: 16% tot €35.000, rest 22%
- 2023: 16% tot €30.000, rest 22%
- 2024: 16% tot €30.000, rest 22%
- 2025: 17% tot €30.000, rest 22% (waterstof/zonnecel: 17% over alles)
- 2026 → 22% over alles (EV's geen voordeel meer, behalve waterstof/zonnecel)

**Fossiel (benzine, diesel, hybride, LPG):**
- ≤2016: 25%
- 2017 → 22% blijvend

**Youngtimers:**
- 15–30 jaar: 35% dagwaarde
- >30 jaar: 0% (geen bijtelling)

### 📖 OUTPUTSTRUCTUUR
- Toon: bouwjaar, eerste toelatingsdatum, cataloguswaarde (of dagwaarde bij youngtimer).
- Bereken bruto bijtelling per jaar, netto bijtelling per maand (gegeven belastingtarief).
- Vermeld expliciet welke percentages en drempels zijn toegepast.
- Geef de einddatum van de 60-maandenregeling.
- Als youngtimer: waarschuw dat de regeling politiek onzeker is (geen 60-maandenbescherming).

### 📌 VOORBEELD
**Input**: EV, bouwjaar 2023, cataloguswaarde €60.000, inkomstenbelastingtarief 37%.
**Output**: 
- Toegepast: 2023-regeling (16% tot €30k, 22% daarboven).
- Bruto bijtelling = €11.400 p/j.
- Netto bijtelling = ca. €352 p/m.
- Geldig t/m 2028 (60 maanden).

## De 6 AutoKosten Vergelijking Opties

### 1. Auto Privé Kopen + Zakelijk Gebruiken
- **Methode**: Privé eigendom, zakelijke kilometervergoeding
- **Voordeel**: €0,23 per kilometer aftrekbaar (2025 tarief)
- **Berekening**: Totale kosten - (zakelijke km × €0,23)
- **Geschikt voor**: Veel zakelijke kilometers, lage aankoopprijs

### 2. Privé Auto Leasen
- **Methode**: Private lease contract
- **Voordeel**: Vaste maandlasten, geen afschrijvingsrisico
- **Berekening**: Maandleasing + brandstof + eventuele extra's
- **Geschikt voor**: Voorspelbare kosten, nieuwe auto's

### 3. Zakelijk Kopen + Privé <500km/jaar
- **Methode**: Auto op bedrijf, minimaal privégebruik
- **Voordeel**: Geen bijtelling, volledige aftrek
- **Berekening**: Alle kosten aftrekbaar, geen bijtelling
- **Geschikt voor**: Echt alleen zakelijk gebruik

### 4. Zakelijk Kopen + Privé >500km/jaar
- **Methode**: Auto op bedrijf, bijtelling van toepassing
- **Voordeel**: Aftrek kosten, bijtelling over cataloguswaarde
- **Berekening**: Kosten aftrekbaar - bijtelling × belastingtarief
- **Geschikt voor**: Mix zakelijk/privé, hogere inkomens

### 5. Zakelijk Leasen via de Zaak
- **Methode**: Operational lease op bedrijf
- **Voordeel**: Vaste kosten, volledige aftrek, bijtelling
- **Berekening**: Lease aftrekbaar - bijtelling × belastingtarief
- **Geschikt voor**: Nieuwe auto's, service inclusief

### 6. Auto van de Zaak Leasen als Werknemer
- **Methode**: Werknemer lease arrangement
- **Voordeel**: Netto loonkorting vs bruto bijtelling
- **Berekening**: Bijtelling - netto lease inhouding
- **Geschikt voor**: Werknemers met auto van de zaak optie

## Nederlandse Belasting Regels (2025)

### Kilometervergoeding 2025
- **Zakelijke Reizen**: €0,23 per kilometer
- **Maximaal Aftrekbaar**: €0,23 per zakelijke kilometer
- **Woon-werk**: Meestal niet aftrekbaar (behalve uitzonderingen)

### MRB (Motorrijtuigenbelasting)
- **Elektrische Auto's**: 25% korting in 2025, 100% vanaf 2026
- **Benzine/Diesel**: Gewicht-gebaseerd tarief
- **Berekening**: (gewicht_kg ÷ 100) × 8 ≈ MRB per maand

## RDW API Integration
- **Base URL**: https://opendata.rdw.nl/
- **Voertuiggegevens**: `/resource/m9d7-ebf2.json?kenteken=XX-XX-XX`
- **Rate Limiting**: Respecteer API limits
- **Error Handling**: Graceful fallbacks bij API failures

## Berekening Componenten

### Vaste Kosten (Alle Opties)
- **Afschrijving**: (Aankoopprijs - Restwaarde) / Jaren
- **Verzekering**: WA, WA+ of Allrisk
- **MRB**: Gewicht/brandstof afhankelijk
- **APK**: €50/jaar voor auto's >3 jaar
- **Onderhoud**: Leeftijd/kilometerstand afhankelijk

### Variabele Kosten
- **Brandstof**: (km/maand ÷ 100) × verbruik × brandstofprijs
- **Banden**: Slijtage gebaseerd op kilometers
- **Reparaties**: Statistisch gemiddelde per leeftijd

### Fiscale Componenten
- **Bijtelling**: Percentage × catalogus/dagwaarde × belastingtarief
- **Aftrek**: Kosten × belastingtarief (voor zakelijke opties)
- **Kilometervergoeding**: Zakelijke km × €0,23

## User Interface Design

### Hoofdscherm Layout
1. **Kenteken Input**: RDW lookup met auto-complete
2. **6 Opties Keuze**: Clear buttons voor elke optie
3. **Parameter Input**: Kilometers, inkomen, gebruik
4. **Real-time Vergelijking**: Side-by-side resultaten
5. **Export Functie**: PDF/Print voor besluitvorming

### Responsive Design
- **Mobile-first**: Touch-vriendelijke interface
- **Tablet**: Optimaal voor vergelijking view
- **Desktop**: Volledig overzicht alle opties
- **Print**: Clean layout voor fysieke rapporten

## Business Logic Flows

### Kenteken → Auto Data
```php
1. Kenteken input → RDW API call
2. Voertuiggegevens ophalen → Parse response
3. Fallback voor missende data → Manual input
4. Validatie en error handling
```

### Optie Vergelijking
```php
1. Voor elke optie → Bereken totale kosten
2. Fiscale voordelen → Aftrek berekeningen
3. Netto effect → Na belasting kosten
4. Ranking → Goedkoopste naar duurste
```

### Parameter Sensitivity
- **Kilometers**: Meer km = voordeel zakelijke opties
- **Inkomen**: Hoger inkomen = meer aftrek voordeel
- **Auto waarde**: Hogere waarde = meer bijtelling impact
- **Gebruik mix**: Zakelijk/privé ratio belangrijk

## Quality Assurance

### Testing Protocol
- **Cross-browser**: Safari, Chrome, Firefox compatibility
- **Mobile**: iOS Safari, Android Chrome
- **API Reliability**: RDW fallback scenarios
- **Calculation Accuracy**: Validation tegen bekende cases

### Performance Targets
- **Load Time**: <3 seconden initial
- **API Response**: <2 seconden RDW lookup
- **Calculation**: <1 seconde voor alle 6 opties
- **Mobile**: 60fps smooth scrolling

## Deployment & Maintenance

### Hostinger Setup
- **Domain**: autokostenvergelijker.nl
- **Auto-deploy**: GitHub webhook
- **SSL**: Automatic certificate
- **Backup**: Daily automated backups

### Version Control
- **Git**: Semantic versioning (v1.0.0)
- **Branches**: main (production), develop (staging)
- **Commits**: Descriptive messages
- **Deploy**: `./deploy.sh "message"` script

## Integration Possibilities

### Met autovandezaakofprive
- **Shared Database**: Bijtelling regels
- **API Functions**: RDW integration patterns
- **Design Consistency**: Matching visual identity
- **Cross-linking**: Verwijzingen tussen sites

### Future Extensions
- **Lease Provider API**: Real-time lease tarieven
- **Insurance API**: Dynamische verzekeringsprijzen
- **Tax Calculator**: Complexere fiscale scenarios
- **Company Fleet**: Multi-vehicle vergelijkingen

## Success Metrics

### User Engagement
- **Completion Rate**: % gebruikers die vergelijking voltooien
- **Return Visits**: Herhaalde bezoeken voor nieuwe auto's
- **Export Usage**: PDF downloads en prints
- **Mobile Usage**: Percentage mobile vs desktop

### Business Impact
- **Decision Support**: Accurate financiële vergelijkingen
- **Time Saving**: Snelle berekeningen vs handmatig
- **Error Reduction**: Minder fiscale vergissingen
- **Professional Image**: Enterprise-level tool voor adviseurs

## Owner Information
- **Owner**: Richard Surie (PianoManOnTour.nl)
- **Business**: Muziekschool + Development + AI Tech
- **Target Users**: Nederlandse ondernemers, zakelijke automobilisten, accountants
- **Integration**: Onderdeel van Richard's business tools ecosystem
