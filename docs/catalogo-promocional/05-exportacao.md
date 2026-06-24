# Etapa 5 — Exportação PNG e PDF

## Objetivo

Capturar o div de preview e gerar um download de PNG (para redes sociais) ou PDF (para impressão/email).

---

## Bibliotecas a instalar

```bash
pnpm add html-to-image jspdf
```

- **html-to-image**: captura um elemento DOM como imagem (PNG/JPEG/SVG). Mais moderno e leve que html2canvas.
- **jspdf**: cria documentos PDF no browser; aceita imagem como conteúdo.

---

## Hook `use-export.ts`

`src/features/promotional-catalog/hooks/use-export.ts`

```typescript
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

type ExportOptions = {
  previewRef: RefObject<HTMLDivElement>;
  catalogName: string;
};

export function useExport({ previewRef, catalogName }: ExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  async function captureImage(): Promise<string> {
    if (!previewRef.current) throw new Error("Preview não encontrado");
    return toPng(previewRef.current, {
      quality: 0.95,
      pixelRatio: 2, // resolução 2x para melhor qualidade
    });
  }

  async function exportAsPng() {
    setIsExporting(true);
    try {
      const dataUrl = await captureImage();
      const link = document.createElement("a");
      link.download = `${catalogName}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  }

  async function exportAsPdf() {
    setIsExporting(true);
    try {
      const dataUrl = await captureImage();
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));

      // Dimensões em mm (A4 ou proporcional ao conteúdo)
      const pxToMm = (px: number) => px * 0.264583;
      const widthMm = pxToMm(img.width);
      const heightMm = pxToMm(img.height);

      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
      pdf.save(`${catalogName}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  return { exportAsPng, exportAsPdf, isExporting };
}
```

---

## Integração no editor

No `catalog-editor.tsx`, o botão de exportação abre um dropdown:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" disabled={isExporting}>
      {isExporting ? "Gerando..." : "↓ Exportar"}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={exportAsPng}>
      Baixar como PNG
    </DropdownMenuItem>
    <DropdownMenuItem onClick={exportAsPdf}>
      Baixar como PDF
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Considerações técnicas

### Imagens externas (S3)

Os produtos têm imagens hospedadas no S3 (URLs externas). Por padrão, `html-to-image` pode não capturar imagens cross-origin.

Solução: passar `fetchRequestInit` com credenciais ou usar proxy interno.

No `toPng`, adicionar:
```typescript
filter: (node) => {
  // evita elementos que html-to-image não consegue renderizar
  if (node instanceof HTMLElement && node.tagName === "BUTTON") return false;
  return true;
},
```

Para imagens S3 com CORS configurado, funciona diretamente. Verificar no teste se as imagens aparecem na exportação.

### Scroll e altura total

Se o catálogo tiver muitos produtos, o preview pode precisar de altura fixa ou scroll. Na exportação, temporariamente setar `overflow: visible` e `height: auto` para capturar o conteúdo completo.

```typescript
async function captureImage() {
  const el = previewRef.current!;
  const prevOverflow = el.style.overflow;
  el.style.overflow = "visible";
  const dataUrl = await toPng(el, { pixelRatio: 2 });
  el.style.overflow = prevOverflow;
  return dataUrl;
}
```

---

## Verificação

- Clicar "Baixar como PNG" → arquivo `.png` baixa com o conteúdo do preview
- Abrir o PNG — confirmar que imagens dos produtos aparecem (não quebradas)
- Clicar "Baixar como PDF" → arquivo `.pdf` baixa
- Abrir o PDF — confirmar qualidade da imagem (2x pixel ratio)
- Testar com catálogo grande (10+ produtos) — verificar se conteúdo é capturado completo
- Verificar nos 3 temas (light/dark/vibrant) se as cores aparecem corretamente
