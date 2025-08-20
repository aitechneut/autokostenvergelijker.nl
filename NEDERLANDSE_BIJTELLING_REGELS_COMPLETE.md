# COMPLETE NEDERLANDSE BIJTELLING REGELS - KNOWLEDGE BASE

## 📖 BASISREGELS
1. Bijtelling wordt berekend over de cataloguswaarde (incl. BTW en opties, excl. BPM), tenzij de youngtimerregeling geldt.
2. Netto bijtelling = bruto bijtelling × marginale inkomstenbelastingtarief van de gebruiker.
3. **Het jaar van eerste toelating (DET) bepaalt de bijtellingsregeling, niet het aankoopjaar.**
4. **Het bijtellingspercentage staat 60 maanden vast vanaf de eerste dag van de maand ná DET.** Daarna geldt automatisch de dan actuele regeling.

## 📖 SPECIALE REGELS
- **Youngtimers (15–30 jaar)**: 35% over de dagwaarde (niet cataloguswaarde). **Géén 60-maandenbescherming**, dus kan door politiek per 1 jan. wijzigen.
- **Oldtimers (>30 jaar)**: geen bijtelling.
- **Waterstof- en zonnecelauto's**: vanaf 2025 altijd 17% over de volledige cataloguswaarde.
- **Alle andere auto's (>0 g/km)**: zie fossiel-regels.

## 📊 COMPLETE TABEL BIJTELLINGSREGELS (DET JAAR → BIJTELLING)

### **EV's (0 g/km CO2-uitstoot):**
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

### **Fossiel (benzine, diesel, hybride, LPG):**
- **≤2016**: 25%
- **2017 →**: 22% blijvend

### **Youngtimers & Oldtimers:**
- **15–30 jaar**: 35% dagwaarde
- **>30 jaar**: 0% (geen bijtelling)

## 📖 JSON OUTPUTSTRUCTUUR
Antwoord ALTIJD in 2 delen:

### **1. Tekstueel overzicht:**
- Bouwjaar, eerste toelatingsdatum, cataloguswaarde (of dagwaarde bij youngtimer).
- Welke percentages en drempels toegepast zijn.
- Bruto bijtelling per jaar.
- Netto bijtelling per maand (op basis van opgegeven IB-percentage).
- Einddatum van de 60-maandenregeling.
- Waarschuwing als het om een youngtimer gaat (geen 60-maandenbescherming).

### **2. JSON-output** met exact deze structuur:
```json
{
  "bouwjaar": "2023",
  "eerste_toelating": "2023-06",
  "cataloguswaarde": 60000,
  "dagwaarde": null,
  "bijtelling_bruto_per_jaar": 11400,
  "bijtelling_netto_per_maand": 352,
  "toegepast_percentage": "16% tot €30.000, 22% daarboven",
  "einde_60_maanden": "2028-06",
  "youngtimer": false,
  "waarschuwing": null
}
```

## 📌 IMPLEMENTATIE VOORBEELDEN

### **Tesla Model 3 uit 2021 (DET: 2021-03)**
- **Regel**: 2021 → 12% tot €40.000, rest 22%
- **Cataloguswaarde**: €55.000
- **Berekening**: 
  - 12% × €40.000 = €4.800
  - 22% × €15.000 = €3.300
  - **Totaal**: €8.100 per jaar
- **60-maanden geldig**: tot maart 2026

### **BMW 3-serie uit 2015 (DET: 2015-11, nu 10 jaar oud)**
- **Regel**: ≤2016 → 25% fossiel
- **Status**: Nog geen youngtimer (pas bij 15 jaar)
- **Bijtelling**: 25% over cataloguswaarde
- **60-maanden geldig**: tot november 2020, daarna 25% blijvend

### **Mercedes E-klasse uit 2007 (nu 18 jaar oud)**
- **Regel**: Youngtimer → 35% over dagwaarde
- **Cataloguswaarde origineel**: €75.000
- **Dagwaarde nu**: €8.000
- **Bijtelling**: 35% × €8.000 = €2.800 per jaar
- **Waarschuwing**: Geen 60-maandenbescherming

### **Porsche uit 1990 (nu 35 jaar oud)**
- **Regel**: Oldtimer → 0% bijtelling
- **Geen bijtelling** ongeacht waarde

## 🚨 KRITIEKE IMPLEMENTATIE PUNTEN

### **DET-Jaar Extraction:**
- RDW API field: `datum_eerste_toelating` (format: "YYYYMMDD")
- Convert naar jaar voor regeltabel lookup
- Indien ontbreekt: gebruik `bouwjaar` als fallback

### **Age Calculation:**
- `const leeftijd = currentYear - parseInt(bouwjaar)`
- Youngtimer: `leeftijd >= 15 && leeftijd <= 30`
- Oldtimer: `leeftijd > 30`

### **60-Maanden Berekening:**
- Start: eerste dag van maand ná DET
- Einddatum: +60 maanden vanaf startdatum
- Format: "YYYY-MM"

### **Drempelwaarde Lookup:**
```javascript
const drempelwaardes = {
  2019: 50000,
  2020: 45000,
  2021: 40000,
  2022: 35000,
  2023: 30000,
  2024: 30000,
  2025: 30000
};
```

### **Brandstof Type Mapping:**
- **Elektrisch**: "Elektrisch", "elektriciteit"
- **Waterstof**: "waterstof", "hydrogen"  
- **Fossiel**: benzine, diesel, hybride, LPG, CNG
- **Special**: Tesla force naar "Elektrisch"

## 💡 **BUSINESS LOGIC FLOW**

1. **Input**: Kenteken/voertuigdata + IB-percentage
2. **RDW Lookup**: Extract DET jaar + brandstoftype
3. **Age Check**: Youngtimer/oldtimer override?
4. **Rule Lookup**: Match DET jaar met regeltabel
5. **Calculation**: Apply percentage + drempelwaarde
6. **Output**: Tekstueel + JSON response

Deze complete regels vervangen alle eerdere bijtelling implementaties in het project.
