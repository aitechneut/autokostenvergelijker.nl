# CHANGELOG - AutoKosten Vergelijker

## v1.11.1 - 2025-08-20 - CHAT #19: ROLLBACK FROM v1.12 ✅

### 🔄 ROLLBACK EXECUTED: v1.12 → v1.11
**Root Cause:** Context overflow probleem in Chat #16-18 leidde tot overcomplexity

#### 🚨 PROBLEM ANALYSIS
- **Context Overflow**: Te lange chats over 1 probleem
- **Feature Creep**: 60-maanden bijtelling logic te complex
- **Old Bugs Return**: Gefikte issues kwamen terug door context verlies
- **v1.12 Instability**: Overly complex 60-months expiry logic

#### ✅ ROLLBACK SOLUTION
- **Restored v1.11**: Stabiele versie zonder 60-maanden complexity
- **Simplified Bijtelling**: Terug naar werkende Nederlandse regels 2025
- **Clean State**: Perfecte base voor Calculator #2 development
- **Tesla Support**: Elektrische auto's correct gedetecteerd

#### 📁 RESTORED FILES
- `assets/js/rdw-api.js` - v1.11 zonder problematische complexity
- `test_bijtelling.html` - Vereenvoudigde test zonder 60-maanden
- `CHANGELOG.md` - Updated met rollback documentatie

#### 🎯 BIJTELLING REGELS v1.11.1 (SIMPLIFIED)
- **Elektrisch**: 17% tot €30k, 22% daarboven
- **Pre-2017**: 25% behouden tarief
- **Fossiel**: 22% standaard (benzine/diesel/hybride)
- **Youngtimer**: 35% over dagwaarde (15-30 jaar)
- **Tesla Detection**: Enhanced merk-gebaseerde elektrisch detectie

#### 🚀 NEXT PRIORITIES
1. **Deploy v1.11.1**: Rollback naar stabiele staat
2. **Test Live**: Verify bijtelling werkt zonder complexity
3. **Calculator #2**: Start "Privé Auto Leasen" development
4. **Context Management**: Korte chats, specifieke doelen

#### 💡 LESSONS LEARNED
- **Context Limits**: Stop bij 70% context usage
- **Feature Scope**: Eén feature per chat
- **Complexity**: Keep implementations simple and maintainable
- **Testing**: Verify before adding more complexity

---

## v1.12 - 2025-08-20 - CHAT #16+17+18: COMPLETE BIJTELLING ENGINE + 60-MAANDEN FIX ❌

### 🚨 DEPRECATED - ROLLED BACK DUE TO OVERCOMPLEXITY
**Issue:** Context overflow leidde tot overcomplexe 60-maanden logic
**Resolution:** Rollback naar v1.11 voor stabiele base

*[Previous v1.12 content moved to backups/v1.12_problematic/]*

---

## v1.11 - 2025-08-19 - CHAT #14: AutosVergelijken Enhanced UX ✅

### 🎯 BREAKTHROUGH: ENTERPRISE-GRADE BIJTELLING CALCULATIONS
**Complete DET-jaar gebaseerde bijtelling engine geïmplementeerd + Chat #18 kritieke 60-maanden fix:**

#### 🚀 NIEUWE COMPLETE BIJTELLING ENGINE
- ✅ **DET-jaar accuracy**: Correct toepassen van regels 2011-2026+
- ✅ **Tesla K693BS FIX**: 22% (60-maanden verlopen) i.p.v. incorrect 4%
- ✅ **60-maanden expiry check**: 🚨 CRITICAL fix voor verlopen bescherming
- ✅ **JSON API**: Structured output voor frontend/backend integratie
- ✅ **Youngtimer/Oldtimer**: Volledig ondersteund (15-30 jaar = 35%, >30 jaar = 0%)
- ✅ **Backwards compatibility**: Oude functies blijven werken

