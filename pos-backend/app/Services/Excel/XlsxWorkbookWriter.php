<?php

namespace App\Services\Excel;

use RuntimeException;
use ZipArchive;

/**
 * Generator workbook Excel (.xlsx / ECMA-376 OOXML) native berbasis PHP ZipArchive.
 * Mendukung style terpusat, formula dinamis dengan cached value, freeze pane,
 * auto-filter, tab color, print setup landscape, dan grafik native Excel (Bar/Line/Doughnut).
 */
class XlsxWorkbookWriter
{
    public const STYLE_DEFAULT           = 0;
    public const STYLE_TITLE_BANNER      = 1;
    public const STYLE_SUBTITLE_BANNER   = 2;
    public const STYLE_META_STRIP        = 3;
    public const STYLE_SECTION_HEADER    = 4;
    public const STYLE_KPI_LABEL         = 5;
    public const STYLE_KPI_CURRENCY      = 6;
    public const STYLE_KPI_NUMBER        = 7;
    public const STYLE_KPI_TEXT          = 8;
    public const STYLE_KPI_DANGER        = 9;
    public const STYLE_KPI_PERCENT       = 10;
    public const STYLE_TABLE_HEADER      = 11;

    // Baris data zebra (Genap / Putih & Ganjil / Slate Soft)
    public const STYLE_TEXT              = 12;
    public const STYLE_TEXT_ALT          = 13;
    public const STYLE_TEXT_CENTER       = 14;
    public const STYLE_TEXT_CENTER_ALT   = 15;
    public const STYLE_BOLD_TEXT         = 16;
    public const STYLE_BOLD_TEXT_ALT     = 17;
    public const STYLE_INTEGER           = 18;
    public const STYLE_INTEGER_ALT       = 19;
    public const STYLE_DECIMAL           = 20;
    public const STYLE_DECIMAL_ALT       = 21;
    public const STYLE_SIGNED_DECIMAL    = 22;
    public const STYLE_SIGNED_DECIMAL_ALT = 23;
    public const STYLE_CURRENCY          = 24;
    public const STYLE_CURRENCY_ALT      = 25;
    public const STYLE_SIGNED_CURRENCY   = 26;
    public const STYLE_SIGNED_CURRENCY_ALT = 27;
    public const STYLE_PERCENT           = 28;
    public const STYLE_PERCENT_ALT       = 29;
    public const STYLE_PROFIT_CURRENCY   = 30;
    public const STYLE_PROFIT_CURRENCY_ALT = 31;
    public const STYLE_LOSS_CURRENCY     = 32;
    public const STYLE_LOSS_CURRENCY_ALT = 33;

    // Status Badges
    public const STYLE_BADGE_SUCCESS     = 34;
    public const STYLE_BADGE_WARNING     = 35;
    public const STYLE_BADGE_DANGER      = 36;
    public const STYLE_BADGE_INFO        = 37;
    public const STYLE_BADGE_NEUTRAL     = 38;

    // Baris Total & Sub-Summary
    public const STYLE_TOTAL_LABEL       = 39;
    public const STYLE_TOTAL_CENTER      = 40;
    public const STYLE_TOTAL_INTEGER     = 41;
    public const STYLE_TOTAL_DECIMAL     = 42;
    public const STYLE_TOTAL_CURRENCY    = 43;
    public const STYLE_TOTAL_SIGNED_CURRENCY = 44;
    public const STYLE_TOTAL_PERCENT     = 45;

    public const STYLE_SUB_LABEL         = 46;
    public const STYLE_SUB_INTEGER       = 47;
    public const STYLE_SUB_CURRENCY      = 48;
    public const STYLE_SUB_PERCENT       = 49;

    public const STYLE_NOTE_BOX            = 50;
    public const STYLE_TEXT_NOWRAP         = 51;
    public const STYLE_TEXT_NOWRAP_ALT     = 52;
    public const STYLE_KPI_DANGER_CURRENCY = 53;
    public const STYLE_KPI_DANGER_NUMBER   = 54;

    /** @var array<string, int> */
    private const STYLE_ALIASES = [
        'default'             => self::STYLE_DEFAULT,
        'titleBanner'         => self::STYLE_TITLE_BANNER,
        'subtitleBanner'      => self::STYLE_SUBTITLE_BANNER,
        'metaStrip'           => self::STYLE_META_STRIP,
        'sectionHeader'       => self::STYLE_SECTION_HEADER,
        'kpiLabel'            => self::STYLE_KPI_LABEL,
        'kpiCurrency'         => self::STYLE_KPI_CURRENCY,
        'kpiNumber'           => self::STYLE_KPI_NUMBER,
        'kpiText'             => self::STYLE_KPI_TEXT,
        'kpiDanger'           => self::STYLE_KPI_DANGER,
        'kpiDangerCurrency'   => self::STYLE_KPI_DANGER_CURRENCY,
        'kpiDangerNumber'     => self::STYLE_KPI_DANGER_NUMBER,
        'kpiPercent'          => self::STYLE_KPI_PERCENT,
        'tableHeader'         => self::STYLE_TABLE_HEADER,
        'text'                => self::STYLE_TEXT,
        'textAlt'             => self::STYLE_TEXT_ALT,
        'textCenter'          => self::STYLE_TEXT_CENTER,
        'textCenterAlt'       => self::STYLE_TEXT_CENTER_ALT,
        'boldText'            => self::STYLE_BOLD_TEXT,
        'boldTextAlt'         => self::STYLE_BOLD_TEXT_ALT,
        'integer'             => self::STYLE_INTEGER,
        'integerAlt'          => self::STYLE_INTEGER_ALT,
        'decimal'             => self::STYLE_DECIMAL,
        'decimalAlt'          => self::STYLE_DECIMAL_ALT,
        'signedDecimal'       => self::STYLE_SIGNED_DECIMAL,
        'signedDecimalAlt'    => self::STYLE_SIGNED_DECIMAL_ALT,
        'currency'            => self::STYLE_CURRENCY,
        'currencyAlt'         => self::STYLE_CURRENCY_ALT,
        'signedCurrency'      => self::STYLE_SIGNED_CURRENCY,
        'signedCurrencyAlt'   => self::STYLE_SIGNED_CURRENCY_ALT,
        'percent'             => self::STYLE_PERCENT,
        'percentAlt'          => self::STYLE_PERCENT_ALT,
        'profitCurrency'      => self::STYLE_PROFIT_CURRENCY,
        'profitCurrencyAlt'   => self::STYLE_PROFIT_CURRENCY_ALT,
        'lossCurrency'        => self::STYLE_LOSS_CURRENCY,
        'lossCurrencyAlt'     => self::STYLE_LOSS_CURRENCY_ALT,
        'badgeSuccess'        => self::STYLE_BADGE_SUCCESS,
        'badgeWarning'        => self::STYLE_BADGE_WARNING,
        'badgeDanger'         => self::STYLE_BADGE_DANGER,
        'badgeInfo'           => self::STYLE_BADGE_INFO,
        'badgeNeutral'        => self::STYLE_BADGE_NEUTRAL,
        'totalLabel'          => self::STYLE_TOTAL_LABEL,
        'totalCenter'         => self::STYLE_TOTAL_CENTER,
        'totalInteger'        => self::STYLE_TOTAL_INTEGER,
        'totalDecimal'        => self::STYLE_TOTAL_DECIMAL,
        'totalCurrency'       => self::STYLE_TOTAL_CURRENCY,
        'totalSignedCurrency' => self::STYLE_TOTAL_SIGNED_CURRENCY,
        'totalPercent'        => self::STYLE_TOTAL_PERCENT,
        'subLabel'            => self::STYLE_SUB_LABEL,
        'subInteger'          => self::STYLE_SUB_INTEGER,
        'subCurrency'         => self::STYLE_SUB_CURRENCY,
        'subPercent'          => self::STYLE_SUB_PERCENT,
        'noteBox'             => self::STYLE_NOTE_BOX,
        'textNoWrap'          => self::STYLE_TEXT_NOWRAP,
        'textNoWrapAlt'       => self::STYLE_TEXT_NOWRAP_ALT,
    ];

