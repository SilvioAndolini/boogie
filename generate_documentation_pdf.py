#!/usr/bin/env python3
"""
Generador de Documentación Técnica - Proyecto Boogie
Genera un PDF profesional con toda la información técnica del proyecto
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path

# Activar entorno virtual si es necesario
import sys
sys.path.insert(0, '/tmp/pdf_env/lib/python3.14/site-packages')

from fpdf import FPDF

class BoogieDocumentationPDF(FPDF):
    """Clase personalizada para generar PDF de documentación técnica"""
    
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.setup_fonts()
        self.colors = {
            'primary': (27, 67, 50),      # Verde oscuro #1B4332
            'secondary': (231, 111, 81),   # Naranja #E76F51
            'background': (254, 252, 249), # Crema #FEFCF9
            'text': (26, 26, 26),          # Negro suave #1A1A1A
            'light_text': (100, 100, 100), # Gris
            'border': (232, 228, 223),     # Beige #E8E4DF
            'white': (255, 255, 255),
            'code_bg': (245, 245, 245),
        }
        
    def setup_fonts(self):
        """Configura las fuentes del documento"""
        # Usar fuentes estándar que siempre están disponibles
        self.font_family = 'Helvetica'
        
    def header(self):
        """Encabezado de página"""
        if self.page_no() > 1:  # No mostrar en página de título
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(*self.colors['light_text'])
            self.cell(0, 10, 'Boogie - Documentación Técnica', 0, 0, 'L')
            self.cell(0, 10, f'Página {self.page_no()}', 0, 1, 'R')
            self.line(10, 15, 200, 15)
            self.ln(5)
    
    def footer(self):
        """Pie de página"""
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(*self.colors['light_text'])
        self.cell(0, 10, f'© {datetime.now().year} SWM Films - Todos los derechos reservados', 0, 0, 'C')
    
    def add_title_page(self):
        """Página de título"""
        self.add_page()
        
        # Logo simple
        self.set_font('Helvetica', 'B', 48)
        self.set_text_color(*self.colors['primary'])
        self.cell(0, 40, 'BOOGIE', 0, 1, 'C')
        
        # Título
        self.set_font('Helvetica', '', 24)
        self.set_text_color(*self.colors['text'])
        self.cell(0, 15, 'Documentación Técnica', 0, 1, 'C')
        
        # Subtítulo
        self.set_font('Helvetica', '', 16)
        self.set_text_color(*self.colors['light_text'])
        self.cell(0, 10, 'Plataforma de Alquileres Vacacionales en Venezuela', 0, 1, 'C')
        
        # Línea decorativa
        self.set_draw_color(*self.colors['primary'])
        self.set_line_width(1)
        self.line(60, self.get_y() + 10, 150, self.get_y() + 10)
        self.ln(20)
        
        # Información del documento
        self.set_font('Helvetica', '', 12)
        self.set_text_color(*self.colors['text'])
        
        info_items = [
            f'Versión: 1.0.0',
            f'Fecha: {datetime.now().strftime("%d/%m/%Y")}',
            'Autor: SWM Films',
            'Estado: Activo',
            'Stack: Next.js 16 + TypeScript + Prisma'
        ]
        
        for item in info_items:
            self.cell(0, 8, item, 0, 1, 'C')
        
        self.ln(20)
        
        # Descripción
        self.set_font('Helvetica', 'I', 11)
        self.set_text_color(*self.colors['light_text'])
        self.multi_cell(0, 6, 'Este documento contiene la documentación técnica completa del proyecto Boogie, '
                       'una plataforma de alquileres vacacionales diseñada para el mercado venezolano. '
                       'Incluye detalles sobre la arquitectura, base de datos, componentes, funcionalidades '
                       'y guías de configuración y despliegue.', align='C')
    
    def add_table_of_contents(self):
        """Tabla de contenidos"""
        self.add_page()
        self.section_title('TABLA DE CONTENIDOS', 1)
        
        contents = [
            ('1. Introducción y Visión General', '3'),
            ('2. Stack Tecnológico', '4'),
            ('3. Arquitectura del Proyecto', '5'),
            ('4. Estructura de Directorios', '6'),
            ('5. Base de Datos', '7'),
            ('6. Modelos de Datos', '8'),
            ('7. Componentes y UI', '10'),
            ('8. Funcionalidades Principales', '12'),
            ('9. Sistema de Autenticación', '13'),
            ('10. Sistema de Pagos', '14'),
            ('11. Configuración y Variables de Entorno', '15'),
            ('12. Scripts y Comandos', '16'),
            ('13. Deployment y Producción', '17'),
            ('14. Paleta de Colores', '18'),
            ('15. Consideraciones de Seguridad', '19'),
            ('16. Mantenimiento y Actualizaciones', '20'),
        ]
        
        self.set_font('Helvetica', '', 11)
        self.set_text_color(*self.colors['text'])
        
        for title, page in contents:
            # Título
            self.cell(150, 8, title, 0, 0, 'L')
            # Página
            self.cell(0, 8, page, 0, 1, 'R')
            # Línea punteada
            self.set_draw_color(*self.colors['border'])
            self.set_line_width(0.1)
            y = self.get_y() - 4
            self.dashed_line(10, y, 200, y, 1, 1)
    
    def section_title(self, title, level=1):
        """Título de sección con diferentes niveles"""
        if level == 1:
            self.set_font('Helvetica', 'B', 16)
            self.set_text_color(*self.colors['primary'])
            self.cell(0, 12, title, 0, 1, 'L')
            self.set_draw_color(*self.colors['primary'])
            self.set_line_width(0.5)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(8)
        elif level == 2:
            self.set_font('Helvetica', 'B', 14)
            self.set_text_color(*self.colors['secondary'])
            self.cell(0, 10, title, 0, 1, 'L')
            self.ln(4)
        elif level == 3:
            self.set_font('Helvetica', 'B', 12)
            self.set_text_color(*self.colors['text'])
            self.cell(0, 8, title, 0, 1, 'L')
            self.ln(2)
    
    def body_text(self, text):
        """Texto normal"""
        self.set_font('Helvetica', '', 10)
        self.set_text_color(*self.colors['text'])
        self.multi_cell(0, 5, text)
        self.ln(3)
    
    def bullet_point(self, text, indent=10):
        """Punto de lista"""
        self.set_font('Helvetica', '', 10)
        self.set_text_color(*self.colors['text'])
        
        # Guardar posición actual
        x = self.get_x()
        y = self.get_y()
        
        # Dibujar bullet (usar guión en lugar de bullet character)
        self.set_font('Helvetica', 'B', 10)
        self.cell(indent, 5, '-', 0, 0)
        
        # Texto
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5, text)
        self.ln(1)
    
    def code_block(self, code, language='bash'):
        """Bloque de código"""
        self.set_font('Courier', '', 9)
        self.set_fill_color(*self.colors['code_bg'])
        self.set_text_color(*self.colors['text'])
        
        # Calcular altura necesaria
        lines = code.split('\n')
        height = len(lines) * 5 + 4
        
        # Dibujar fondo
        self.rect(10, self.get_y(), 190, height, 'F')
        
        # Escribir código
        self.set_xy(12, self.get_y() + 2)
        for line in lines:
            self.cell(186, 5, line, 0, 1, 'L')
        
        self.ln(5)
    
    def info_box(self, title, content):
        """Caja de información destacada"""
        self.set_draw_color(*self.colors['primary'])
        self.set_fill_color(*self.colors['background'])
        self.set_line_width(0.3)
        
        # Calcular altura
        self.set_font('Helvetica', '', 10)
        lines = content.split('\n')
        height = len(lines) * 5 + 15
        
        # Dibujar caja
        self.rect(10, self.get_y(), 190, height, 'DF')
        
        # Título
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(*self.colors['primary'])
        self.set_xy(15, self.get_y() + 3)
        self.cell(0, 6, title, 0, 1)
        
        # Contenido
        self.set_font('Helvetica', '', 10)
        self.set_text_color(*self.colors['text'])
        self.set_x(15)
        for line in lines:
            self.cell(180, 5, line, 0, 1)
        
        self.ln(8)
    
    def table(self, headers, data, col_widths=None):
        """Tabla de datos"""
        if col_widths is None:
            col_widths = [190 / len(headers)] * len(headers)
        
        # Encabezados
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(*self.colors['primary'])
        self.set_text_color(*self.colors['white'])
        
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 7, header, 1, 0, 'C', True)
        self.ln()
        
        # Datos
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.colors['text'])
        
        for row_idx, row in enumerate(data):
            # Alternar colores de fila
            if row_idx % 2 == 0:
                self.set_fill_color(255, 255, 255)
            else:
                self.set_fill_color(248, 248, 248)
            
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 6, str(cell), 1, 0, 'L', True)
            self.ln()
        
        self.ln(5)

def analyze_project(project_path):
    """Analiza el proyecto y extrae información"""
    print(f"📁 Analizando proyecto: {project_path}")
    
    data = {
        'readme': '',
        'package': '',
        'prisma': '',
        'structure': {},
        'pages': {'main': [], 'auth': [], 'panel': []},
        'components': [],
        'actions': [],
    }
    
    # Leer archivos clave
    files_to_read = {
        'readme': 'README.md',
        'package': 'package.json',
        'prisma': 'prisma/schema.prisma',
    }
    
    for key, filename in files_to_read.items():
        filepath = os.path.join(project_path, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data[key] = f.read()
            print(f"✅ {filename} leído")
    
    # Analizar estructura
    print("📊 Analizando estructura...")
    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', '__pycache__', 'temp', 'documentacion']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                rel_path = os.path.relpath(os.path.join(root, file), project_path)
                data['structure'][rel_path] = os.path.getsize(os.path.join(root, file))
    
    # Analizar páginas
    print("📄 Analizando páginas...")
    pages_dir = os.path.join(project_path, 'src/app')
    if os.path.exists(pages_dir):
        for root, dirs, files in os.walk(pages_dir):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
            
            for file in files:
                if file == 'page.tsx':
                    rel_path = os.path.relpath(os.path.join(root, file), pages_dir)
                    if '(auth)' in rel_path:
                        data['pages']['auth'].append(rel_path)
                    elif '(panel)' in rel_path:
                        data['pages']['panel'].append(rel_path)
                    else:
                        data['pages']['main'].append(rel_path)
    
    # Analizar componentes
    print("🧩 Analizando componentes...")
    components_dir = os.path.join(project_path, 'src/components')
    if os.path.exists(components_dir):
        for root, dirs, files in os.walk(components_dir):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
            
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    rel_path = os.path.relpath(os.path.join(root, file), components_dir)
                    data['components'].append(rel_path)
    
    # Analizar acciones del servidor
    print("⚙️ Analizando acciones del servidor...")
    actions_dir = os.path.join(project_path, 'src/actions')
    if os.path.exists(actions_dir):
        for file in os.listdir(actions_dir):
            if file.endswith('.ts'):
                data['actions'].append(file)
    
    print("✅ Análisis completado")
    return data

def extract_models_from_schema(schema_content):
    """Extrae modelos del schema de Prisma"""
    models = []
    model_pattern = r'model\s+(\w+)\s*\{([^}]+)\}'
    
    matches = re.findall(model_pattern, schema_content, re.DOTALL)
    for name, content in matches:
        fields = []
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('//') and not line.startswith('@@'):
                parts = line.split()
                if len(parts) >= 2:
                    field_name = parts[0]
                    field_type = parts[1]
                    # Añadir información sobre atributos
                    attributes = ' '.join(parts[2:]) if len(parts) > 2 else ''
                    fields.append((field_name, field_type, attributes))
        
        models.append({
            'name': name,
            'fields': fields
        })
    
    return models

def extract_scripts_from_package(package_content):
    """Extrae scripts del package.json"""
    try:
        package_data = json.loads(package_content)
        return package_data.get('scripts', {})
    except:
        return {}

def generate_documentation(project_path, output_path):
    """Genera la documentación PDF completa"""
    print("📝 Generando documentación PDF...")
    
    # Analizar proyecto
    data = analyze_project(project_path)
    
    # Crear PDF
    pdf = BoogieDocumentationPDF()
    
    # 1. Página de título
    pdf.add_title_page()
    
    # 2. Tabla de contenidos
    pdf.add_table_of_contents()
    
    # 3. Introducción
    pdf.add_page()
    pdf.section_title('1. INTRODUCCIÓN Y VISIÓN GENERAL')
    
    pdf.body_text('Boogie es una plataforma de alquileres vacacionales diseñada específicamente para el mercado venezolano. '
                 'Conecta anfitriones que desean alquilar sus propiedades con huéspedes que buscan alojamiento temporal, '
                 'ya sea por vacaciones, trabajo o cualquier otra necesidad.')
    
    pdf.section_title('Descripción del Proyecto', 2)
    pdf.body_text('La plataforma está construida como una aplicación web moderna que ofrece:')
    
    features = [
        'Procesamiento de pagos local (Pago Móvil, Zelle, transferencia bancaria, USDT)',
        'Sistema de reservas con calendario de disponibilidad interactivo',
        'Panel de usuario completo con gestión de propiedades y reservas',
        'Sistema de reseñas y calificaciones detalladas',
        'Landing page atractiva con búsqueda y exploración por zonas geográficas',
        'Soporte para múltiples tipos de propiedades (apartamentos, casas, villas, cabañas, etc.)',
        'Gestión de amenidades y características de cada propiedad',
        'Sistema de notificaciones en tiempo real',
        'Interfaz responsive y optimizada para móviles',
    ]
    
    for feature in features:
        pdf.bullet_point(feature)
    
    pdf.section_title('Objetivos del Proyecto', 2)
    objectives = [
        'Facilitar el alquiler vacacional en Venezuela con métodos de pago locales',
        'Crear una plataforma confiable y segura para anfitriones y huéspedes',
        'Ofrecer una experiencia de usuario intuitiva y agradable',
        'Implementar un sistema de verificación y confianza',
        'Proporcionar herramientas de gestión completas para propietarios',
        'Soportar la economía local con procesamiento de pagos en bolívares y dólares',
    ]
    
    for obj in objectives:
        pdf.bullet_point(obj)
    
    # 4. Stack Tecnológico
    pdf.add_page()
    pdf.section_title('2. STACK TECNOLÓGICO')
    
    pdf.body_text('El proyecto utiliza un stack tecnológico moderno y robusto, optimizado para '
                 'rendimiento, escalabilidad y experiencia de desarrollo.')
    
    # Extraer stack del README
    stack_data = []
    if data['readme']:
        lines = data['readme'].split('\n')
        in_stack = False
        
        for line in lines:
            if '| Tecnología | Propósito |' in line:
                in_stack = True
                continue
            elif line.startswith('## ') and in_stack:
                break
            elif in_stack and line.startswith('| ') and not line.startswith('|---'):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 2:
                    stack_data.append(parts[:2])
    
    if stack_data:
        pdf.section_title('Tecnologías Principales', 2)
        pdf.table(['Tecnología', 'Propósito'], stack_data, [60, 130])
    
    pdf.section_title('Detalles del Stack', 2)
    
    stack_details = [
        ('Frontend', 'Next.js 16 con App Router para renderizado híbrido (SSR/SSG), '
         'TypeScript para tipado estático, Tailwind CSS 4 para estilos utilitarios, '
         'shadcn/ui para componentes accesibles y personalizables.'),
        
        ('Backend', 'Next.js Server Actions para lógica de servidor, Prisma 7 como ORM '
         'para PostgreSQL (Supabase), Zod para validación de esquemas.'),
        
        ('Autenticación', 'Supabase Auth para gestión de usuarios, sesiones y seguridad.'),
        
        ('Almacenamiento', 'Supabase Storage para imágenes de propiedades, PostgreSQL para datos estructurados.'),
        
        ('Estado', 'Zustand para estado global del cliente, TanStack Query para cache del servidor.'),
        
        ('UI/UX', 'Framer Motion para animaciones, React Hook Form para formularios, '
         'componentes reutilizables y diseño responsive.'),
    ]
    
    for category, description in stack_details:
        pdf.section_title(category, 3)
        pdf.body_text(description)
    
    # 5. Arquitectura del Proyecto
    pdf.add_page()
    pdf.section_title('3. ARQUITECTURA DEL PROYECTO')
    
    pdf.body_text('Boogie sigue una arquitectura moderna basada en componentes, con separación clara '
                 'entre frontend y backend, utilizando los patrones más recientes de Next.js.')
    
    pdf.section_title('Principios de Arquitectura', 2)
    
    principles = [
        'App Router de Next.js: Utiliza el sistema de rutas basado en carpetas con layout anidados',
        'Server Components: Componentes que se renderizan en el servidor para mejor rendimiento',
        'Server Actions: Funciones del servidor para mutaciones de datos seguras',
        'Separación de preocupaciones: Lógica de negocio separada de la presentación',
        'Componentes reutilizables: UI modular con shadcn/ui como base',
        'Tipado fuerte: TypeScript en todo el proyecto para mayor seguridad',
    ]
    
    for principle in principles:
        pdf.bullet_point(principle)
    
    pdf.section_title('Patrones de Diseño', 2)
    
    patterns = [
        'Contenedor/Presentación: Separación entre lógica y UI',
        'Hooks personalizados: Lógica reutilizable (useSearch, useDebounce, etc.)',
        'Server Actions: Para mutaciones de datos y llamadas al backend',
        'Provider Pattern: Para contextos globales (autenticación, estado)',
        'Skeleton Loading: Para mejor experiencia durante la carga',
    ]
    
    for pattern in patterns:
        pdf.bullet_point(pattern)
    
    # 6. Estructura de Directorios
    pdf.add_page()
    pdf.section_title('4. ESTRUCTURA DE DIRECTORIOS')
    
    pdf.body_text('El proyecto sigue una estructura organizada y clara que facilita el mantenimiento '
                 'y la colaboración entre desarrolladores.')
    
    pdf.section_title('Directorios Principales', 2)
    
    directories = [
        ('src/', 'Código fuente principal de la aplicación'),
        ('src/app/', 'Rutas y layouts de la aplicación (App Router)'),
        ('src/components/', 'Componentes React reutilizables'),
        ('src/actions/', 'Server Actions para lógica de backend'),
        ('src/lib/', 'Utilidades, constantes y configuraciones'),
        ('src/hooks/', 'Hooks personalizados de React'),
        ('src/types/', 'Definiciones de tipos TypeScript'),
        ('prisma/', 'Esquema de base de datos y migraciones'),
        ('public/', 'Archivos estáticos (imágenes, íconos, etc.)'),
        ('scripts/', 'Scripts de utilidad para desarrollo'),
    ]
    
    for dir_name, description in directories:
        pdf.section_title(dir_name, 3)
        pdf.body_text(description)
    
    pdf.section_title('Archivos de Configuración', 2)
    
    config_files = [
        'package.json - Dependencias y scripts del proyecto',
        'tsconfig.json - Configuración de TypeScript',
        'next.config.ts - Configuración de Next.js',
        'tailwind.config.ts - Configuración de Tailwind CSS',
        'postcss.config.mjs - Configuración de PostCSS',
        'eslint.config.mjs - Configuración de ESLint',
        'prisma.config.ts - Configuración de Prisma',
        '.env.example - Ejemplo de variables de entorno',
    ]
    
    for config in config_files:
        pdf.bullet_point(config)
    
    # 7. Base de Datos
    pdf.add_page()
    pdf.section_title('5. BASE DE DATOS')
    
    pdf.body_text('El sistema utiliza PostgreSQL a través de Supabase como sistema de base de datos, '
                 'con Prisma como ORM para interactuar con los datos de forma segura y eficiente.')
    
    pdf.section_title('Configuración de Base de Datos', 2)
    
    pdf.info_box('Proveedor de Base de Datos', 
                'PostgreSQL (Supabase)\nORM: Prisma 7\nMotor: PostgreSQL 15+')
    
    pdf.section_title('Características de la Base de Datos', 2)
    
    db_features = [
        'Relacional: Tablas con relaciones bien definidas',
        'Índices optimizados: Para búsquedas rápidas por ubicación, precio, rating',
        'Integridad referencial: Claves foráneas con restricciones',
        'Enums: Para estados y categorías predefinidas',
        'Timestamps: Campos de fecha automáticos',
        'Soft delete: Para usuarios (campo activo)',
        'Migraciones versionadas: Con Prisma Migrate',
    ]
    
    for feature in db_features:
        pdf.bullet_point(feature)
    
    # 8. Modelos de Datos
    pdf.add_page()
    pdf.section_title('6. MODELOS DE DATOS')
    
    pdf.body_text('El esquema de base de datos está diseñado para soportar todas las funcionalidades '
                 'de la plataforma, con modelos que representan usuarios, propiedades, reservas, pagos y más.')
    
    # Extraer modelos del schema
    models = []
    if data['prisma']:
        models = extract_models_from_schema(data['prisma'])
    
    if models:
        for model in models[:10]:  # Mostrar los primeros 10 modelos
            pdf.section_title(f'Modelo: {model["name"]}', 2)
            
            # Crear tabla de campos
            if model['fields']:
                headers = ['Campo', 'Tipo', 'Atributos']
                table_data = []
                
                for field in model['fields'][:10]:  # Máximo 10 campos por modelo
                    table_data.append([field[0], field[1], field[2][:30] + '...' if len(field[2]) > 30 else field[2]])
                
                pdf.table(headers, table_data, [40, 50, 100])
    
    pdf.section_title('Relaciones entre Modelos', 2)
    
    relationships = [
        'Usuario -> Propiedad: Un usuario puede tener múltiples propiedades (1:N)',
        'Propiedad -> ImagenPropiedad: Una propiedad puede tener múltiples imágenes (1:N)',
        'Propiedad -> Reserva: Una propiedad puede tener múltiples reservas (1:N)',
        'Reserva -> Pago: Una reserva puede tener múltiples pagos (1:N)',
        'Reserva -> Reseña: Una reserva puede tener una reseña (1:1)',
        'Usuario -> Reserva: Un usuario puede hacer múltiples reservas como huésped (1:N)',
        'Propiedad -> Amenidad: Relación muchos a muchos (M:N)',
    ]
    
    for rel in relationships:
        pdf.bullet_point(rel)
    
    # 9. Componentes y UI
    pdf.add_page()
    pdf.section_title('7. COMPONENTES Y UI')
    
    pdf.body_text('La interfaz de usuario está construida con componentes reutilizables y accesibles, '
                 'basados en shadcn/ui y personalizados para las necesidades específicas de Boogie.')
    
    pdf.section_title('Componentes de Layout', 2)
    
    layout_components = [
        ('Navbar', 'Barra de navegación principal con menú responsive, búsqueda y acciones de usuario'),
        ('Footer', 'Pie de página con información de la empresa, enlaces y redes sociales'),
        ('Sidebar', 'Barra lateral para el panel de usuario con navegación entre secciones'),
        ('Providers', 'Proveedor de contextos globales (autenticación, estado, etc.)'),
    ]
    
    for comp_name, comp_desc in layout_components:
        pdf.section_title(comp_name, 3)
        pdf.body_text(comp_desc)
    
    pdf.section_title('Componentes de Propiedades', 2)
    
    property_components = [
        ('PropertyCard', 'Tarjeta que muestra información resumida de una propiedad'),
        ('PropertyGrid', 'Grid responsivo para mostrar múltiples propiedades'),
        ('PropertyFilters', 'Panel de filtros para búsqueda avanzada'),
        ('PropertyGallery', 'Galería de imágenes con lightbox'),
        ('PropertySkeleton', 'Placeholder de carga para propiedades'),
    ]
    
    for comp_name, comp_desc in property_components:
        pdf.section_title(comp_name, 3)
        pdf.body_text(comp_desc)
    
    pdf.section_title('Componentes de Reservas', 2)
    
    booking_components = [
        ('BookingWidget', 'Widget principal para realizar reservas'),
        ('BookingCalendar', 'Calendario interactivo para seleccionar fechas'),
    ]
    
    for comp_name, comp_desc in booking_components:
        pdf.section_title(comp_name, 3)
        pdf.body_text(comp_desc)
    
    pdf.section_title('Componentes de UI Base', 2)
    
    ui_components = [
        'Button, Input, Label, Select, Card, Badge',
        'Avatar, Separator, Dropdown Menu',
        'Dialog, Sheet, Tooltip, Toast',
        'Loading Spinner, Error Message, Empty State',
        'Page Transition para animaciones suaves',
    ]
    
    for comp in ui_components:
        pdf.bullet_point(comp)
    
    # 10. Funcionalidades Principales
    pdf.add_page()
    pdf.section_title('8. FUNCIONALIDADES PRINCIPALES')
    
    pdf.body_text('Boogie ofrece un conjunto completo de funcionalidades diseñadas para cubrir '
                 'todas las necesidades de una plataforma de alquileres vacacionales.')
    
    # Extraer funcionalidades del README
    features = []
    if data['readme']:
        lines = data['readme'].split('\n')
        in_features = False
        
        for line in lines:
            if '## Funcionalidades' in line:
                in_features = True
                continue
            elif line.startswith('## ') and in_features:
                break
            elif in_features and line.startswith('- '):
                features.append(line[2:])
    
    if features:
        for feature in features:
            pdf.bullet_point(feature)
    
    pdf.section_title('Detalles de Funcionalidades', 2)
    
    feature_details = [
        ('Autenticación', 'Sistema completo con registro, login, recuperación de contraseña y verificación de email. '
         'Utiliza Supabase Auth con protección CSRF y rate limiting.'),
        
        ('Propiedades', 'CRUD completo con formulario multi-paso, filtros de búsqueda avanzada, '
         'galería de imágenes, gestión de amenidades y precios especiales.'),
        
        ('Reservas', 'Widget de reserva intuitivo, calendario de disponibilidad, cálculo automático de precios, '
         'gestión de estados y notificaciones.'),
        
        ('Pagos', 'Soporte para 7 métodos de pago locales venezolanos, verificación manual de comprobantes, '
         'gestión de tasas de cambio y reembolsos.'),
        
        ('Reseñas', 'Sistema de calificaciones con múltiples categorías (limpieza, comunicación, ubicación, valor), '
         'respuestas de anfitriones y moderación.'),
    ]
    
    for title, description in feature_details:
        pdf.section_title(title, 3)
        pdf.body_text(description)
    
    # 11. Sistema de Autenticación
    pdf.add_page()
    pdf.section_title('9. SISTEMA DE AUTENTICACIÓN')
    
    pdf.body_text('El sistema de autenticación está construido sobre Supabase Auth, proporcionando '
                 'seguridad robusta y una experiencia de usuario fluida.')
    
    pdf.section_title('Características de Autenticación', 2)
    
    auth_features = [
        'Registro con email y contraseña',
        'Login con credenciales',
        'Recuperación de contraseña por email',
        'Verificación de email obligatoria',
        'Sesiones persistentes con refresh tokens',
        'Logout seguro con invalidación de tokens',
        'Protección contra ataques de fuerza bruta',
        'Rate limiting en endpoints sensibles',
    ]
    
    for feature in auth_features:
        pdf.bullet_point(feature)
    
    pdf.section_title('Flujo de Autenticación', 2)
    
    auth_flow = [
        '1. Usuario se registra con email y contraseña',
        '2. Supabase envía email de verificación',
        '3. Usuario verifica email haciendo clic en el enlace',
        '4. Usuario inicia sesión con credenciales',
        '5. Supabase valida credenciales y emite tokens',
        '6. Tokens se almacenan de forma segura',
        '7. Sesión se mantiene hasta logout o expiración',
    ]
    
    for step in auth_flow:
        pdf.bullet_point(step)
    
    pdf.section_title('Roles de Usuario', 2)
    
    roles = [
        ('HUESPED', 'Usuario que busca y reserva propiedades'),
        ('ANFITRION', 'Usuario que publica y gestiona propiedades'),
        ('AMBOS', 'Usuario que puede actuar como huésped y anfitrión'),
        ('ADMIN', 'Administrador con acceso completo al sistema'),
    ]
    
    for role, description in roles:
        pdf.section_title(role, 3)
        pdf.body_text(description)
    
    # 12. Sistema de Pagos
    pdf.add_page()
    pdf.section_title('10. SISTEMA DE PAGOS')
    
    pdf.body_text('El sistema de pagos está diseñado específicamente para el mercado venezolano, '
                 'soportando los métodos de pago más utilizados en el país.')
    
    pdf.section_title('Métodos de Pago Soportados', 2)
    
    payment_methods = [
        'Transferencia Bancaria: Pago mediante transferencia a cuentas bancarias locales',
        'Pago Móvil: Pago mediante transferencia a número de teléfono',
        'Zelle: Pago mediante Zelle a email registrado',
        'Efectivo (Farmatodo): Pago en efectivo en puntos Farmatodo',
        'USDT (Tether): Pago con criptomonedas estables',
        'Tarjeta Internacional: Pago con tarjetas Visa/Mastercard',
        'Efectivo: Pago en efectivo directo',
    ]
    
    for method in payment_methods:
        pdf.bullet_point(method)
    
    pdf.section_title('Flujo de Pago', 2)
    
    payment_flow = [
        '1. Huésped selecciona método de pago',
        '2. Sistema muestra datos de pago según método',
        '3. Huésped realiza el pago externamente',
        '4. Huésped sube comprobante de pago',
        '5. Anfitrión o admin verifica el pago',
        '6. Pago se marca como verificado',
        '7. Reserva se confirma automáticamente',
        '8. Notificación se envía a ambas partes',
    ]
    
    for step in payment_flow:
        pdf.bullet_point(step)
    
    pdf.section_title('Comisiones', 2)
    
    pdf.info_box('Estructura de Comisiones',
                'Comisión al huésped: 6%\nComisión al anfitrión: 3%\nTotal: 9% de comisión de plataforma')
    
    # 13. Configuración y Variables de Entorno
    pdf.add_page()
    pdf.section_title('11. CONFIGURACIÓN Y VARIABLES DE ENTORNO')
    
    pdf.body_text('La aplicación utiliza variables de entorno para configuración sensible y específica '
                 'del entorno, manteniendo la seguridad y flexibilidad.')
    
    pdf.section_title('Variables Requeridas', 2)
    
    env_vars = [
        ('NEXT_PUBLIC_SUPABASE_URL', 'URL de tu proyecto Supabase'),
        ('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Key pública de Supabase (frontend)'),
        ('SUPABASE_SERVICE_ROLE_KEY', 'Key de servicio de Supabase (backend)'),
        ('DATABASE_URL', 'URL de conexión a PostgreSQL'),
        ('NEXT_PUBLIC_APP_URL', 'URL base de la aplicación'),
    ]
    
    for var, description in env_vars:
        pdf.section_title(var, 3)
        pdf.body_text(description)
    
    pdf.section_title('Variables Opcionales', 2)
    
    optional_vars = [
        ('COMISION_PLATAFORMA_HUESPED', 'Comisión personalizada para huéspedes (default: 0.06)'),
        ('COMISION_PLATAFORMA_ANFITRION', 'Comisión personalizada para anfitriones (default: 0.03)'),
        ('NEXT_PUBLIC_GA_ID', 'Google Analytics ID'),
        ('SMTP_HOST', 'Servidor SMTP para envío de emails'),
        ('SMTP_PORT', 'Puerto del servidor SMTP'),
        ('SMTP_USER', 'Usuario SMTP'),
        ('SMTP_PASSWORD', 'Contraseña SMTP'),
    ]
    
    for var, description in optional_vars:
        pdf.bullet_point(f'{var}: {description}')
    
    pdf.section_title('Archivo .env.example', 2)
    
    pdf.body_text('El proyecto incluye un archivo .env.example con todas las variables necesarias. '
                 'Para configurar tu entorno:')
    
    pdf.code_block('cp .env.example .env.local\n# Edita .env.local con tus credenciales', 'bash')
    
    # 14. Scripts y Comandos
    pdf.add_page()
    pdf.section_title('12. SCRIPTS Y COMANDOS')
    
    pdf.body_text('El proyecto incluye varios scripts para facilitar el desarrollo, pruebas y despliegue.')
    
    # Extraer scripts del package.json
    scripts = {}
    if data['package']:
        scripts = extract_scripts_from_package(data['package'])
    
    if scripts:
        pdf.section_title('Scripts de Desarrollo', 2)
        
        dev_scripts = []
        for script, command in scripts.items():
            if 'dev' in script or 'start' in script:
                dev_scripts.append([script, command])
        
        if dev_scripts:
            pdf.table(['Script', 'Comando'], dev_scripts, [60, 130])
        
        pdf.section_title('Scripts de Base de Datos', 2)
        
        db_scripts = []
        for script, command in scripts.items():
            if 'db' in script or 'prisma' in script or 'migrate' in script:
                db_scripts.append([script, command])
        
        if db_scripts:
            pdf.table(['Script', 'Comando'], db_scripts, [60, 130])
        
        pdf.section_title('Scripts de Producción', 2)
        
        prod_scripts = []
        for script, command in scripts.items():
            if 'build' in script or 'lint' in script or 'format' in script:
                prod_scripts.append([script, command])
        
        if prod_scripts:
            pdf.table(['Script', 'Comando'], prod_scripts, [60, 130])
    
    pdf.section_title('Comandos Útiles', 2)
    
    useful_commands = [
        ('Instalar dependencias', 'npm install'),
        ('Generar cliente Prisma', 'npm run postinstall'),
        ('Crear migración', 'npm run db:migrate'),
        ('Push schema sin migración', 'npm run db:push'),
        ('Ejecutar seed', 'npm run db:seed'),
        ('Prisma Studio', 'npm run db:studio'),
        ('Linter', 'npm run lint'),
        ('Formatear código', 'npm run format'),
    ]
    
    for desc, command in useful_commands:
        pdf.bullet_point(f'{desc}: {command}')
    
    # 15. Deployment y Producción
    pdf.add_page()
    pdf.section_title('13. DEPLOYMENT Y PRODUCCIÓN')
    
    pdf.body_text('El proyecto está optimizado para despliegue en Vercel, pero puede desplegarse '
                 'en cualquier plataforma que soporte Node.js.')
    
    pdf.section_title('Requisitos de Producción', 2)
    
    prod_requirements = [
        'Node.js 20 o superior',
        'npm 10 o superior',
        'Cuenta en Supabase con base de datos PostgreSQL',
        'Variables de entorno configuradas',
        'Dominio personalizado (opcional)',
        'SSL/TLS para HTTPS',
    ]
    
    for req in prod_requirements:
        pdf.bullet_point(req)
    
    pdf.section_title('Despliegue en Vercel', 2)
    
    vercel_steps = [
        '1. Instalar Vercel CLI: npm install -g vercel',
        '2. Iniciar sesión: vercel login',
        '3. Configurar variables de entorno en Vercel',
        '4. Desplegar: vercel',
        '5. Configurar dominio personalizado (opcional)',
        '6. Activar analytics y monitoring',
    ]
    
    for step in vercel_steps:
        pdf.bullet_point(step)
    
    pdf.section_title('Variables de Entorno en Producción', 2)
    
    pdf.body_text('Configura las siguientes variables en tu plataforma de despliegue:')
    
    prod_env_vars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'NEXT_PUBLIC_APP_URL (con tu dominio de producción)',
    ]
    
    for var in prod_env_vars:
        pdf.bullet_point(var)
    
    pdf.section_title('Consideraciones de Producción', 2)
    
    prod_considerations = [
        'Habilitar caching para mejor rendimiento',
        'Configurar CDN para assets estáticos',
        'Monitorear logs y errores',
        'Configurar backups automáticos de base de datos',
        'Implementar rate limiting para APIs',
        'Configurar alertas de uptime',
    ]
    
    for consideration in prod_considerations:
        pdf.bullet_point(consideration)
    
    # 16. Paleta de Colores
    pdf.add_page()
    pdf.section_title('14. PALETA DE COLORES')
    
    pdf.body_text('La paleta de colores de Boogie está diseñada para ser cálida, profesional y accesible, '
                 'reflejando la calidez venezolana manteniendo la seriedad de una plataforma de negocios.')
    
    # Extraer colores del README
    colors_data = []
    if data['readme']:
        lines = data['readme'].split('\n')
        in_colors = False
        
        for line in lines:
            if '| Color | Hex | Uso |' in line:
                in_colors = True
                continue
            elif line.startswith('## ') and in_colors:
                break
            elif in_colors and line.startswith('| ') and not line.startswith('|---'):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 3:
                    colors_data.append(parts[:3])
    
    if colors_data:
        pdf.section_title('Colores Principales', 2)
        pdf.table(['Color', 'Código Hex', 'Uso'], colors_data, [50, 50, 90])
    
    pdf.section_title('Uso de Colores', 2)
    
    color_usage = [
        'Primario (#1B4332): Botones principales, enlaces importantes, headers',
        'Acento (#E76F51): CTAs, elementos destacados, notificaciones importantes',
        'Fondo (#FEFCF9): Fondo general de la aplicación',
        'Superficie (#FFFFFF): Cards, modales, paneles flotantes',
        'Borde (#E8E4DF): Bordes, separadores, líneas divisorias',
        'Texto (#1A1A1A): Texto principal, títulos, contenido importante',
    ]
    
    for usage in color_usage:
        pdf.bullet_point(usage)
    
    pdf.section_title('Consideraciones de Accesibilidad', 2)
    
    accessibility = [
        'Contraste mínimo de 4.5:1 para texto normal',
        'Contraste mínimo de 3:1 para texto grande',
        'No depender solo del color para transmitir información',
        'Soporte para modo oscuro (futuro)',
        'Colores amigables para daltonismo',
    ]
    
    for item in accessibility:
        pdf.bullet_point(item)
    
    # 17. Consideraciones de Seguridad
    pdf.add_page()
    pdf.section_title('15. CONSIDERACIONES DE SEGURIDAD')
    
    pdf.body_text('La seguridad es una prioridad en Boogie. El proyecto implementa múltiples capas '
                 'de seguridad para proteger los datos de usuarios y las transacciones.')
    
    pdf.section_title('Medidas de Seguridad Implementadas', 2)
    
    security_measures = [
        'Autenticación con Supabase Auth (JWT, refresh tokens)',
        'Protección CSRF en formularios y Server Actions',
        'Validación de entrada con Zod en frontend y backend',
        'Sanitización de datos para prevenir XSS',
        'Rate limiting en endpoints sensibles',
        'Variables de entorno para datos sensibles',
        'Row Level Security (RLS) en Supabase',
        'HTTPS obligatorio en producción',
        'Headers de seguridad HTTP',
        'Logs de seguridad y auditoría',
    ]
    
    for measure in security_measures:
        pdf.bullet_point(measure)
    
    pdf.section_title('Buenas Prácticas de Seguridad', 2)
    
    security_practices = [
        'No exponer keys de servicio en el frontend',
        'Validar y sanitizar todas las entradas de usuario',
        'Usar prepared statements para consultas SQL (Prisma)',
        'Implementar logging para actividades sospechosas',
        'Mantener dependencias actualizadas',
        'Revisar código regularmente',
        'Realizar pruebas de penetración periódicas',
    ]
    
    for practice in security_practices:
        pdf.bullet_point(practice)
    
    pdf.section_title('Protección de Datos', 2)
    
    data_protection = [
        'Contraseñas hasheadas con bcrypt',
        'Datos sensibles en variables de entorno',
        'Acceso a base de datos restringido',
        'Backups automáticos con retención limitada',
        'Cumplimiento con regulaciones de privacidad',
    ]
    
    for protection in data_protection:
        pdf.bullet_point(protection)
    
    # 18. Mantenimiento y Actualizaciones
    pdf.add_page()
    pdf.section_title('16. MANTENIMIENTO Y ACTUALIZACIONES')
    
    pdf.body_text('El mantenimiento regular es esencial para garantizar el rendimiento, '
                 'seguridad y estabilidad de la plataforma.')
    
    pdf.section_title('Tareas de Mantenimiento Recurrentes', 2)
    
    maintenance_tasks = [
        'Actualización de dependencias mensualmente',
        'Revisión de logs de errores semanalmente',
        'Backup de base de datos diario',
        'Monitoreo de rendimiento continuo',
        'Revisión de seguridad trimestral',
        'Actualización de documentación por release',
        'Limpieza de logs antigos mensualmente',
        'Verificación de certificados SSL',
    ]
    
    for task in maintenance_tasks:
        pdf.bullet_point(task)
    
    pdf.section_title('Proceso de Actualización', 2)
    
    update_process = [
        '1. Crear rama de feature para la actualización',
        '2. Actualizar dependencias: npm update',
        '3. Ejecutar tests: npm run test',
        '4. Verificar build: npm run build',
        '5. Revisar changelog de dependencias',
        '6. Probar en entorno de staging',
        '7. Crear pull request con revisión de código',
        '8. Desplegar a producción',
        '9. Monitorear post-despliegue',
    ]
    
    for step in update_process:
        pdf.bullet_point(step)
    
    pdf.section_title('Monitoreo y Alertas', 2)
    
    monitoring = [
        'Uptime monitoring (UptimeRobot, Pingdom)',
        'Error tracking (Sentry, LogRocket)',
        'Performance monitoring (Vercel Analytics)',
        'Database monitoring (Supabase Dashboard)',
        'Alertas de seguridad automáticas',
        'Reportes de rendimiento semanales',
    ]
    
    for item in monitoring:
        pdf.bullet_point(item)
    
    # Página final
    pdf.add_page()
    pdf.section_title('CONCLUSIÓN')
    
    pdf.body_text('Boogie representa una solución completa y moderna para el mercado de alquileres '
                 'vacacionales en Venezuela. Con un stack tecnológico robusto, una arquitectura bien '
                 'diseñada y un enfoque en la experiencia de usuario, la plataforma está preparada '
                 'para escalar y evolucionar con las necesidades del mercado.')
    
    pdf.body_text('Esta documentación técnica proporciona una visión completa del proyecto, '
                 'desde la arquitectura y base de datos hasta los componentes de UI y procesos de '
                 'despliegue. Sirve como guía para desarrolladores actuales y futuros, así como '
                 'para la toma de decisiones técnicas.')
    
    pdf.section_title('Próximos Pasos', 2)
    
    next_steps = [
        'Implementar modo oscuro',
        'Añadir sistema de mensajería entre usuarios',
        'Integrar pasarela de pagos internacional',
        'Implementar sistema de recomendaciones con IA',
        'Añadir soporte para múltiples idiomas',
        'Desarrollar aplicación móvil nativa',
        'Implementar analytics avanzados',
        'Añadir integración con redes sociales',
    ]
    
    for step in next_steps:
        pdf.bullet_point(step)
    
    pdf.section_title('Contacto y Soporte', 2)
    
    pdf.info_box('SWM Films',
                'Email: soporte@boogie.com.ve\n'
                'Sitio web: https://boogie.com.ve\n'
                'GitHub: https://github.com/SilvioAndolini/boogie')
    
    # Guardar PDF
    pdf.output(output_path)
    print(f"✅ Documentación generada exitosamente: {output_path}")
    return output_path

def main():
    """Función principal"""
    import sys
    
    # Ruta del proyecto
    project_path = "/tmp/boogie"
    
    # Ruta de salida
    output_path = os.path.join(project_path, "documentacion", "documentacion_tecnica_boogie.pdf")
    
    # Crear directorio si no existe
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Generar documentación
    try:
        generate_documentation(project_path, output_path)
        print(f"\n📄 PDF generado en: {output_path}")
        print(f"📊 Tamaño del archivo: {os.path.getsize(output_path) / 1024:.1f} KB")
    except Exception as e:
        print(f"❌ Error generando documentación: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()