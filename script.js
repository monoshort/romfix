/**
 * E₁₀₀-banden: CROW Kennisbank «Elasticiteitsmodulus, E», tabel 4.4.2 (classificatie, NEN 9997-1+C2:2017).
 * https://kennisbank.crow.nl/public/gastgebruiker/GEO/Construeren_met_grond/Elasticiteitsmodulus,_E/114237
 *
 * eRekenSuggestie (MPa): indicatieve stijfheid voor het Romfix-rekenveld — zelfde ordegrootte
 * als gangbare subfundering-invoer in gelaagde verharding, niet gelijk aan E₁₀₀ bij zeer zachte grond.
 */
const BODEM_TYPES = {
    bodem_veen_sl: { e100Label: '0,1–0,5 MPa (E₁₀₀, band)', eRekenSuggestie: 12 },
    bodem_veen_mat: { e100Label: '0,5–1,0 MPa (E₁₀₀, band)', eRekenSuggestie: 15 },
    bodem_klei_org: { e100Label: '0,2–2,0 MPa (E₁₀₀, band; organisch)', eRekenSuggestie: 18 },
    bodem_klei_sl: { e100Label: '0,5–1,5 MPa (E₁₀₀, band)', eRekenSuggestie: 25 },
    bodem_klei_mat: { e100Label: '1,0–3,0 MPa (E₁₀₀, band)', eRekenSuggestie: 35 },
    bodem_klei_vast: { e100Label: '2,0–5,0 MPa (E₁₀₀, band)', eRekenSuggestie: 55 },
    bodem_zand_silt: { e100Label: '8–35 MPa (E₁₀₀, band; siltig)', eRekenSuggestie: 65 },
    bodem_zand_los: { e100Label: '5–30 MPa (E₁₀₀, band)', eRekenSuggestie: 75 },
    bodem_zand_mat: { e100Label: '10–45 MPa (E₁₀₀, band)', eRekenSuggestie: 88 },
    bodem_zand_vast: { e100Label: '15–75 MPa (E₁₀₀, band)', eRekenSuggestie: 102 },
    bodem_grind: { e100Label: '15–90 MPa (E₁₀₀, band)', eRekenSuggestie: 115 }
};

function bodemIsGranulair(slug) {
    return /^bodem_zand_|^bodem_grind$/.test(slug);
}

function bodemRekenESuggestie(slug) {
    const row = BODEM_TYPES[slug];
    return row ? row.eRekenSuggestie : BODEM_TYPES.bodem_klei_mat.eRekenSuggestie;
}

/**
 * Indicatieve stijfheden — CROW Kennisbank «Stijfheid fundering», tabel 37 (ontwerp- en gebruiksbanden MPa);
 * https://kennisbank.crow.nl/public/gastgebruiker/ASFALT/Asfalt_in_de_weg-_en_waterbouw/Stijfheid_fundering/112542
 * E_hoofd / E_w: gekozen midden-binnen gangbare gebruiksspeling, passend bij Romfix-rekenvelden (In/W).
 * γ: indicatief volumiek gewicht (kN/m³), gangbare orde voor ongebonden korrelmaterialen — niet in de formule gebruikt.
 *
 * Bims: dichtheid werk verdicht ca. 850–1150 kg/m³ (CROW Handboek funderingsmaterialen — Bims puimsteen); E indicatief
 * (laag t.o.v. zand/steenslag i.v.m. verbrijzeling en lichte belasting).
 * Argex: geëxpandeerde / gebakken klei (handelsnaam); indicatieve moduli licht granulaat.
 * Schuimglas: glasgranulaat, los van Argex; E (In) 80 MPa in deze tool (Romfix-specificatie), E (W) tweede rekentak indicatief.
 */