    /** @var XlsxSheet[] */
    private array $sheets = [];

    /** @var array<string, int> */
    private array $sharedStringMap = [];

    /** @var string[] */
    private array $sharedStrings = [];

    private string $author;
    private string $title;

    public function __construct(string $title = 'Laporan Konsolidasi Arunika POS', string $author = 'Arunika POS Executive Suite')
    {
        $this->title = $title;
        $this->author = $author;
    }

    public static function resolveStyleId(string|int $style): int
    {
        if (is_int($style)) {
            return $style;
        }
        return self::STYLE_ALIASES[$style] ?? self::STYLE_DEFAULT;
    }

    /**
     * Pilih style zebra genap/ganjil secara otomatis berdasarkan flag $isAlt.
     */
    public static function zebra(int $baseStyle, bool $isAlt): int
    {
        if (!$isAlt) {
            return $baseStyle;
        }
        return match ($baseStyle) {
            self::STYLE_TEXT            => self::STYLE_TEXT_ALT,
            self::STYLE_TEXT_CENTER     => self::STYLE_TEXT_CENTER_ALT,
            self::STYLE_BOLD_TEXT       => self::STYLE_BOLD_TEXT_ALT,
            self::STYLE_INTEGER         => self::STYLE_INTEGER_ALT,
            self::STYLE_DECIMAL         => self::STYLE_DECIMAL_ALT,
            self::STYLE_SIGNED_DECIMAL  => self::STYLE_SIGNED_DECIMAL_ALT,
            self::STYLE_CURRENCY        => self::STYLE_CURRENCY_ALT,
            self::STYLE_SIGNED_CURRENCY => self::STYLE_SIGNED_CURRENCY_ALT,
            self::STYLE_PERCENT         => self::STYLE_PERCENT_ALT,
            self::STYLE_PROFIT_CURRENCY => self::STYLE_PROFIT_CURRENCY_ALT,
            self::STYLE_LOSS_CURRENCY   => self::STYLE_LOSS_CURRENCY_ALT,
            self::STYLE_TEXT_NOWRAP     => self::STYLE_TEXT_NOWRAP_ALT,
            default                     => $baseStyle,
        };
    }

    public function addSheet(string $title, ?string $tabColor = null, array $colWidths = []): XlsxSheet
    {
        $sheet = new XlsxSheet($title, $tabColor);
        if ($colWidths !== []) {
            $sheet->setColWidths($colWidths);
        }
        $this->sheets[] = $sheet;
        return $sheet;
    }

