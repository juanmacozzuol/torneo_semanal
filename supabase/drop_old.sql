-- Ejecutar PRIMERO para limpiar las tablas del proyecto anterior
-- (termómetro político)

drop table if exists votes cascade;
drop table if exists daily_snapshots cascade;
drop table if exists vote_aggregates cascade;
drop table if exists vote_by_province cascade;
drop table if exists proposals cascade;

-- Eliminar vistas si existen
drop view if exists vote_aggregates cascade;
drop view if exists vote_by_province cascade;