const FUNDERINGS_AGGREGAAT = {
    agg_custom: { eHoofd: null, eW: null, gamma: null },
    agg_zand: { eHoofd: 120, eW: 55, gamma: 19.0 },
    agg_steenslag: { eHoofd: 220, eW: 85, gamma: 20.0 },
    agg_metselwerk: { eHoofd: 220, eW: 85, gamma: 20.5 },
    agg_menggranulaat: { eHoofd: 400, eW: 150, gamma: 21.0 },
    agg_betongranulaat: { eHoofd: 600, eW: 220, gamma: 21.5 },
    agg_bims: { eHoofd: 80, eW: 45, gamma: 10.0 },
    agg_schuimglas: { eHoofd: 80, eW: 48, gamma: 2.0 },
    agg_argex: { eHoofd: 175, eW: 78, gamma: 7.5 },
    agg_licht_capping: { eHoofd: 150, eW: 33, gamma: 20.0 },
    agg_licht_roadbase: { eHoofd: 250, eW: 148, gamma: 20.5 }
};

function berekenAdvies() {
    try {
        // === INPUTS OPHALEN ===
        const verkeersintensiteit = parseInt(document.getElementById('verkeersintensiteit').value) || 10;
        const ondergrond_type = document.getElementById('ondergrond_type').value;
        const breedte = parseFloat(document.getElementById('breedte').value) || 2.75;
        const levensduur = parseInt(document.getElementById('levensduur').value) || 20;

        const series_type = document.getElementById('series_type').value;

        let romfix_dikte = parseFloat(document.getElementById('romfix_dikte').value) || 300;
        const sif = parseFloat(document.getElementById('sif').value) || 10;
        const mif = parseFloat(document.getElementById('mif').value) || 4.5;
        const werkingsdikteRaw = parseFloat(document.getElementById('werkingsdikte').value);
        const werkingsdikte = Math.min(600, Math.max(50, Number.isFinite(werkingsdikteRaw) ? werkingsdikteRaw : 200));
        let e_ongewapend_in = parseFloat(document.getElementById('e_ongewapend_in').value) || 150;
        let e_ongewapend_w = parseFloat(document.getElementById('e_ongewapend_w').value) || 33;
        const bovenlaag_dikte = parseFloat(document.getElementById('bovenlaag_dikte').value) || 1050;
        const bovenlaag_e = parseFloat(document.getElementById('bovenlaag_e').value) || 5000;

        // === ONDERGROND BEPALEN ===
        const e_ondergrond_input = document.getElementById('e_ondergrond');
        const e_ondergrond_excel = e_ondergrond_input ? parseFloat(e_ondergrond_input.value) : NaN;
        let e_ondergrond = Number.isFinite(e_ondergrond_excel) && e_ondergrond_excel > 0
            ? e_ondergrond_excel
            : bodemRekenESuggestie(ondergrond_type);

        e_ondergrond = Math.max(8, Math.min(200, e_ondergrond));

        // === BASISWAARDEN ===
        const deklaag = 35;
        const onderlaag_theo_min = 25;
        const onderlaag_praktijk_min = 70;

        let zand_dikte = bodemIsGranulair(ondergrond_type) ? 200 : 300;

        // Asfalt aanpassing
        const extra_theo = Math.max(0, (verkeersintensiteit - 10) / 10 * 5);
        let onderlaag_theo = onderlaag_theo_min + extra_theo;
        let onderlaag_praktijk = Math.max(onderlaag_praktijk_min, Math.round(onderlaag_theo + 45));

        const romfix_nodig = !bodemIsGranulair(ondergrond_type);
        const romfix_omschrijving = romfix_nodig 
            ? "R’Tex geotextiel + E’Grid + 200 mm R’Cel + funderingsaggregaat" 
            : "Niet nodig";

        // === BEREKENINGEN (zoals in Excel) ===

        // 1. Sublaag-modulus (Austroads)
        // Excel: E_max = E_bovenlaag * 2^(h/125), vervolgens sublagen opbouwen richting E_ondergrond,
        // met een cap op E_ongewapend (granulaire laag kan niet stijver worden dan zichzelf).
        const e_ongewapend = (e_ongewapend_in + e_ongewapend_w) / 2;
        const e_max_raw = bovenlaag_e * Math.pow(2, romfix_dikte / 125);
        const e_max = Math.min(e_max_raw, e_ongewapend);
        const ratio = Math.pow(e_max / e_ondergrond, 1 / 5);
        let subs = [];
        let current = e_ondergrond;
        for (let i = 0; i < 5; i++) {
            current = Math.min(current * ratio, e_max);
            subs.push(Math.round(current));
        }
        const e_niv = Math.round(subs.reduce((a, b) => a + b, 0) / 5);

        // 2. Gewapend E
        // Excel (sheet2): ROUND(MIN(SIF * E_niv, MIF * E_ongewapend_in),0)
        const e_gewapend = Math.round(Math.min(sif * e_niv, mif * e_ongewapend_in));

        // 3. Laagopbouw splitsing
        const h_ong_hoog = Math.max(0, romfix_dikte - werkingsdikte);
        const h_gew = Math.min(werkingsdikte, romfix_dikte);
        const h_ong_laag = romfix_dikte - h_ong_hoog - h_gew;
        const e_ong = e_ongewapend;

        // 4. Equivalente modulus (Thenn de Barros)
        const sum_h = h_ong_hoog + h_gew + h_ong_laag;
        let sum_trans = 0;
        if (sum_h > 0) {
            sum_trans = h_ong_hoog * Math.pow(e_ong, 1/3) + 
                        h_gew * Math.pow(e_gewapend, 1/3) + 
                        h_ong_laag * Math.pow(e_ong, 1/3);
        }
        const e_eq = sum_h > 0 ? Math.pow(sum_trans / sum_h, 3) : 0;
        const e_eq_round = Math.round(e_eq);

        // 5. F2 (Palmer & Barber – vereenvoudigde tabel-interpolatie)
        const hr = romfix_dikte / 150;
        const e1e2 = e_eq / e_ondergrond || 1; // voorkom deling door 0

        const hr_values = [0.156, 0.312, 0.625, 1.25, 2.5, 5.0, 10.0];
        const e1e2_values = [1, 2, 5, 10, 20, 50, 100];
        const f_table = [
            [1.000, 0.966, 0.939, 0.925, 0.908, 0.869, 0.869],
            [1.000, 0.930, 0.867, 0.818, 0.756, 0.654, 0.654],
            [1.000, 0.839, 0.693, 0.600, 0.512, 0.405, 0.405],
            [1.000, 0.711, 0.494, 0.388, 0.307, 0.227, 0.227],
            [1.000, 0.614, 0.356, 0.250, 0.183, 0.126, 0.126],
            [1.000, 0.558, 0.279, 0.176, 0.117, 0.073, 0.073],
            [1.000, 0.529, 0.240, 0.138, 0.0836, 0.0466, 0.0466]
        ];

        function interpolate(x, y, tx, ty, table) {
            let i = 0, j = 0;
            for (i = 0; i < tx.length - 1; i++) if (x <= tx[i+1]) break;
            for (j = 0; j < ty.length - 1; j++) if (y <= ty[j+1]) break;
            const x1 = tx[i], x2 = tx[i+1] || x1;
            const y1 = ty[j], y2 = ty[j+1] || y1;
            const f11 = table[i][j];
            const f12 = table[i][j+1] !== undefined ? table[i][j+1] : f11;
            const f21 = table[i+1] ? table[i+1][j] : f11;
            const f22 = table[i+1] && table[i+1][j+1] !== undefined ? table[i+1][j+1] : f11;

            const fx1 = f11 + ((f21 - f11) / (x2 - x1)) * (x - x1);
            const fx2 = f12 + ((f22 - f12) / (x2 - x1)) * (x - x1);
            const f = fx1 + ((fx2 - fx1) / (y2 - y1)) * (y - y1);
            return f;
        }

        const f2 = interpolate(hr, e1e2, hr_values, e1e2_values, f_table);
        const f2_round = parseFloat(f2).toFixed(3);

        // 6. Gecorrigeerde E_eq
        const e_eq_gecorr = Math.round(e_eq * parseFloat(f2));

        // Levensduur schatting
        let levensduur_basis = 72.2 * (10 / verkeersintensiteit) * (20 / levensduur);
        const bonus = Math.max(0, (e_eq_gecorr - 100) / 100 * 0.15);
        let geschatte_levensduur = levensduur_basis * (1 + bonus);
        geschatte_levensduur = Math.round(geschatte_levensduur * 10) / 10;

        const levensduur_status = geschatte_levensduur >= levensduur 
            ? "geschat voldoende lang voor uw gekozen jaren" 
            : "geschat aan de korte kant — overweeg dikkere lagen of minder verkeer";

        // Totale dikte
        const totale_dikte = deklaag + onderlaag_praktijk + romfix_dikte + zand_dikte;

        // === OUTPUT ===
        const resultEl = document.getElementById('result');
        resultEl.style.display = 'block';

        // Lagen vullen
        const lagenList = document.getElementById('lagen');
        lagenList.innerHTML = '';
        const lagenArray = [
            `Slijt- / deklaag: ${deklaag} mm (AC 11 surf DL-B)`,
            `Bind- / onderlaag asfalt: ${onderlaag_praktijk} mm (AC 22 base OL-B; theoretisch minimum ca. ${Math.round(onderlaag_theo)} mm)`,
            `Romfix-fundering: ${romfix_dikte} mm — ${romfix_omschrijving}`,
            `Wapening in rekening: ja (draagsteun SIF ${sif}, stijfheid MIF ${mif})`,
            `Zandbed / tussenlaag: ${zand_dikte} mm`,
            `Ondergrond — rekenwaarde stijfheid (E-modulus): ${e_ondergrond} MPa`
        ];
        lagenArray.forEach(txt => {
            const li = document.createElement('li');
            li.textContent = txt;
            lagenList.appendChild(li);
        });

        document.getElementById('totale_dikte').textContent = totale_dikte;
        document.getElementById('geschatte_levensduur').textContent = geschatte_levensduur + ` (${levensduur_status})`;

        // Berekeningen tonen
        const berekeningen = document.getElementById('berekeningen');
        berekeningen.innerHTML = `
            <div class="calculation-step"><strong>1. Stijfheid tussen ondergrond en menggranulaat</strong> (methode Austroads)<br>
                Maximum in dit model: ${Math.round(e_max)} MPa<br>
                Verhouding per stap: ${ratio.toFixed(4)}<br>
                Tussenlagen (van diep naar ondiep): ${subs[4]}, ${subs[3]}, ${subs[2]}, ${subs[1]}, ${subs[0]} MPa<br>
                Gemiddelde stijfheid daarvan (E<sub>niv</sub>): ${e_niv} MPa</div>

            <div class="calculation-step"><strong>2. Stijfheid van het gewapende Romfix-deel</strong><br>
                De rekenregel neemt het gunstigste van twee opties: SIF × gemiddelde sublaag of MIF × stijfheid granulaat (hoofdwaarde).<br>
                E<sub>gewapend</sub> = min(${sif} × ${e_niv}, ${mif} × ${e_ongewapend_in}) = ${Math.round(e_gewapend)} MPa</div>

            <div class="calculation-step"><strong>3. Verdeling over de Romfix-dikte</strong><br>
                Ongewapend (boven E&rsquo;Grid / R&rsquo;Cel): ${h_ong_hoog} mm — E = ${e_ong} MPa<br>
                Gewapend Romfix (E&rsquo;Grid + R&rsquo;Cel): ${h_gew} mm — E = ${e_gewapend} MPa<br>
                Ongewapend (onder E&rsquo;Grid / R&rsquo;Cel): ${h_ong_laag} mm — E = ${e_ong} MPa</div>

            <div class="calculation-step"><strong>4. Gemiddelde stijfheid van het hele Romfix-pakket</strong> (Thenn de Barros)<br>
                Tussenstap (gewogen volgens de formule): ${sum_trans.toFixed(2)}<br>
                E<sub>eq</sub> = ${e_eq_round} MPa</div>

            <div class="calculation-step"><strong>5. Correctie voor de zachtere ondergrond eronder</strong> (Palmer &amp; Barber)<br>
                Verhouding dikte (${(romfix_dikte / 150).toFixed(2)}) en stijfheid Romfix t.o.v. ondergrond (${(e_eq / e_ondergrond).toFixed(2)})<br>
                Factor F2 = ${f2_round}</div>

            <div class="calculation-step"><strong>6. Stijfheid na correctie</strong> (meegenomen effect van de ondergrond)<br>
                ${e_eq_round} × ${f2_round} ≈ ${e_eq_gecorr} MPa</div>
        `;

        // Opmerkingen
        const opmList = document.getElementById('opmerkingen');
        opmList.innerHTML = '';
        const opmerkingen = [
            `Levensduur: ${levensduur_status} (inclusief een kleine meerekening als de stijfheid gunstig uitpakt).`,
            `Bij zachte bodem past Romfix meestal goed; controleer voor uw project altijd bij een ingenieur of Romfix.`,
            `Deze stappen volgen dezelfde logica als het Romfix-rekenmodel (Austroads, Thenn de Barros, Palmer & Barber).`,
            breedte < 2.75 ? `Smalle rijbaan: vaak extra maatregelen aan de zijkant (bijvoorbeeld beschoeiing) bespreken.` : `Rijbaanbreedte: in beginsel geen bijzonder kanttekening voor stabiliteit in deze scan.`,
            `Alle cijfers zijn indicatief; definitieve waarden volgen uit het officiële Romfix-dossier of projectberekening.`
        ];
        opmerkingen.forEach(txt => {
            const li = document.createElement('li');
            li.textContent = txt;
            opmList.appendChild(li);
        });

        // UX: spring naar het resultaat na berekenen
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        alert("De berekening kon niet worden afgerond.\nControleer of alle velden geldige getallen bevatten.\n\nTechnische melding: " + error.message);
        console.error("Berekeningsfout:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primaryNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', (e) => {
        const link = e.target instanceof Element ? e.target.closest('a') : null;
        if (!link) return;
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    });

    const eOndergrond = document.getElementById('e_ondergrond');
    const mif = document.getElementById('mif');
    const eOngewapendIn = document.getElementById('e_ongewapend_in');
    const eOngewapendW = document.getElementById('e_ongewapend_w');
    const seriesType = document.getElementById('series_type');
    const funderingsAggregaat = document.getElementById('funderingsaggregaat');

    function applySeriesDefaults() {
        if (!seriesType) return;
        if (seriesType.value === 'roadbase') {
            if (mif) mif.value = '4.3';
        } else {
            if (mif) mif.value = '4.5';
        }
        syncAggregaatMetProductlijn();
    }

    function syncAggregaatMetProductlijn() {
        if (!funderingsAggregaat || !seriesType) return;
        if (funderingsAggregaat.value !== 'agg_auto_product') return;
        applyAggregaatPreset();
    }

    function applyAggregaatPreset() {
        if (!funderingsAggregaat) return;
        let key = funderingsAggregaat.value;
        if (key === 'agg_custom') return;
        if (key === 'agg_auto_product' && seriesType) {
            key = seriesType.value === 'roadbase' ? 'agg_licht_roadbase' : 'agg_licht_capping';
        }
        const row = FUNDERINGS_AGGREGAAT[key];
        if (!row || row.eHoofd == null) return;
        if (eOngewapendIn) eOngewapendIn.value = String(row.eHoofd);
        if (eOngewapendW) eOngewapendW.value = String(row.eW);
    }

    if (funderingsAggregaat) {
        funderingsAggregaat.addEventListener('change', applyAggregaatPreset);
    }

    function applyBodemStijfheid() {
        const sel = document.getElementById('ondergrond_type');
        if (!sel || !eOndergrond) return;
        eOndergrond.value = String(bodemRekenESuggestie(sel.value));
    }

    if (seriesType) {
        seriesType.addEventListener('change', applySeriesDefaults);
        applySeriesDefaults();
    }

    const ondergrondSel = document.getElementById('ondergrond_type');
    if (ondergrondSel) {
        ondergrondSel.addEventListener('change', applyBodemStijfheid);
        applyBodemStijfheid();
    }
});