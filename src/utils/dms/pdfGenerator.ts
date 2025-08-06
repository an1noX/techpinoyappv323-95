import jsPDF from 'jspdf';
import { DocumentData, documentTitles } from '@/types/dms/document';

const createPDFDocument = async (currentDoc: DocumentData, type: string) => {
  console.log('=== PDF GENERATION DEBUG ===');
  console.log('Type:', type);
  console.log('Document data:', currentDoc);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20; // match p-4 (16px) + print:p-2 (8px) for print, so start at 20 for safe top margin
  const logoSize = 14; // mm (approx 56px)

  // Header with pixel-perfect layout matching the preview
  try {
    const headerImg = new Image();
    headerImg.src = '/dms/logo.png';
    await new Promise((resolve, reject) => {
      headerImg.onload = resolve;
      headerImg.onerror = reject;
    });

    // Logo: h-14 w-14 (56px), object-contain, mr-3 (12px), mt-2 (8px)
    // In jsPDF, 1 unit = 1 pt (1/72 inch), so 56px ~ 42pt
    const logoX = margin;
    const logoY = yPosition + 2; // mt-2
    doc.addImage(headerImg, 'PNG', logoX, logoY, logoSize, logoSize);

    // Company name: left of logo + logo width + mr-3 + ml-1 (4px)
    const companyX = logoX + logoSize + 4; // logo + ml-1
    const companyY = logoY + logoSize - 2; // align to bottom of logo, adjust for leading-none
    doc.setFontSize(18); // text-2xl ~ 18pt
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(242, 153, 74); // #F2994A
    doc.text('TECH', companyX, companyY);
    const techWidth = doc.getTextWidth('TECH');
    doc.setTextColor(143, 211, 244); // #8FD3F4
    doc.text('PINOY', companyX + techWidth + 2, companyY); // tracking-widest, add 2pt
    // Subtitle
    doc.setFontSize(10); // text-sm
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // text-gray-500
    doc.text('I.T. Services', companyX, companyY + 7);
  } catch (error) {
    // Fallback: draw TP in a circle
    doc.setFillColor(251, 146, 60); // orange-400
    doc.circle(margin + 8, yPosition + 8, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // white
    doc.text('TP', margin + 5, yPosition + 10);
    // Company name
    const companyX = margin + 20;
    const companyY = yPosition + 16;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(242, 153, 74); // #F2994A
    doc.text('TECH', companyX, companyY);
    const techWidth = doc.getTextWidth('TECH');
    doc.setTextColor(143, 211, 244); // #8FD3F4
    doc.text('PINOY', companyX + techWidth + 2, companyY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // text-gray-500
    doc.text('I.T. Services', companyX, companyY + 7);
  }

  // Report number box (right side, blue-100, rounded-lg, px-4 md:px-6 py-2)
  const boxWidth = 50; // px-4 = 16px, md:px-6 = 24px, py-2 = 8px top/bottom
  const boxHeight = 18;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = yPosition + 2; // align with logo
  doc.setFillColor(219, 234, 254); // blue-100
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
  // Report Number label
  doc.setTextColor(107, 114, 128); // text-xs text-gray-600
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Number', boxX + 4, boxY + 7);
  // Report Number value
  doc.setTextColor(29, 78, 216); // text-blue-700
  doc.setFontSize(14); // text-lg
  doc.setFont('helvetica', 'bold');
  // Generate report number: TP-<date>-<random>
  const datePart = (currentDoc.date || '').replace(/-/g, '').slice(2);
  const randomPart = Math.floor(100 + Math.random() * 900).toString();
  const reportNumber = `TP-${datePart ? datePart + '-' : ''}${randomPart}`;
  doc.text(reportNumber, boxX + 4, boxY + 14);
  // Status - show "Price Quotation" for Price Quotation Request, otherwise show date
  doc.setTextColor(107, 114, 128); // text-xs text-gray-600
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (type === 'priceQuotationRequest') {
    doc.text('Status: Price Quotation', boxX + 4, boxY + 17);
  } else {
    doc.text(`Date: ${currentDoc.date}`, boxX + 4, boxY + 17);
  }

  // Separator line (border-b-2)
  yPosition += logoSize + 10; // add logo height + gap
  doc.setDrawColor(209, 213, 219); // border-gray-200
  doc.setLineWidth(1.2); // border-b-2
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // From and To sections
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('From:', margin, yPosition);
  doc.text('To:', pageWidth / 2 + 10, yPosition);
  
  yPosition += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // From section (company info)
  const fromInfo = [
    'Your Company Name',
    'Your Address',
    'Phone: Your Phone',
    'Email: your@email.com'
  ];
  
  fromInfo.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });
  
  // Reset position for To section
  yPosition -= 20;
  
  // To section (client info)
  const toInfo = [
    currentDoc.clientName,
    currentDoc.clientAddress,
    `Phone: ${currentDoc.clientPhone}`,
    `Email: ${currentDoc.clientEmail}`
  ];
  
  toInfo.forEach(line => {
    doc.text(line, pageWidth / 2 + 10, yPosition);
    yPosition += 5;
  });
  
  yPosition += 20;

  // Items table - EXACT same structure as PurchaseInventoryPreview.tsx
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Table headers - EXACT match with the actual file
  const tableHeaders = ['ITEM', 'PRODUCT NAME', 'QTY', 'UNIT COST', 'TOTAL'];
  const colWidths = [15, 80, 15, 30, 30];
  let xPosition = margin;
  
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });
  
  yPosition += 5;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Table rows - EXACT same logic as PurchaseInventoryPreview.tsx
  doc.setFont('helvetica', 'normal');
  currentDoc.items.forEach((item, index) => {
    xPosition = margin;
    
    // ITEM column (index + 1)
    doc.text((index + 1).toString(), xPosition, yPosition);
    xPosition += colWidths[0];
    
    // PRODUCT NAME column (description)
    doc.text(item.description, xPosition, yPosition);
    xPosition += colWidths[1];
    
    // QTY column
    doc.text(item.quantity.toString(), xPosition, yPosition);
    xPosition += colWidths[2];
    
    // UNIT COST column - show value only if not Price Quotation Request (matches hidden logic)
    if (type !== 'priceQuotationRequest') {
      doc.text(`₱${item.unitPrice.toFixed(2)}`, xPosition, yPosition);
    }
    xPosition += colWidths[3];
    
    // TOTAL column - show value only if not Price Quotation Request (matches hidden logic)
    if (type !== 'priceQuotationRequest') {
      doc.text(`₱${item.total.toFixed(2)}`, xPosition, yPosition);
    }
    
    yPosition += 8;
  });
  
  // Total line - only for non-price quotation requests
  if (type !== 'priceQuotationRequest') {
    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - margin - 50, yPosition);
    const totalAmount = currentDoc.items.reduce((sum, item) => sum + item.total, 0);
    doc.text(`$${totalAmount.toFixed(2)}`, pageWidth - margin - 20, yPosition);
    yPosition += 20;
  } else {
    yPosition += 20;
  }

  // Notes section - show for Price Quotation Request or if regular notes exist
  const notesText = type === 'priceQuotationRequest' 
    ? 'Inventory purchase budget for PO #54ab883f'
    : (currentDoc.notes || '');
  
  console.log('=== NOTES SECTION ===');
  console.log('Type:', type);
  console.log('Notes text:', notesText);
  
  if (notesText) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    
    // Split notes into lines to fit page width
    const noteLines = doc.splitTextToSize(notesText, pageWidth - 2 * margin);
    noteLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  }

  // Custom Footer
  yPosition = pageHeight - 60; // Position footer near bottom of page
  
  // Footer border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Company name with colors
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(242, 153, 74); // #F2994A
  const techWidth = doc.getTextWidth('TECH');
  doc.text('TECH', margin, yPosition);
  doc.setTextColor(96, 165, 250); // text-blue-400
  doc.text('PINOY.COM', margin + techWidth, yPosition);
  
  yPosition += 8;
  
  // Contact info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // text-gray-600
  doc.text('+63977 11 88880', margin, yPosition);
  doc.text('techpinoy@outlook.ph', margin + 60, yPosition);
  
  yPosition += 6;
  
  // Description
  doc.setTextColor(55, 65, 81); // text-gray-700
  const description = 'Your trusted partner for comprehensive IT solutions. We provide remote support, on-site service, and ready-to-use hardware for schools, offices, and businesses.';
  const descriptionLines = doc.splitTextToSize(description, pageWidth - 2 * margin);
  descriptionLines.forEach((line: string) => {
    doc.text(line, margin, yPosition);
    yPosition += 4;
  });
  
  yPosition += 2;
  
  // Services
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128); // text-gray-500
  const services1 = '• I.T. Consulting & Support • All-In-One Printer Solution • All-In-One Computer Solution • Repair Services';
  const services2 = '• Data Recovery & System Services • Network & Server Solutions';
  
  const servicesLines1 = doc.splitTextToSize(services1, pageWidth - 2 * margin);
  servicesLines1.forEach((line: string) => {
    doc.text(line, margin, yPosition);
    yPosition += 3;
  });
  
  const servicesLines2 = doc.splitTextToSize(services2, pageWidth - 2 * margin);
  servicesLines2.forEach((line: string) => {
    doc.text(line, margin, yPosition);
    yPosition += 3;
  });

  yPosition += 4;
  
  // Computer-generated document notice
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text("This is a computer-generated document. No signature required.", margin, yPosition);
  
  yPosition += 6;
  
  // Date and time generated
  const now = new Date();
  const dateGenerated = now.toLocaleDateString();
  const timeGenerated = now.toLocaleTimeString();
  doc.text(`Generated on: ${dateGenerated} at ${timeGenerated}`, margin, yPosition);

  return doc;
};

