"""
MercadoLibre Venezuela Property Scraper v2
Requiere: playwright, beautifulsoup4, lxml
Uso:  python ml_scraper.py          # corrida completa
      python ml_scraper.py --test   # test rápido (80 URLs)
"""

import json
import re
import sys
import time
from pathlib import Path
from typing import Optional

from bs4 import BeautifulSoup, Tag
from playwright.sync_api import sync_playwright, Browser, BrowserContext

# ── Config ──────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
AUTH_FILE = BASE_DIR / "ml_auth.json"
INDEX_FILE = BASE_DIR / "ml_index.json"

SEARCH_URLS = [
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/apartamentos/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/casas/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/terrenos/venta/",
    "https://listado.mercadolibre.com.ve/inmuebles/locales/alquiler/",
    "https://listado.mercadolibre.com.ve/inmuebles/oficinas/alquiler/",
]
MAX_SEARCH_PAGES = 10
DELAY_MS = 6000
DELAY_SEARCH_MS = 4000

AGENCY_KEYWORDS = [
    "Información de la corredora",
    "Información de la inmobiliaria",
    "Información de la tienda",
    "Ir a la tienda oficial",
    "tienda oficial",
    "Corredora con",
    "Corredor con",
    "Inmobiliaria con",
    "Agencia inmobiliaria",
]

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


# ── Helpers ─────────────────────────────────────────────────────────────────

def sleep_ms(ms: int):
    time.sleep(ms / 1000)


