# 💰 Gastoxpress - Control de Gastos Personales

Luis Eduardo Márquez Brazón: https://www.linkedin.com/in/luis-eduardo-m%C3%A1rquez-braz%C3%B3n-9a469b19/

¿Cómo he ido desarrollando este sistema?:

https://www.youtube.com/playlist?list=PLqKbnrdMO6PxDg4m_U_rFlcaDt7i3-hK8

![Estado del Proyecto](https://img.shields.io/badge/Estado-En_Desarrollo-green)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)

**Gastoxpress** es una aplicación web moderna diseñada para la gestión eficiente de finanzas personales. Permite a los usuarios registrar sus ingresos y gastos, visualizar estadísticas y mantener un control total sobre su economía diaria.

## 🛠️ Tecnologías Utilizadas

El proyecto está construido utilizando una arquitectura moderna separando el Frontend y el Backend:

### Frontend
- **React 19**: Biblioteca principal para la interfaz de usuario.
- **TypeScript**: Superset de JavaScript para un código más robusto y tipado.
- **Vite**: Empaquetador y servidor de desarrollo ultrarrápido.
- **Recharts**: Para la visualización de datos y gráficos estadísticos.
- **Google GenAI**: Integración de inteligencia artificial para análisis o sugerencias (en desarrollo).
- **jsPDF / xlsx**: Librerías para exportación de reportes a PDF y Excel.

### Backend
- **PHP**: Lenguaje de servidor para la lógica de negocio y API REST.
- **MySQL**: Base de datos relacional para el almacenamiento persistente.
- **PDO**: Extensión de PHP para acceso seguro a la base de datos.

## ⚙️ Configuración del Sistema

Sigue estos pasos para poner en marcha el proyecto en tu entorno local:

### 1. Base de Datos
1. Asegúrate de tener **MySQL** corriendo.
2. Crea una base de datos llamada `gastoxpress`.
3. Importa el archivo `db_schema.sql` ubicado en la raíz del proyecto para crear las tablas necesarias (`usuarios`, `transacciones`).

```bash
mysql -u root -p < db_schema.sql
```

### 2. Backend (API)
1. Navega al archivo `db.php` y configura las credenciales de tu base de datos:
   ```php
   $host = 'localhost';
   $dbname = 'gastoxpress';
   $username = 'tu_usuario';
   $password = 'tu_contraseña';
   ```
2. Sirve los archivos PHP usando un servidor como Apache (AppServ, XAMPP) o el servidor integrado de PHP:
   ```bash
   php -S localhost:8000
   ```
   *Nota: Asegúrate de que `api.php` sea accesible.*

### 3. Frontend (Cliente)
1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre tu navegador en la URL que te indique Vite (usualmente `http://localhost:5173`).

---

## 🚀 Funcionalidades Principales

La aplicación permite realizar las siguientes acciones:

*   **Registrar Transacciones**: Agregar nuevos ingresos o gastos con detalle de monto, categoría, fecha y descripción.
*   **Visualización de Dashboard**: Gráficos interactivos que muestran el balance actual y distribución de gastos.
*   **Historial de Movimientos**: Listado completo de todas las transacciones ordenadas cronológicamente.
*   **Eliminación de Registros**: Opción para borrar transacciones erróneas o antiguas.
*   **Exportación de Datos**: Generación de reportes en formatos PDF y Excel para análisis externo.

---

## 🔮 Mejoras para Próximas Versiones (Roadmap)

Para futuras iteraciones del proyecto, se plantean las siguientes mejoras:

1.  **Autenticación de Usuarios Completa**: Implementar sistema de Login/Registro funcional en el Frontend conectado con la tabla `usuarios` y manejo de sesiones (JWT).
2.  **Seguridad Avanzada**: Validaciones robustas en el Backend y protección contra inyecciones SQL (aunque ya se usa PDO, reforzar validación de inputs).
3.  **Categorías Personalizables**: Permitir a los usuarios crear y editar sus propias categorías de gastos.
4.  **Modo Oscuro**: Implementar un toggle para cambiar entre tema claro y oscuro.
5.  **Presupuestos Mensuales**: Funcionalidad para establecer límites de gasto por categoría y alertas.
6.  **IA Financiera**: Potenciar la integración con Google GenAI para ofrecer consejos de ahorro personalizados basados en el historial del usuario.
7.  **Soporte Multi-moneda**: Opción para manejar diferentes divisas.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

---
*Desarrollado con ❤️ para el control financiero.*

Luis Eduardo Márquez Brazón: https://www.linkedin.com/in/luis-eduardo-m%C3%A1rquez-braz%C3%B3n-9a469b19/