export const generatePDF = async (currentDoc: DocumentData, type: string) => {
  const doc = await createPDFDocument(currentDoc, type);
  
  // Save the PDF
  const fileName = `${documentTitles[type || ''].replace(/\s+/g, '_')}_${currentDoc.clientName.replace(/\s+/g, '_')}_${currentDoc.date}.pdf`;
  doc.save(fileName);
};

export const generatePDFBlob = async (currentDoc: DocumentData, type: string): Promise<Blob> => {
  const doc = await createPDFDocument(currentDoc, type);
  
  // Return PDF as blob
  return doc.output('blob');
};

export const generateBlankPDF = async (currentDoc: DocumentData, type: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;
  const logoSize = 14;

  // --- HEADER (same as before) ---
  try {
    const headerImg = new Image();
    headerImg.src = '/dms/logo.png';
    await new Promise((resolve, reject) => {
      headerImg.onload = resolve;
      headerImg.onerror = reject;
    });
    const logoX = margin;
    const logoY = yPosition + 2;
    doc.addImage(headerImg, 'PNG', logoX, logoY, logoSize, logoSize);
    const companyX = logoX + logoSize + 4;
    const companyY = logoY + logoSize - 2;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(242, 153, 74);
    doc.text('TECH', companyX, companyY);
    const techWidth = doc.getTextWidth('TECH');
    doc.setTextColor(143, 211, 244);
    doc.text('PINOY', companyX + techWidth + 2, companyY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('I.T. Services', companyX, companyY + 7);
  } catch (error) {
    doc.setFillColor(251, 146, 60);
    doc.circle(margin + 8, yPosition + 8, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TP', margin + 5, yPosition + 10);
    const companyX = margin + 20;
    const companyY = yPosition + 16;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(242, 153, 74);
    doc.text('TECH', companyX, companyY);
    const techWidth = doc.getTextWidth('TECH');
    doc.setTextColor(143, 211, 244);
    doc.text('PINOY', companyX + techWidth + 2, companyY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('I.T. Services', companyX, companyY + 7);
  }
  // Report number box
  const boxWidth = 50;
  const boxHeight = 18;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = yPosition + 2;
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Number', boxX + 4, boxY + 7);
  doc.setTextColor(29, 78, 216);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const datePart = (currentDoc.date || '').replace(/-/g, '').slice(2);
  const randomPart = Math.floor(100 + Math.random() * 900).toString();
  const reportNumber = `TP-${datePart ? datePart + '-' : ''}${randomPart}`;
  doc.text(reportNumber, boxX + 4, boxY + 14);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${currentDoc.date}`, boxX + 4, boxY + 17);
  // Separator line
  yPosition += logoSize + 10;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(1.2);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // --- FOOTER (same as before, but positioned at bottom) ---
  let footerY = pageHeight - 40;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  footerY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(242, 153, 74);
  const techWidth = doc.getTextWidth('TECH');
  doc.text('TECH', margin, footerY);
  doc.setTextColor(96, 165, 250);
  doc.text('PINOY.COM', margin + techWidth, footerY);
  footerY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('+63977 11 88880', margin, footerY);
  doc.text('techpinoy@outlook.ph', margin + 60, footerY);
  footerY += 6;
  doc.setTextColor(55, 65, 81);
  const description = 'Your trusted partner for comprehensive IT solutions. We provide remote support, on-site service, and ready-to-use hardware for schools, offices, and businesses.';
  const descriptionLines = doc.splitTextToSize(description, pageWidth - 2 * margin);
  descriptionLines.forEach((line: string) => {
    doc.text(line, margin, footerY);
    footerY += 4;
  });
  footerY += 2;
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  const services1 = '• I.T. Consulting & Support • All-In-One Printer Solution • All-In-One Computer Solution • Repair Services';
  const services2 = '• Data Recovery & System Services • Network & Server Solutions';
  const servicesLines1 = doc.splitTextToSize(services1, pageWidth - 2 * margin);
  servicesLines1.forEach((line: string) => {
    doc.text(line, margin, footerY);
    footerY += 3;
  });
  const servicesLines2 = doc.splitTextToSize(services2, pageWidth - 2 * margin);
  servicesLines2.forEach((line: string) => {
    doc.text(line, margin, footerY);
    footerY += 3;
  });

  footerY += 4;
  
  // Computer-generated document notice
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text("This is a computer-generated document. No signature required.", margin, footerY);
  
  footerY += 6;
  
  // Date and time generated
  const now = new Date();
  const dateGenerated = now.toLocaleDateString();
  const timeGenerated = now.toLocaleTimeString();
  doc.text(`Generated on: ${dateGenerated} at ${timeGenerated}`, margin, footerY);

  // Save the PDF
  const fileName = `Blank_Document_${currentDoc.date}.pdf`;
  doc.save(fileName);
};