    /**
     * Kemas seluruh worksheet, shared strings, style, dan grafik menjadi biner .xlsx valid.
     */
    public function toBinary(): string
    {
        if ($this->sheets === []) {
            throw new RuntimeException('Workbook harus memiliki minimal 1 worksheet.');
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'arunika_xlsx_');
        if ($tmpFile === false) {
            throw new RuntimeException('Gagal membuat file sementara untuk Excel.');
        }

        $zip = new ZipArchive();
        if ($zip->open($tmpFile, ZipArchive::OVERWRITE | ZipArchive::CREATE) !== true) {
            @unlink($tmpFile);
            throw new RuntimeException('Gagal membuka ZipArchive untuk menulis workbook .xlsx.');
        }

        try {
            $drawingParts = []; // sheetIdx => ['drawingXml' => ..., 'drawingRels' => ..., 'charts' => [chartNum => xml]]
            $chartCounter = 1;
            $drawingCounter = 1;

            // Bangun XML tiap worksheet lebih dulu agar sharedStrings lengkap terisi
            $sheetXmls = [];
            foreach ($this->sheets as $idx => $sheet) {
                $sheetNumber = $idx + 1;
                $drawingId = null;

                if ($sheet->charts !== []) {
                    $drawingId = $drawingCounter++;
                    $chartsForSheet = [];
                    foreach ($sheet->charts as $cIdx => $chartSpec) {
                        $cNum = $chartCounter++;
                        $chartsForSheet[] = [
                            'chartNum' => $cNum,
                            'rId'      => 'rId' . ($cIdx + 1),
                            'spec'     => $chartSpec,
                            'xml'      => $this->buildChartXml($chartSpec),
                        ];
                    }
                    $drawingParts[$sheetNumber] = [
                        'drawingNum'  => $drawingId,
                        'drawingXml'  => $this->buildDrawingXml($chartsForSheet),
                        'drawingRels' => $this->buildDrawingRelsXml($chartsForSheet),
                        'charts'      => $chartsForSheet,
                    ];
                }

                $sheetXmls[$sheetNumber] = $this->buildWorksheetXml($sheet, $drawingId !== null);
            }

            // Tambahkan paket inti OOXML ke ZIP
            $zip->addFromString('[Content_Types].xml', $this->buildContentTypesXml(count($this->sheets), $drawingParts));
            $zip->addFromString('_rels/.rels', $this->buildRootRelsXml());
            $zip->addFromString('docProps/core.xml', $this->buildCorePropsXml());
            $zip->addFromString('docProps/app.xml', $this->buildAppPropsXml());
            $zip->addFromString('xl/workbook.xml', $this->buildWorkbookXml());
            $zip->addFromString('xl/_rels/workbook.xml.rels', $this->buildWorkbookRelsXml(count($this->sheets)));
            $zip->addFromString('xl/styles.xml', $this->buildStylesXml());
            $zip->addFromString('xl/sharedStrings.xml', $this->buildSharedStringsXml());

            foreach ($sheetXmls as $sheetNumber => $xml) {
                $zip->addFromString("xl/worksheets/sheet{$sheetNumber}.xml", $xml);

                if (isset($drawingParts[$sheetNumber])) {
                    $d = $drawingParts[$sheetNumber];
                    $dNum = $d['drawingNum'];
                    $zip->addFromString(
                        "xl/worksheets/_rels/sheet{$sheetNumber}.xml.rels",
                        $this->buildSheetRelsXml($dNum)
                    );
                    $zip->addFromString("xl/drawings/drawing{$dNum}.xml", $d['drawingXml']);
                    $zip->addFromString("xl/drawings/_rels/drawing{$dNum}.xml.rels", $d['drawingRels']);

                    foreach ($d['charts'] as $chartItem) {
                        $zip->addFromString("xl/charts/chart{$chartItem['chartNum']}.xml", $chartItem['xml']);
                    }
                }
            }

            $zip->close();
            $binary = file_get_contents($tmpFile);
            if ($binary === false) {
                throw new RuntimeException('Gagal membaca biner workbook .xlsx.');
            }
            return $binary;
        } finally {
            if (file_exists($tmpFile)) {
                @unlink($tmpFile);
            }
        }
    }

    private function registerString(string $text): int
    {
        $clean = $this->sanitizeXmlString($text);
        if (!array_key_exists($clean, $this->sharedStringMap)) {
            $this->sharedStringMap[$clean] = count($this->sharedStrings);
            $this->sharedStrings[] = $clean;
        }
        return $this->sharedStringMap[$clean];
    }

    private function buildContentTypesXml(int $sheetCount, array $drawingParts): string
    {
        $out = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
            '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
            '  <Default Extension="xml" ContentType="application/xml"/>',
            '  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
            '  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
            '  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>',
            '  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
            '  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
        ];

        for ($i = 1; $i <= $sheetCount; $i++) {
            $out[] = "  <Override PartName=\"/xl/worksheets/sheet{$i}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>";
        }

        foreach ($drawingParts as $d) {
            $dNum = $d['drawingNum'];
            $out[] = "  <Override PartName=\"/xl/drawings/drawing{$dNum}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawing+xml\"/>";
            foreach ($d['charts'] as $chartItem) {
                $cNum = $chartItem['chartNum'];
                $out[] = "  <Override PartName=\"/xl/charts/chart{$cNum}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawingml.chart+xml\"/>";
            }
        }

        $out[] = '</Types>';
        return implode("\n", $out);
    }

    private function buildRootRelsXml(): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
