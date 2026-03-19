function berekenAdvies() {
    try {
        // === INPUTS OPHALEN ===
        const verkeersintensiteit = parseInt(document.getElementById('verkeersintensiteit').value) || 10;
        const ondergrond_type = document.getElementById('ondergrond_type').value;
        const breedte = parseFloat(document.getElementById('breedte').value) || 2.75;
        const levensduur = parseInt(document.getElementById('levensduur').value) || 20;

        const series_type = document.getElementById('series_type').value;
        const excel_case = document.getElementById('excel_case')?.value || 'sheet1';

        let romfix_dikte = parseFloat(document.getElementById('romfix_dikte').value) || 300;
        const sif = parseFloat(document.getElementById('sif').value) || 10;
        const mif = parseFloat(document.getElementById('mif').value) || 4.5;
        const werkingsdikte = parseFloat(document.getElementById('werkingsdikte').value) || 250;
        let e_ongewapend_in = parseFloat(document.getElementById('e_ongewapend_in').value) || 150;
        let e_ongewapend_w = parseFloat(document.getElementById('e_ongewapend_w').value) || 33;
        const bovenlaag_dikte = parseFloat(document.getElementById('bovenlaag_dikte').value) || 1050;
        const bovenlaag_e = parseFloat(document.getElementById('bovenlaag_e').value) || 5000;

        // === ONDERGROND BEPALEN ===
        const e_ondergrond_input = document.getElementById('e_ondergrond');
        const e_ondergrond_excel = e_ondergrond_input ? parseFloat(e_ondergrond_input.value) : NaN;
        let e_ondergrond = Number.isFinite(e_ondergrond_excel) && e_ondergrond_excel > 0
            ? e_ondergrond_excel
            : (ondergrond_type === 'veen_klei' ? 30 : ondergrond_type === 'klei' ? 76 : 100);

        // Excel case defaults (uit meegeleverde sheets)
        // sheet1: E onderliggend vaak 11, MIF 4.5; sheet2: E onderliggend vaak 105, MIF 4.3
        if (excel_case === 'sheet2') {
            if (!Number.isFinite(e_ondergrond_excel) || e_ondergrond_excel <= 0) e_ondergrond = 105;
        } else {
            if (!Number.isFinite(e_ondergrond_excel) || e_ondergrond_excel <= 0) e_ondergrond = 11;
        }

        // Series type defaults (uit Excel)
        if (series_type === 'capping') {
            e_ongewapend_w = 33;
        } else if (series_type === 'roadbase') {
            e_ongewapend_w = 148;
        }

        // === BASISWAARDEN ===
        const deklaag = 35;
        const onderlaag_theo_min = 25;
        const onderlaag_praktijk_min = 70;

        let zand_dikte = ondergrond_type === 'zand' ? 200 : 300;

        // Asfalt aanpassing
        const extra_theo = Math.max(0, (verkeersintensiteit - 10) / 10 * 5);
        let onderlaag_theo = onderlaag_theo_min + extra_theo;
        let onderlaag_praktijk = Math.max(onderlaag_praktijk_min, Math.round(onderlaag_theo + 45));

        const romfix_nodig = ondergrond_type !== 'zand';
        const romfix_omschrijving = romfix_nodig 
            ? "R’Tex geotextiel + E’Grid + 200 mm R’Cel + menggranulaat" 
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
            ? "Voldoet ruimschoots" 
            : "Te kort – dikkere lagen overwegen";

        // Totale dikte
        const totale_dikte = deklaag + onderlaag_praktijk + romfix_dikte + zand_dikte;

        // === OUTPUT ===
        const resultEl = document.getElementById('result');
        resultEl.style.display = 'block';

        // Lagen vullen
        const lagenList = document.getElementById('lagen');
        lagenList.innerHTML = '';
        const lagenArray = [
            `Deklaag: ${deklaag} mm AC 11 surf DL-B`,
            `Onderlaag: ${onderlaag_praktijk} mm AC 22 base OL-B (theoretisch ${Math.round(onderlaag_theo)} mm)`,
            `Funderingslaag: ${romfix_dikte} mm Romfix-systeem (${romfix_omschrijving})`,
            `Funderingswapening: Geïntegreerd (SIF=${sif}, MIF=${mif})`,
            `Zandlaag: ${zand_dikte} mm zand`,
            `Ondergrond stijfheidsmodulus (E): ${e_ondergrond} MPa`
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
            <div class="calculation-step"><strong>1. Sublaag-modulus (Austroads):</strong><br>
                E_max: ${Math.round(e_max)} MPa<br>
                Ratio: ${ratio.toFixed(4)}<br>
                sub5: ${subs[4]} | sub4: ${subs[3]} | sub3: ${subs[2]} | sub2: ${subs[1]} | sub1: ${subs[0]}<br>
                Gemiddelde E_niv: ${e_niv} MPa</div>

            <div class="calculation-step"><strong>2. Gewapende modulus:</strong><br>
                E_gewapend = min(${mif} × ${e_niv}, ${e_ongewapend_in} × ${sif}) = ${Math.round(e_gewapend)} MPa</div>

            <div class="calculation-step"><strong>3. Laagopbouw:</strong><br>
                Ong. hoog: ${h_ong_hoog} mm, E=${e_ong} MPa<br>
                Gewapend: ${h_gew} mm, E=${e_gewapend} MPa<br>
                Ong. laag: ${h_ong_laag} mm, E=${e_ong} MPa</div>

            <div class="calculation-step"><strong>4. Equivalente modulus (Thenn de Barros):</strong><br>
                Som getransformeerd: ${sum_trans.toFixed(2)}<br>
                E_eq = ${e_eq_round} MPa</div>

            <div class="calculation-step"><strong>5. F2-factor (Palmer & Barber):</strong><br>
                h/r = ${(romfix_dikte / 150).toFixed(2)}, E1/E2 = ${(e_eq / e_ondergrond).toFixed(2)}<br>
                F2 = ${f2_round}</div>

            <div class="calculation-step"><strong>6. Gecorrigeerde E_eq:</strong><br>
                ${e_eq_round} × ${f2_round} = ${e_eq_gecorr} MPa</div>
        `;

        // Opmerkingen
        const opmList = document.getElementById('opmerkingen');
        opmList.innerHTML = '';
        const opmerkingen = [
            `Levensduur: ${levensduur_status}. Basis + bonus door hogere E_eq.`,
            `Romfix-systeem: Sterk aanbevolen bij slappe ondergrond.`,
            `Berekeningen nabootsen Excel (Austroads, Thenn de Barros, Palmer & Barber).`,
            breedte < 2.75 ? `Smalle weg: houten beschoeiing aanbevolen.` : `Goede stabiliteit verwacht.`,
            `Indicatief – voor exacte waarden originele Excel gebruiken.`
        ];
        opmerkingen.forEach(txt => {
            const li = document.createElement('li');
            li.textContent = txt;
            opmList.appendChild(li);
        });

        // UX: spring naar het resultaat na berekenen
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        alert("Er ging iets mis bij het rekenen.\nControleer of alle velden correct zijn ingevuld.\n\nFout: " + error.message);
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

    const excelCase = document.getElementById('excel_case');
    const eOndergrond = document.getElementById('e_ondergrond');
    const mif = document.getElementById('mif');
    const eOngewapendW = document.getElementById('e_ongewapend_w');
    const seriesType = document.getElementById('series_type');

    function applyExcelDefaults() {
        if (!excelCase) return;
        const v = excelCase.value;
        if (v === 'sheet2') {
            if (eOndergrond) eOndergrond.value = '105';
            if (mif) mif.value = '4.3';
            if (seriesType && seriesType.value === 'capping') seriesType.value = 'roadbase';
            if (eOngewapendW) eOngewapendW.value = '148';
        } else {
            if (eOndergrond) eOndergrond.value = '11';
            if (mif) mif.value = '4.5';
            if (seriesType && seriesType.value === 'roadbase') seriesType.value = 'capping';
            if (eOngewapendW) eOngewapendW.value = '33';
        }
    }

    if (excelCase) {
        excelCase.addEventListener('change', applyExcelDefaults);
        applyExcelDefaults();
    }
});