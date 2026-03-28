import pdfplumber
import httpx
import io


async def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n\n".join(pages).strip()


async def extract_text_from_pdf_url(url: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url)
        response.raise_for_status()
    return await extract_text_from_pdf_bytes(response.content)
