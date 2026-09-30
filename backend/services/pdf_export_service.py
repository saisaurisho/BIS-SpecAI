import io
import re
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_standard_pdf_bytes(std_data: Dict[str, Any], clause_text: Optional[str] = None) -> bytes:
    """
    Generates a publication-grade PDF technical specification sheet for an Indian Standard.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e1b4b'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#5b21b6')
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    clause_style = ParagraphStyle(
        'Clause',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Header Banner
    story.append(Paragraph("BUREAU OF INDIAN STANDARDS (BIS) SPECIFICATION REPORT", subtitle_style))
    story.append(Paragraph(f"Standard Assessment: {std_data.get('is_number', '')}", title_style))
    story.append(Paragraph(f"<b>Title:</b> {std_data.get('title', '')}", body_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#5b21b6'), spaceAfter=12))

    # Meta Table
    score = std_data.get('ai_relevance_score', 85)
    score_str = f"{score}% AI Match" if score else "Recommended"
    status_str = "Active / Current Edition" if std_data.get("status") == "current" else f"Superseded (Replacement: {std_data.get('superseded_by', 'Current Edition')})"
    
    certs = std_data.get("certification", [])
    cert_str = ", ".join(certs) if certs else "BIS Scheme-I (ISI Mark)"

    meta_data = [
        [
            Paragraph("<b>IS Number:</b>", body_style),
            Paragraph(str(std_data.get("is_number", "")), body_style),
            Paragraph("<b>AI Relevance:</b>", body_style),
            Paragraph(score_str, body_style)
        ],
        [
            Paragraph("<b>Edition Year:</b>", body_style),
            Paragraph(str(std_data.get("year", "")), body_style),
            Paragraph("<b>Legal Status:</b>", body_style),
            Paragraph(status_str, body_style)
        ],
        [
            Paragraph("<b>Domain:</b>", body_style),
            Paragraph(f"{std_data.get('domain', '')} Domain", body_style),
            Paragraph("<b>Certification:</b>", body_style),
            Paragraph(cert_str, body_style)
        ]
    ]

    t_meta = Table(meta_data, colWidths=[90, 170, 90, 180])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f5f3ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#c4b5fd')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e9d5ff')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # Scope
    story.append(Paragraph("1. OFFICIAL STANDARD SCOPE", h2_style))
    story.append(Paragraph(std_data.get("scope", "Covers manufacturing, performance, and quality requirements as per BIS guidelines."), body_style))
    story.append(Spacer(1, 10))

    # Verified Parameters
    params = std_data.get("technical_parameters", {})
    if params:
        story.append(Paragraph("2. VERIFIED TECHNICAL SPECIFICATIONS", h2_style))
        param_rows = []
        for k, v in list(params.items())[:6]:
            val_str = ", ".join(str(x) for x in v) if isinstance(v, list) else str(v)
            param_rows.append([Paragraph(f"<b>{k}:</b>", body_style), Paragraph(val_str, body_style)])
        
        t_param = Table(param_rows, colWidths=[160, 370])
        t_param.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_param)
        story.append(Spacer(1, 10))

    # Why Recommended
    reasons = std_data.get("why_recommended", [])
    if reasons:
        story.append(Paragraph("3. SPECIFICATION MATCH & AUDIT CHECKPOINTS", h2_style))
        for r in reasons[:4]:
            story.append(Paragraph(f"• {r}", body_style))
        story.append(Spacer(1, 10))

    # Tender Clause
    if clause_text:
        story.append(Paragraph("4. MANDATORY TENDER COMPLIANCE CLAUSE (NIT / GeM)", h2_style))
        t_clause = Table([[Paragraph(clause_text.replace("\n", "<br/>"), clause_style)]], colWidths=[530])
        t_clause.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94a3b8')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t_clause)

    # Footer note
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=6))
    story.append(Paragraph("Generated by BIS-SpecAI Assistant • Grounded on National Indian Standards Catalog • services.bis.gov.in", subtitle_style))

    doc.build(story)
    return buffer.getvalue()
