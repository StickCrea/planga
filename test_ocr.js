import { extractDetailedData } from './src/utils/ocrUtils.js';

const text = `
01 SAS NIT900215862-1 Gran contribuyente y Agente
retenedor de IVA Res. 00020029 TR: 0000032525
DE 06 SUR NO 23 BOGOTA DC
CLIENTE: Consumidor Final C.C: 22222222
Generacion: 2026/04/29 18:28:44
Validacion Dian: 2026-04-29 18:28:44
NO EAN OR VALOR U CANTIDA DESCRIPCION VALOR TT
1 UN 2,300 7702004714300 EMPANADA 2,300 A
2 UN 3,300 7702004057669 LECHE 3,300 B
3 UN 890 7702004027729 NO SE RECICLA 890 A
4 UN 8,900 7702004244719 QUESO SABANA 8,900 B
5 UN 5,750 7702004236943 HOJUELAS 5,750 A
6 UN 16,900 7702004276685 FILETES DE PO 16,900 B
7 UN 3,490 7702004262521 MAYONESA 3,490 A
8 UN 8,700 7702004228450 JABON DE LOU 8,700 A
9 UN 2,350 7702004025030 ACEITE DE SOY 2,350 A

TOTAL 58,880
FORMA DE PAGO: CONTADO - VALOR PAGADO
EFECTIVO 58,880
CAMBIO 0
Articulos (10)

RESUMEN DE IMPUESTOS
TOTAL BASE DIA
5 EXENTO 30,050 30,050 0
5 % 28,571 24,000 4,561
TOTAL 54,100 4,561
`;

const lines = text.split('\n');
console.log("Testing extractDetailedData...");
const result = extractDetailedData(text);
console.log("Extracted Data:", JSON.stringify(result, null, 2));

if (result.total === 58880) {
    console.log("✅ TEST PASSED: Total correctly identified as 58880");
} else {
    console.log(`❌ TEST FAILED: Expected 58880, got ${result.total}`);
}
