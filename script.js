/**
 * Normatieve basis: Excel-werkboek «sterkteberekingen funderingswapening Romfix» (tabbladen Capping_Romfix /
 * RoadBase_Romfix) — dezelfde rekenketen (o.a. Austroads, Thenn de Barros, Palmer & Barber) als in dat model.
 * Aanvullingen (Romfix-referentie bodem/aggregaten, MIF-tabellen uit losse Romfix-documentatie, OIA-indicatie)
 * ondersteunen en mogen nooit impliciet de Excel-defaults vervangen zonder expliciete keuze van de gebruiker.
 *
 * E₁₀₀-banden: CROW Kennisbank «Elasticiteitsmodulus, E», tabel 4.4.2 (classificatie, NEN 9997-1+C2:2017).
 * https://kennisbank.crow.nl/public/gastgebruiker/GEO/Construeren_met_grond/Elasticiteitsmodulus,_E/114237
 *
 * eRekenSuggestie (MPa): indicatieve stijfheid voor het Romfix-rekenveld — zelfde ordegrootte
 * als gangbare subfundering-invoer in gelaagde verharding, niet gelijk aan E₁₀₀ bij zeer zachte grond.
 */
const BODEM_TYPES = {
    /** Romfix-referentie (interne aanname t.b.v. MIF-tabellen / fundering) */
    bodem_rf_veen_slaklei: { e100Label: 'Romfix-referentie: veen / slappe klei — E_fundering ca. 30 MPa', eRekenSuggestie: 30 },
    bodem_rf_klei_vast: { e100Label: 'Romfix-referentie: vaste klei — E_fundering ca. 50 MPa', eRekenSuggestie: 50 },
    bodem_rf_zand: { e100Label: 'Romfix-referentie: zand — E_fundering ca. 100 MPa', eRekenSuggestie: 100 },
    bodem_rf_zand_gegradeerd: { e100Label: 'Romfix-referentie: goed gegradeerd zand — E_fundering ca. 120 MPa', eRekenSuggestie: 120 },
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
    return /^bodem_zand_|^bodem_grind$/.test(slug) || slug === 'bodem_rf_zand' || slug === 'bodem_rf_zand_gegradeerd';
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
/** E(In) conform interne Romfix-referentie (Paul); E(W) indicatief tweede rekentak. */
const FUNDERINGS_AGGREGAAT = {
    agg_custom: { eHoofd: null, eW: null, gamma: null },
    agg_zand: { eHoofd: 120, eW: 55, gamma: 19.0 },
    agg_steenslag: { eHoofd: 150, eW: 75, gamma: 20.0 },
    agg_metselwerk: { eHoofd: 150, eW: 75, gamma: 20.5 },
    agg_menggranulaat: { eHoofd: 400, eW: 150, gamma: 21.0 },
    agg_betongranulaat: { eHoofd: 600, eW: 220, gamma: 21.5 },
    agg_bims: { eHoofd: 125, eW: 55, gamma: 10.0 },
    agg_schuimglas: { eHoofd: 50, eW: 28, gamma: 2.0 },
    agg_argex: { eHoofd: 175, eW: 78, gamma: 7.5 },
    agg_licht_capping: { eHoofd: 150, eW: 33, gamma: 20.0 },
    agg_licht_roadbase: { eHoofd: 250, eW: 148, gamma: 20.5 }
};

/**
 * MIF zoals in het Excel-werkboek, eerste wapeningsrij (cel E19; SIF 10 in standaardvoorbeeld).
 * Tweede rij (E20) in Excel: Capping 4,8 — RoadBase 3,8 — bij één laag in deze tool volgt u E19;
 * voor de tweede Excel-rij: zet MIF handmatig.
 */
const EXCEL_MIF_STANDAARD = {
    capping: 4.5,
    roadbase: 4.3
};

/** Excel «Invoer funderingswapening» tweede wapeningsrij (E20 / rij 20). */
const EXCEL_MIF_RIJ2 = {
    capping: 4.8,
    roadbase: 3.8
};

function excelMifVoorProductlijn(seriesType) {
    return seriesType === 'roadbase' ? EXCEL_MIF_STANDAARD.roadbase : EXCEL_MIF_STANDAARD.capping;
}

function excelMifRij2(seriesType) {
    return seriesType === 'roadbase' ? EXCEL_MIF_RIJ2.roadbase : EXCEL_MIF_RIJ2.capping;
}

/** Tweede rekentak W (MPa) bij modus «vast» + menggranulaat — ontwerppraktijk Chris t.o.v. Excel/Paul (33 MPa). */
const W_VAST_MENG_CHRIS_MPA = 300;

/**
 * Indicatieve SIF-schaal op ondergrond: zachter → hogere factor (max. ca. +12 %), stijver → lager (max. ca. –8 %).
 * Alleen actief bij keuze «indicatief_bodem»; standaard blijven de vaste Chris/Excel-waarden 5 / 7,6 / 10.
 */
function sifFactorFromBodem(eOnderMpa) {
    const e = Math.min(200, Math.max(8, eOnderMpa));
    const pivot = 70;
    const raw = (pivot - e) / 350;
    return Math.max(0.92, Math.min(1.12, 1 + raw));
}

function sifBasisVoorConfig(wapeningConfig) {
    const sifMap = { grid_only: 5.0, cell_only: 7.6, grid_cell: 10.0 };
    return sifMap[wapeningConfig] || 10.0;
}

/**
 * MIF-tabellen ROMFIX® R'Cel en R'Cel + E'Grid (Romfix-documentatie), meewerkende hoogte max. 300 mm.
 * Rijen: stijfheid onderbouw (MPa) 40…220. Kolommen: stijfheid infill (MPa).
 * Celinhoud is 1:1 gelijk aan de officiële tabellen; interpolatie 2D in mifInterpGrid().
 * Op sommige bronplaten staat de laatste twee kolommen visueel als «225»; de achtste kolom in het rooster
 * hoort bij de hoogste infill-as (in code 250 MPa) zodat de as strikt stijgend blijft voor interpolatie.
 */
const MIF_SUB = [40, 60, 80, 100, 120, 140, 160, 180, 200, 220];
const MIF_INF = [75, 100, 125, 150, 175, 200, 225, 250];

const MIF_TABLE_RCEL = [
    [3.3, 2.9, 2.6, 2.3, 2.1, 1.9, 1.8, 1.7],
    [3.4, 3.0, 2.7, 2.4, 2.2, 2.0, 1.9, 1.8],
    [3.4, 3.1, 2.8, 2.5, 2.3, 2.1, 2.0, 1.9],
    [3.5, 3.1, 2.8, 2.6, 2.3, 2.2, 2.0, 1.9],
    [3.6, 3.2, 2.9, 2.6, 2.4, 2.2, 2.1, 2.0],
    [3.7, 3.3, 3.0, 2.7, 2.5, 2.3, 2.2, 2.1],
    [3.7, 3.4, 3.0, 2.8, 2.5, 2.4, 2.2, 2.1],
    [3.8, 3.4, 3.1, 2.8, 2.6, 2.4, 2.3, 2.2],
    [3.8, 3.5, 3.1, 2.9, 2.6, 2.5, 2.3, 2.3],
    [3.9, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4, 2.3]
];

const MIF_TABLE_RCEL_GRID = [
    [4.8, 4.3, 3.8, 3.4, 3.1, 2.8, 2.6, 2.5],
    [4.9, 4.4, 3.9, 3.5, 3.2, 2.9, 2.7, 2.6],
    [5.0, 4.5, 4.0, 3.6, 3.3, 3.1, 2.9, 2.7],
    [5.2, 4.6, 4.2, 3.7, 3.4, 3.2, 3.0, 2.9],
    [5.3, 4.7, 4.3, 3.9, 3.5, 3.3, 3.1, 3.0],
    [5.4, 4.8, 4.4, 4.0, 3.6, 3.4, 3.2, 3.1],
    [5.4, 4.9, 4.4, 4.0, 3.7, 3.5, 3.3, 3.1],
    [5.5, 5.0, 4.5, 4.1, 3.8, 3.5, 3.3, 3.2],
    [5.6, 5.1, 4.6, 4.2, 3.9, 3.6, 3.4, 3.3],
    [5.7, 5.1, 4.7, 4.3, 3.9, 3.7, 3.5, 3.4]
];

/**
 * 2D interpolatie op een rechthoekig rooster; lineair extrapoleren buiten het bereik.
 * x = onderbouw (MPa), y = infill (MPa); z[i][j] = MIF bij (MIF_SUB[i], MIF_INF[j]).
 */
function mifInterpGrid(x, y, z) {
    const xs = MIF_SUB;
    const ys = MIF_INF;

    function clampSegment(val, arr, ensureMinWidth) {
        const n = arr.length;
        if (n < 2) return { i0: 0, i1: 0, t: 0 };
        if (val <= arr[0]) {
            const i0 = 0;
            const i1 = 1;
            const span = arr[i1] - arr[i0] || ensureMinWidth;
            const t = (val - arr[i0]) / span;
            return { i0, i1, t };
        }
        if (val >= arr[n - 1]) {
            const i0 = n - 2;
            const i1 = n - 1;
            const span = arr[i1] - arr[i0] || ensureMinWidth;
            const t = (val - arr[i0]) / span;
            return { i0, i1, t };
        }
        let i = 0;
        for (; i < n - 1; i++) {
            if (val <= arr[i + 1]) break;
        }
        const i0 = i;
        const i1 = i + 1;
        const span = arr[i1] - arr[i0] || ensureMinWidth;
        const t = (val - arr[i0]) / span;
        return { i0, i1, t };
    }

    const rx = clampSegment(x, xs, 1);
    const ry = clampSegment(y, ys, 1);

    const f00 = z[rx.i0][ry.i0];
    const f01 = z[rx.i0][ry.i1];
    const f10 = z[rx.i1][ry.i0];
    const f11 = z[rx.i1][ry.i1];

    const bottom = f00 + (f10 - f00) * rx.t;
    const top = f01 + (f11 - f01) * rx.t;
    return bottom + (top - bottom) * ry.t;
}

/**
 * Alleen GeoGrid: geen R'Cel-tabel — indicatieve MIF als fractie van R'Cel-tabel (SIF-grid / SIF-cel).
 */
const MIF_GRID_ONLY_SCALE = 5.0 / 7.6;

function mifFromRomfixTables(wapeningConfig, eOnderbouw, eInfill) {
    const x = Math.max(1, eOnderbouw);
    const y = Math.max(1, eInfill);
    let base;
    if (wapeningConfig === 'cell_only') {
        base = mifInterpGrid(x, y, MIF_TABLE_RCEL);
    } else if (wapeningConfig === 'grid_cell') {
        base = mifInterpGrid(x, y, MIF_TABLE_RCEL_GRID);
    } else {
        base = mifInterpGrid(x, y, MIF_TABLE_RCEL) * MIF_GRID_ONLY_SCALE;
    }
    return Math.round(Math.max(1.0, Math.min(20, base)) * 100) / 100;
}

/** Thenn de Barros: bijdrage Romfix-blok (T mm, werkingsdikte mm, E_ong, E_gewapend). */
function thennRomfixBlok(T_mm, werk_mm, eOng, eGew) {
    const hOngHoog = Math.max(0, T_mm - werk_mm);
    const hGew = Math.min(werk_mm, T_mm);
    const hOngLaag = T_mm - hOngHoog - hGew;
    const cube = (h, e) => (h > 0 ? h * Math.pow(e, 1 / 3) : 0);
    return cube(hOngHoog, eOng) + cube(hGew, eGew) + cube(hOngLaag, eOng);
}

function berekenAdvies() {
    try {
        // === INPUTS OPHALEN ===
        const verkeersintensiteit = parseInt(document.getElementById('verkeersintensiteit').value) || 10;
        const ondergrond_type = document.getElementById('ondergrond_type').value;
        const breedte = parseFloat(document.getElementById('breedte').value) || 2.75;
        const levensduur = parseInt(document.getElementById('levensduur').value) || 20;
        const rekenmethode = document.getElementById('rekenmethode')?.value || 'romfix';
        const bereken_doel = document.getElementById('bereken_doel')?.value || 'romfix_stijfheid';

        const series_type = document.getElementById('series_type').value;
        const wapening_config = document.getElementById('wapening_config')?.value || 'grid_cell';
        const funderings_agg_keuze = document.getElementById('funderingsaggregaat')?.value || 'agg_auto_product';
        const wMode = document.getElementById('e_ongewapend_w_mode')?.value || 'vast';

        let romfix_dikte = parseFloat(document.getElementById('romfix_dikte').value) || 300;
        const sifMode = document.getElementById('sif_mode')?.value || 'vast';
        const sifBase = sifBasisVoorConfig(wapening_config);
        let sif = sifBase;
        const sifInput = document.getElementById('sif');
        let werkingsdikte = parseFloat(document.getElementById('werkingsdikte')?.value);
        if (!Number.isFinite(werkingsdikte)) werkingsdikte = 150;
        werkingsdikte = Math.max(1, Math.min(400, werkingsdikte));

        let romfix_dikte_2 = parseFloat(document.getElementById('romfix_dikte_2')?.value);
        if (!Number.isFinite(romfix_dikte_2)) romfix_dikte_2 = 0;
        romfix_dikte_2 = Math.max(0, romfix_dikte_2);

        let werkingsdikte_2 = parseFloat(document.getElementById('werkingsdikte_2')?.value);
        if (romfix_dikte_2 > 0) {
            if (!Number.isFinite(werkingsdikte_2)) werkingsdikte_2 = 300;
            werkingsdikte_2 = Math.max(1, Math.min(400, werkingsdikte_2));
        } else {
            werkingsdikte_2 = 0;
        }

        let e_ongewapend_in = parseFloat(document.getElementById('e_ongewapend_in').value) || 150;
        let e_ongewapend_w = parseFloat(document.getElementById('e_ongewapend_w').value) || 33;
        const bovenlaag_dikte = parseFloat(document.getElementById('bovenlaag_dikte').value) || 1050;
        const bovenlaag_e = parseFloat(document.getElementById('bovenlaag_e').value) || 5000;
        const wInputEl = document.getElementById('e_ongewapend_w');
        if (wMode === 'vast') {
            if (funderings_agg_keuze === 'agg_menggranulaat') {
                e_ongewapend_w = W_VAST_MENG_CHRIS_MPA;
                if (wInputEl) wInputEl.value = String(W_VAST_MENG_CHRIS_MPA);
            } else if (funderings_agg_keuze === 'agg_auto_product') {
                const ak = series_type === 'roadbase' ? 'agg_licht_roadbase' : 'agg_licht_capping';
                e_ongewapend_w = FUNDERINGS_AGGREGAAT[ak].eW;
                if (wInputEl) wInputEl.value = String(e_ongewapend_w);
            }
        }

        // === ONDERGROND BEPALEN ===
        const e_ondergrond_input = document.getElementById('e_ondergrond');
        const e_ondergrond_excel = e_ondergrond_input ? parseFloat(e_ondergrond_input.value) : NaN;
        let e_ondergrond = Number.isFinite(e_ondergrond_excel) && e_ondergrond_excel > 0
            ? e_ondergrond_excel
            : bodemRekenESuggestie(ondergrond_type);

        e_ondergrond = Math.max(8, Math.min(200, e_ondergrond));

        if (sifMode === 'indicatief_bodem') {
            sif = Math.round(sifBase * sifFactorFromBodem(e_ondergrond) * 10) / 10;
        }
        if (sifInput) sifInput.value = sif.toFixed(1);

        const mifManualEl = document.getElementById('mif_manual_override');
        const mifManual = !!(mifManualEl && mifManualEl.checked);
        const mifInputEl = document.getElementById('mif');
        const mifSource = document.getElementById('mif_source')?.value || 'excel';
        let mif;
        if (mifManual) {
            mif = parseFloat(mifInputEl?.value) || excelMifVoorProductlijn(series_type);
            if (mifInputEl) mifInputEl.readOnly = false;
        } else if (mifSource === 'excel') {
            mif = excelMifVoorProductlijn(series_type);
            if (mifInputEl) {
                mifInputEl.value = mif.toFixed(2);
                mifInputEl.readOnly = true;
            }
        } else {
            mif = mifFromRomfixTables(wapening_config, e_ondergrond, e_ongewapend_in);
            if (mifInputEl) {
                mifInputEl.value = mif.toFixed(2);
                mifInputEl.readOnly = true;
            }
        }

        const mif2ManualEl = document.getElementById('mif2_manual_override');
        const mif2Manual = !!(mif2ManualEl && mif2ManualEl.checked);
        const mif2InputEl = document.getElementById('mif_2');
        let mif2 = excelMifRij2(series_type);
        if (romfix_dikte_2 > 0) {
            if (mif2Manual) {
                mif2 = parseFloat(mif2InputEl?.value) || excelMifRij2(series_type);
                if (mif2InputEl) mif2InputEl.readOnly = false;
            } else if (mifSource === 'excel') {
                mif2 = excelMifRij2(series_type);
                if (mif2InputEl) {
                    mif2InputEl.value = mif2.toFixed(2);
                    mif2InputEl.readOnly = true;
                }
            } else {
                mif2 = mifFromRomfixTables(wapening_config, e_ondergrond, e_ongewapend_in);
                if (mif2InputEl) {
                    mif2InputEl.value = mif2.toFixed(2);
                    mif2InputEl.readOnly = true;
                }
            }
        } else if (mif2InputEl) {
            mif2InputEl.readOnly = true;
            if (!mif2Manual) {
                mif2InputEl.value = excelMifRij2(series_type).toFixed(2);
            }
        }

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
        const geocelType = document.getElementById('geocel_type')?.value || 'rcel_150';
        const rcelHoogteMm = geocelType === 'rcel_200' ? 200 : 150;
        const romfix_omschrijving = romfix_nodig
            ? `R\u2019Tex geotextiel + E\u2019Grid + ${rcelHoogteMm} mm R\u2019Cel + funderingsaggregaat`
            : 'Niet nodig';

        // === BEREKENINGEN (zoals in Excel) ===

        // 1. Sublaag-modulus (Austroads)
        // Excel: E_max = E_bovenlaag * 2^(h/125), vervolgens sublagen opbouwen richting E_ondergrond,
        // met een cap op E_ongewapend (granulaire laag kan niet stijver worden dan zichzelf).
        const e_ongewapend = (e_ongewapend_in + e_ongewapend_w) / 2;
        // Bovenlaag_dikte: zoals Excel «Invoer wegconstructie» rij boven Romfix (exclusief Romfix-laaglagen).
        const e_max_raw = bovenlaag_e * Math.pow(2, bovenlaag_dikte / 125);
        const e_max = Math.min(e_max_raw, e_ongewapend);
        const ratio = Math.pow(e_max / e_ondergrond, 1 / 5);
        let subs = [];
        let current = e_ondergrond;
        for (let i = 0; i < 5; i++) {
            current = Math.min(current * ratio, e_max);
            subs.push(Math.round(current));
        }
        const e_niv = Math.round(subs.reduce((a, b) => a + b, 0) / 5);

        // 2. Gewapend E (per Romfix-blok waar van toepassing)
        // Excel: ROUND(MIN(SIF * E_niv, MIF * E_ongewapend_in),0)
        const e_gewapend = Math.round(Math.min(sif * e_niv, mif * e_ongewapend_in));
        const e_gewapend_2 = romfix_dikte_2 > 0
            ? Math.round(Math.min(sif * e_niv, mif2 * e_ongewapend_in))
            : 0;

        // 3. Laagopbouw splitsing (eerste blok — voor uitleg)
        const h_ong_hoog = Math.max(0, romfix_dikte - werkingsdikte);
        const h_gew = Math.min(werkingsdikte, romfix_dikte);
        const h_ong_laag = romfix_dikte - h_ong_hoog - h_gew;
        const e_ong = e_ongewapend;

        const romfix_tot = romfix_dikte + romfix_dikte_2;
        let h2_ong_hoog = 0;
        let h2_gew = 0;
        let h2_ong_laag = 0;
        if (romfix_dikte_2 > 0) {
            h2_ong_hoog = Math.max(0, romfix_dikte_2 - werkingsdikte_2);
            h2_gew = Math.min(werkingsdikte_2, romfix_dikte_2);
            h2_ong_laag = romfix_dikte_2 - h2_ong_hoog - h2_gew;
        }

        // 4. Equivalente modulus (Thenn de Barros) — één of twee Romfix-blokken onder elkaar (Excel-stapel)
        let sum_trans = thennRomfixBlok(romfix_dikte, werkingsdikte, e_ong, e_gewapend);
        if (romfix_dikte_2 > 0) sum_trans += thennRomfixBlok(romfix_dikte_2, werkingsdikte_2, e_ong, e_gewapend_2);
        const e_eq = romfix_tot > 0 ? Math.pow(sum_trans / romfix_tot, 3) : 0;
        const e_eq_round = Math.round(e_eq);

        // 5. F2 (Palmer & Barber – vereenvoudigde tabel-interpolatie)
        const hr = romfix_tot / 150;
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

        // OIA-indicatie (vereenvoudigd, vergelijkend)
        const oia_levensduur = Math.round((72.0 * (10 / verkeersintensiteit) * (20 / levensduur)) * 10) / 10;
        const oia_status = oia_levensduur >= levensduur
            ? "voldoet indicatief"
            : "onder doel, zwaardere opbouw nodig";
        const oia_onderlaag = Math.max(70, Math.round(25 + Math.max(0, (verkeersintensiteit - 10) / 10 * 5) + 45));
        const oia_totale_dikte = 35 + oia_onderlaag + (romfix_nodig ? romfix_tot : 0) + zand_dikte;

        // Totale dikte
        const totale_dikte = deklaag + onderlaag_praktijk + romfix_tot + zand_dikte;

        // === OUTPUT ===
        const resultEl = document.getElementById('result');
        resultEl.style.display = 'block';
        const methodResult = document.getElementById('method_result');

        // Lagen vullen
        const lagenList = document.getElementById('lagen');
        lagenList.innerHTML = '';
        const romfixLijn = romfix_dikte_2 > 0
            ? [
                `Romfix-laag 1 (onder bindlaag): ${romfix_dikte} mm — ${romfix_omschrijving}; MIF ${mif.toFixed(2)}`,
                `Romfix-laag 2 (onder laag 1): ${romfix_dikte_2} mm — ${romfix_omschrijving}; MIF ${mif2.toFixed(2)}`
            ]
            : [`Romfix-fundering: ${romfix_dikte} mm — ${romfix_omschrijving}`];
        const wapeningZin = romfix_dikte_2 > 0
            ? `Wapening: SIF ${sif}; MIF laag 1 = ${mif.toFixed(2)}, laag 2 = ${mif2.toFixed(2)}`
            : `Wapening in rekening: ja (draagsteun SIF ${sif}, stijfheid MIF ${mif.toFixed(2)})`;
        const lagenArray = [
            `Slijt- / deklaag: ${deklaag} mm (AC 11 surf DL-B)`,
            `Bind- / onderlaag asfalt: ${onderlaag_praktijk} mm (AC 22 base OL-B; theoretisch minimum ca. ${Math.round(onderlaag_theo)} mm)`,
            ...romfixLijn,
            wapeningZin,
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

        const workflowBlok = `
            <div class="calculation-step workflow-note">
                <strong>Kern</strong> = zelfde rekenketen als het Romfix Excel-werkboek (Austroads → SIF/MIF → Thenn de Barros → Palmer &amp; Barber). <strong>Aanvullingen</strong> = o.a. OIA-indicatie, MIF-tabellen bodem/vulling, indicatieve SIF-trend — optioneel naast die kern.<br>
                <strong>Workflow (indicatief)</strong><br>
                Eerst elementenverharding en verkeersbelasting bepalen, daarna fundering/Romfix. Romfix en OIA in deze tool delen dezelfde invoer waar dat zinvol is; het pakket <em>boven</em> de Romfix-laaglagen (dikte + E) voert u in zoals Excel rij boven Romfix; dat werkt door in de Austroads-stap. <em>Vuistregel</em> (niet normatief): een substantiële stijging van de stijfheid van elementen boven Romfix (bijv. E 20→40 MPa) kan in de orde van <strong>ca. 200 mm</strong> extra totale pakketdikte vergen — altijd projectmatig toetsen.
            </div>`;
        const doelBlok =
            bereken_doel === 'asfalt_dikte'
                ? `<div class="calculation-step"><strong>Uw gekozen focus</strong>: benodigde asfalt- of totale pakketdikte — gebruik de getoonde lagen en totaal; de vuistregel hierboven helpt bij gevoel voor E-stappen.</div>`
                : bereken_doel === 'elementen'
                    ? `<div class="calculation-step"><strong>Uw gekozen focus</strong>: elementenverharding of hogere E boven Romfix — stem <em>Stijfheid van dat pakket</em> en de totale fundatie-opbouwdikte af op uw elementtype; controleer de doorwerking in stap 1–2 hieronder.</div>`
                    : '';
        if (methodResult) {
            if (rekenmethode === 'oia') {
                methodResult.innerHTML = `
                    ${workflowBlok}
                    ${doelBlok}
                    <div class="calculation-step">
                        <strong>OIA-indicatie (vereenvoudigd)</strong><br>
                        Geschatte levensduur: ${oia_levensduur} jaar (${oia_status})<br>
                        Indicatieve onderlaag: ${oia_onderlaag} mm<br>
                        Totale opbouw (indicatie): ${oia_totale_dikte} mm
                    </div>
                `;
            } else if (rekenmethode === 'beide') {
                methodResult.innerHTML = `
                    ${workflowBlok}
                    ${doelBlok}
                    <div class="calculation-step">
                        <strong>Vergelijking rekenmethodes</strong><br>
                        Romfix: levensduur ${geschatte_levensduur} jaar, totale opbouw ${totale_dikte} mm (Romfix totaal ${romfix_tot} mm)<br>
                        OIA-indicatie: levensduur ${oia_levensduur} jaar, totale opbouw ${oia_totale_dikte} mm<br>
                        Zelfde invoerparameters gelden voor beide blokken waar ondersteund. Let op: OIA in deze tool is vereenvoudigd; officiële OIA vereist specialistische invoer.
                    </div>
                `;
            } else {
                methodResult.innerHTML = workflowBlok + doelBlok;
            }
        }
        const zettingNote = document.getElementById('zetting_note');
        if (zettingNote) {
            zettingNote.innerHTML =
                '<p><strong>Zetting en vervorming</strong> worden in deze tool <strong>niet</strong> berekend. U ziet indicatieve E-moduli, draagkracht-indicaties (o.a. F2) en levensduur-schattingen. Bij zware assen (bijv. 50 t), zachte bodem of gevoelige omgeving — laat zetting en doorbuiging vaststellen door een ingenieur (sondering, monitoring, normenkader).</p>';
        }

        // Berekeningen tonen
        const berekeningen = document.getElementById('berekeningen');
        berekeningen.innerHTML = `
            <div class="calculation-step"><strong>1. Stijfheid tussen ondergrond en menggranulaat</strong> (methode Austroads)<br>
                Maximum in dit model: ${Math.round(e_max)} MPa<br>
                Verhouding per stap: ${ratio.toFixed(4)}<br>
                Tussenlagen (van diep naar ondiep): ${subs[4]}, ${subs[3]}, ${subs[2]}, ${subs[1]}, ${subs[0]} MPa<br>
                Gemiddelde stijfheid daarvan (E<sub>niv</sub>): ${e_niv} MPa</div>

            <div class="calculation-step"><strong>2. Stijfheid van het gewapende Romfix-deel</strong> (per laag zoals Excel)<br>
                De rekenregel neemt het gunstigste van twee opties: SIF × gemiddelde sublaag of MIF × stijfheid granulaat (hoofdwaarde — zoals in het Excel-model).<br>
                ${mifManual ? '' : mifSource === 'excel'
                    ? `MIF laag 1 = ${mif.toFixed(2)} (Excel eerste wapeningsrij; tabblad ${series_type === 'roadbase' ? 'RoadBase' : 'Capping'}_Romfix).<br>`
                    : `MIF laag 1 = ${mif.toFixed(2)} (aanvullende Romfix MIF-tabel; onderbouw ${e_ondergrond} MPa, invulling ${e_ongewapend_in} MPa).<br>`}
                E<sub>gewapend,1</sub> = min(${sif} × ${e_niv}, ${mif.toFixed(2)} × ${e_ongewapend_in}) = ${Math.round(e_gewapend)} MPa${romfix_dikte_2 > 0
                    ? `<br>${mif2Manual ? '' : mifSource === 'excel'
                        ? `MIF laag 2 = ${mif2.toFixed(2)} (Excel tweede wapeningsrij / E20).<br>`
                        : `MIF laag 2 = ${mif2.toFixed(2)} (zelfde bron als laag 1).<br>`}
                E<sub>gewapend,2</sub> = min(${sif} × ${e_niv}, ${mif2.toFixed(2)} × ${e_ongewapend_in}) = ${Math.round(e_gewapend_2)} MPa`
                    : ''}${sifMode === 'indicatief_bodem'
                    ? `<br>SIF = ${sif.toFixed(1)} (basis ${sifBase.toFixed(1)} × bodemfactor ${sifFactorFromBodem(e_ondergrond).toFixed(3)} — indicatief; niet 1-op-1 gelijk aan een vaste Excel-cel).`
                    : ''}</div>

            <div class="calculation-step"><strong>3. Verdeling over de Romfix-dikte</strong><br>
                <strong>Laag 1 (${romfix_dikte} mm)</strong>, werkingsdikte ${werkingsdikte} mm:<br>
                Ongewapend (boven): ${h_ong_hoog} mm — E = ${e_ong} MPa<br>
                Gewapend: ${h_gew} mm — E = ${e_gewapend} MPa<br>
                Ongewapend (onder): ${h_ong_laag} mm — E = ${e_ong} MPa${romfix_dikte_2 > 0
                    ? `<br><strong>Laag 2 (${romfix_dikte_2} mm)</strong>, werkingsdikte ${werkingsdikte_2} mm:<br>
                Ongewapend (boven): ${h2_ong_hoog} mm — E = ${e_ong} MPa<br>
                Gewapend: ${h2_gew} mm — E = ${e_gewapend_2} MPa<br>
                Ongewapend (onder): ${h2_ong_laag} mm — E = ${e_ong} MPa`
                    : ''}</div>

            <div class="calculation-step"><strong>4. Gemiddelde stijfheid van het hele Romfix-pakket</strong> (Thenn de Barros, totaal ${romfix_tot} mm)<br>
                Tussenstap (gewogen volgens de formule): ${sum_trans.toFixed(2)}<br>
                E<sub>eq</sub> = ${e_eq_round} MPa</div>

            <div class="calculation-step"><strong>5. Correctie voor de zachtere ondergrond eronder</strong> (Palmer &amp; Barber)<br>
                Verhouding dikte (${(romfix_tot / 150).toFixed(2)}) en stijfheid Romfix t.o.v. ondergrond (${(e_eq / e_ondergrond).toFixed(2)})<br>
                Factor F2 = ${f2_round}</div>

            <div class="calculation-step"><strong>6. Stijfheid na correctie</strong> (meegenomen effect van de ondergrond)<br>
                ${e_eq_round} × ${f2_round} ≈ ${e_eq_gecorr} MPa</div>
        `;

        // Opmerkingen
        const opmList = document.getElementById('opmerkingen');
        opmList.innerHTML = '';
        let mifBronZin;
        if (mifManual) {
            mifBronZin = `MIF is handmatig (${mif.toFixed(2)}); standaard sluit de tool aan op het Excel-werkboek of — bij keuze «MIF-tabel» — op de aanvullende Romfix MIF-roosters.`;
        } else if (mifSource === 'excel') {
            mifBronZin = `MIF (${mif.toFixed(2)}) volgt de Excel-basis (eerste wapeningsrij E19, ${series_type === 'roadbase' ? 'RoadBase' : 'Capping'}_Romfix). ` +
                `Romfix MIF-tabellen kunt u via «MIF-bron» inschakelen als aanvulling op onderbouw/vulstof.`;
        } else {
            const tabelKeuze = wapening_config === 'cell_only'
                ? 'tabel alleen R\u2019Cel'
                : wapening_config === 'grid_cell'
                    ? 'tabel R\u2019Cel + E\u2019Grid'
                    : 'indicatief: R\u2019Cel-tabel geschaald (alleen GeoGrid; geen aparte tabel)';
            mifBronZin = `MIF (${mif.toFixed(2)}) volgt de aanvullende Romfix MIF-tabellen (meewerkende hoogte max. 300 mm), 2D-interpolatie — ${tabelKeuze}. ` +
                `Voor strict Excel-gedrag kiest u bij MIF-bron het werkboek.`;
        }
        const opmerkingen = [
            `Levensduur: ${levensduur_status} (inclusief een kleine meerekening als de stijfheid gunstig uitpakt).`,
            `Bij zachte bodem past Romfix meestal goed; controleer voor uw project altijd bij een ingenieur of Romfix.`,
            sifMode === 'indicatief_bodem'
                ? `SIF = ${sif.toFixed(1)} (basis ${sifBase.toFixed(1)} voor ${wapening_config === 'grid_only' ? 'alleen GeoGrid' : wapening_config === 'cell_only' ? 'alleen GeoCell' : 'GeoGrid + GeoCell'}, met indicatieve ondergrondcorrectie: zachtere bodem iets hoger, stijvere iets lager).`
                : `SIF staat op de vaste Chris/Excel-waarde ${sif.toFixed(1)} (${wapening_config === 'grid_only' ? 'alleen GeoGrid' : wapening_config === 'cell_only' ? 'alleen GeoCell' : 'GeoGrid + GeoCell'}). Kies «indicatieve bodemcorrectie» bij SIF voor een ruwe trendlijn — strikt Excel-gedrag blijft bij «vast».`,
            mifBronZin,
            `Werkingsdikte per wapeningsrij — invoer zoals Excel (geel); max. in tool 400 mm voor robuustheid.`,
            `MIF-bron «Excel»: eerste rij = standaard E19, tweede Romfix-laag = E20 (Capping 4,8 / RoadBase 3,8).`,
            `Deze stappen sluiten aan op het Romfix Excel-rekenmodel (Austroads, Thenn de Barros, Palmer & Barber); aanvullingen (OIA, MIF-tabel 2D, SIF-bodemtrend) zijn optioneel.`,
            rekenmethode !== 'romfix' ? `OIA-uitkomst in deze tool is een vereenvoudigde indicatie en geen officiële OIA-dimensionering.` : `Voor OIA-vergelijking kun je bovenin rekenmethode op OIA of beide zetten.`,
            breedte < 2.75 ? `Smalle rijbaan: vaak extra maatregelen aan de zijkant (bijvoorbeeld beschoeiing) bespreken.` : `Rijbaanbreedte: in beginsel geen bijzonder kanttekening voor stabiliteit in deze scan.`,
            `Alle cijfers zijn indicatief; definitieve waarden volgen uit het officiële Romfix-dossier of projectberekening.`,
            `Zetting/doorbuiging: niet berekend in deze tool — zie het vak hieronder bij het resultaat.`
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
    const sif = document.getElementById('sif');
    const wapeningConfig = document.getElementById('wapening_config');
    const mif = document.getElementById('mif');
    const mifManualOverride = document.getElementById('mif_manual_override');
    const eOngewapendIn = document.getElementById('e_ongewapend_in');
    const eOngewapendW = document.getElementById('e_ongewapend_w');
    const eOngewapendWMode = document.getElementById('e_ongewapend_w_mode');
    const seriesType = document.getElementById('series_type');
    const funderingsAggregaat = document.getElementById('funderingsaggregaat');
    const romfixDikte2El = document.getElementById('romfix_dikte_2');
    const mif2El = document.getElementById('mif_2');
    const mif2ManualOverride = document.getElementById('mif2_manual_override');

    function toggleRomfixLaag2Velden() {
        const v = parseFloat(romfixDikte2El?.value) || 0;
        const on = v > 0;
        const b1 = document.getElementById('romfix_laag2_velden');
        const b2 = document.getElementById('werkingsdikte_2_group');
        if (b1) b1.style.display = on ? 'block' : 'none';
        if (b2) b2.style.display = on ? 'block' : 'none';
    }

    function syncMif2UitTabel() {
        if (!mif2El || !wapeningConfig || !eOndergrond || !eOngewapendIn) return;
        const rom2 = parseFloat(romfixDikte2El?.value) || 0;
        if (rom2 <= 0) {
            mif2El.readOnly = true;
            const st = seriesType?.value || 'capping';
            mif2El.value = excelMifRij2(st).toFixed(2);
            return;
        }
        if (mif2ManualOverride && mif2ManualOverride.checked) {
            mif2El.readOnly = false;
            return;
        }
        const src = document.getElementById('mif_source')?.value || 'excel';
        if (src === 'excel') {
            const st = seriesType?.value || 'capping';
            mif2El.value = excelMifRij2(st).toFixed(2);
            mif2El.readOnly = true;
            return;
        }
        const eSub = parseFloat(eOndergrond.value);
        const eIn = parseFloat(eOngewapendIn.value);
        const v = mifFromRomfixTables(
            wapeningConfig.value,
            Number.isFinite(eSub) ? eSub : 40,
            Number.isFinite(eIn) ? eIn : 150
        );
        mif2El.value = v.toFixed(2);
        mif2El.readOnly = true;
    }

    function updateSifDisplay() {
        if (!wapeningConfig || !sif || !eOndergrond) return;
        const base = sifBasisVoorConfig(wapeningConfig.value);
        const mode = document.getElementById('sif_mode')?.value || 'vast';
        const eSub = parseFloat(eOndergrond.value);
        const eOk = Number.isFinite(eSub) ? eSub : 70;
        if (mode === 'indicatief_bodem') {
            sif.value = (Math.round(base * sifFactorFromBodem(eOk) * 10) / 10).toFixed(1);
        } else {
            sif.value = base.toFixed(1);
        }
    }

    function applyWModeRules() {
        if (!eOngewapendW || !eOngewapendWMode || !funderingsAggregaat) return;
        const isVast = eOngewapendWMode.value === 'vast';
        const fa = funderingsAggregaat.value;
        if (isVast && fa === 'agg_menggranulaat') {
            eOngewapendW.value = String(W_VAST_MENG_CHRIS_MPA);
            eOngewapendW.readOnly = true;
        } else if (isVast && fa === 'agg_auto_product' && seriesType) {
            const key = seriesType.value === 'roadbase' ? 'agg_licht_roadbase' : 'agg_licht_capping';
            eOngewapendW.value = String(FUNDERINGS_AGGREGAAT[key].eW);
            eOngewapendW.readOnly = true;
        } else {
            eOngewapendW.readOnly = false;
        }
    }

    function syncMifUitTabel() {
        if (!mif || !wapeningConfig || !eOndergrond || !eOngewapendIn) {
            syncMif2UitTabel();
            return;
        }
        if (mifManualOverride && mifManualOverride.checked) {
            mif.readOnly = false;
            syncMif2UitTabel();
            return;
        }
        const src = document.getElementById('mif_source')?.value || 'excel';
        if (src === 'excel') {
            const st = seriesType?.value || 'capping';
            mif.value = excelMifVoorProductlijn(st).toFixed(2);
            mif.readOnly = true;
            syncMif2UitTabel();
            return;
        }
        const eSub = parseFloat(eOndergrond.value);
        const eIn = parseFloat(eOngewapendIn.value);
        const v = mifFromRomfixTables(
            wapeningConfig.value,
            Number.isFinite(eSub) ? eSub : 40,
            Number.isFinite(eIn) ? eIn : 150
        );
        mif.value = v.toFixed(2);
        mif.readOnly = true;
        syncMif2UitTabel();
    }

    function applySeriesDefaults() {
        if (!seriesType) return;
        syncAggregaatMetProductlijn();
        syncMifUitTabel();
    }

    function syncAggregaatMetProductlijn() {
        if (!funderingsAggregaat || !seriesType) return;
        if (funderingsAggregaat.value !== 'agg_auto_product') return;
        applyAggregaatPreset();
    }

    function applyAggregaatPreset() {
        if (!funderingsAggregaat) return;
        let key = funderingsAggregaat.value;
        if (key === 'agg_custom') {
            syncMifUitTabel();
            return;
        }
        if (key === 'agg_auto_product' && seriesType) {
            key = seriesType.value === 'roadbase' ? 'agg_licht_roadbase' : 'agg_licht_capping';
        }
        const row = FUNDERINGS_AGGREGAAT[key];
        if (!row || row.eHoofd == null) {
            syncMifUitTabel();
            return;
        }
        if (eOngewapendIn) eOngewapendIn.value = String(row.eHoofd);
        if (eOngewapendW) eOngewapendW.value = String(row.eW);
        applyWModeRules();
        syncMifUitTabel();
    }

    if (funderingsAggregaat) {
        funderingsAggregaat.addEventListener('change', () => {
            applyAggregaatPreset();
            applyWModeRules();
        });
    }
    if (eOngewapendWMode) eOngewapendWMode.addEventListener('change', applyWModeRules);
    const sifModeEl = document.getElementById('sif_mode');
    if (sifModeEl) sifModeEl.addEventListener('change', updateSifDisplay);

    if (wapeningConfig) {
        wapeningConfig.addEventListener('change', () => {
            updateSifDisplay();
            syncMifUitTabel();
        });
    }

    function applyBodemStijfheid() {
        const sel = document.getElementById('ondergrond_type');
        if (!sel || !eOndergrond) return;
        eOndergrond.value = String(bodemRekenESuggestie(sel.value));
        syncMifUitTabel();
        updateSifDisplay();
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

    if (eOndergrond) {
        const onEonder = () => {
            syncMifUitTabel();
            updateSifDisplay();
        };
        eOndergrond.addEventListener('input', onEonder);
        eOndergrond.addEventListener('change', onEonder);
    }
    if (eOngewapendIn) {
        eOngewapendIn.addEventListener('input', syncMifUitTabel);
        eOngewapendIn.addEventListener('change', syncMifUitTabel);
    }
    if (mifManualOverride) {
        mifManualOverride.addEventListener('change', () => {
            if (mifManualOverride.checked) {
                if (mif) mif.readOnly = false;
            } else {
                syncMifUitTabel();
            }
        });
    }
    if (mif2ManualOverride) {
        mif2ManualOverride.addEventListener('change', () => {
            if (mif2ManualOverride.checked) {
                if (mif2El) mif2El.readOnly = false;
            } else {
                syncMif2UitTabel();
            }
        });
    }
    const mifSourceSel = document.getElementById('mif_source');
    if (mifSourceSel) mifSourceSel.addEventListener('change', syncMifUitTabel);

    if (romfixDikte2El) {
        romfixDikte2El.addEventListener('input', () => {
            toggleRomfixLaag2Velden();
            syncMif2UitTabel();
        });
        romfixDikte2El.addEventListener('change', () => {
            toggleRomfixLaag2Velden();
            syncMif2UitTabel();
        });
    }

    updateSifDisplay();
    applyWModeRules();
    toggleRomfixLaag2Velden();
    syncMifUitTabel();
});