XML;
    }

    private function buildCorePropsXml(): string
    {
        $title = $this->esc($this->title);
        $author = $this->esc($this->author);
        $iso = gmdate('Y-m-d\TH:i:s\Z');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{$title}</dc:title>
  <dc:creator>{$author}</dc:creator>
  <cp:lastModifiedBy>{$author}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{$iso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{$iso}</dcterms:modified>
</cp:coreProperties>
XML;
    }

    private function buildAppPropsXml(): string
    {
        $sheetCount = count($this->sheets);
        $titlesXml = '';
        foreach ($this->sheets as $sheet) {
            $titlesXml .= '<vt:lpstr>' . $this->esc($sheet->title) . '</vt:lpstr>';
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Arunika POS Executive Reporting</Application>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>{$sheetCount}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="{$sheetCount}" baseType="lpstr">{$titlesXml}</vt:vector>
  </TitlesOfParts>
</Properties>
XML;
    }

    private function buildWorkbookXml(): string
    {
        $sheetsXml = [];
        foreach ($this->sheets as $idx => $sheet) {
            $sheetId = $idx + 1;
            $name = $this->esc($sheet->title);
            $sheetsXml[] = "    <sheet name=\"{$name}\" sheetId=\"{$sheetId}\" r:id=\"rId{$sheetId}\"/>";
        }

        $sheetsStr = implode("\n", $sheetsXml);
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000" activeTab="0"/>
  </bookViews>
  <sheets>
{$sheetsStr}
  </sheets>
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>
XML;
    }

    private function buildWorkbookRelsXml(int $sheetCount): string
    {
        $rels = [];
        for ($i = 1; $i <= $sheetCount; $i++) {
            $rels[] = "  <Relationship Id=\"rId{$i}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{$i}.xml\"/>";
        }
        $stylesId = $sheetCount + 1;
        $stringsId = $sheetCount + 2;
        $rels[] = "  <Relationship Id=\"rId{$stylesId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>";
        $rels[] = "  <Relationship Id=\"rId{$stringsId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"sharedStrings.xml\"/>";

        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n"
            . implode("\n", $rels) . "\n</Relationships>";
    }

    private function buildSharedStringsXml(): string
    {
        $count = count($this->sharedStrings);
        $items = [];
        foreach ($this->sharedStrings as $str) {
            $preserve = (preg_match('/^\s|\s$/u', $str) === 1) ? ' xml:space="preserve"' : '';
            $items[] = '<si><t' . $preserve . '>' . $this->esc($str) . '</t></si>';
        }

        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<sst xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" count=\"{$count}\" uniqueCount=\"{$count}\">\n"
            . implode("\n", $items) . "\n</sst>";
    }

    private function buildWorksheetXml(XlsxSheet $sheet, bool $hasDrawing): string
    {
        $maxRow = max(1, !empty($sheet->rows) ? max(array_keys($sheet->rows)) : 1);
        $maxColLetter = XlsxSheet::colLetter(max(1, $sheet->maxCol));

        $parts = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
        ];

        // 1. sheetPr (tabColor & fitToPage)
        $tabColorXml = $sheet->tabColor
            ? '<tabColor rgb="FF' . ltrim($sheet->tabColor, '#') . '"/>'
            : '';
        $parts[] = "  <sheetPr>{$tabColorXml}<pageSetUpPr fitToPage=\"1\"/></sheetPr>";

        // 2. dimension
        $parts[] = "  <dimension ref=\"A1:{$maxColLetter}{$maxRow}\"/>";

        // 3. sheetViews (freeze panes)
        if ($sheet->freezeRow > 0 || $sheet->freezeCol > 0) {
            $topLeftCol = XlsxSheet::colLetter($sheet->freezeCol + 1);
            $topLeftRow = $sheet->freezeRow + 1;
            $topLeft = "{$topLeftCol}{$topLeftRow}";
            $ySplitAttr = $sheet->freezeRow > 0 ? " ySplit=\"{$sheet->freezeRow}\"" : '';
            $xSplitAttr = $sheet->freezeCol > 0 ? " xSplit=\"{$sheet->freezeCol}\"" : '';
            $activePane = ($sheet->freezeRow > 0 && $sheet->freezeCol > 0)
                ? 'bottomRight'
                : ($sheet->freezeRow > 0 ? 'bottomLeft' : 'topRight');

            $parts[] = "  <sheetViews><sheetView workbookViewId=\"0\">"
                . "<pane{$xSplitAttr}{$ySplitAttr} topLeftCell=\"{$topLeft}\" activePane=\"{$activePane}\" state=\"frozen\"/>"
                . "<selection pane=\"{$activePane}\" activeCell=\"{$topLeft}\" sqref=\"{$topLeft}\"/>"
                . "</sheetView></sheetViews>";
        } else {
            $parts[] = '  <sheetViews><sheetView workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews>';
        }

        // 4. sheetFormatPr
        $parts[] = '  <sheetFormatPr defaultRowHeight="20"/>';

        // 5. cols
        if ($sheet->colWidths !== []) {
            $colsXml = ['  <cols>'];
            foreach ($sheet->colWidths as $colIdx => $width) {
                $w = number_format(max(4.0, (float) $width), 2, '.', '');
                $colsXml[] = "    <col min=\"{$colIdx}\" max=\"{$colIdx}\" width=\"{$w}\" customWidth=\"1\"/>";
            }
            $colsXml[] = '  </cols>';
            $parts[] = implode("\n", $colsXml);
        }

        // 6. sheetData
        $rowsOut = ['  <sheetData>'];
        ksort($sheet->rows);
        foreach ($sheet->rows as $rowIndex => $cols) {
            $htAttr = isset($sheet->rowHeights[$rowIndex])
                ? ' ht="' . number_format($sheet->rowHeights[$rowIndex], 1, '.', '') . '" customHeight="1"'
                : '';

            if ($cols === []) {
                $rowsOut[] = "    <row r=\"{$rowIndex}\"{$htAttr}/>";
                continue;
            }

            $cellsXml = [];
            foreach ($cols as $colIndex => $cell) {
                $coord = XlsxSheet::colLetter($colIndex) . $rowIndex;
                $s = (int) ($cell['s'] ?? 0);
                $val = $cell['v'] ?? null;
                $formula = $cell['f'] ?? null;

                if ($formula !== null && $formula !== '') {
                    $cached = is_numeric($val) ? '<v>' . $val . '</v>' : '';
                    $cellsXml[] = "<c r=\"{$coord}\" s=\"{$s}\"><f>" . $this->esc($formula) . "</f>{$cached}</c>";
                } elseif ($val === null || $val === '') {
                    $cellsXml[] = "<c r=\"{$coord}\" s=\"{$s}\"/>";
                } elseif (($cell['t'] ?? '') === 'n' || is_int($val) || is_float($val)) {
                    $numVal = is_numeric($val) ? (0 + $val) : 0;
                    $cellsXml[] = "<c r=\"{$coord}\" s=\"{$s}\"><v>{$numVal}</v></c>";
                } else {
                    $strIdx = $this->registerString((string) $val);
                    $cellsXml[] = "<c r=\"{$coord}\" s=\"{$s}\" t=\"s\"><v>{$strIdx}</v></c>";
                }
            }

            $rowsOut[] = "    <row r=\"{$rowIndex}\"{$htAttr}>" . implode('', $cellsXml) . '</row>';
        }
        $rowsOut[] = '  </sheetData>';
        $parts[] = implode("\n", $rowsOut);

        // 7. mergeCells
        if ($sheet->merges !== []) {
            $mCount = count($sheet->merges);
            $parts[] = "  <mergeCells count=\"{$mCount}\">";
            foreach ($sheet->merges as $range) {
                $parts[] = "    <mergeCell ref=\"{$range}\"/>";
            }
            $parts[] = '  </mergeCells>';
        }

        // 8. autoFilter
        if ($sheet->autoFilterRange !== null) {
            $parts[] = "  <autoFilter ref=\"{$sheet->autoFilterRange}\"/>";
        }

        // 9. pageMargins & pageSetup (Landscape, Fit 1 Page Wide)
        $parts[] = '  <pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.25" footer="0.25"/>';
        $parts[] = '  <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>';

        // 10. drawing (chart anchor)
        if ($hasDrawing) {
            $parts[] = '  <drawing r:id="rId1"/>';
        }

        $parts[] = '</worksheet>';
        return implode("\n", $parts);
    }

    private function buildSheetRelsXml(int $drawingNumber): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing{$drawingNumber}.xml"/>
</Relationships>
XML;
    }

    private function buildDrawingRelsXml(array $chartsForSheet): string
    {
        $rels = [];
        foreach ($chartsForSheet as $chartItem) {
            $rId = $chartItem['rId'];
            $cNum = $chartItem['chartNum'];
            $rels[] = "  <Relationship Id=\"{$rId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart\" Target=\"../charts/chart{$cNum}.xml\"/>";
        }
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n"
            . implode("\n", $rels) . "\n</Relationships>";
    }

    private function buildDrawingXml(array $chartsForSheet): string
    {
        $anchors = [];
        foreach ($chartsForSheet as $idx => $chartItem) {
            $spec = $chartItem['spec'];
            $col = max(0, (int) ($spec['anchorCol'] ?? 0));
            $row = max(0, (int) ($spec['anchorRow'] ?? 0));
            $cx = (int) (($spec['widthPx'] ?? 620) * 9525);
            $cy = (int) (($spec['heightPx'] ?? 320) * 9525);
            $id = $idx + 1;
            $rId = $chartItem['rId'];

            $anchors[] = <<<XML
  <xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>{$col}</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>{$row}</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="{$cx}" cy="{$cy}"/>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="{$id}" name="Chart {$id}"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm>
        <a:off x="0" y="0"/>
        <a:ext cx="0" cy="0"/>
      </xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
                   xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                   r:id="{$rId}"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:oneCellAnchor>
XML;
        }

        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
            . "<xdr:wsDr xmlns:xdr=\"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing\""
            . " xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\">\n"
            . implode("\n", $anchors) . "\n</xdr:wsDr>";
    }

    private function buildChartXml(array $spec): string
    {
        $type = $spec['type'] ?? 'col';
        $title = $this->esc($spec['title'] ?? 'Grafik Laporan');
        $catRange = $this->esc($spec['categoriesRange']);
        $seriesList = $spec['series'] ?? [];
        $legendPos = $spec['legendPos'] ?? 'b';
        $palette = ['1B4332', '059669', 'D97706', '2563EB', '7C3AED', 'DC2626'];

        $seriesXml = [];
        foreach ($seriesList as $idx => $ser) {
            $color = ltrim($ser['color'] ?? $palette[$idx % count($palette)], '#');
            $valRange = $this->esc($ser['valuesRange']);

            if (!empty($ser['nameRange'])) {
                $txXml = '<tx><strRef><f>' . $this->esc($ser['nameRange']) . '</f></strRef></tx>';
            } else {
                $txXml = '<tx><v>' . $this->esc($ser['name'] ?? ('Seri ' . ($idx + 1))) . '</v></tx>';
            }

            if ($type === 'line') {
                $spPr = "<spPr><a:ln xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" w=\"28575\"><a:solidFill><a:srgbClr val=\"{$color}\"/></a:solidFill></a:ln></spPr>"
                    . "<marker><symbol val=\"circle\"/><size val=\"5\"/><spPr><a:solidFill xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:srgbClr val=\"{$color}\"/></a:solidFill></spPr></marker>";
            } elseif ($type === 'doughnut') {
                $spPr = ''; // biarkan varyColors=1 memberi warna tiap irisan
            } else {
                $spPr = "<spPr><a:solidFill xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:srgbClr val=\"{$color}\"/></a:solidFill></spPr>";
            }

            $seriesXml[] = "<ser><idx val=\"{$idx}\"/><order val=\"{$idx}\"/>{$txXml}{$spPr}"
                . "<cat><strRef><f>{$catRange}</f></strRef></cat>"
                . "<val><numRef><f>{$valRange}</f></numRef></val></ser>";
        }
        $allSeries = implode('', $seriesXml);

        $catAxPos = $type === 'bar' ? 'l' : 'b';
        $catOrientation = $type === 'bar' ? 'maxMin' : 'minMax';
        $valAxPos = $type === 'bar' ? 'b' : 'l';
        $valNumFmt = !empty($spec['yAxisCurrency']) ? '"Rp "#,##0' : '#,##0';

        $axesXml = <<<XML
<catAx>
  <axId val="10"/>
  <scaling><orientation val="{$catOrientation}"/></scaling>
  <delete val="0"/>
  <axPos val="{$catAxPos}"/>
  <majorTickMark val="none"/>
  <minorTickMark val="none"/>
  <tickLblPos val="nextTo"/>
  <crossAx val="100"/>
  <crosses val="autoZero"/>
  <auto val="1"/>
  <lblAlgn val="ctr"/>
  <lblOffset val="100"/>
</catAx>
<valAx>
  <axId val="100"/>
  <scaling><orientation val="minMax"/></scaling>
  <delete val="0"/>
  <axPos val="{$valAxPos}"/>
  <majorGridlines><spPr><a:ln xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" w="6350"><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></spPr></majorGridlines>
  <numFmt formatCode="{$this->esc($valNumFmt)}" sourceLinked="0"/>
  <majorTickMark val="none"/>
  <minorTickMark val="none"/>
  <tickLblPos val="nextTo"/>
  <crossAx val="10"/>
  <crosses val="autoZero"/>
  <crossBetween val="between"/>
</valAx>
XML;

        if ($type === 'doughnut') {
            $plotBody = "<doughnutChart><varyColors val=\"1\"/>{$allSeries}<firstSliceAng val=\"0\"/><holeSize val=\"45\"/></doughnutChart>";
        } elseif ($type === 'line') {
            $plotBody = "<lineChart><grouping val=\"standard\"/><varyColors val=\"0\"/>{$allSeries}<axId val=\"10\"/><axId val=\"100\"/></lineChart>{$axesXml}";
        } else {
            $barDir = $type === 'bar' ? 'bar' : 'col';
            $overlap = count($seriesList) > 1 ? '<overlap val="-15"/>' : '';
            $plotBody = "<barChart><barDir val=\"{$barDir}\"/><grouping val=\"clustered\"/><varyColors val=\"0\"/>{$allSeries}<gapWidth val=\"110\"/>{$overlap}<axId val=\"10\"/><axId val=\"100\"/></barChart>{$axesXml}";
        }

        $legendXml = $legendPos !== 'none'
            ? "<legend><legendPos val=\"{$legendPos}\"/><overlay val=\"0\"/></legend>"
            : '';

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<chartSpace xmlns="http://schemas.openxmlformats.org/drawingml/2006/chart"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <roundedCorners val="1"/>
  <chart>
    <title>
      <tx>
        <rich>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr><a:defRPr sz="1150" b="1"><a:solidFill><a:srgbClr val="143326"/></a:solidFill></a:defRPr></a:pPr>
            <a:r><a:rPr lang="id-ID" sz="1150" b="1"><a:solidFill><a:srgbClr val="143326"/></a:solidFill></a:rPr><a:t>{$title}</a:t></a:r>
          </a:p>
        </rich>
      </tx>
      <overlay val="0"/>
    </title>
    <autoTitleDeleted val="0"/>
    <plotArea>
      <layout/>
      {$plotBody}
    </plotArea>
    {$legendXml}
    <plotVisOnly val="1"/>
    <dispBlanksAs val="gap"/>
  </chart>
</chartSpace>
XML;
    }

    private function buildStylesXml(): string
    {
        // Number Formats (>=164)
        $fmtCurrency       = 164;
        $fmtInteger        = 165;
        $fmtDecimal        = 166;
        $fmtSignedDecimal  = 167;
        $fmtSignedCurrency = 168;
        $fmtPercent        = 169;

        $numFmts = [
            $fmtCurrency       => '"Rp "#,##0;-"Rp "#,##0;"Rp "0',
            $fmtInteger        => '#,##0',
            $fmtDecimal        => '#,##0.00',
            $fmtSignedDecimal  => '+#,##0.00;-#,##0.00;0.00',
            $fmtSignedCurrency => '+"Rp "#,##0;-"Rp "#,##0;"Rp "0',
            $fmtPercent        => '0.0%',
        ];

        $fonts = [];
        $addFont = function (int $size, bool $bold = false, bool $italic = false, string $color = '1E293B') use (&$fonts): int {
            $b = $bold ? '<b/>' : '';
            $i = $italic ? '<i/>' : '';
            $fonts[] = "<font>{$b}{$i}<sz val=\"{$size}\"/><color rgb=\"FF{$color}\"/><name val=\"Segoe UI\"/></font>";
            return count($fonts) - 1;
        };

        $fDefault      = $addFont(10, false, false, '1E293B'); // 0
        $fTitleBanner  = $addFont(14, true,  false, 'FFFFFF'); // 1
        $fSubtitle     = $addFont(9,  false, false, 'D1FAE5'); // 2
        $fMeta         = $addFont(9,  false, true,  '334155'); // 3
        $fSection      = $addFont(10, true,  false, '143326'); // 4
        $fKpiLabel     = $addFont(8,  true,  false, '065F46'); // 5
        $fKpiVal       = $addFont(12, true,  false, '143326'); // 6
        $fKpiDanger    = $addFont(12, true,  false, '991B1B'); // 7
        $fTableHead    = $addFont(9,  true,  false, 'FFFFFF'); // 8
        $fBoldDark     = $addFont(10, true,  false, '0F172A'); // 9
        $fProfitGreen  = $addFont(10, true,  false, '166534'); // 10
        $fLossRed      = $addFont(10, true,  false, '991B1B'); // 11
        $fBadgeSuccess = $addFont(9,  true,  false, '166534'); // 12
        $fBadgeWarning = $addFont(9,  true,  false, '92400E'); // 13
        $fBadgeDanger  = $addFont(9,  true,  false, '991B1B'); // 14
        $fBadgeInfo    = $addFont(9,  true,  false, '075985'); // 15
        $fBadgeNeutral = $addFont(9,  true,  false, '334155'); // 16
        $fSub          = $addFont(9,  true,  true,  '334155'); // 17
        $fNote         = $addFont(9,  false, true,  '78350F'); // 18

        // Wajib: index 0 = none, index 1 = gray125 sesuai spesifikasi Excel OOXML
        $fills = [
            '<fill><patternFill patternType="none"/></fill>',
            '<fill><patternFill patternType="gray125"/></fill>',
        ];
        $addFill = function (string $rgb) use (&$fills): int {
            $fills[] = "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF{$rgb}\"/></patternFill></fill>";
            return count($fills) - 1;
        };

        $fillNone         = 0;
        $fillForestDark   = $addFill('143326');
        $fillForestMid    = $addFill('1B4332');
        $fillMintSoft     = $addFill('ECFDF5');
        $fillMintHeader   = $addFill('D1FAE5');
        $fillKpiCard      = $addFill('F0FDF4');
        $fillKpiDanger    = $addFill('FEF2F2');
        $fillWhite        = $addFill('FFFFFF');
        $fillZebra        = $addFill('F8FAFC');
        $fillBadgeSuccess = $addFill('DCFCE7');
        $fillBadgeWarning = $addFill('FEF3C7');
        $fillBadgeDanger  = $addFill('FEE2E2');
        $fillBadgeInfo    = $addFill('E0F2FE');
        $fillBadgeNeutral = $addFill('F1F5F9');
        $fillTotal        = $addFill('E2E8F0');
        $fillSub          = $addFill('F1F5F9');
        $fillNote         = $addFill('FFFBEB');

        // Wajib: index 0 = border kosong
        $borders = [
            '<border><left/><right/><top/><bottom/><diagonal/></border>',
        ];
        $mkBorder = function (string $lStyle, string $lCol, string $rStyle, string $rCol, string $tStyle, string $tCol, string $bStyle, string $bCol) use (&$borders): int {
            $borders[] = '<border>'
                . ($lStyle ? "<left style=\"{$lStyle}\"><color rgb=\"FF{$lCol}\"/></left>" : '<left/>')
                . ($rStyle ? "<right style=\"{$rStyle}\"><color rgb=\"FF{$rCol}\"/></right>" : '<right/>')
                . ($tStyle ? "<top style=\"{$tStyle}\"><color rgb=\"FF{$tCol}\"/></top>" : '<top/>')
                . ($bStyle ? "<bottom style=\"{$bStyle}\"><color rgb=\"FF{$bCol}\"/></bottom>" : '<bottom/>')
                . '<diagonal/></border>';
            return count($borders) - 1;
        };

        $bNone       = 0;
        $bMeta       = $mkBorder('thin', 'A7F3D0', 'thin', 'A7F3D0', 'thin', 'A7F3D0', 'thin', 'A7F3D0');
        $bSection    = $mkBorder('', '', '', '', 'thin', 'A7F3D0', 'medium', '059669');
        $bKpiTop     = $mkBorder('thin', 'A7F3D0', 'thin', 'A7F3D0', 'thin', 'A7F3D0', '', '');
        $bKpiBot     = $mkBorder('thin', 'A7F3D0', 'thin', 'A7F3D0', '', '', 'medium', '059669');
        $bKpiDanger  = $mkBorder('thin', 'FECACA', 'thin', 'FECACA', '', '', 'medium', 'DC2626');
        $bTableHead  = $mkBorder('thin', '2D6A4F', 'thin', '2D6A4F', 'thin', '143326', 'medium', '059669');
        $bCell       = $mkBorder('thin', 'E2E8F0', 'thin', 'E2E8F0', 'thin', 'E2E8F0', 'thin', 'E2E8F0');
        $bBadgeOk    = $mkBorder('thin', '86EFAC', 'thin', '86EFAC', 'thin', '86EFAC', 'thin', '86EFAC');
        $bBadgeWarn  = $mkBorder('thin', 'FCD34D', 'thin', 'FCD34D', 'thin', 'FCD34D', 'thin', 'FCD34D');
        $bBadgeErr   = $mkBorder('thin', 'FCA5A5', 'thin', 'FCA5A5', 'thin', 'FCA5A5', 'thin', 'FCA5A5');
        $bBadgeInfo  = $mkBorder('thin', '7DD3FC', 'thin', '7DD3FC', 'thin', '7DD3FC', 'thin', '7DD3FC');
        $bBadgeGray  = $mkBorder('thin', 'CBD5E1', 'thin', 'CBD5E1', 'thin', 'CBD5E1', 'thin', 'CBD5E1');
        $bTotal      = $mkBorder('thin', 'CBD5E1', 'thin', 'CBD5E1', 'thin', '143326', 'double', '143326');
        $bSub        = $mkBorder('thin', 'CBD5E1', 'thin', 'CBD5E1', 'thin', 'CBD5E1', 'thin', '94A3B8');
        $bNote       = $mkBorder('thin', 'FDE68A', 'thin', 'FDE68A', 'thin', 'FDE68A', 'thin', 'FDE68A');

        // Peta XF tepat sesuai nomor konstanta STYLE_* (0..52)
        $xf = function (int $numFmt, int $font, int $fill, int $border, string $hAlign = 'left', bool $wrap = false): string {
            $wrapAttr = $wrap ? ' wrapText="1"' : '';
            $applyNum = $numFmt > 0 ? ' applyNumberFormat="1"' : '';
            $applyFill = $fill > 0 ? ' applyFill="1"' : '';
            $applyBorder = $border > 0 ? ' applyBorder="1"' : '';
            return "<xf numFmtId=\"{$numFmt}\" fontId=\"{$font}\" fillId=\"{$fill}\" borderId=\"{$border}\" xfId=\"0\" applyFont=\"1\"{$applyNum}{$applyFill}{$applyBorder} applyAlignment=\"1\">"
                . "<alignment horizontal=\"{$hAlign}\" vertical=\"center\"{$wrapAttr}/></xf>";
        };

        $cellXfs = [
            self::STYLE_DEFAULT               => $xf(0, $fDefault, $fillNone, $bNone, 'left', false),
            self::STYLE_TITLE_BANNER          => $xf(0, $fTitleBanner, $fillForestDark, $bNone, 'left', false),
            self::STYLE_SUBTITLE_BANNER       => $xf(0, $fSubtitle, $fillForestMid, $bNone, 'left', false),
            self::STYLE_META_STRIP            => $xf(0, $fMeta, $fillMintSoft, $bMeta, 'left', true),
            self::STYLE_SECTION_HEADER        => $xf(0, $fSection, $fillMintHeader, $bSection, 'left', false),
            self::STYLE_KPI_LABEL             => $xf(0, $fKpiLabel, $fillKpiCard, $bKpiTop, 'left', false),
            self::STYLE_KPI_CURRENCY          => $xf($fmtCurrency, $fKpiVal, $fillKpiCard, $bKpiBot, 'left', false),
            self::STYLE_KPI_NUMBER            => $xf($fmtInteger, $fKpiVal, $fillKpiCard, $bKpiBot, 'left', false),
            self::STYLE_KPI_TEXT              => $xf(0, $fKpiVal, $fillKpiCard, $bKpiBot, 'left', false),
            self::STYLE_KPI_DANGER            => $xf(0, $fKpiDanger, $fillKpiDanger, $bKpiDanger, 'left', false),
            self::STYLE_KPI_PERCENT           => $xf($fmtPercent, $fKpiVal, $fillKpiCard, $bKpiBot, 'left', false),
            self::STYLE_TABLE_HEADER          => $xf(0, $fTableHead, $fillForestMid, $bTableHead, 'center', true),

            self::STYLE_TEXT                  => $xf(0, $fDefault, $fillWhite, $bCell, 'left', true),
            self::STYLE_TEXT_ALT              => $xf(0, $fDefault, $fillZebra, $bCell, 'left', true),
            self::STYLE_TEXT_CENTER           => $xf(0, $fDefault, $fillWhite, $bCell, 'center', true),
            self::STYLE_TEXT_CENTER_ALT       => $xf(0, $fDefault, $fillZebra, $bCell, 'center', true),
            self::STYLE_BOLD_TEXT             => $xf(0, $fBoldDark, $fillWhite, $bCell, 'left', true),
            self::STYLE_BOLD_TEXT_ALT         => $xf(0, $fBoldDark, $fillZebra, $bCell, 'left', true),
            self::STYLE_INTEGER               => $xf($fmtInteger, $fDefault, $fillWhite, $bCell, 'right', false),
            self::STYLE_INTEGER_ALT           => $xf($fmtInteger, $fDefault, $fillZebra, $bCell, 'right', false),
            self::STYLE_DECIMAL               => $xf($fmtDecimal, $fDefault, $fillWhite, $bCell, 'right', false),
            self::STYLE_DECIMAL_ALT           => $xf($fmtDecimal, $fDefault, $fillZebra, $bCell, 'right', false),
            self::STYLE_SIGNED_DECIMAL        => $xf($fmtSignedDecimal, $fDefault, $fillWhite, $bCell, 'right', false),
            self::STYLE_SIGNED_DECIMAL_ALT    => $xf($fmtSignedDecimal, $fDefault, $fillZebra, $bCell, 'right', false),
            self::STYLE_CURRENCY              => $xf($fmtCurrency, $fDefault, $fillWhite, $bCell, 'right', false),
            self::STYLE_CURRENCY_ALT          => $xf($fmtCurrency, $fDefault, $fillZebra, $bCell, 'right', false),
            self::STYLE_SIGNED_CURRENCY       => $xf($fmtSignedCurrency, $fDefault, $fillWhite, $bCell, 'right', false),
            self::STYLE_SIGNED_CURRENCY_ALT   => $xf($fmtSignedCurrency, $fDefault, $fillZebra, $bCell, 'right', false),
            self::STYLE_PERCENT               => $xf($fmtPercent, $fDefault, $fillWhite, $bCell, 'right', false),
            self::STYLE_PERCENT_ALT           => $xf($fmtPercent, $fDefault, $fillZebra, $bCell, 'right', false),
            self::STYLE_PROFIT_CURRENCY       => $xf($fmtCurrency, $fProfitGreen, $fillWhite, $bCell, 'right', false),
            self::STYLE_PROFIT_CURRENCY_ALT   => $xf($fmtCurrency, $fProfitGreen, $fillZebra, $bCell, 'right', false),
            self::STYLE_LOSS_CURRENCY         => $xf($fmtCurrency, $fLossRed, $fillWhite, $bCell, 'right', false),
            self::STYLE_LOSS_CURRENCY_ALT     => $xf($fmtCurrency, $fLossRed, $fillZebra, $bCell, 'right', false),

            self::STYLE_BADGE_SUCCESS         => $xf(0, $fBadgeSuccess, $fillBadgeSuccess, $bBadgeOk, 'center', true),
            self::STYLE_BADGE_WARNING         => $xf(0, $fBadgeWarning, $fillBadgeWarning, $bBadgeWarn, 'center', true),
            self::STYLE_BADGE_DANGER          => $xf(0, $fBadgeDanger, $fillBadgeDanger, $bBadgeErr, 'center', true),
            self::STYLE_BADGE_INFO            => $xf(0, $fBadgeInfo, $fillBadgeInfo, $bBadgeInfo, 'center', true),
            self::STYLE_BADGE_NEUTRAL         => $xf(0, $fBadgeNeutral, $fillBadgeNeutral, $bBadgeGray, 'center', true),

            self::STYLE_TOTAL_LABEL           => $xf(0, $fBoldDark, $fillTotal, $bTotal, 'left', false),
            self::STYLE_TOTAL_CENTER          => $xf(0, $fBoldDark, $fillTotal, $bTotal, 'center', false),
            self::STYLE_TOTAL_INTEGER         => $xf($fmtInteger, $fBoldDark, $fillTotal, $bTotal, 'right', false),
            self::STYLE_TOTAL_DECIMAL         => $xf($fmtDecimal, $fBoldDark, $fillTotal, $bTotal, 'right', false),
            self::STYLE_TOTAL_CURRENCY        => $xf($fmtCurrency, $fBoldDark, $fillTotal, $bTotal, 'right', false),
            self::STYLE_TOTAL_SIGNED_CURRENCY => $xf($fmtSignedCurrency, $fBoldDark, $fillTotal, $bTotal, 'right', false),
            self::STYLE_TOTAL_PERCENT         => $xf($fmtPercent, $fBoldDark, $fillTotal, $bTotal, 'right', false),

            self::STYLE_SUB_LABEL             => $xf(0, $fSub, $fillSub, $bSub, 'left', false),
            self::STYLE_SUB_INTEGER           => $xf($fmtInteger, $fSub, $fillSub, $bSub, 'right', false),
            self::STYLE_SUB_CURRENCY          => $xf($fmtCurrency, $fSub, $fillSub, $bSub, 'right', false),
            self::STYLE_SUB_PERCENT           => $xf($fmtPercent, $fSub, $fillSub, $bSub, 'right', false),

            self::STYLE_NOTE_BOX              => $xf(0, $fNote, $fillNote, $bNote, 'left', true),
            self::STYLE_TEXT_NOWRAP           => $xf(0, $fDefault, $fillWhite, $bCell, 'left', false),
            self::STYLE_TEXT_NOWRAP_ALT       => $xf(0, $fDefault, $fillZebra, $bCell, 'left', false),
            self::STYLE_KPI_DANGER_CURRENCY   => $xf($fmtCurrency, $fKpiDanger, $fillKpiDanger, $bKpiDanger, 'left', false),
            self::STYLE_KPI_DANGER_NUMBER     => $xf($fmtInteger, $fKpiDanger, $fillKpiDanger, $bKpiDanger, 'left', false),
        ];
        ksort($cellXfs);

        $numFmtsXml = [];
        foreach ($numFmts as $id => $code) {
            $numFmtsXml[] = '<numFmt numFmtId="' . $id . '" formatCode="' . $this->esc($code) . '"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' . "\n"
            . '  <numFmts count="' . count($numFmts) . '">' . implode('', $numFmtsXml) . "</numFmts>\n"
            . '  <fonts count="' . count($fonts) . '">' . implode('', $fonts) . "</fonts>\n"
            . '  <fills count="' . count($fills) . '">' . implode('', $fills) . "</fills>\n"
            . '  <borders count="' . count($borders) . '">' . implode('', $borders) . "</borders>\n"
            . '  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' . "\n"
            . '  <cellXfs count="' . count($cellXfs) . '">' . implode('', $cellXfs) . "</cellXfs>\n"
            . '  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' . "\n"
            . '</styleSheet>';
    }

    private function sanitizeXmlString(string $value): string
    {
        // Hapus karakter kontrol ilegal XML 1.0 (pertahankan \t, \n, \r)
        return (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
    }

    private function esc(string $value): string
    {
        return htmlspecialchars($this->sanitizeXmlString($value), ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
