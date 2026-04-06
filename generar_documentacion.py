#!/usr/bin/env python3
"""
Script para generar documentación técnica del proyecto Boogie
Genera un PDF con estilo profesional y logo de SWM
"""

import os
import re
from fpdf import FPDF
from pathlib import Path
from datetime import datetime

class DocumentacionPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        self.logo_path = self.crear_logo_swm()
        
    def crear_logo_swm(self):
        """Crea un logo simple de SWM"""
        # Crear directorio temporal si no existe
        os.makedirs("temp", exist_ok=True)
        logo_path = "temp/swm_logo.png"
        
        # Crear imagen simple con Pillow
        try:
            from PIL import Image, ImageDraw, ImageFont
            
            # Crear imagen blanca con texto SWM
            img = Image.new('RGB', (200, 60), color='white')
            draw = ImageDraw.Draw(img)
            
            # Intentar usar fuente por defecto
            try:
                font = ImageFont.truetype("Arial.ttf", 40)
            except:
                font = ImageFont.load_default()
            
            # Dibujar texto SWM en verde
            draw.text((20, 10), "SWM", fill=(27, 67, 50), font=font)  # Color #1B4332
            
            # Guardar imagen
            img.save(logo_path)
            print(f"✅ Logo creado: {logo_path}")
            return logo_path
        except Exception as e:
            print(f"⚠️  No se pudo crear logo: {e}")
            return None
    
    def header(self):
        """Encabezado con logo y título"""
        # Logo en la parte superior izquierda
        if self.logo_path and os.path.exists(self.logo_path):
            self.image(self.logo_path, x=10, y=8, w=20)
        
        # Título del documento
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(27, 67, 50)  # Color #1B4332
        self.cell(0, 10, 'Documentacion Tecnica - Proyecto Boogie', 0, 1, 'C')
        
        # Subtítulo
        self.set_font('Helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, f'Generado: {datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 1, 'C')
        
        # Línea separadora
        self.set_draw_color(27, 67, 50)
        self.set_line_width(0.5)
        self.line(10, 25, 200, 25)
        self.ln(10)
    
    def footer(self):
        """Pie de página"""
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Pagina {self.page_no()}/{{nb}}', 0, 0, 'C')
    
    def titulo_seccion(self, titulo):
        """Título de sección principal"""
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(27, 67, 50)
        # Reemplazar caracteres especiales
        titulo = titulo.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
        self.cell(0, 10, titulo, 0, 1, 'L')
        self.set_draw_color(27, 67, 50)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)
    
    def subtitulo(self, texto):
        """Subtítulo"""
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(50, 50, 50)
        # Reemplazar caracteres especiales
        texto = texto.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
        self.cell(0, 8, texto, 0, 1, 'L')
        self.ln(2)
    
    def texto_normal(self, texto):
        """Texto normal"""
        self.set_font('Helvetica', '', 10)
        self.set_text_color(50, 50, 50)
        # Reemplazar caracteres especiales
        texto = texto.replace('•', '-').replace('...', '...').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
        self.multi_cell(0, 5, texto)
        self.ln(2)
    
    def codigo(self, texto):
        """Bloque de código"""
        self.set_font('Courier', '', 9)
        self.set_fill_color(240, 240, 240)
        self.set_text_color(50, 50, 50)
        # Reemplazar caracteres especiales
        texto = texto.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
        self.multi_cell(0, 5, texto, 0, 'L', True)
        self.ln(2)
    
    def tabla_simple(self, encabezados, datos):
        """Tabla simple"""
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(27, 67, 50)
        self.set_text_color(255, 255, 255)
        
        # Encabezados
        ancho_columna = 190 / len(encabezados)
        for encabezado in encabezados:
            # Reemplazar caracteres especiales
            encabezado = encabezado.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
            self.cell(ancho_columna, 7, encabezado, 1, 0, 'C', True)
        self.ln()
        
        # Datos
        self.set_font('Helvetica', '', 8)
        self.set_text_color(50, 50, 50)
        self.set_fill_color(255, 255, 255)
        
        for fila in datos:
            for i, celda in enumerate(fila):
                # Reemplazar caracteres especiales
                celda = str(celda).replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
                self.cell(ancho_columna, 6, celda, 1, 0, 'L', i % 2 == 0)
            self.ln()
        self.ln(5)