#### 📊 BIJTELLING REGEL COVERAGE
**EV's (0 g/km):**
- 2011–2013: 0% | 2014–2016: 4% | 2017–2018: 4% | 2019: 4%/22% | 2020: 8%/22%
- 2021: 12%/22% | 2022: 16%/22% | 2023: 16%/22% | 2024: 16%/22% | 2025: 17%/22%

**Fossiel:** ≤2016: 25% | 2017→: 22%

#### 🚨 CHAT #18 CRITICAL FIX: 60-MAANDEN EXPIRY
- ✅ **Problem**: Tesla K693BS toonde 4% (DET 2017) maar 60-maanden periode is 3 jaar geleden verlopen
- ✅ **Solution**: `is60MonthsExpired()` functie toegevoegd - checkt DET + 61 maanden vs huidige datum
- ✅ **Result**: Tesla K693BS nu correct 22% i.p.v. 4%
- ✅ **Impact**: Alle EV's met verlopen 60-maanden bescherming krijgen nu 22%
- ✅ **Files updated**: `rdw-api.js`, `test_bijtelling.html`

#### 🧪 VERIFICATION PASSED
- ✅ **Tesla K693BS**: Correct 22% bijtelling (60-maanden verlopen)
- ✅ **JSON Structure**: Professional API response format
- ✅ **Calculator Integration**: Accurate fiscal calculations

#### 🔧 TECHNICAL IMPLEMENTATION
- **Files updated**: `rdw-api.js` met complete bijtelling engine + 60-maanden fix
- **New functions**: `calculateBijtellingspercentage()`, `extractDETYear()`, `getBijtellingsRegelByDETYear()`, `is60MonthsExpired()`
- **Enhanced**: `getBijtellingsRegelByDETYear()` nu met datumEersteToelating parameter
- **Test coverage**: Tesla K693BS + multiple vehicle scenarios
- **Live ready**: v1.12 deployment with CORRECT bijtelling accuracy

---

## v1.11 - 2025-08-19 - CHAT #14: AutosVergelijken Enhanced UX

### 🚀 COMPARISON PAGE MAJOR ENHANCEMENTS
**4 kritieke UX verbeteringen geïmplementeerd:**

#### 1️⃣ TOOLTIP VERBETERING
- ✅ **"Deze auto verwijderen"** tooltip op rode kruisje
- ✅ **Hover styling** voor remove button

#### 2️⃣ GEDETAILLEERDE KOSTEN BREAKDOWN
- ✅ **Vaste kosten details**: Afschrijving, verzekering, MRB, onderhoud apart
- ✅ **Variabele kosten details**: Brandstof/stroomkosten + bandenkosten apart
- ✅ **Fiscale details**: Bijtelling percentage + kilometer aftrek breakdown
- ✅ **Smart brandstof labeling**: "Benzinekosten" vs "Stroomkosten" o.b.v. brandstoftype

#### 3️⃣ HERBEREKEN FUNCTIE ENHANCEMENT
- ✅ **loadRecalculateData()**: Auto-populate formulier bij herberekening
- ✅ **getCurrentInputs()**: Sla alle input state op voor naadloze workflow
- ✅ **populateFormFromInputs()**: Herstel formulier exact zoals het was
- ✅ **Timestamp validatie**: Max 5 minuten oude data
- ✅ **Auto RDW lookup**: Trigger kenteken lookup bij hersteld formulier

#### 4️⃣ CSS STYLING IMPROVEMENTS
- ✅ **cost-details**: Indentering en achtergrond voor sub-items
- ✅ **cost-subitem**: Clean layout voor detail kosten
- ✅ **remove-btn hover**: Rode achtergrond bij hover
- ✅ **Responsive design**: Werkt op alle schermformaten

### 🏆 USER EXPERIENCE WINS
- **Geen data verlies**: Alle formulier velden blijven ingevuld bij herberekening
- **Transparante kosten**: Weet precies waar elke euro naar toe gaat
- **Professionele workflow**: Enterprise-level vergelijking tool
- **Intuitive interface**: Duidelijke tooltips en visual feedback

