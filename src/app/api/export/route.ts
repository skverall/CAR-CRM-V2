import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Lazy imports are used for Excel/PDF generation to avoid overhead when exporting CSV
// We'll import inside the handler only when needed.

type Row = Record<string, unknown>;

function toCSV(rows: Row[]): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").toLowerCase();
  const db = getSupabaseAdmin();

  type ExpenseRowSelect = {
    id: string;
    occurred_at: string;
    amount: number | null;
    currency: string | null;
    rate_to_aed: number | null;
    amount_aed_fils: number | null;
    scope: string;
    category: string;
    description: string | null;
    car_id: string | null;
    au_cars?: { vin: string | null } | null;
  };


  let rows: Row[] = [];
  switch (type) {
    case "expenses": {
      const orgId = searchParams.get("org_id") || "";
      const start = searchParams.get("start");
      const end = searchParams.get("end");
      const scope = searchParams.get("scope");
      const carId = searchParams.get("car_id");
      const category = searchParams.get("category");

      let query = db
        .from("au_expenses")
        .select(`
          id,
          occurred_at,
          amount,
          currency,
          rate_to_aed,
          amount_aed_fils,
          scope,
          category,
          description,
          car_id,
          au_cars(vin)
        `)
        .eq("org_id", orgId)
        .order("occurred_at", { ascending: false })
        .limit(2000);

      if (start) query = query.gte("occurred_at", start);
      if (end) query = query.lte("occurred_at", end);
      if (scope) query = query.eq("scope", scope);
      if (carId) query = query.eq("car_id", carId);
      if (category) query = query.eq("category", category);

      const { data } = await query;
      const arr = (data as ExpenseRowSelect[] | null) || [];
      rows = arr.map((r) => ({
        occurred_at: r.occurred_at,
        scope: r.scope,
        category: r.category,
        amount: r.amount ?? "",
        currency: r.currency ?? "",
        rate_to_aed: r.rate_to_aed ?? "",
        amount_aed: r.amount_aed_fils != null ? (Number(r.amount_aed_fils) / 100).toFixed(2) : "",
        car_id: r.car_id ?? "",
        car_vin: r.au_cars?.vin ?? "",
        description: r.description ?? "",
      }));
      break;
    }
    case "incomes": {
      const { data } = await db.from("au_incomes").select("id,occurred_at,amount,currency,amount_aed,car_id,description").order("occurred_at", { ascending: false }).limit(500);
      rows = data || [];
      break;
    }
    case "movements": {
      const { data } = await db.from("au_capital_movements").select("id,occurred_at,account,amount_aed,reason,expense_id,income_id,car_id,distribution_id").order("occurred_at", { ascending: false }).limit(500);
      rows = data || [];
      break;
    }
    case "cars": {
      const { data } = await db.from("au_cars").select("id,vin,make,model,model_year,status,purchase_date,purchase_currency,purchase_rate_to_aed,purchase_price").order("purchase_date", { ascending: false }).limit(500);
      rows = data || [];
      break;
    }
    case "sales": {
      const orgId = searchParams.get("org_id") || "";
      const start = searchParams.get("start");
      const end = searchParams.get("end");

      type SalesRowSelect = {
        id: string;
        org_id: string;
        vin: string;
        make: string;
        model: string;
        sold_date: string;
        purchase_date: string | null;
        days_on_lot: number | null;
        sold_price_aed: number;
        commission_aed: number;
        total_cost_aed: number;
        profit_aed: number;
        margin_pct: number;
        roi_pct: number;
      };

      let query = db
        .from("car_profit_view")
        .select("id, org_id, vin, make, model, sold_date, purchase_date, days_on_lot, sold_price_aed, commission_aed, total_cost_aed, profit_aed, margin_pct, roi_pct")
        .eq("org_id", orgId)
        .order("sold_date", { ascending: false })
        .limit(5000);

      if (start) query = query.gte("sold_date", start);
      if (end) query = query.lte("sold_date", end);

      const { data } = await query;
      const arr = (data as SalesRowSelect[] | null) || [];
      rows = arr.map((r: SalesRowSelect) => ({
        sold_date: r.sold_date,
        vin: r.vin,
        make: r.make,
        model: r.model,
        sold_price_aed: r.sold_price_aed,
        total_cost_aed: r.total_cost_aed,
        commission_aed: r.commission_aed,
        profit_aed: r.profit_aed,
        margin_pct: r.margin_pct,
        roi_pct: r.roi_pct,
        days_on_lot: r.days_on_lot,
      }));
      break;
    }
    default:
      return new Response("Unknown type", { status: 400 });
  }

  const format = (searchParams.get("format") || "csv").toLowerCase();

  if (format === "xlsx" && type === "sales") {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sales");
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      ws.addRow(headers);
      for (const r of rows) {
        const values = headers.map((h) => {
          const v = r[h] as unknown;
          return v as string | number | boolean | Date | null;
        });
        ws.addRow(values);
      }
      ws.getRow(1).font = { bold: true };
    }
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    return new Response(buf, {
      headers: new Headers({
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename=${type}.xlsx`,
      })
    });
  }

  if (format === "pdf" && type === "sales") {
    const PDFDocument = (await import("pdfkit")).default;

    // Compute totals for the current dataset
    const num = (v: unknown) => (typeof v === 'number' ? v : Number(v || 0));
    const sumBy = (key: string) => rows.reduce((s, r) => s + num(r[key]), 0);
    const count = rows.length;
    const totals = {
      revenue: sumBy('sold_price_aed'),
      cost: sumBy('total_cost_aed'),
      commission: sumBy('commission_aed'),
      profit: sumBy('profit_aed'),
      avgMargin: count ? (rows.reduce((s, r) => s + num(r['margin_pct']), 0) / count) : 0,
    };

    const orgId = (new URL(req.url)).searchParams.get('org_id');
    let orgName = 'Company';
    if (orgId) {
      const { data: org } = await getSupabaseAdmin().from('orgs').select('name').eq('id', orgId).single();
      if (org && (org as { name?: string }).name) orgName = (org as { name: string }).name;
    }

    const start = (new URL(req.url)).searchParams.get('start') || '';
    const end = (new URL(req.url)).searchParams.get('end') || '';
    const periodText = start || end ? `${start || '…'} — ${end || '…'}` : 'All time';

    // Page setup
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const page = { width: doc.page.width, height: doc.page.height, margin: 36 };
    const table = {
      x: page.margin,
      y: page.margin + 80, // after header block
      width: page.width - page.margin * 2,
      rowGap: 6,
      headerBg: '#F3F4F6',
      border: '#E5E7EB',
      fontSize: 9,
      cols: [
        { key: 'sold_date', title: 'Date', width: 70 },
        { key: 'vin', title: 'VIN', width: 110 },
        { key: 'make', title: 'Make', width: 70 },
        { key: 'model', title: 'Model', width: 80 },
        { key: 'sold_price_aed', title: 'Sold', width: 60, align: 'right' as const },
        { key: 'total_cost_aed', title: 'Cost', width: 60, align: 'right' as const },
        { key: 'commission_aed', title: 'Comm', width: 50, align: 'right' as const },
        { key: 'profit_aed', title: 'Profit', width: 60, align: 'right' as const },
        { key: 'margin_pct', title: 'Margin %', width: 55, align: 'right' as const },
        { key: 'roi_pct', title: 'ROI %', width: 45, align: 'right' as const },
      ],
    };

    function drawHeader() {
      // Top bar background
      doc.rect(page.margin, page.margin, page.width - page.margin * 2, 60).fill('#F8FAFC');

      // Org name & report title (left)
      doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold')
        .text(orgName, page.margin + 16, page.margin + 12, { width: page.width - page.margin * 2 - 32, align: 'left' });
      doc.fontSize(12).font('Helvetica').fillColor('#334155')
        .text('Sales Report', page.margin + 16, page.margin + 32);
      doc.fontSize(9).fillColor('#475569')
        .text(`Period: ${periodText}`, page.margin + 16, page.margin + 48);

      // Company mark (top-right): try image public/logo.png, else initials badge
      try {
        doc.image('public/logo.png', page.width - page.margin - 44, page.margin + 8, { fit: [36, 36] });
      } catch {
        // Fallback: initials badge
        const initials = orgName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(w => w[0]?.toUpperCase() || '')
          .join('');
        doc.roundedRect(page.width - page.margin - 44, page.margin + 8, 36, 36, 8).fill('#E2E8F0');
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12)
          .text(initials || '•', page.width - page.margin - 44, page.margin + 18, { width: 36, align: 'center' });
      }

      // Totals box (right side)
      const boxW = 220, boxH = 60, boxX = page.width - page.margin - boxW, boxY = page.margin;
      doc.roundedRect(boxX, boxY, boxW, boxH, 8).stroke('#E2E8F0');
      doc.fontSize(9).fillColor('#0F172A');
      const lineH = 12; let yy = boxY + 10;
      doc.text(`Sales: ${count}`, boxX + 10, yy, { width: boxW - 20 }); yy += lineH;
      doc.text(`Revenue: ${totals.revenue.toLocaleString()} AED`, boxX + 10, yy, { width: boxW - 20 }); yy += lineH;
      doc.text(`Profit: ${totals.profit.toLocaleString()} AED`, boxX + 10, yy, { width: boxW - 20 }); yy += lineH;
      doc.text(`Avg Margin: ${totals.avgMargin.toFixed(1)}%`, boxX + 10, yy, { width: boxW - 20 });

      // Reset fill color for table
      doc.fillColor('#0F172A');
    }

    let pageNo = 1;
    function drawFooter() {
      const contact = 'Phone: +971 585 263 233  •  Email: aydmaxx@gmail.com';
      const leftX = page.margin, rightX = page.width - page.margin;
      const y = page.height - page.margin - 16;
      // separator line
      doc.strokeColor('#E2E8F0').moveTo(leftX, y).lineTo(rightX, y).stroke();
      // footer text, website link & page number
      doc.fontSize(8).fillColor('#64748B');
      doc.text(contact, leftX, y + 4, { width: page.width - page.margin * 2, align: 'left' });
      doc.fillColor('#2563EB');
      doc.text('ezcar24.com', leftX, y + 4, {
        width: page.width - page.margin * 2,
        align: 'center',
        link: 'https://ezcar24.com',
        underline: true,
      });
      doc.fillColor('#64748B');
      doc.text(`Page ${pageNo}`, leftX, y + 4, { width: page.width - page.margin * 2, align: 'right' });
      doc.fillColor('#0F172A').strokeColor('#000000');
    }

    function drawTableHeader(y: number) {
      doc.rect(table.x, y, table.width, 20).fill(table.headerBg).stroke(table.border);
      let xx = table.x + 6;
      for (const col of table.cols) {
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
          .text(col.title, xx, y + 6, { width: col.width - 12, align: col.align || 'left' });
        xx += col.width;
      }
      doc.fillColor('#0F172A').font('Helvetica');
      return y + 22;
    }

    function drawRow(r: Row, y: number) {
      // compute max row height with wrapping
      let rowH = 0;
      const cellPad = 6;
      for (const col of table.cols) {
        const raw = r[col.key];
        const val = (col.key.endsWith('_aed') || col.key.endsWith('_pct')) ? String(raw ?? '') : String(raw ?? '');
        const h = doc.heightOfString(val, { width: col.width - cellPad * 2, align: col.align || 'left' });
        rowH = Math.max(rowH, h + cellPad * 2);
      }
      if (y + rowH > page.height - page.margin - 20) {
        // finish current page with footer, then start a new one
        drawFooter();
        doc.addPage();
        pageNo += 1;
        drawHeader();
        y = drawTableHeader(page.margin + 80);
      }
      // row border
      doc.rect(table.x, y, table.width, rowH).stroke(table.border);
      let xx = table.x + cellPad;
      for (const col of table.cols) {
        let v = r[col.key];
        if (col.key.endsWith('_aed')) v = typeof v === 'number' ? v.toLocaleString() : String(v ?? '');
        if (col.key.endsWith('_pct')) v = typeof v === 'number' ? `${v.toFixed(1)}%` : String(v ?? '');
        doc.text(String(v ?? ''), xx, y + cellPad, { width: col.width - cellPad * 2, align: col.align || 'left' });
        xx += col.width;
      }
      return y + rowH + table.rowGap;
    }

    // First page
    drawHeader();
    let y = drawTableHeader(table.y);
    for (const r of rows) y = drawRow(r, y);
    drawFooter();

    doc.end();
    await new Promise<void>((res) => doc.on('end', () => res()));
    const buf = Buffer.concat(chunks);
    return new Response(buf, {
      headers: new Headers({
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename=${type}.pdf`,
      })
    });
  }

  // Default CSV
  const csv = toCSV(rows);
  return new Response(csv, {
    headers: new Headers({
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${type}.csv`,
    })
  });
}