def analizar_proyecto(ruta_proyecto):
    """Analiza la estructura del proyecto"""
    print(f"🔍 Analizando proyecto: {ruta_proyecto}")
    
    # Verificar que existe el proyecto
    if not os.path.exists(ruta_proyecto):
        print(f"❌ No se encontró el proyecto en: {ruta_proyecto}")
        return None
    
    # Leer README.md
    readme_path = os.path.join(ruta_proyecto, "README.md")
    readme_content = ""
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            readme_content = f.read()
        print("✅ README.md encontrado")
    
    # Leer package.json
    package_path = os.path.join(ruta_proyecto, "package.json")
    package_content = ""
    if os.path.exists(package_path):
        with open(package_path, 'r', encoding='utf-8') as f:
            package_content = f.read()
        print("✅ package.json encontrado")
    
    # Leer schema.prisma
    prisma_path = os.path.join(ruta_proyecto, "prisma/schema.prisma")
    prisma_content = ""
    if os.path.exists(prisma_path):
        with open(prisma_path, 'r', encoding='utf-8') as f:
            prisma_content = f.read()
        print("✅ schema.prisma encontrado")
    
    # Analizar estructura de directorios
    estructura = analizar_estructura(ruta_proyecto)
    
    # Analizar páginas
    paginas = analizar_paginas(ruta_proyecto)
    
    return {
        "readme": readme_content,
        "package": package_content,
        "prisma": prisma_content,
        "estructura": estructura,
        "paginas": paginas,
        "ruta": ruta_proyecto
    }

def analizar_estructura(ruta_proyecto):
    """Analiza la estructura de directorios"""
    print("📁 Analizando estructura de directorios...")
    
    estructura = {
        "src": [],
        "prisma": [],
        "public": [],
        "config": []
    }
    
    # Directorios principales
    dirs_principales = ["src", "prisma", "public"]
    for dir_name in dirs_principales:
        dir_path = os.path.join(ruta_proyecto, dir_name)
        if os.path.exists(dir_path):
            for root, dirs, files in os.walk(dir_path):
                # Ignorar node_modules y .next
                dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
                
                for file in files:
                    if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.prisma')):
                        rel_path = os.path.relpath(os.path.join(root, file), ruta_proyecto)
                        estructura[dir_name].append(rel_path)
    
    # Archivos de configuración
    config_files = ['package.json', 'tsconfig.json', 'next.config.ts', 'tailwind.config.ts', 
                   'postcss.config.mjs', 'eslint.config.mjs', 'components.json']
    for file in config_files:
        if os.path.exists(os.path.join(ruta_proyecto, file)):
            estructura["config"].append(file)
    
    return estructura

def analizar_paginas(ruta_proyecto):
    """Analiza las páginas de la aplicación"""
    print("📄 Analizando páginas...")
    
    paginas = {
        "main": [],  # Páginas principales
        "auth": [],  # Páginas de autenticación
        "panel": []  # Páginas del panel de usuario
    }
    
    # Buscar archivos page.tsx
    for root, dirs, files in os.walk(os.path.join(ruta_proyecto, "src")):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
        
        for file in files:
            if file == "page.tsx":
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, os.path.join(ruta_proyecto, "src"))
                
                # Leer contenido del archivo
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extraer título si existe
                    titulo_match = re.search(r'//\s*(.*?)(?:\n|$)', content)
                    titulo = titulo_match.group(1) if titulo_match else "Sin título"
                    
                    # Extraer descripción
                    desc_match = re.search(r'/\*\*(.*?)\*\*/', content, re.DOTALL)
                    descripcion = desc_match.group(1).strip() if desc_match else ""
                    
                    info_pagina = {
                        "ruta": rel_path,
                        "titulo": titulo,
                        "descripcion": descripcion,
                        "tamaño": os.path.getsize(full_path)
                    }
                    
                    # Clasificar página
                    if "(auth)" in rel_path:
                        paginas["auth"].append(info_pagina)
                    elif "(panel)" in rel_path:
                        paginas["panel"].append(info_pagina)
                    else:
                        paginas["main"].append(info_pagina)
                        
                except Exception as e:
                    print(f"⚠️  Error leyendo {full_path}: {e}")
    
    return paginas