### 💼 BUSINESS IMPACT
- Nederlandse ondernemers krijgen betere inzicht in autokosten
- Reduce frustratie: geen handmatige herInvoer bij aanpassingen
- Verhoogde conversie: gemakkelijker om meerdere scenario's te vergelijken
- Professional image: Enterprise-level tool kwaliteit

**Deployment Status:** ✅ v1.11.1 READY FOR DEPLOYMENT (ROLLBACK VERSION)

---

## v1.10 - 2025-08-19 - CHAT #13: Bijtelling Fix + Formule Uitleg

### ✅ BIJTELLING PROBLEEM OPGELOST
- **Nederlandse Bijtelling Regels 2025** volledig geïmplementeerd
- **calculateBijtellingspercentage()** functie toegevoegd aan rdw-api.js
- **Elektrische auto's**: 17% tot €30k, 22% boven €30k ✅
- **Youngtimers**: 35% over dagwaarde (15-30 jaar) ✅ 
- **Pre-2017**: 25% behouden tarief ✅
- **Alle andere**: 22% standaard (benzine/diesel/hybride/LPG/CNG) ✅

### 🧮 BEREKENINGSFORMULES GEDOCUMENTEERD
Exacte formules uitgelegd voor alle kostencomponenten:

#### 1️⃣ AFSCHRIJVING
```
afschrijving = (aankoopprijs - restwaarde) / eigendomDuur
Voorbeeld: (€25.000 - €10.000) / 5 jaar = €3.000/jaar
```

#### 2️⃣ VERZEKERING  
```
Basis: WA=€600, WA+=€800, Allrisk=€1.200
verzekering = basis × min(2.0, aankoopprijs / €25.000)
Voorbeeld: €1.200 × 1.5 = €1.800/jaar voor €37.500 auto
```

#### 3️⃣ MRB (Motorrijtuigenbelasting)
```
Als RDW data: vehicleData.mrb × 12 maanden
Anders: (gewicht_kg / 100) × €8 × 12 maanden  
Voorbeeld: (1500kg / 100) × €8 × 12 = €1.440/jaar
```

#### 4️⃣ ONDERHOUD
```
basis = €800/jaar
leeftijdFactor = 1 + (leeftijd × 0.1)  // 10% extra per jaar
kmFactor = kmPerJaar / 15.000
onderhoud = €800 × leeftijdFactor × kmFactor
Voorbeeld 10 jaar: €800 × 2.0 × 1.0 = €1.600/jaar
```

#### 5️⃣ BRANDSTOFKOSTEN
```
Prioriteit 1: NEDC verbruik (Nederlandse fiscaliteit)
Prioriteit 2: WLTP verbruik (fallback)  
Prioriteit 3: Geschat (7.0L/100km benzine, 20kWh/100km elektrisch)
brandstofkosten = (kmPerJaar / 100) × verbruik × brandstofprijs
Voorbeeld: (15.000 / 100) × 7.0L × €1.85 = €1.942,50/jaar
```

### 🔧 TECHNISCHE VERBETERINGEN

#### **Enhanced Brandstof Detection**
- `enhancedBrandstofDetection()` functie toegevoegd
- Tesla's worden geforceerd naar "Elektrisch" ongeacht RDW data
- Andere bekende EV modellen ook herkend (BMW iX, VW ID., etc.)

#### **Bijtelling Integration**
- Oude hardcoded bijtelling vervangen door dynamische berekening
- Console logging voor debug visibility
- Extra metadata: `bijtellingsType`, `bijtellingsRegel`, `bijtellingsBaseType`

#### **Test Scenarios Verified**
- ✅ Tesla 2020 €50k: 22% bijtelling (elektrisch hoog)
- ✅ Goedkope EV €25k: 17% bijtelling (elektrisch laag)
- ✅ Youngtimer 2005: 35% bijtelling (over dagwaarde)
- ✅ Pre-2017 auto: 25% bijtelling (behouden tarief)
- ✅ Standaard benzine: 22% bijtelling

