from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

# services/pdf_generator.py -> app/templates, so go up one level from
# this file's folder (services/) before looking for templates/.
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)


def render_degree_pdf(
    *,
    registration_id: int,
    student_id: str,
    student_name: str,
    degree_name: str,
    conferral_date: str,
) -> bytes:
    """Render the degree certificate and return the PDF as raw bytes."""
    template = _env.get_template("degree_template.html")
    html_content = template.render(
        registration_id=registration_id,
        student_id=student_id,
        student_name=student_name,
        degree_name=degree_name,
        conferral_date=conferral_date,
    )
    pdf_bytes = HTML(string=html_content, base_url=str(TEMPLATE_DIR)).write_pdf()
    return pdf_bytes