def generar_documentacion(datos, output_path):
    """Genera el PDF de documentación"""
    print("📝 Generando documentación PDF...")
    
    # Crear PDF
    pdf = DocumentacionPDF()
    
    # Página de título
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(27, 67, 50)
    pdf.cell(0, 20, 'BOOGIE', 0, 1, 'C')
    
    pdf.set_font('Helvetica', '', 16)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, 'Documentacion Tecnica', 0, 1, 'C')
    pdf.cell(0, 10, 'Plataforma de Alquileres Vacacionales', 0, 1, 'C')
    pdf.ln(20)
    
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(0, 8, f'Version: 0.1.0', 0, 1, 'C')
    pdf.cell(0, 8, f'Fecha: {datetime.now().strftime("%d/%m/%Y")}', 0, 1, 'C')
    pdf.cell(0, 8, 'Autor: SWM Films', 0, 1, 'C')
    
    # Índice
    pdf.add_page()
    pdf.titulo_seccion("ÍNDICE")
    pdf.texto_normal("1. Introducción y Visión General")
    pdf.texto_normal("2. Stack Tecnológico")
    pdf.texto_normal("3. Arquitectura del Proyecto")
    pdf.texto_normal("4. Base de Datos")
    pdf.texto_normal("5. Páginas y Funcionalidades")
    pdf.texto_normal("6. Componentes y UI")
    pdf.texto_normal("7. Configuración y Despliegue")
    pdf.texto_normal("8. Scripts y Comandos")
    
    # 1. Introducción
    pdf.add_page()
    pdf.titulo_seccion("1. INTRODUCCIÓN Y VISIÓN GENERAL")
    pdf.subtitulo("Descripción del Proyecto")
    pdf.texto_normal("Boogie es una plataforma de alquileres vacacionales en Venezuela que conecta anfitriones y huéspedes.")
    pdf.texto_normal("Características principales:")
    pdf.texto_normal("• Procesamiento de pagos local (Pago Móvil, Zelle, transferencia bancaria, USDT)")
    pdf.texto_normal("• Sistema de reservas con calendario de disponibilidad")
    pdf.texto_normal("• Panel de usuario con gestión de propiedades y reservas")
    pdf.texto_normal("• Sistema de reseñas y calificaciones")
    pdf.texto_normal("• Landing page con búsqueda y exploración por zonas")
    
    # Extraer información del README
    if datos["readme"]:
        lines = datos["readme"].split('\n')
        funcionalidades = []
        in_funcionalidades = False
        
        for line in lines:
            if "## Funcionalidades" in line:
                in_funcionalidades = True
                continue
            elif line.startswith("## ") and in_funcionalidades:
                break
            elif in_funcionalidades and line.startswith("- "):
                funcionalidades.append(line[2:])
        
        if funcionalidades:
            pdf.subtitulo("Funcionalidades Principales")
            for func in funcionalidades:
                pdf.texto_normal(f"• {func}")
    
    # 2. Stack Tecnológico
    pdf.add_page()
    pdf.titulo_seccion("2. STACK TECNOLÓGICO")
    
    if datos["readme"]:
        lines = datos["readme"].split('\n')
        in_stack = False
        stack_data = []
        
        for line in lines:
            if "| Tecnología | Propósito |" in line:
                in_stack = True
                continue
            elif line.startswith("## ") and in_stack:
                break
            elif in_stack and line.startswith("| ") and not line.startswith("|---"):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 2:
                    stack_data.append(parts[:2])
        
        if stack_data:
            pdf.tabla_simple(["Tecnología", "Propósito"], stack_data)
    
    # 3. Arquitectura del Proyecto
    pdf.add_page()
    pdf.titulo_seccion("3. ARQUITECTURA DEL PROYECTO")
    
    pdf.subtitulo("Estructura de Directorios")
    estructura = datos["estructura"]
    
    pdf.texto_normal("Directorios principales:")
    for dir_name, files in estructura.items():
        if files:
            pdf.texto_normal(f"• {dir_name}/: {len(files)} archivos")
    
    pdf.subtitulo("Páginas de la Aplicación")
    paginas = datos["paginas"]
    
    pdf.texto_normal(f"• Páginas principales: {len(paginas['main'])}")
    pdf.texto_normal(f"• Páginas de autenticación: {len(paginas['auth'])}")
    pdf.texto_normal(f"• Páginas del panel: {len(paginas['panel'])}")
    
    # 4. Base de Datos
    pdf.add_page()
    pdf.titulo_seccion("4. BASE DE DATOS")
    
    if datos["prisma"]:
        pdf.subtitulo("Modelos de Datos")
        
        # Extraer modelos
        modelos = re.findall(r'model\s+(\w+)\s*{([^}]+)}', datos["prisma"], re.DOTALL)
        
        for nombre, contenido in modelos[:10]:  # Primeros 10 modelos
            pdf.subtitulo(f"Modelo: {nombre}")
            
            # Extraer campos
            campos = re.findall(r'(\w+)\s+(\w+)', contenido)
            if campos:
                pdf.tabla_simple(["Campo", "Tipo"], campos[:10])
    
    # 5. Páginas y Funcionalidades
    pdf.add_page()
    pdf.titulo_seccion("5. PÁGINAS Y FUNCIONALIDADES")
    
    pdf.subtitulo("Páginas Principales")
    for pagina in paginas["main"]:
        pdf.texto_normal(f"• {pagina['titulo']}")
        if pagina['descripcion']:
            pdf.texto_normal(f"  {pagina['descripcion'][:100]}...")
    
    pdf.subtitulo("Páginas de Autenticación")
    for pagina in paginas["auth"]:
        pdf.texto_normal(f"• {pagina['titulo']}")
    
    pdf.subtitulo("Panel de Usuario")
    for pagina in paginas["panel"]:
        pdf.texto_normal(f"• {pagina['titulo']}")
    
    # 6. Componentes y UI
    pdf.add_page()
    pdf.titulo_seccion("6. COMPONENTES Y UI")
    
    pdf.subtitulo("Componentes de Layout")
    pdf.texto_normal("• Navbar: Barra de navegación principal")
    pdf.texto_normal("• Footer: Pie de página")
    pdf.texto_normal("• Sidebar: Barra lateral para panel de usuario")
    
    pdf.subtitulo("Componentes de Propiedades")
    pdf.texto_normal("• PropertyCard: Tarjeta de propiedad")
    pdf.texto_normal("• PropertyGrid: Grid de propiedades")
    pdf.texto_normal("• PropertyFilters: Filtros de búsqueda")
    
    pdf.subtitulo("Componentes de Reservas")
    pdf.texto_normal("• BookingWidget: Widget de reserva")
    pdf.texto_normal("• BookingCalendar: Calendario de disponibilidad")
    
    # 7. Configuración y Despliegue
    pdf.add_page()
    pdf.titulo_seccion("7. CONFIGURACIÓN Y DESPLIEGUE")
    
    pdf.subtitulo("Variables de Entorno")
    pdf.texto_normal("Las variables de entorno esenciales son:")
    pdf.texto_normal("• NEXT_PUBLIC_SUPABASE_URL")
    pdf.texto_normal("• NEXT_PUBLIC_SUPABASE_ANON_KEY")
    pdf.texto_normal("• SUPABASE_SERVICE_ROLE_KEY")
    pdf.texto_normal("• DATABASE_URL")
    
    pdf.subtitulo("Paleta de Colores")
    if datos["readme"]:
        lines = datos["readme"].split('\n')
        in_colors = False
        colors_data = []
        
        for line in lines:
            if "| Color | Hex | Uso |" in line:
                in_colors = True
                continue
            elif line.startswith("## ") and in_colors:
                break
            elif in_colors and line.startswith("| ") and not line.startswith("|---"):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 3:
                    colors_data.append(parts[:3])
        
        if colors_data:
            pdf.tabla_simple(["Color", "Hex", "Uso"], colors_data)
    
    # 8. Scripts y Comandos
    pdf.add_page()
    pdf.titulo_seccion("8. SCRIPTS Y COMANDOS")
    
    if datos["package"]:
        import json
        try:
            package_data = json.loads(datos["package"])
            scripts = package_data.get("scripts", {})
            
            pdf.subtitulo("Scripts Disponibles")
            script_data = []
            for script, command in scripts.items():
                script_data.append([script, command])
            
            if script_data:
                pdf.tabla_simple(["Script", "Comando"], script_data)
        except:
            pass
    
    # Guardar PDF
    pdf.output(output_path)
    print(f"✅ Documentación generada: {output_path}")
    return output_path

def main():
    """Función principal"""
    print("🚀 Iniciando generación de documentación para Boogie...")
    
    # Ruta del proyecto
    ruta_proyecto = "/mnt/c/Users/swmfi/Documents/Proyectos/swmTech/boogie"
    
    # Analizar proyecto
    datos = analizar_proyecto(ruta_proyecto)
    
    if not datos:
        print("❌ No se pudo analizar el proyecto")
        return
    
    # Crear directorio para documentación
    doc_dir = os.path.join(ruta_proyecto, "documentacion")
    os.makedirs(doc_dir, exist_ok=True)
    
    # Generar PDF
    output_path = os.path.join(doc_dir, "documentacion_boogie.pdf")
    generar_documentacion(datos, output_path)
    
    print(f"""
📄 RESUMEN:
• Proyecto analizado: {ruta_proyecto}
• Documentación generada: {output_path}
• Archivos encontrados: {sum(len(v) for v in datos['estructura'].values())}
• Páginas encontradas: {len(datos['paginas']['main']) + len(datos['paginas']['auth']) + len(datos['paginas']['panel'])}
    """)

if __name__ == "__main__":
    main()