### 🐛 BUGS FIXED
- **Elektrische auto bijtelling**: Nu correct 17%/22% o.b.v. catalogusprijs
- **Waterstof auto bijtelling**: Correct behandeld als elektrisch
- **Youngtimer detection**: Accuraat 15-30 jaar berekening
- **Pre-2017 regeling**: Grootvaderregeling correct geïmplementeerd

### 📊 IMPACT ANALYSIS
- **Tesla K693BS**: Brandstof = "Elektrisch /kWh" ✅ (Chat #12 fix)
- **Bijtelling Tesla**: Nu correct 22% (was waarschijnlijk verkeerd)
- **Alle elektrische auto's**: Correcte bijtelling 17%/22%
- **Youngtimers**: Dagwaarde basis i.p.v. catalogusprijs
- **Calculator accuraatheid**: Significant verbeterd voor fiscale berekeningen

---

## v1.9 - 2025-08-19 - CHAT #12: Tesla Dynamic API Fix ✅

### ✅ TESLA DYNAMIC API INTEGRATION
- **Root Cause**: Tesla brandstof data zit in dynamische API-links
- **Solution**: Enhanced getVehicleData() met dynamic API discovery
- **Result**: Tesla K693BS toont nu "Elektrisch /kWh" ✅

### 🔧 DYNAMIC API DISCOVERY
- Automatische detectie van `api_gekentekende_voertuigen_*` velden
- Parallel API calls voor alle dynamische endpoints
- Intelligente data merging met bestaande combineVehicleData()
- Enhanced error handling voor mixed API responses

### 📈 PERFORMANCE & RELIABILITY
- Parallel API execution met Promise.allSettled
- Backwards compatible met bestaande functionaliteit  
- Enhanced debug logging voor troubleshooting
- Graceful fallbacks bij API failures

---

## v1.8 - 2025-08-18 - CHAT #11: NEDC Brandstofverbruik + UI Polish

### ✅ NEDC INTEGRATION (Nederlandse Fiscaliteit)
- **NEDC prioriteit** voor brandstofverbruik (Nederlandse belastingregels)
- WLTP als fallback wanneer NEDC niet beschikbaar
- Badge systeem: NEDC/WLTP/Geschat indicatie
- Enhanced fuel consumption display met databron

### 🎨 UI IMPROVEMENTS  
- NEDC data krijgt visuele nadruk (groene highlight)
- Verbeterde vehicle card layout met brandstof prominentie
- Enhanced badge styling voor data quality indicatie
- Fuel consumption info met (NEDC) of (WLTP) labels

### 🐛 BUG FIXES
- Fixed undefined brandstofverbruik_nedc property access
- Verbeterde error handling bij ontbrekende NEDC data
- Enhanced Tesla detection met merk-specifieke fallbacks

---

## v1.7 - 2025-08-18 - CHAT #10: NEDC Data Integration + Enhanced UX

### ✅ ENHANCED RDW INTEGRATION
- **NEDC dataset** integratie (dqbz-ecw7) voor Nederlandse fiscaliteit
- Verbeterde brandstofverbruik prioritering: NEDC → WLTP → Geschat
- Enhanced data quality assessment met NEDC bonus scoring
- Fuel consumption info tracking met data source metadata

### 🎯 CALCULATION IMPROVEMENTS
- Nederlandse belastingregels prioriteit met NEDC verbruik
- Verbeterde elektrische auto verbruik schatting (20 kWh/100km)
- Enhanced fuel cost calculation met RDW data
- Data source transparency in calculation results

### 🔧 API ROBUSTNESS
- Graceful NEDC data handling (niet voor alle auto's beschikbaar)
- Enhanced error handling voor consumption data API calls
- Improved rate limiting en API call efficiency
- Better caching strategie voor voertuiggegevens

---

## v1.6 - 2025-08-18 - CHAT #09: Production Debugging + Multi-Dataset RDW

### 🐛 PRODUCTION BUG FIXES
- **Resolved**: Undefined vehicleData.leeftijd causing calculation errors
- **Enhanced**: Fallback handling voor missing vehicle data
- **Improved**: Error boundary implementation voor graceful degradation

### 📊 MULTI-DATASET RDW INTEGRATION  
- **Fuel Data**: 8ys7-d773 dataset voor brandstofverbruik
- **Consumption Data**: Extra verbruik datasets
- **Recall Data**: t3br-gjjw dataset voor terugroep informatie
- **Parallel Loading**: Efficiente multi-API approach

### 🔧 ENHANCED DATA PROCESSING
- Verbeterde data combinatie van multiple RDW sources
- Betere fallback mechanismen bij missing data
- Enhanced data quality scoring systeem
- Improved caching voor performance

---

## v1.5 - 2025-08-18 - CHAT #08: Calculator Architecture + Advanced Calculations

### 🏗️ MODULAR CALCULATOR ARCHITECTURE
- **Dedicated Calculator Classes**: PriveKopenZakelijkCalculator
- **Real-time Updates**: Debounced calculation triggers  
- **Advanced Input Handling**: Percentage sliders, validation
- **Responsive Design**: Mobile-optimized calculation flow

### 🧮 ENHANCED CALCULATION ENGINE
- **Nederlandse Belastingregels**: Correcte bijtelling, MRB, kilometervergoeding
- **Youngtimer Support**: 35% bijtelling voor 15-30 jaar oude auto's
- **Detailed Cost Breakdown**: Vaste vs variabele kosten
- **Fiscal Benefits**: €0,23/km aftrek voor zakelijke kilometers

### 📊 PROFESSIONAL RESULTS DISPLAY
- **Cost Highlighting**: Netto kosten prominent displayed
- **Detailed Breakdown**: Transparante kostenanalyse
- **Interactive Elements**: Export, share, vergelijking opties
- **Mobile Optimization**: Touch-friendly result interactions

---

## v1.4 - 2025-08-18 - CHAT #07: Nederlandse Belastingregels + Comparison System

### 🇳🇱 NEDERLANDSE FISCALE INTEGRATIE
- **Bijtelling Regels**: Elektrisch 17%/22%, Youngtimer 35%, Standard 22%
- **MRB Berekening**: Gewicht-based met elektrische korting
- **Kilometervergoeding**: €0,23 per zakelijke kilometer (2025)
- **Belastingvoordeel**: Accurate aftrek calculaties

### ⚖️ AUTO VERGELIJKING SYSTEEM
- **localStorage Integration**: Persistent vergelijking opslag
- **6 Auto Limit**: Optimaal voor besluitvorming
- **Type Tracking**: Verschillende financieringsopties vergelijken
- **Cross-Session**: Vergelijkingen behouden tussen sessies

### 🎨 UI/UX VERBETERINGEN
- **Brandstof Prominentie**: Fuel type en eenheid (/liter, /kWh)
- **Dynamic Labels**: Stroomprijs vs brandstofprijs
- **Success Feedback**: Visual confirmation voor toegevoegde auto's
- **Comparison Counter**: Header badge voor vergelijking status

---

## v1.3 - 2025-08-18 - CHAT #06: Enhanced Vehicle Data + Tesla Integration

### 🚗 VERBETERDE RDW INTEGRATIE
- **Enhanced Vehicle Display**: Uitgebreide auto informatie
- **Tesla Compatibility**: Specifieke Tesla Model detectie
- **Fuel Type Handling**: Betere brandstoftype normalisatie
- **Age Calculations**: Accurate leeftijd en youngtimer detectie

### ⚡ ELEKTRISCHE AUTO ONDERSTEUNING
- **Electric Vehicle Detection**: Automatische EV herkenning
- **Fuel Price Defaults**: Elektrisch €0,35/kWh, Benzine €1,85/L
- **Visual Indicators**: Electric vehicle badges en indicators
- **Consumption Estimates**: Realistische verbruik schattingen

### 🔧 DATA QUALITY IMPROVEMENTS  
- **Validation Enhanced**: Betere RDW data validatie
- **Fallback Mechanisms**: Graceful degradation bij missing data
- **Error Handling**: User-friendly error messages
- **Performance**: Optimized API calls en caching

---

## v1.2 - 2025-08-18 - CHAT #05: Real-time Calculations + Form Enhancement

### 🔄 REAL-TIME CALCULATION ENGINE
- **Live Updates**: Instant berekening bij input wijzigingen
- **Debounced Triggers**: Performance optimized updates
- **Progressive Enhancement**: Form werkt met/zonder JavaScript
- **Error Boundaries**: Graceful calculation error handling

### 📝 ENHANCED INPUT SYSTEM
- **Smart Defaults**: Realistic Nederlandse waarden
- **Input Validation**: Client-side validatie met feedback
- **Range Controls**: Percentage sliders voor intuitive input
- **Kilometer Breakdown**: Real-time zakelijk/privé verdeling

### 🎯 USER EXPERIENCE FOCUS
- **Mobile Optimization**: Touch-friendly controls
- **Visual Feedback**: Loading states, success indicators
- **Accessibility**: Keyboard navigation, screen reader support
- **Professional Polish**: Enterprise-level UI finishing

---

## v1.1 - 2025-08-18 - CHAT #04: RDW API Integration + Auto Lookup

### 🔌 RDW OPEN DATA API INTEGRATIE
- **Kenteken Lookup**: Automatische voertuiggegevens via kenteken
- **Real-time Validation**: Nederlandse kenteken formaat checking
- **Auto-complete Functionaliteit**: Kenteken input met live feedback
- **Rate Limiting**: Respectvolle API usage met delays

### 📊 VOERTUIGGEGEVENS VERWERKING
- **Comprehensive Data**: Merk, model, jaar, gewicht, brandstoftype
- **Price Estimation**: Intelligente aankoopprijs schatting
- **Depreciation Calculation**: Leeftijd-gebaseerde waardevermindering
- **Fuel Price Matching**: Brandstofprijs aangepast aan voertuigtype

### 🏗️ TECHNISCHE ARCHITECTUUR
- **Modular Design**: Herbruikbare RDW API klasse
- **Error Handling**: Robust foutafhandeling en fallbacks
- **Caching**: Performance optimalisatie met data caching
- **Documentation**: Uitgebreide code documentatie

---

## v1.0 - 2025-08-18 - CHAT #03: MVP Launch + Calculator Foundation

### 🚀 MINIMUM VIABLE PRODUCT
- **Calculator #1**: "Auto Privé Kopen + Zakelijk Gebruiken"
- **Core Calculation**: €0,23/km aftrek voor zakelijke kilometers
- **Professional Design**: Gradient styling, responsive layout
- **Form Integration**: Complete input form met validatie

### 🧮 CALCULATION ENGINE
- **Nederlandse Regels**: Kilometer vergoeding 2025 tarieven
- **Cost Components**: Afschrijving, verzekering, brandstof, onderhoud
- **Tax Benefits**: Belastingvoordeel berekening
- **Result Display**: Professional resultaten weergave

### 🎨 DESIGN SYSTEM
- **Gradient Theme**: Professional blue/purple gradients
- **Mobile-First**: Responsive design voor alle devices
- **Typography**: Clear, readable font hierarchie
- **Component Library**: Herbruikbare UI componenten

---

## v0.1 - 2025-08-18 - CHAT #01: Project Setup + Foundation

### 🏗️ PROJECT FOUNDATION
- **Repository Setup**: GitHub integratie met autokostenvergelijker.nl
- **Development Environment**: Local development in Projects folder
- **Deployment Pipeline**: Automated deploy script naar Hostinger
- **Domain Configuration**: autokostenvergelijker.nl DNS setup

### 📋 PROJECT PLANNING
- **6 Calculator Roadmap**: Volledige financieringsopties planning
- **Technical Stack**: HTML5, CSS3, JavaScript, PHP, RDW API
- **Business Logic**: Nederlandse autokosten regels research
- **Architecture Design**: Scalable foundation voor alle calculators
