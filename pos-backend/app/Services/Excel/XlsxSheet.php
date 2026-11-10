<?php

namespace App\Services\Excel;

/**
 * Representasi satu worksheet OOXML (.xlsx) dengan baris, sel berformula,
 * merge cell, auto-filter, freeze pane, lebar kolom, dan grafik native Excel.
 */
class XlsxSheet
{
    public string $title;
    public ?string $tabColor;

    /** @var array<int, array<int, array{v: mixed, s: int, f?: string, t?: string}>> */
    public array $rows = [];

    /** @var array<int, float> 1-based rowIndex => height */
    public array $rowHeights = [];

    /** @var array<int, float> 1-based colIndex => width */
    public array $colWidths = [];

    /** @var string[] Cell ranges e.g. 'A1:J1' */
    public array $merges = [];

    public ?string $autoFilterRange = null;
    public int $freezeRow = 0;
    public int $freezeCol = 0;
    public int $nextRow = 1;
    public int $maxCol = 1;

    /** @var array<int, array<string, mixed>> */
    public array $charts = [];

    public function __construct(string $title, ?string $tabColor = null)
    {
        // Excel membatasi nama sheet maksimal 31 karakter & melarang \ / ? * [ ] :
        $sanitized = str_replace(['\\', '/', '?', '*', '[', ']', ':'], '-', $title);
        $this->title = mb_substr($sanitized, 0, 31);
        $this->tabColor = $tabColor;
    }

    /**
     * Atur lebar kolom menggunakan array 1-based [1 => 6, 2 => 25, ...].
     *
     * @param array<int, float|int> $widths
     */
    public function setColWidths(array $widths): self
    {
        foreach ($widths as $col => $width) {
            $this->colWidths[(int) $col] = (float) $width;
            if ((int) $col > $this->maxCol) {
                $this->maxCol = (int) $col;
            }
        }
        return $this;
    }

    public function setFreezePane(int $row, int $col = 0): self
    {
        $this->freezeRow = max(0, $row);
        $this->freezeCol = max(0, $col);
        return $this;
    }

    public function setAutoFilter(string $range): self
    {
        $this->autoFilterRange = $range;
        return $this;
    }

    public function merge(string $range): self
    {
        $this->merges[] = $range;
        return $this;
    }

    /**
     * Tambah satu baris pada posisi kursor berikutnya dan kembalikan nomor baris (1-based).
     *
     * @param array<int, mixed> $cells Daftar sel (0-based array atau 1-based).
     */
    public function addRow(array $cells = [], ?float $height = null): int
    {
        $rowIndex = $this->nextRow++;
        return $this->setRow($rowIndex, $cells, $height);
    }

    /**
     * Tambah baris kosong sebagai spasi visual.
     */
    public function addSpacerRow(float $height = 10): int
    {
        return $this->addRow([], $height);
    }

    /**
     * Isi baris pada nomor baris spesifik (1-based).
     *
     * @param array<int, mixed> $cells
     */
    public function setRow(int $rowIndex, array $cells, ?float $height = null): int
    {
        if ($rowIndex >= $this->nextRow) {
            $this->nextRow = $rowIndex + 1;
        }

        if ($height !== null) {
            $this->rowHeights[$rowIndex] = $height;
        }

        if ($cells === []) {
            if (!isset($this->rows[$rowIndex])) {
                $this->rows[$rowIndex] = [];
            }
            return $rowIndex;
        }

        $isZeroIndexed = array_key_exists(0, $cells);
        $rowData = $this->rows[$rowIndex] ?? [];

        foreach ($cells as $idx => $cell) {
            $colIndex = $isZeroIndexed ? ((int) $idx + 1) : (int) $idx;
            if ($colIndex < 1) {
                continue;
            }
            if ($colIndex > $this->maxCol) {
                $this->maxCol = $colIndex;
            }
            $rowData[$colIndex] = $this->normalizeCell($cell);
        }

        ksort($rowData);
        $this->rows[$rowIndex] = $rowData;
        return $rowIndex;
    }

    /**
     * Tambahkan blok banner judul + subjudul + metadata terstandar di atas sheet.
     */
    public function addBannerHeader(
        string $title,
        string $subtitle,
        string $metaInfo,
        int $spanCols,
    ): self {
        $lastCol = self::colLetter(max(2, $spanCols));

        $r1 = $this->addRow([$title], 28);
        $this->fillStyleRange($r1, 1, $spanCols, XlsxWorkbookWriter::STYLE_TITLE_BANNER);
        $this->merge("A{$r1}:{$lastCol}{$r1}");

        $r2 = $this->addRow([$subtitle], 20);
        $this->fillStyleRange($r2, 1, $spanCols, XlsxWorkbookWriter::STYLE_SUBTITLE_BANNER);
        $this->merge("A{$r2}:{$lastCol}{$r2}");

        $r3 = $this->addRow([$metaInfo], 20);
        $this->fillStyleRange($r3, 1, $spanCols, XlsxWorkbookWriter::STYLE_META_STRIP);
        $this->merge("A{$r3}:{$lastCol}{$r3}");

        $this->addSpacerRow(8);
        return $this;
    }

