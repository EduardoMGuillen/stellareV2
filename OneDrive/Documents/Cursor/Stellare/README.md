# 🌟 Stellare - Custom Shopify Theme

Tema personalizado de Shopify para [Stellare](https://stellare.co) - Tienda de pulseras italianas con dijes personalizables.

## ✨ Características

### 🎨 Diseño
- **Minimalista y Moderno**: Colores blanco, gris, rosa y dorado
- **Mobile Responsive**: Optimizado para todos los dispositivos
- **Tipografía Limpia**: Diseño elegante y profesional

### 🛠️ Constructor de Pulseras
- **Drag & Drop Interactivo**: Arrastra dijes a posiciones específicas
- **Vista en Vivo**: Previsualiza tu pulsera mientras la construyes
- **Integración Real**: Productos directamente desde Shopify
- **Precio Dinámico**: Actualización automática del precio total

### 🛒 Funcionalidad de Carrito
- **AJAX Cart**: Agregar productos sin recargar página
- **Notificaciones Toast**: Feedback visual al agregar al carrito
- **Integración Completa**: Funciona en productos individuales y builder

### 🌐 Localización
- **100% en Español**: Diseñado para Honduras
- **Moneda Local**: Precios en Lempiras (L)

## 📁 Estructura del Proyecto

```
stellareV2/
├── assets/
│   ├── bracelet-builder.css    # Estilos del constructor
│   ├── bracelet-builder.js     # Lógica del constructor
│   ├── theme.css               # Estilos globales
│   └── theme.js                # JavaScript global
├── config/
│   ├── settings_data.json      # Valores de configuración
│   └── settings_schema.json    # Schema del theme customizer
├── layout/
│   └── theme.liquid            # Layout principal
├── sections/
│   ├── header.liquid           # Encabezado
│   ├── footer.liquid           # Pie de página
│   ├── hero-banner.liquid      # Banner principal
│   ├── featured-products.liquid
│   └── main-page-builder.liquid
└── templates/
    ├── index.liquid            # Página principal
    ├── product.liquid          # Página de producto
    ├── collection.liquid       # Página de colección
    ├── cart.liquid             # Página de carrito
    └── page.builder.liquid     # Constructor de pulseras
```

## 🚀 Instalación

1. **Descargar el tema:**
   ```bash
   git clone https://github.com/EduardoMGuillen/stellareV2.git
   ```

2. **Comprimir archivos:**
   - Comprime todas las carpetas (assets, config, layout, sections, templates) en un archivo .zip

3. **Subir a Shopify:**
   - Ve a: Admin → Online Store → Themes
   - Click en "Add theme" → "Upload zip file"
   - Selecciona el archivo .zip

4. **Configurar colecciones:**
   - Crea colección "Pulseras" con tus pulseras base
   - Crea colección "Colgantes y dijes" con tus dijes
   - Los productos deben estar publicados para aparecer

5. **Crear página del builder:**
   - Admin → Online Store → Pages
   - Crear nueva página:
     - **Título**: Crea Tu Pulsera
     - **URL**: `builder`
     - **Template**: `page.builder`
     - **Visibility**: Visible
   - Publicar

## ⚙️ Configuración del Theme

Personaliza tu tema desde: **Admin → Online Store → Themes → Customize**

### Colores
- Color Primario (Rosa): `#E91E8C`
- Color Secundario (Dorado): `#FFD700`
- Color de Acento: `#FF1493`

### Constructor de Pulseras
- Máximo de dijes por pulsera: 18 (configurable)
- Mostrar slots vacíos: Sí

### Redes Sociales
- Instagram: [@stellare_hn](https://www.instagram.com/stellare_hn/)

## 🔧 Desarrollo

### Requisitos
- Cuenta de Shopify
- Conocimientos básicos de Liquid, HTML, CSS, JavaScript

### Hacer cambios
```bash
# Editar archivos localmente
# Cuando estés listo para subir:
git add .
git commit -m "Descripción de cambios"
git push origin main
```

## 📝 Notas Técnicas

- **Shopify API**: Usa `/products.json` para obtener productos
- **Cart API**: Usa `/cart/add.js` para agregar al carrito
- **Filtrado**: Solo muestra productos publicados (sin importar stock)
- **Drag & Drop**: HTML5 Drag and Drop API

## 🐛 Troubleshooting

### Página del builder muestra 404
- Verifica que la página esté creada con URL handle `builder`
- Verifica que el template sea `page.builder`
- Asegúrate que la página esté publicada

### Productos no aparecen
- Verifica que las colecciones "Pulseras" y "Colgantes y dijes" existan
- Asegúrate que los productos estén publicados
- Revisa la consola del navegador para errores

### No se puede agregar al carrito
- Abre la consola del navegador (F12)
- Verifica los logs para ver el error específico
- Asegúrate que los productos tengan variantes válidas

## 📧 Contacto

- **Tienda**: [stellare.co](https://stellare.co)
- **Instagram**: [@stellare_hn](https://www.instagram.com/stellare_hn/)
- **GitHub**: [@EduardoMGuillen](https://github.com/EduardoMGuillen)

## 📄 Licencia

© 2025 Stellare. Todos los derechos reservados.

---

**Hecho con ❤️ para Stellare**

