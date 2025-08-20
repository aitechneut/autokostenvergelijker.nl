# Nederlandse Bijtelling Reference Guide
**AutoKosten Vergelijker - Officiële Bijtelling Regels & Berekeningen**

---

## 📖 BASISREGELS
1. Bijtelling wordt berekend over de cataloguswaarde (incl. BTW en opties, excl. BPM), tenzij de youngtimerregeling geldt.
2. Netto bijtelling = bruto bijtelling × marginale inkomstenbelastingtarief van de gebruiker.
3. Het jaar van eerste toelating (DET) bepaalt de bijtellingsregeling, niet het aankoopjaar.
4. Het bijtellingspercentage staat 60 maanden vast vanaf de eerste dag van de maand ná DET. Daarna geldt automatisch de dan actuele regeling.

## 📖 SPECIALE REGELS
- **Youngtimers (15–30 jaar)**: 35% over de dagwaarde (niet cataloguswaarde). Let op: géén 60-maandenbescherming, dus kan door politiek per 1 jan. wijzigen.
- **Oldtimers (>30 jaar)**: geen bijtelling.
- **Waterstof- en zonnecelauto's**: vanaf 2025 altijd 17% over de volledige cataloguswaarde.
- **Alle andere auto's (>0 g/km)**: zie fossiel-regels.

## 📊 TABEL BIJTELLINGSREGELS (DET JAAR → BIJTELLING)

### EV's (0 g/km):
- **2011–2013**: 0%
- **2014–2016**: 4% over alles
- **2017–2018**: 4% over alles
- **2019**: 4% tot €50.000, rest 22%
- **2020**: 8% tot €45.000, rest 22%
- **2021**: 12% tot €40.000, rest 22%
- **2022**: 16% tot €35.000, rest 22%
- **2023**: 16% tot €30.000, rest 22%
- **2024**: 16% tot €30.000, rest 22%
- **2025**: 17% tot €30.000, rest 22% (waterstof/zonnecel: 17% over alles)
- **2026 →**: 22% over alles (EV's geen voordeel meer, behalve waterstof/zonnecel)

### Fossiel (benzine, diesel, hybride, LPG):
- **≤2016**: 25%
- **2017 →**: 22% blijvend

### Youngtimers:
- **15–30 jaar**: 35% dagwaarde
- **>30 jaar**: 0% (geen bijtelling)

## 📖 OUTPUTSTRUCTUUR
- **Toon**: bouwjaar, eerste toelatingsdatum, cataloguswaarde (of dagwaarde bij youngtimer).
- **Bereken**: bruto bijtelling per jaar, netto bijtelling per maand (gegeven belastingtarief).
- **Vermeld expliciet**: welke percentages en drempels zijn toegepast.
- **Geef**: de einddatum van de 60-maandenregeling.
- **Als youngtimer**: waarschuw dat de regeling politiek onzeker is (geen 60-maandenbescherming).

## 📌 VOORBEELD
**Input**: EV, bouwjaar 2023, cataloguswaarde €60.000, inkomstenbelastingtarief 37%.

**Output**: 
- Toegepast: 2023-regeling (16% tot €30k, 22% daarboven).
- Bruto bijtelling = €11.400 p/j.
- Netto bijtelling = ca. €352 p/m.
- Geldig t/m 2028 (60 maanden).

---

## 🔧 IMPLEMENTATIE NOTES

### DET Jaar Extraction
```javascript
const detYear = parseInt(vehicleData.datum_eerste_toelating?.substr(0, 4) || vehicleData.bouwjaar);
```

### Drempelwaarde Lookup
```javascript
const thresholds = {
  2019: 50000, 2020: 45000, 2021: 40000, 
  2022: 35000, 2023: 30000, 2024: 30000, 2025: 30000
};
```

### Age Calculation  
```javascript
const age = currentYear - parseInt(vehicleData.bouwjaar);
const isYoungtimer = age >= 15 && age <= 30;
const isOldtimer = age > 30;
```

### 60-Months End Date
```javascript
const detDate = new Date(vehicleData.datum_eerste_toelating);
const endDate = new Date(detDate.getFullYear(), detDate.getMonth() + 61, 1);
```

---
**Versie**: 1.0  
**Laatst bijgewerkt**: Augustus 2025  
**Bron**: Nederlandse Belastingdienst + Richard Surie expertise
