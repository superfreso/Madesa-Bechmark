/*
# Mover datos del período Noviembre 2026 a Septiembre 2026

## Contexto
Los datos fueron registrados accidentalmente bajo el período "Noviembre 2026"
cuando en realidad corresponden a septiembre (las fechas de consulta son
2026-09-14 y 2026-09-15). Esta migración mueve todos los registros al período
correcto sin perder ningún dato.

## Cambios
1. Actualiza `price_records` que apuntan al período Noviembre → Septiembre
2. Actualiza `commercial_conditions` que apuntan al período Noviembre → Septiembre
3. Actualiza `payment_methods` que apuntan al período Noviembre → Septiembre
4. Actualiza `traffic_records` que apuntan al período Noviembre → Septiembre
5. Marca el período "Septiembre 2026" como abierto (open) — es el período actual
6. Marca el período "Noviembre 2026" como cerrado (closed) — no corresponde aún

## Notas
- No se elimina ni se pierde ningún dato.
- Los registros que ya estaban en Septiembre u Octubre no se ven afectados.
- Solo se mueven los registros actualmente asignados a Noviembre.
*/

UPDATE public.price_records
SET period_id = '73dc13aa-58fe-48a0-829c-56f715058e35'
WHERE period_id = '3c4880c1-7723-489e-8f5c-785c4850c3ef';

UPDATE public.commercial_conditions
SET period_id = '73dc13aa-58fe-48a0-829c-56f715058e35'
WHERE period_id = '3c4880c1-7723-489e-8f5c-785c4850c3ef';

UPDATE public.payment_methods
SET period_id = '73dc13aa-58fe-48a0-829c-56f715058e35'
WHERE period_id = '3c4880c1-7723-489e-8f5c-785c4850c3ef';

UPDATE public.traffic_records
SET period_id = '73dc13aa-58fe-48a0-829c-56f715058e35'
WHERE period_id = '3c4880c1-7723-489e-8f5c-785c4850c3ef';

-- Septiembre es el período actual (activo)
UPDATE public.analysis_periods
SET status = 'open'
WHERE id = '73dc13aa-58fe-48a0-829c-56f715058e35';

-- Noviembre pasa a cerrado (no corresponde al período actual)
UPDATE public.analysis_periods
SET status = 'closed'
WHERE id = '3c4880c1-7723-489e-8f5c-785c4850c3ef';
