from datetime import datetime
from io import BytesIO
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from xml.sax.saxutils import escape


NAVY = colors.HexColor('#102B4E')
GOLD = colors.HexColor('#E7AD24')
INK = colors.HexColor('#172B45')
MUTED = colors.HexColor('#61738A')
PALE = colors.HexColor('#F1F5F9')


def build_student_roster_pdf(school, students, class_label, account_filter):
    """Build a branded, multi-page PDF roster for the selected school filters."""
    buffer = BytesIO()
    page_size = landscape(A4)
    document = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=34 * mm,
        bottomMargin=17 * mm,
        title=f'{school.name} Student Roster',
        author=school.name,
    )

    title_style = ParagraphStyle(
        'RosterTitle',
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=NAVY,
        alignment=TA_LEFT,
        spaceAfter=3 * mm,
    )
    detail_style = ParagraphStyle(
        'RosterDetail',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=MUTED,
    )
    cell_style = ParagraphStyle(
        'RosterCell',
        fontName='Helvetica',
        fontSize=7.5,
        leading=9,
        textColor=INK,
    )
    header_cell_style = ParagraphStyle(
        'RosterHeaderCell',
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8,
        textColor=colors.white,
        alignment=TA_LEFT,
    )

    account_label = {
        'with-account': 'Students with portal accounts',
        'without-account': 'Students without portal accounts',
    }.get(account_filter, 'All portal account statuses')

    story = [
        Paragraph('STUDENT ROSTER', title_style),
        Paragraph(
            f'<b>Class:</b> {escape(class_label)}'
            f' &nbsp;&nbsp; <b>Account filter:</b> {escape(account_label)}'
            f' &nbsp;&nbsp; <b>Students:</b> {len(students)}',
            detail_style,
        ),
        Spacer(1, 5 * mm),
    ]

    headers = ['No.', 'Student ID', 'Student Name', 'Class', 'Gender', 'Portal Account', 'Status']
    rows = [[Paragraph(escape(label), header_cell_style) for label in headers]]
    for index, student in enumerate(students, start=1):
        rows.append([
            Paragraph(str(index), cell_style),
            Paragraph(escape(student.student_id or ''), cell_style),
            Paragraph(escape(student.get_full_name()), cell_style),
            Paragraph(escape(student.current_class.full_name if student.current_class else 'Unassigned'), cell_style),
            Paragraph(escape(student.get_gender_display()), cell_style),
            Paragraph('Created' if student.user_id else 'None', cell_style),
            Paragraph('Active' if student.is_active else 'Inactive', cell_style),
        ])

    column_widths = [11 * mm, 32 * mm, 67 * mm, 47 * mm, 22 * mm, 34 * mm, 24 * mm]
    table = Table(rows, colWidths=column_widths, repeatRows=1, hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PALE]),
        ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#D5DEE8')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
    ]))
    story.append(table)

    if not students:
        story.append(Paragraph('No students match the selected filters.', detail_style))

    def draw_page(canvas, doc):
        canvas.saveState()
        page_width, page_height = page_size
        band_height = 25 * mm
        canvas.setFillColor(NAVY)
        canvas.rect(0, page_height - band_height, page_width, band_height, fill=1, stroke=0)
        canvas.setFillColor(GOLD)
        canvas.rect(0, page_height - band_height - 1.2 * mm, page_width, 1.2 * mm, fill=1, stroke=0)

        text_left = 14 * mm
        logo_path = None
        if school.logo:
            try:
                candidate = school.logo.path
                if os.path.isfile(candidate):
                    logo_path = candidate
            except (ValueError, AttributeError, OSError, NotImplementedError):
                pass
        if logo_path:
            try:
                canvas.drawImage(
                    logo_path,
                    text_left,
                    page_height - 21 * mm,
                    width=17 * mm,
                    height=17 * mm,
                    preserveAspectRatio=True,
                    anchor='c',
                    mask='auto',
                )
                text_left += 22 * mm
            except (OSError, ValueError):
                pass

        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 15)
        canvas.drawString(text_left, page_height - 10 * mm, school.name[:95])
        canvas.setFont('Helvetica', 8)
        contact_line = ' | '.join(part for part in [
            school.address,
            school.location,
            school.phone_number,
            school.email,
        ] if part)
        canvas.drawString(text_left, page_height - 16 * mm, contact_line[:180])
        if school.motto:
            canvas.setFont('Helvetica-Oblique', 7.5)
            canvas.drawString(text_left, page_height - 21 * mm, school.motto[:150])

        canvas.setStrokeColor(colors.HexColor('#D5DEE8'))
        canvas.line(14 * mm, 12 * mm, page_width - 14 * mm, 12 * mm)
        canvas.setFillColor(MUTED)
        canvas.setFont('Helvetica', 7)
        canvas.drawString(14 * mm, 7 * mm, f'Generated {datetime.now().strftime("%d %b %Y, %H:%M")}')
        canvas.drawRightString(page_width - 14 * mm, 7 * mm, f'Page {doc.page}')
        canvas.restoreState()

    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return buffer.getvalue()
