import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { dirtyHtml } = await request.json();

    if (!dirtyHtml) {
      return NextResponse.json({ error: "No se proporcionó HTML" }, { status: 400 });
    }

    // 0. CAPTURAR HEADER ORIGINAL (Protección Outlook/Scotiabank)
    const doctypeMatch = dirtyHtml.match(/<!DOCTYPE[^>]*>/i);
    const htmlTagMatch = dirtyHtml.match(/<html[^>]*>/i);
    const originalDoctype = doctypeMatch ? doctypeMatch[0] : '';
    const originalHtmlTag = htmlTagMatch ? htmlTagMatch[0] : '<html>';

    // 1. NORMALIZAR CASE SENSITIVITY
    let processed = dirtyHtml.replace(/(Margin|Padding|Font|Display|Background|Width|Height|Line-height|Border):/gi, (m: string) => m.toLowerCase());
    const $ = cheerio.load(processed);

    // 2. FILTRO NUCLEAR (Elimina basura visual)
    $('span').each(function() {
      const style = $(this).attr('style') || "";
      if (style.includes('display:none') || style.includes('opacity:0')) {
        let text = $(this).text().replace(/[\u2000-\u200F\u202F\u205F\u3000\ufeff\u034f\u00ad\u2007]/g, '');
        $(this).text(text.replace(/\s+/g, ' ').trim() + " ");
      }
    });

    // 3. ELIMINACIÓN DE TBODY
    $('tbody').each(function() { $(this).replaceWith($(this).contents()); });

    // 4. LIMPIEZA DE TABLAS FANTASMA
    $('table').each(function() {
      const $table = $(this);
      const style = ($table.attr('style') || "").toLowerCase();
      const hasText = $table.text().replace(/\s/g, '').replace(/&nbsp;/g, '').length > 0;
      const hasImg = $table.find('img').length > 0;
      const hasBg = $table.attr('bgcolor') || (style.includes('background') && !style.includes('transparent') && !style.includes('background:none'));
      if (!hasText && !hasImg && !hasBg) { $(this).remove(); }
    });

    // 5. PROCESAMIENTO DE QA
    $('table, td').each(function() {
      const $el = $(this);
      const isButton = $el.attr('bgcolor') || $el.hasClass('t') || $el.find('a.t').length > 0;
      if ($el.attr('align')) $el.attr('align', $el.attr('align'));
      if ($el.attr('width')) $el.attr('width', $el.attr('width'));
      if (this.tagName === 'table') {
        $el.attr({ 'role': 'presentation', 'border': '0', 'cellpadding': '0', 'cellspacing': '0' });
        if (!isButton) {
          const s = $el.attr('style') || "";
          if (s.toLowerCase().includes('border')) $el.css({ 'border': '0', 'border-width': '0' });
        }
      }
    });

    // 6. IMÁGENES E ICONOS (Protección blu)
    $('img').each(function() {
      $(this).attr({ 'alt': $(this).attr('alt') || '', 'border': '0' });
      const s = $(this).attr('style') || "";
      if (!s.toLowerCase().includes('display')) $(this).css('display', 'block');
    });

    // 7. ENLACES (Target _blank forzado)
    $('a').attr({ 'target': '_blank', 'rel': 'noopener noreferrer' });
    
    let cleanHtml = $.html().replace(/\s+/g, " ");
    if (originalDoctype) cleanHtml = cleanHtml.replace(/<!DOCTYPE[^>]*>/i, originalDoctype);
    if (originalHtmlTag) cleanHtml = cleanHtml.replace(/<html[^>]*>/i, originalHtmlTag);

    const ajustes = [
      { elem: "File", mod: "XHTML Header", desc: "Preservación de DOCTYPE" },
      { elem: "Head", mod: "Preheader Fix", desc: "Limpieza de caracteres ocultos" },
      { elem: "Body", mod: "Estructura", desc: "Eliminación de TBODY" },
      { elem: "Table", mod: "Ghost Tables", desc: "Borrado de contenedores vacíos" },
      { elem: "QA / Links", mod: "Target _blank", desc: "Validación de apertura externa" }
    ];

    return NextResponse.json({ cleanHtml: cleanHtml.trim(), ajustes });
  } catch (error) {
    return NextResponse.json({ error: "Falla en el motor" }, { status: 500 });
  }
}