# Ejemplos de uso de la API de Aplicaciones

## Endpoints principales

### 1. Obtener aplicaciones con filtros
```bash
# Obtener todas las aplicaciones del usuario autenticado
GET /api/v1/applications

# Filtrar por estado
GET /api/v1/applications?status=pending

# Filtrar por rango de fechas
GET /api/v1/applications?date_from=2024-01-01&date_to=2024-12-31

# Filtrar por rango de tarifa
GET /api/v1/applications?rate_min=500&rate_max=2000

# Combinar filtros con paginación
GET /api/v1/applications?status=under_review&page=1&limit=20
```

### 2. Obtener aplicación específica
```bash
GET /api/v1/applications/{applicationId}
```

### 3. Evaluar aplicación (solo clientes)
```bash
PUT /api/v1/applications/{applicationId}/evaluate
Content-Type: application/json

{
  "priority_score": 85,
  "client_feedback": "Excelente propuesta, pero necesitamos ver más ejemplos de trabajos similares",
  "metadata": {
    "evaluation_notes": "Candidato prometedor",
    "next_steps": "Solicitar portfolio adicional"
  }
}
```

### 4. Aprobar aplicación (solo clientes)
```bash
PUT /api/v1/applications/{applicationId}/approve
Content-Type: application/json

{
  "client_feedback": "¡Perfecto! Tu propuesta es exactamente lo que buscábamos",
  "final_rate": 1500,
  "rate_negotiation_notes": "Acordamos esta tarifa basada en la complejidad del proyecto"
}
```

### 5. Rechazar aplicación (solo clientes)
```bash
PUT /api/v1/applications/{applicationId}/reject
Content-Type: application/json

{
  "reason": "Buscamos alguien con más experiencia en tecnologías específicas",
  "client_feedback": "Tu propuesta fue buena, pero necesitamos experiencia específica en React Native",
  "send_feedback_email": true
}
```

### 6. Retirar aplicación (solo profesionales)
```bash
PUT /api/v1/applications/{applicationId}/withdraw
Content-Type: application/json

{
  "reason": "He encontrado otro proyecto que se ajusta mejor a mi disponibilidad"
}
```

### 7. Obtener estadísticas
```bash
GET /api/v1/applications/stats
```

### 8. Recalcular prioridad (admins y clientes)
```bash
POST /api/v1/applications/{applicationId}/calculate-priority
```

## Endpoints desde el contexto de proyecto

### 1. Evaluar aplicación de proyecto específico
```bash
PUT /api/v1/projects/{projectId}/applications/{applicationId}/evaluate
Content-Type: application/json

{
  "priority_score": 90,
  "client_feedback": "Muy buena propuesta para este proyecto específico"
}
```

### 2. Aprobar aplicación de proyecto
```bash
PUT /api/v1/projects/{projectId}/applications/{applicationId}/approve
Content-Type: application/json

{
  "client_feedback": "Seleccionado para el proyecto",
  "final_rate": 2000
}
```

### 3. Rechazar aplicación de proyecto
```bash
PUT /api/v1/projects/{projectId}/applications/{applicationId}/reject
Content-Type: application/json

{
  "reason": "Seleccionamos otra propuesta",
  "client_feedback": "Gracias por tu tiempo, la propuesta fue muy profesional"
}
```

## Flujos de trabajo típicos

### Para Clientes:

1. **Revisar aplicaciones nuevas:**
   ```bash
   GET /api/v1/projects/{projectId}/applications?status=pending
   ```

2. **Evaluar candidatos:**
   ```bash
   PUT /api/v1/applications/{applicationId}/evaluate
   ```

3. **Seleccionar finalista:**
   ```bash
   PUT /api/v1/applications/{applicationId}/approve
   ```

4. **Rechazar otros candidatos:**
   ```bash
   PUT /api/v1/applications/{applicationId}/reject
   ```

### Para Profesionales:

1. **Ver mis aplicaciones:**
   ```bash
   GET /api/v1/applications
   ```

2. **Ver aplicaciones pendientes:**
   ```bash
   GET /api/v1/applications?status=pending
   ```

3. **Retirar aplicación si es necesario:**
   ```bash
   PUT /api/v1/applications/{applicationId}/withdraw
   ```

4. **Ver estadísticas personales:**
   ```bash
   GET /api/v1/applications/stats
   ```

## Respuestas de ejemplo

### Aplicación con detalles completos:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "professional_id": "456e7890-e89b-12d3-a456-426614174001",
    "project_id": "789e0123-e89b-12d3-a456-426614174002",
    "cover_letter": "Estimado cliente, tengo 5 años de experiencia...",
    "proposed_rate": 1500,
    "proposed_timeline": 30,
    "status": "under_review",
    "priority_score": 87.5,
    "created_at": "2024-12-15T10:00:00Z",
    "reviewed_at": "2024-12-15T14:30:00Z",
    "professional": {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "first_name": "Juan",
      "last_name": "Pérez",
      "avatar_url": "https://example.com/avatar.jpg",
      "professionalProfile": {
        "title": "Desarrollador Full Stack",
        "experience_years": 5,
        "hourly_rate": 50,
        "completion_rate": 95.5,
        "rating_average": 4.8
      }
    },
    "project": {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "title": "Desarrollo de aplicación móvil",
      "category": "mobile",
      "budget_min": 1000,
      "budget_max": 2000,
      "client": {
        "id": "012e3456-e89b-12d3-a456-426614174003",
        "first_name": "María",
        "last_name": "González"
      }
    }
  },
  "message": "Aplicación obtenida exitosamente"
}
```

### Estadísticas de aplicaciones:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "by_status": {
      "pending": 3,
      "under_review": 2,
      "accepted": 8,
      "rejected": 10,
      "withdrawn": 2
    },
    "avg_response_time_hours": "24.5"
  },
  "message": "Estadísticas obtenidas exitosamente"
}
```
