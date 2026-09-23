import { Service } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfColumn {
    header: string;
    dataKey: string;
}

export interface PdfTableSection {
    type: 'table';
    title: string;
    columns: PdfColumn[];
    rows: Record<string, string | number>[];
}

export interface PdfTextSection {
    type: 'text';
    title: string;
    body: string;
}

export interface PdfKpiSection {
    type: 'kpi';
    title: string;
    items: { label: string; value: string; }[];
}

export type PdfSection = PdfTableSection | PdfTextSection | PdfKpiSection;

export interface PdfOptions {
    title: string;
    subtitle?: string;
    filename: string;
    sections: PdfSection[];
    meta?: { label: string; value: string; }[];
    orientation?: 'portrait' | 'landscape';
    classification?: 'public' | 'internal' | 'confidential' | 'top-secret';
}

@Service()
export class PdfService {
    generate(options: PdfOptions): void {
        const orientation = options.orientation ?? 'portrait';
        const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        this.drawHeader(doc, options, pageWidth);
        let y = 48;

        for (const section of options.sections) {
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }

            if (section.type === 'text') {
                y = this.drawTextSection(doc, section, y, pageWidth);
            } else if (section.type === 'kpi') {
                y = this.drawKpiSection(doc, section, y, pageWidth);
            } else if (section.type === 'table') {
                y = this.drawTableSection(doc, section, y);
            }
        }

        this.drawFooter(doc, options, pageWidth, pageHeight);
        doc.save(`${options.filename}.pdf`);
    }

    private drawHeader(doc: jsPDF, options: PdfOptions, pageWidth: number): void {
        doc.setFillColor(20, 25, 40);
        doc.rect(0, 0, pageWidth, 36, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(options.title, 14, 16);

        if (options.subtitle) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 190, 210);
            doc.text(options.subtitle, 14, 24);
        }

        doc.setFontSize(8);
        doc.setTextColor(140, 150, 170);
        const date = new Date().toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        doc.text(`Generated: ${date}`, pageWidth - 14, 16, { align: 'right' });
        doc.text('OmniSocial System', pageWidth - 14, 24, { align: 'right' });

        if (options.classification) {
            const colors: Record<string, [number, number, number]> = {
                public: [52, 199, 89],
                internal: [0, 122, 255],
                confidential: [255, 149, 0],
                'top-secret': [255, 59, 48],
            };
            const [r, g, b] = colors[options.classification] ?? [142, 142, 147];
            doc.setFillColor(r, g, b);
            const label = options.classification.toUpperCase().replace('-', ' ');
            doc.roundedRect(pageWidth - 60, 27, 46, 7, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(label, pageWidth - 37, 32, { align: 'center' });
        }

        if (options.meta?.length) {
            let mx = 14;
            const my = 42;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            for (const m of options.meta) {
                doc.setTextColor(120, 130, 150);
                doc.text(`${m.label}:`, mx, my);
                const labelWidth = doc.getTextWidth(`${m.label}:`);
                doc.setTextColor(40, 50, 70);
                doc.setFont('helvetica', 'bold');
                doc.text(m.value, mx + labelWidth + 1, my);
                doc.setFont('helvetica', 'normal');
                mx += labelWidth + doc.getTextWidth(m.value) + 8;
            }
        }
    }

    private drawTextSection(doc: jsPDF, section: PdfTextSection, y: number, pageWidth: number): number {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 25, 40);
        doc.text(section.title, 14, y);
        y += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 70, 90);
        const lines = doc.splitTextToSize(section.body, pageWidth - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 8;
        return y;
    }

    private drawKpiSection(doc: jsPDF, section: PdfKpiSection, y: number, pageWidth: number): number {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 25, 40);
        doc.text(section.title, 14, y);
        y += 6;

        const cols = section.items.length > 3 ? 4 : section.items.length;
        const gap = 3;
        const cardW = (pageWidth - 28 - gap * (cols - 1)) / cols;
        const cardH = 22;

        section.items.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = 14 + col * (cardW + gap);
            const cy = y + row * (cardH + gap);

            doc.setFillColor(245, 247, 250);
            doc.roundedRect(x, cy, cardW, cardH, 2, 2, 'F');

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120, 130, 150);
            doc.text(item.label.toUpperCase(), x + 3, cy + 6);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 122, 255);
            doc.text(item.value, x + 3, cy + 16);
        });

        const rows = Math.ceil(section.items.length / cols);
        y += rows * (cardH + gap) + 8;
        return y;
    }

    private drawTableSection(doc: jsPDF, section: PdfTableSection, y: number): number {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 25, 40);
        doc.text(section.title, 14, y);
        y += 4;

        autoTable(doc, {
            startY: y,
            head: [section.columns.map(c => c.header)],
            body: section.rows.map(row => section.columns.map(c => String(row[c.dataKey] ?? ''))),
            theme: 'striped',
            styles: {
                fontSize: 8,
                cellPadding: 2.5,
                lineColor: [220, 224, 230],
                lineWidth: 0.1,
            },
            headStyles: {
                fillColor: [20, 25, 40],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
            },
            alternateRowStyles: { fillColor: [248, 249, 251] },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                const pageH = doc.internal.pageSize.getHeight();
                doc.setFontSize(7);
                doc.setTextColor(150, 155, 165);
                doc.text(
                    `Page ${doc.getNumberOfPages()}`,
                    doc.internal.pageSize.getWidth() - 14,
                    pageH - 8,
                    { align: 'right' },
                );
            },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
        return y;
    }

    private drawFooter(doc: jsPDF, options: PdfOptions, pageWidth: number, pageHeight: number): void {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setDrawColor(220, 224, 230);
            doc.setLineWidth(0.3);
            doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

            doc.setFontSize(7);
            doc.setTextColor(150, 155, 165);
            doc.setFont('helvetica', 'normal');
            doc.text(`${options.title}`, 14, pageHeight - 7);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }
    }

    async generateFromHtml(element: HTMLElement, filename: string): Promise<void> {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 20;
        }

        doc.save(`${filename}.pdf`);
    }
}