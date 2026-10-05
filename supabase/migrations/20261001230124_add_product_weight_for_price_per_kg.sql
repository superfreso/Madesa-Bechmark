/*
# Agregar peso del producto para calcular precio por kilogramo

## Objetivo
Permite guardar el peso aproximado de cada mueble y usarlo para comparar
el precio por kilogramo entre competidores en el dashboard.

## Cambios en tablas existentes
1. `products.weight_kg` — peso del mueble en kilogramos, opcional, con hasta dos decimales.

## Seguridad
- No se crean tablas nuevas ni se modifican políticas RLS.
- La columna queda protegida por las mismas políticas de `products` ya existentes.

## Integridad y compatibilidad
- La columna es nullable para conservar todos los productos actuales sin inventar pesos.
- Los productos sin peso seguirán mostrándose normalmente y se excluirán únicamente de la estadística por kilogramo.
- No se eliminan ni modifican datos existentes.
*/

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS weight_kg numeric(10, 2);