def verhardingsadvies_tool(verkeersintensiteit=10, ondergrond_type='veen_klei', breedte=2.75, levensduur=20):
    """
    Tool voor verhardingsadvies gebaseerd op het Hoornaar-document.
    
    Inputs:
    - verkeersintensiteit: Aantal vrachtwagens per werkdag per richting (int, default 10)
    - ondergrond_type: 'zand', 'klei' of 'veen_klei' (str, default 'veen_klei')
    - breedte: Wegbreedte in meters (float, default 2.75)
    - levensduur: Gewenste ontwerplevensduur in jaren (int, default 20)
    
    Output: Een dictionary met aanbeveling voor lagen, totale dikte, geschatte levensduur en opmerkingen.
    """
    # Basiswaarden uit document
    base_asfalt_deklaag = 35  # mm AC 11 surf DL-B
    base_asfalt_onderlaag_theoretisch = 25  # mm AC 22 base OL-B
    base_asfalt_onderlaag_praktijk = 70
    fundering_dikte = 300  # mm geocel + menggranulaat (Romfix)
    zand_dikte = 300  # mm zand
    e_ondergrond = 30 if ondergrond_type == 'veen_klei' else (76 if ondergrond_type == 'klei' else 100)  # MPa uit PDF
    
    # Pas asfalt aan op verkeersintensiteit (simple scaling: +5mm per 10 extra vrachtwagens)
    extra_verkeer_factor = max(0, (verkeersintensiteit - 10) / 10 * 5)
    asfalt_onderlaag_theoretisch = base_asfalt_onderlaag_theoretisch + extra_verkeer_factor
    asfalt_onderlaag_praktijk = max(base_asfalt_onderlaag_praktijk, asfalt_onderlaag_theoretisch + 45)  # Min. 70mm voor verdichting
    
    # Pas op ondergrond: Bij zand minder zandlaag
    if ondergrond_type == 'zand':
        zand_dikte = 200
        romfix_aanbevolen = False
    else:
        romfix_aanbevolen = True
    
    # Schat levensduur (gebaseerd op PDF: bij 10 vrachtwagens 72 jaar; schaalt omgekeerd met verkeer)
    geschatte_levensduur = 72 * (10 / verkeersintensiteit) * (20 / levensduur)  # Simple approximatie
    opmerking_levensduur = "Voldoet aan doel." if geschatte_levensduur >= levensduur else "Te kort; overweeg dikkere lagen."
    
    # Romfix details
    romfix_details = "R’tex geotextiel als scheidingsdoek, E’grid met 200 mm R’cel, gevuld met 300 mm menggranulaat." if romfix_aanbevolen else "Niet nodig op stevige ondergrond."
    
    # Totale opbouw
    lagen = {
        'Deklaag': f"{base_asfalt_deklaag} mm AC 11 surf DL-B",
        'Onderlaag': f"{asfalt_onderlaag_praktijk} mm AC 22 base OL-B (theoretisch {asfalt_onderlaag_theoretisch:.0f} mm)",
        'Fundering': f"{fundering_dikte} mm geocel + menggranulaat (Romfix: {romfix_details})",
        'Funderingswapening': "Geïntegreerd in Romfix" if romfix_aanbevolen else "Niet aanbevolen",
        'Zand': f"{zand_dikte} mm zand",
        'Ondergrond E-modulus': f"{e_ondergrond} MPa"
    }
    totale_dikte = base_asfalt_deklaag + asfalt_onderlaag_praktijk + fundering_dikte + zand_dikte
    
    # Output
    result = {
        'Aanbevolen opbouw': lagen,
        'Totale dikte (mm)': totale_dikte,
        'Geschatte levensduur (jaren)': round(geschatte_levensduur, 1),
        'Opmerkingen': [
            opmerking_levensduur,
            f"Berekening geïnspireerd op OIA 2.0 en funderingswapening uit document (E-fundering ~633 MPa bij Romfix).",
            "Voor breedte < 2.75m: Overweeg extra randversterking (houten beschoeiing).",
            "Dit is een approximatie; raadpleeg expert voor exacte OIA-berekening."
        ]
    }
    return result

# Voorbeeld gebruik
advies = verhardingsadvies_tool(verkeersintensiteit=15, ondergrond_type='veen_klei', breedte=3.0, levensduur=25)
print("Aanbeveling:")
for key, value in advies.items():
    print(f"{key}: {value}")