    /**
     * Tambahkan strip header seksi ber-background mint & garis aksen emerald.
     */
    public function addSectionTitle(string $title, int $spanCols): int
    {
        $lastCol = self::colLetter(max(1, $spanCols));
        $r = $this->addRow([['v' => $title, 's' => XlsxWorkbookWriter::STYLE_SECTION_HEADER]], 23);
        $this->fillStyleRange($r, 1, $spanCols, XlsxWorkbookWriter::STYLE_SECTION_HEADER);
        if ($spanCols > 1) {
            $this->merge("A{$r}:{$lastCol}{$r}");
        }
        return $r;
    }

    /**
     * Tambahkan grafik native Excel OOXML ke sheet.
     *
     * @param array{
     *   type: 'col'|'bar'|'line'|'doughnut',
     *   title: string,
     *   anchorCol: int,
     *   anchorRow: int,
     *   widthPx?: int,
     *   heightPx?: int,
     *   categoriesRange: string,
     *   series: array<int, array{nameRange?: string, name?: string, valuesRange: string, color?: string}>,
     *   yAxisTitle?: string,
     *   legendPos?: 'r'|'b'|'t'|'none'
     * } $spec
     */
    public function addChart(array $spec): self
    {
        $this->charts[] = $spec;
        return $this;
    }

    /**
     * Terapkan style tertentu ke rentang kolom horizontal dalam satu baris (berguna untuk sel merge).
     */
    public function fillStyleRange(int $rowIndex, int $startCol, int $endCol, string|int $style): void
    {
        $styleId = XlsxWorkbookWriter::resolveStyleId($style);
        for ($c = $startCol; $c <= $endCol; $c++) {
            if (!isset($this->rows[$rowIndex][$c])) {
                $this->rows[$rowIndex][$c] = ['v' => null, 's' => $styleId];
            } else {
                $this->rows[$rowIndex][$c]['s'] = $styleId;
            }
            if ($c > $this->maxCol) {
                $this->maxCol = $c;
            }
        }
        ksort($this->rows[$rowIndex]);
    }

    /**
     * Konversi indeks kolom 1-based (1 => A, 27 => AA).
     */
    public static function colLetter(int $colIndex): string
    {
        $letter = '';
        while ($colIndex > 0) {
            $mod = ($colIndex - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $colIndex = intdiv($colIndex - $mod - 1, 26);
        }
        return $letter ?: 'A';
    }

    /**
     * Bentuk string referensi sel absolut untuk ChartML, mis: "'Menu Terlaris'!$B$8:$B$17".
     */
    public function absRange(int $startCol, int $startRow, int $endCol, int $endRow): string
    {
        $escapedSheet = str_replace("'", "''", $this->title);
        $c1 = self::colLetter($startCol);
        $c2 = self::colLetter($endCol);
        if ($startCol === $endCol && $startRow === $endRow) {
            return "'{$escapedSheet}'!\${$c1}\${$startRow}";
        }
        return "'{$escapedSheet}'!\${$c1}\${$startRow}:\${$c2}\${$endRow}";
    }

    /**
     * @return array{v: mixed, s: int, f?: string, t?: string}
     */
    private function normalizeCell(mixed $cell): array
    {
        if (is_array($cell)) {
            $style = XlsxWorkbookWriter::resolveStyleId($cell['s'] ?? 0);
            $out = [
                'v' => $cell['v'] ?? null,
                's' => $style,
            ];
            if (!empty($cell['f'])) {
                $out['f'] = (string) $cell['f'];
            }
            if (!empty($cell['t'])) {
                $out['t'] = (string) $cell['t'];
            }
            return $out;
        }

        if (is_int($cell) || is_float($cell)) {
            return [
                'v' => $cell,
                's' => is_float($cell)
                    ? XlsxWorkbookWriter::STYLE_DECIMAL
                    : XlsxWorkbookWriter::STYLE_INTEGER,
                't' => 'n',
            ];
        }

        return [
            'v' => $cell,
            's' => XlsxWorkbookWriter::STYLE_TEXT,
            't' => 's',
        ];
    }
}

