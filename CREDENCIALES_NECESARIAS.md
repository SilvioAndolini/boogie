# Credenciales necesarias para subir a GitHub

## Información requerida

Para subir el proyecto Boogie a GitHub, necesito:

### 1. Nombre de usuario de GitHub
- Ejemplo: `mi_usuario`

### 2. Token de acceso personal (PAT)
- Ve a: https://github.com/settings/tokens
- Click en "Generate new token (classic)"
- Nombre: "Boogie Upload"
- Expiración: 30 días (o más)
- Permisos seleccionar:
  - ✅ repo (Full control of private repositories)
  - ✅ workflow (Update GitHub Action workflows)
- Click en "Generate token"
- **COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)

## Opciones de subida

### Opción A: Yo lo subo automáticamente
Proporcióname:
```
Usuario: tu_usuario
Token: ghp_1234567890abcdef
```

### Opción B: Tú lo subes manualmente
Sigue las instrucciones en `SUBIR_A_GITHUB.md`

### Opción C: Usar GitHub CLI
```bash
gh auth login
gh repo create boogie --public --source=. --remote=origin --push
```

## Seguridad del token

⚠️ **IMPORTANTE**: 
- El token es como una contraseña
- No lo compartas públicamente
- Después de subir, puedes revocar el token en GitHub
- El token solo necesita permisos de repositorio

## Verificación después de subir

Una vez subido, verifica:
1. El repositorio existe en: https://github.com/tu_usuario/boogie
2. Todos los archivos están presentes
3. La documentación PDF está incluida
4. El README.md se muestra correctamente

## Soporte

Si tienes problemas:
1. Verifica que el token tenga permisos correctos
2. Asegúrate de que el repositorio no existe previamente
3. Revisa que no haya límites de tamaño en tu cuenta de GitHub