def load_json(fp: Path, fallback=None):
    if fp.exists():
        try:
            return json.loads(fp.read_text("utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return fallback if fallback is not None else []


def save_json(fp: Path, data):
    fp.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")


def make_context(browser: Browser) -> BrowserContext:
    opts: dict = {"user_agent": UA, "viewport": {"width": 1920, "height": 1080}}
    if AUTH_FILE.exists():
        opts["storage_state"] = str(AUTH_FILE)
    return browser.new_context(**opts)


def extract_mlv_id(url: str) -> str:
    m = re.search(r"MLV-(\d+)", url)
    return m.group(1) if m else ""


def fmt_phone(raw: Optional[str]) -> Optional[str]:
    if not raw or len(raw) < 10:
        return raw
    return f"+{raw[:2]} {raw[2:5]} {raw[5:8]} {raw[8:]}"


def is_agency(body_text: str) -> bool:
    return any(kw in body_text for kw in AGENCY_KEYWORDS)


def extract_agency_name(body_text: str) -> Optional[str]:
    for pattern in [
        r"Información de la (?:corredora|inmobiliaria|tienda)\s*\n(.+)",
        r"Ir a la tienda oficial de\s+(.+?)(?:\n|$)",
    ]:
        m = re.search(pattern, body_text)
        if m:
            return m.group(1).strip()
    return None


def clean_number(raw: str) -> Optional[int]:
    """Parse a number like '3.000', '1.047', '254' into int."""
    cleaned = raw.replace(".", "").replace(",", "").strip()
    try:
        return int(cleaned)
    except ValueError:
        return None


# ── Extraction with BeautifulSoup (HTML-based) ──────────────────────────────

def extract_property_data(html: str, url: str, agency: bool) -> dict:
    soup = BeautifulSoup(html, "lxml")

    # ── Title ──
    titulo = ""
    h1 = soup.find("h1")
    if h1:
        titulo = h1.get_text(strip=True)

    # ── Price: find the element that contains US$ ──
    price_str = None
    price_num = None
    body_text = soup.get_text(separator="\n", strip=True)
    pm = re.search(r"US\$\s*([\d.,]+)", body_text)
    if pm:
        raw = pm.group(1).replace(".", "").replace(",", ".")
        try:
            price_num = float(raw)
            price_str = f"${int(price_num)} USD"
        except ValueError:
            pass

    # ── Location ──
    ubicacion = ""
    # Try to find the location section
    loc_m = re.search(r"Ubicación\s*\n(.+)", body_text)
    if loc_m:
        ubicacion = loc_m.group(1).strip()

    # ── Description (clean) ──
    descripcion = ""
    # Look for the description section in HTML — it's usually in a <p> or <div>
    # after a heading containing "Descripción"
    desc_heading = soup.find(string=re.compile(r"^Descripción$"))
    if desc_heading:
        parent = desc_heading.find_parent()
        if parent:
            # The actual description is usually in the next sibling(s)
            desc_parts = []
            for sibling in parent.find_next_siblings():
                text = sibling.get_text(strip=True)
                if any(stop in text for stop in [
                    "Información de la zona", "Publicación #",
                    "Consejos de seguridad", "Ubicación",
                ]):
                    break
                if text and len(text) > 5:
                    desc_parts.append(text)
            if not desc_parts:
                # Try parent's next sibling
                next_el = parent.find_next_sibling()
                if next_el:
                    desc_text = next_el.get_text(strip=True)
                    if desc_text and len(desc_text) > 5:
                        desc_parts.append(desc_text)
            descripcion = "\n".join(desc_parts)

    # Fallback: regex on body text but extract only the relevant section
    if not descripcion:
        desc_m = re.search(
            r"Descripción\s*\n([\s\S]*?)(?:\nInformación de la zona|\nPublicación #|\nConsejos de seguridad)",
            body_text,
        )
        if desc_m:
            raw_desc = desc_m.group(1).strip()
            # Filter out UI noise lines
            lines = []
            for line in raw_desc.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if len(line) < 3:
                    continue
                if line in ("D", "Preguntas", "Q", "Calificaciones", "R"):
                    continue
                if "métodos abreviados" in line:
                    continue
                if "flechas arriba o abajo" in line:
                    continue
                if "Mercado Libre Venezuela" in line:
                    continue
                if "Ingresa lo que quieras" in line:
                    continue
                if line.startswith("Categor"):
                    continue
                if line.startswith("Historial"):
                    continue
                if "Tiendas oficiales" in line:
                    continue
                if "Ofertas" in line and len(line) < 10:
                    continue
                if line in ("Vender", "Ayuda", "Nuevo"):
                    continue
                if "Hola " in line and len(line) < 30:
                    continue
                if "@" in line and len(line) < 40:
                    continue
                if "Compras" in line and len(line) < 15:
                    continue
                if "Mi perfil" in line and len(line) < 15:
                    continue
                if "Mi cuenta" in line and len(line) < 15:
                    continue
                if "Mis compras" in line and len(line) < 15:
                    continue
                if "Favoritos" in line and len(line) < 15:
                    continue
                if "Notificaciones" in line:
                    continue
                if line == "...":
                    continue
                if line.startswith("Subir foto"):
                    continue
                if line.startswith("Salir"):
                    continue
                if "Compartir" in line and len(line) < 15:
                    continue
                if "Agregar a" in line and len(line) < 20:
                    continue
                if "Publicado" in line and ("día" in line or "mes" in line):
                    continue
                if "Agregar a una lista" in line:
                    continue
                if line.startswith("Consultar"):
                    continue
                if "WhatsApp" in line and len(line) < 15:
                    continue
                if "problema con la publicación" in line:
                    continue
                if "Avísanos" in line:
                    continue
                if "veracidad" in line:
                    continue
                if "Sospecha" in line:
                    continue
                if "Servicios de pago" in line:
                    continue
                if "sebaschaconpe" in line:
                    continue
                if "Sebastián" in line and len(line) < 20:
                    continue
                if re.match(r"^\d{1,2}$", line):
                    continue
                lines.append(line)
            descripcion = "\n".join(lines)

    # ── Specs — extract from specific table rows ──
    def find_spec_value(label: str) -> Optional[str]:
        # ML uses table-like structures. Find th/td pairs
        for row in soup.find_all("tr"):
            cells = row.find_all(["th", "td"])
            if len(cells) >= 2:
                cell_text = cells[0].get_text(strip=True)
                if label.lower() in cell_text.lower():
                    return cells[1].get_text(strip=True)
        # Fallback: spans
        for span in soup.find_all("span"):
            if label.lower() in span.get_text(strip=True).lower():
                parent = span.find_parent()
                if parent:
                    val_span = parent.find("span", class_=re.compile(r"andes-table.*value|value"))
                    if val_span:
                        return val_span.get_text(strip=True)
        # Fallback: regex
        m = re.search(rf"{label}\s*\n([\d.,]+)", body_text)
        if m:
            return m.group(1)
        return None

    sup_raw = find_spec_value("Superficie total")
    sup = clean_number(sup_raw) if sup_raw else None

    hab_raw = find_spec_value("Habitaciones")
    hab = clean_number(hab_raw) if hab_raw else None

    ban_raw = find_spec_value("Baños")
    ban = clean_number(ban_raw) if ban_raw else None

    est_raw = find_spec_value("Estacionamientos")
    est = clean_number(est_raw) if est_raw else None

    antig_m = re.search(r"Antigüedad\s*\n(.+)", body_text)
    antiguedad = antig_m.group(1).strip() if antig_m else None

    def pbool(label):
        if f"{label}: Sí" in body_text:
            return True
        if f"{label}: No" in body_text:
            return False
        return None

    nombre_agencia = extract_agency_name(body_text) if agency else None

    return {
        "id": extract_mlv_id(url),
        "url": url,
        "titulo": titulo,
        "precio": price_str,
        "precio_numerico": price_num,
        "ubicacion": ubicacion,
        "descripcion": descripcion,
        "superficie": sup,
        "superficie_texto": f"{sup} m²" if sup else None,
        "habitaciones": hab,
        "banos": ban,
        "estacionamientos": est,
        "antiguedad": antiguedad,
        "amoblado": pbool("Amoblado"),
        "admite_mascotas": pbool("Admite mascotas"),
        "telefono": None,
        "whatsapp": None,
        "telefono_formateado": None,
        "publicado_por": "agencia" if agency else "particular",
        "nombre_agencia": nombre_agencia,
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
    }


# ── Phase 1: Discover URLs ─────────────────────────────────────────────────

def discover_urls(ctx: BrowserContext) -> list[str]:
    seen: set[str] = set()

    for search_url in SEARCH_URLS:
        for pg in range(MAX_SEARCH_PAGES):
            page_url = search_url if pg == 0 else f"{search_url}_Desde_{pg * 48 + 1}"
            page = ctx.new_page()
            try:
                page.goto(page_url, wait_until="domcontentloaded", timeout=25000)
                sleep_ms(3000)

                links = page.evaluate(
                    """() => [...new Set(
                        Array.from(document.querySelectorAll('a[href*="mercadolibre.com.ve/MLV-"]'))
                            .map(a => a.href.split('#')[0].split('?')[0])
                            .filter(h => /MLV-\\d+/.test(h))
                    )]"""
                )
                before = len(seen)
                for link in links:
                    seen.add(link)

                cat = "/".join(search_url.rstrip("/").split("/")[-3:-1])
                added = len(seen) - before
                print(f"  {cat} p{pg+1}: +{added} (total: {len(seen)})")
            except Exception:
                print(f"  ERROR p{pg+1}")
            finally:
                page.close()
            sleep_ms(DELAY_SEARCH_MS)

    return list(seen)


# ── Phase 2: Scrape single property ─────────────────────────────────────────

def scrape_property(ctx: BrowserContext, url: str) -> Optional[dict]:
    page = ctx.new_page()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        sleep_ms(4000)

        try:
            btn = page.locator('button:has-text("Aceptar cookies")')
            if btn.is_visible(timeout=2000):
                btn.click()
                sleep_ms(500)
        except Exception:
            pass

        body_text = page.evaluate("() => document.body.innerText")
        agency = is_agency(body_text)

        try:
            page.wait_for_function(
                "() => { const h = document.querySelector('h1'); return h && h.textContent.length > 10; }",
                timeout=15000,
            )
        except Exception:
            return None

        # Phone via WhatsApp popup
        phone = _get_whatsapp_phone(ctx, page)

        html = page.content()
        data = extract_property_data(html, url, agency)

        if not data["titulo"] or len(data["titulo"]) < 5:
            return None

        data["telefono"] = phone
        data["whatsapp"] = f"https://wa.me/{phone}" if phone else None
        data["telefono_formateado"] = fmt_phone(phone) if phone else None

        return data

    except Exception:
        return None
    finally:
        page.close()


def _get_whatsapp_phone(ctx: BrowserContext, page) -> Optional[str]:
    """Get phone via request interception — no popup management."""
    phone_holder: list[str] = []

    def capture_wa_url(request):
        url = request.url
        m = re.search(r"phone=(\d+)", url)
        if m:
            phone_holder.append(m.group(1))

    # Intercept WhatsApp navigation at context level
    ctx.on("request", capture_wa_url)

    try:
        wa_btn = page.locator("button").filter(has_text=re.compile(r"WhatsApp", re.I)).first
        if not wa_btn.is_visible(timeout=3000):
            return None
    except Exception:
        return None

    try:
        # Intercept the new page before it loads
        with ctx.expect_page(timeout=8000) as popup_info:
            wa_btn.click()
        popup = popup_info.value
        # Abort the navigation to avoid loading WhatsApp
        try:
            popup.route("**/*", lambda route: route.abort())
        except Exception:
            pass
        sleep_ms(1500)
        # Also check popup URL directly
        m = re.search(r"phone=(\d+)", popup.url)
        if m and m.group(1) not in phone_holder:
            phone_holder.append(m.group(1))
        try:
            popup.close()
        except Exception:
            pass
    except Exception:
        pass

    # Remove listener
    try:
        ctx.remove_listener("request", capture_wa_url)
    except Exception:
        pass

    # Kill stray pages
    try:
        for p in ctx.pages:
            if p != page:
                p.close()
    except Exception:
        pass

    return phone_holder[0] if phone_holder else None


# ── Output: grouped results ─────────────────────────────────────────────────

def save_grouped(results: list[dict]):
    particulares = [r for r in results if r.get("publicado_por") == "particular"]
    agencias = [r for r in results if r.get("publicado_por") == "agencia"]

    combined = {
        "resumen": {
            "total": len(results),
            "particulares": len(particulares),
            "agencias": len(agencias),
            "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        },
        "particulares": particulares,
        "agencias": agencias,
    }

    save_json(INDEX_FILE, combined)
    return combined["resumen"]


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    test_mode = "--test" in sys.argv

    print("MercadoLibre VE Scraper v2 (Python)")
    print("=" * 50)

    existing = load_json(INDEX_FILE, {})
    results: list[dict] = []
    known: set[str] = set()

    if isinstance(existing, dict) and "particulares" in existing:
        results = existing.get("particulares", []) + existing.get("agencias", [])
        known = {r.get("id") for r in results if r.get("id")}
    elif isinstance(existing, list):
        results = existing
        known = {r.get("id") for r in results if r.get("id")}

    print(f"En indice: {len(known)}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False, args=["--no-sandbox"])

        try:
            # ── Phase 1: Discover ──
            print("\n--- Fase 1: Descubriendo URLs ---")
            ctx1 = make_context(browser)

            if test_mode:
                page = ctx1.new_page()
                page.goto(SEARCH_URLS[0], wait_until="domcontentloaded", timeout=25000)
                sleep_ms(3000)
                found = page.evaluate(
                    """() => [...new Set(
                        Array.from(document.querySelectorAll('a[href*="mercadolibre.com.ve/MLV-"]'))
                            .map(a => a.href.split('#')[0].split('?')[0])
                            .filter(h => /MLV-\\d+/.test(h))
                    )]"""
                )
                page.close()
                urls = [u for u in found if extract_mlv_id(u) not in known]
                print(f"  Test mode: {len(urls)} URLs from first page")
            else:
                urls = discover_urls(ctx1)

            ctx1.close()

            new_urls = [u for u in urls if extract_mlv_id(u) not in known]
            print(f"\nNuevas: {len(new_urls)}")

            # ── Phase 2: Scrape ──
            print("\n--- Fase 2: Scrapeando ---")
            ok_part = 0
            ok_ag = 0
            failed = 0
            ctx2 = make_context(browser)

            stop_at = 80 if test_mode else len(new_urls)

            for i, url in enumerate(new_urls[:stop_at]):
                mlv = extract_mlv_id(url)
                sys.stdout.write(f"[{i+1}/{min(stop_at, len(new_urls))}] {mlv} ")
                sys.stdout.flush()

                result = scrape_property(ctx2, url)

                if result and result.get("id"):
                    results.append(result)
                    tipo = result.get("publicado_por", "?")
                    tel = result.get("telefono_formateado") or "sin tel"
                    precio = result.get("precio") or "?"
                    ag_name = result.get("nombre_agencia") or ""

                    if tipo == "agencia":
                        ok_ag += 1
                        label = ag_name[:25] if ag_name else "AGENCIA"
                        print(f"AG [{label}] | {precio} | {tel}")
                    else:
                        ok_part += 1
                        print(f"PARTICULAR | {precio} | {tel}")
                        print(f"     {result['titulo'][:70]}")
                        print(f"     {result.get('ubicacion', '')[:60]}")

                    save_grouped(results)
                else:
                    failed += 1
                    print("FALLO")

                sleep_ms(DELAY_MS)

                if (i + 1) % 50 == 0 and not test_mode:
                    print(
                        f"\n=== {i+1}/{len(new_urls)} "
                        f"| {ok_part} part | {ok_ag} ag | {failed} fail ===\n"
                    )

            ctx2.close()

            resumen = save_grouped(results)

            print(f"\n{'=' * 50}")
            print(f"RESUMEN FINAL")
            print(f"  Particulares: {resumen['particulares']}")
            print(f"  Agencias:     {resumen['agencias']}")
            print(f"  Fallos:       {failed}")
            print(f"  Total:        {resumen['total']}")
            print(f"\nGuardado en: {INDEX_FILE.name}")
            print(f"  -> particulares: {resumen['particulares']} propiedades")
            print(f"  -> agencias:     {resumen['agencias']} propiedades")

        finally:
            browser.close()


if __name__ == "__main__":
    main()
