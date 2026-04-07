/**
 * Zelfde kernformules als script.js (zonder DOM) — handmatige parity-check t.o.v. Excel.
 *
 * node tools/parity-check.mjs
 */

function thennRomfixBlok(T_mm, werk_mm, eOng, eGew) {
    const hOngHoog = Math.max(0, T_mm - werk_mm);
    const hGew = Math.min(werk_mm, T_mm);
    const hOngLaag = T_mm - hOngHoog - hGew;
    const cube = (h, e) => (h > 0 ? h * Math.pow(e, 1 / 3) : 0);
    return cube(hOngHoog, eOng) + cube(hGew, eGew) + cube(hOngLaag, eOng);
}

function interpolate(x, y, tx, ty, table) {
    let i = 0;
    let j = 0;
    for (i = 0; i < tx.length - 1; i++) if (x <= tx[i + 1]) break;
    for (j = 0; j < ty.length - 1; j++) if (y <= ty[j + 1]) break;
    const x1 = tx[i];
    const x2 = tx[i + 1] || x1;
    const y1 = ty[j];
    const y2 = ty[j + 1] || y1;
    const f11 = table[i][j];
    const f12 = table[i][j + 1] !== undefined ? table[i][j + 1] : f11;
    const f21 = table[i + 1] ? table[i + 1][j] : f11;
    const f22 = table[i + 1] && table[i + 1][j + 1] !== undefined ? table[i + 1][j + 1] : f11;
    const fx1 = f11 + ((f21 - f11) / (x2 - x1)) * (x - x1);
    const fx2 = f12 + ((f22 - f12) / (x2 - x1)) * (x - x1);
    return fx1 + ((fx2 - fx1) / (y2 - y1)) * (y - y1);
}

// Screenshot testcase («Test 5»): Capping MIF 4,5 / 4,8, ondergrond 11 MPa
const test = {
    bovenlaag_dikte_mm: 1050,
    bovenlaag_e_MPa: 5000,
    e_ondergrond_MPa: 11,
    romfix1_mm: 250,
    romfix2_mm: 300,
    werk1_mm: 250,
    werk2_mm: 300,
    e_in_MPa: 150,
    e_w_MPa: 33,
    sif: 10,
    mif1: 4.5,
    mif2: 4.8
};

const hr_values = [0.156, 0.312, 0.625, 1.25, 2.5, 5.0, 10.0];
const e1e2_values = [1, 2, 5, 10, 20, 50, 100];
const f_table = [
    [1.0, 0.966, 0.939, 0.925, 0.908, 0.869, 0.869],
    [1.0, 0.93, 0.867, 0.818, 0.756, 0.654, 0.654],
    [1.0, 0.839, 0.693, 0.6, 0.512, 0.405, 0.405],
    [1.0, 0.711, 0.494, 0.388, 0.307, 0.227, 0.227],
    [1.0, 0.614, 0.356, 0.25, 0.183, 0.126, 0.126],
    [1.0, 0.558, 0.279, 0.176, 0.117, 0.073, 0.073],
    [1.0, 0.529, 0.24, 0.138, 0.0836, 0.0466, 0.0466]
];

const e_onder = Math.max(8, Math.min(200, test.e_ondergrond_MPa));
const e_ongewapend = (test.e_in_MPa + test.e_w_MPa) / 2;
const e_max_raw = test.bovenlaag_e_MPa * Math.pow(2, test.bovenlaag_dikte_mm / 125);
const e_max = Math.min(e_max_raw, e_ongewapend);
const ratio = Math.pow(e_max / e_onder, 1 / 5);
let subs = [];
let current = e_onder;
for (let k = 0; k < 5; k++) {
    current = Math.min(current * ratio, e_max);
    subs.push(Math.round(current));
}
const e_niv = Math.round(subs.reduce((a, b) => a + b, 0) / 5);

const e_gew1 = Math.round(Math.min(test.sif * e_niv, test.mif1 * test.e_in_MPa));
const e_gew2 = Math.round(Math.min(test.sif * e_niv, test.mif2 * test.e_in_MPa));

const romfix_tot = test.romfix1_mm + test.romfix2_mm;
let sum_trans = thennRomfixBlok(test.romfix1_mm, test.werk1_mm, e_ongewapend, e_gew1);
sum_trans += thennRomfixBlok(test.romfix2_mm, test.werk2_mm, e_ongewapend, e_gew2);
const e_eq = romfix_tot > 0 ? Math.pow(sum_trans / romfix_tot, 3) : 0;
const e_eq_round = Math.round(e_eq);

const hr = romfix_tot / 150;
const e1e2 = e_eq / e_onder || 1;
const f2 = interpolate(hr, e1e2, hr_values, e1e2_values, f_table);
const e_eq_gecorr = Math.round(e_eq * f2);

console.log('=== Invoer (Excel screenshot / tool) ===');
console.log(JSON.stringify(test, null, 2));
console.log('\n=== Tussenstappen (tool-kern) ===');
console.log('E_ongewapend (gemiddelde In/W):', e_ongewapend);
console.log('E_max_raw:', e_max_raw);
console.log('E_max:', e_max);
console.log('ratio:', ratio);
console.log('5 sublagen (diep→ondiep):', subs.join(', '));
console.log('E_niv:', e_niv);
console.log('E_gewapend laag 1:', e_gew1);
console.log('E_gewapend laag 2:', e_gew2);
console.log('Thenn sum_trans:', sum_trans.toFixed(4));
console.log('Romfix totaal mm:', romfix_tot);
console.log('E_eq:', e_eq_round, '(ongaaf:', e_eq, ')');
console.log('h_r:', hr.toFixed(4), 'E_eq/E_onder:', e1e2.toFixed(4));
console.log('F2:', f2.toFixed(4));
console.log('E_eq gecorrigeerd:', e_eq_gecorr);
