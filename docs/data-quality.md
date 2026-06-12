# Informe de calidad de datos

> Generado automáticamente por `npm run ingest` el 12/6/2026, 18:25:59.
> Se regenera en cada ejecución; no editar a mano.

## Resumen

| Métrica                         | Valor                   |
| ------------------------------- | ----------------------- |
| Registros cargados              | **19.993**              |
| Empresas distintas (NIF)        | 10.080                  |
| Empresas con más de un proyecto | 3696 de 10.080          |
| Rango de fechas de aprobación   | 2014-01-30 → 2026-05-28 |
| Presupuesto total               | 14.213.283.117 €        |
| Aportación CDTI total           | 10.329.303.168 €        |

## Registros por año

| Año  | Proyectos | Presupuesto     | Aportación CDTI | % medio aportación |
| ---- | --------- | --------------- | --------------- | ------------------ |
| 2014 | 1531      | 1.039.423.280 € | 798.490.828 €   | 76.92 %            |
| 2015 | 1826      | 1.186.976.784 € | 841.260.206 €   | 70.17 %            |
| 2016 | 1508      | 975.058.230 €   | 687.975.603 €   | 70.43 %            |
| 2017 | 1588      | 1.222.971.972 € | 879.014.701 €   | 69.55 %            |
| 2018 | 1762      | 1.036.050.275 € | 744.659.583 €   | 71.13 %            |
| 2019 | 1695      | 1.113.434.527 € | 833.886.095 €   | 74.96 %            |
| 2020 | 1634      | 1.120.464.401 € | 837.752.303 €   | 75.11 %            |
| 2021 | 1806      | 1.353.001.330 € | 980.954.912 €   | 74.88 %            |
| 2022 | 1730      | 1.230.044.887 € | 862.588.301 €   | 71.85 %            |
| 2023 | 1677      | 1.225.605.075 € | 887.852.499 €   | 74.42 %            |
| 2024 | 1299      | 955.165.278 €   | 705.199.592 €   | 73.8 %             |
| 2025 | 1476      | 1.445.199.577 € | 1.026.746.548 € | 75.58 %            |
| 2026 | 461       | 309.887.502 €   | 242.921.996 €   | 79.2 %             |

## Valores nulos tras la normalización

| Columna                 | Nulos |
| ----------------------- | ----- |
| `pyme`                  | 260   |
| `instrumento`           | 272   |
| `area_sectorial`        | 177   |
| `cnae`                  | 1449  |
| `porcentaje_aportacion` | 56    |

Los valores vacíos del origen (cadenas vacías) se convierten a `NULL` en la ingesta:
`tipo_entidad`: 0 · `ccaa`: 0 · `provincia`: 0 · `localidad`: 0 · `tipo_ayuda`: 0 · `instrumento`: 272 · `area_sectorial`: 177 · `cnae`: 1449 · `origen_fondos`: 0.

## Normalización de categorías

Estrategia data-driven y reproducible: por columna, cada valor se limpia (espacios
recortados y colapsados, puntos finales eliminados) y las variantes que solo difieren en
mayúsculas/tildes se agrupan, eligiendo como valor canónico la variante más frecuente.
El mapa completo queda persistido en la tabla `category_mappings` de la base de datos.

| Columna                 | Valores originales | Valores limpios |
| ----------------------- | ------------------ | --------------- |
| `AreaSectorial`         | 59                 | 59              |
| `CCAA`                  | 18                 | 18              |
| `CNAE`                  | 19                 | 19              |
| `InstrumentoFinanciero` | 34                 | 34              |
| `Localidad`             | 2266               | 2245            |
| `OrigenFondos`          | 16                 | 16              |
| `Provincia`             | 51                 | 51              |
| `TipoAyuda`             | 2                  | 2               |
| `TipoEntidad`           | 8                  | 8               |

### Mapa «valor original → valor limpio» (solo entradas con cambios)

| Columna         | Original                                                                                            | Limpio                                                                                             | Registros |
| --------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| `AreaSectorial` | «Tecnologías Informáticas.»                                                                         | «Tecnologías Informáticas»                                                                         | 2186      |
| `AreaSectorial` | «Bienes de equipo.»                                                                                 | «Bienes de equipo»                                                                                 | 1614      |
| `AreaSectorial` | «Químico.»                                                                                          | «Químico»                                                                                          | 745       |
| `AreaSectorial` | «Fomento de las energías renovables y tecnologías emergentes.»                                      | «Fomento de las energías renovables y tecnologías emergentes»                                      | 702       |
| `AreaSectorial` | «Equipos, Sistemas y Servicios de Telecomunicaciones.»                                              | «Equipos, Sistemas y Servicios de Telecomunicaciones»                                              | 414       |
| `AreaSectorial` | «Optimización de las formas y utilizaciones convencionales de la energía.»                          | «Optimización de las formas y utilizaciones convencionales de la energía»                          | 316       |
| `AreaSectorial` | «Soluciones generales y sectoriales de negocio para pymes.»                                         | «Soluciones generales y sectoriales de negocio para pymes»                                         | 278       |
| `AreaSectorial` | «Biotecnología para la salud.»                                                                      | «Biotecnología para la salud»                                                                      | 274       |
| `AreaSectorial` | «Electrotecnia, equipos eléctricos y electrodomésticos.»                                            | «Electrotecnia, equipos eléctricos y electrodomésticos»                                            | 230       |
| `AreaSectorial` | «Tecnologías de combustión limpia y tecnologías emergentes.»                                        | «Tecnologías de combustión limpia y tecnologías emergentes»                                        | 197       |
| `AreaSectorial` | «Gestión y uso sostenible de los recursos naturales.»                                               | «Gestión y uso sostenible de los recursos naturales»                                               | 164       |
| `AreaSectorial` | «Infraestructuras.»                                                                                 | «Infraestructuras»                                                                                 | 144       |
| `AreaSectorial` | «Otra investigación farmacéutica.»                                                                  | «Otra investigación farmacéutica»                                                                  | 140       |
| `AreaSectorial` | «Equipamiento médico y para la salud.»                                                              | «Equipamiento médico y para la salud»                                                              | 134       |
| `AreaSectorial` | «Contexto (infraestructuras, seguridad y contenidos).»                                              | «Contexto (infraestructuras, seguridad y contenidos)»                                              | 115       |
| `AreaSectorial` | «Tecnologías moleculares y celulares de aplicación a la salud humana.»                              | «Tecnologías moleculares y celulares de aplicación a la salud humana»                              | 99        |
| `AreaSectorial` | «Cáncer.»                                                                                           | «Cáncer»                                                                                           | 81        |
| `AreaSectorial` | «Enfermedades crónicas e inflamación.»                                                              | «Enfermedades crónicas e inflamación»                                                              | 65        |
| `AreaSectorial` | «Agroalimentación.»                                                                                 | «Agroalimentación»                                                                                 | 52        |
| `AreaSectorial` | «Investigación traslacional sobre la salud humana.»                                                 | «Investigación traslacional sobre la salud humana»                                                 | 49        |
| `AreaSectorial` | «Enfermedades infecciosas y sida.»                                                                  | «Enfermedades infecciosas y sida»                                                                  | 45        |
| `AreaSectorial` | «Fomento de la investigación en salud pública, salud ambiental y laboral.»                          | «Fomento de la investigación en salud pública, salud ambiental y laboral»                          | 40        |
| `AreaSectorial` | «Enfermedades del sistema nervioso. »                                                               | «Enfermedades del sistema nervioso»                                                                | 38        |
| `AreaSectorial` | «Biotecnología industrial.»                                                                         | «Biotecnología industrial»                                                                         | 30        |
| `AreaSectorial` | «Enfermedades cardiovasculares.»                                                                    | «Enfermedades cardiovasculares»                                                                    | 28        |
| `AreaSectorial` | «Enfermedades respiratorias.»                                                                       | «Enfermedades respiratorias»                                                                       | 24        |
| `AreaSectorial` | «Enfermedades genéticas, modelos de enfermedad y terapia.»                                          | «Enfermedades genéticas, modelos de enfermedad y terapia»                                          | 14        |
| `AreaSectorial` | «Biología de sistemas, biología sintética y nanobiotecnología.»                                     | «Biología de sistemas, biología sintética y nanobiotecnología»                                     | 12        |
| `AreaSectorial` | «Economía del turismo y competitividad del sector turístico.»                                       | «Economía del turismo y competitividad del sector turístico»                                       | 9         |
| `AreaSectorial` | «Enfermedades mentales.»                                                                            | «Enfermedades mentales»                                                                            | 6         |
| `AreaSectorial` | «Gestión de las empresas del turismo.»                                                              | «Gestión de las empresas del turismo»                                                              | 6         |
| `AreaSectorial` | «Biotecnología ambiental.»                                                                          | «Biotecnología ambiental»                                                                          | 6         |
| `AreaSectorial` | «Planificación y gestión de los destinos turísticos.»                                               | «Planificación y gestión de los destinos turísticos»                                               | 4         |
| `AreaSectorial` | «El sistema nacional de salud como plataforma de desarrollo de Investigación científica y técnica.» | «El sistema nacional de salud como plataforma de desarrollo de Investigación científica y técnica» | 3         |
| `AreaSectorial` | «Bioenergía y desarrollo de biocombustible.»                                                        | «Bioenergía y desarrollo de biocombustible»                                                        | 2         |
| `Localidad`     | «MÓSTOLES»                                                                                          | «MOSTOLES»                                                                                         | 6         |
| `Localidad`     | «GIJÓN»                                                                                             | «GIJON»                                                                                            | 4         |
| `Localidad`     | «ALCORCÓN»                                                                                          | «ALCORCON»                                                                                         | 3         |
| `Localidad`     | «POZUELO DE ALARCÓN»                                                                                | «POZUELO DE ALARCON»                                                                               | 2         |
| `Localidad`     | «CÓRDOBA»                                                                                           | «CORDOBA»                                                                                          | 2         |
| `Localidad`     | «MÁLAGA»                                                                                            | «MALAGA»                                                                                           | 2         |
| `Localidad`     | «MATARÓ»                                                                                            | «MATARO»                                                                                           | 2         |
| `Localidad`     | «RIBA-ROJA DE TÚRIA»                                                                                | «RIBA-ROJA DE TURIA»                                                                               | 2         |
| `Localidad`     | «ALCÚDIA, L'»                                                                                       | «ALCUDIA, L'»                                                                                      | 1         |
| `Localidad`     | «ÁVILA»                                                                                             | «AVILA»                                                                                            | 1         |
| `Localidad`     | «ALMÀSSERA»                                                                                         | «ALMASSERA»                                                                                        | 1         |
| `Localidad`     | «JAÉN»                                                                                              | «JAEN»                                                                                             | 1         |
| `Localidad`     | «SEQUERO, EL (AGONCILLO)»                                                                           | «SEQUERO, EL (AGONCILLO)»                                                                          | 1         |
| `Localidad`     | «BÉTERA»                                                                                            | «BETERA»                                                                                           | 1         |
| `Localidad`     | «SEARA, A (SAN PEDRO DE MOR ALFOZ)»                                                                 | «SEARA, A (SAN PEDRO DE MOR ALFOZ)»                                                                | 1         |
| `Localidad`     | «PARQUE TECNOLOGICO (CAYES LLANERA)»                                                                | «PARQUE TECNOLOGICO (CAYES LLANERA)»                                                               | 1         |
| `Localidad`     | «VALL D'UIXÓ, LA»                                                                                   | «VALL D'UIXO, LA»                                                                                  | 1         |
| `Localidad`     | «VILANOVA DE AROUSA (CASCO URBANO)»                                                                 | «VILANOVA DE AROUSA (CASCO URBANO)»                                                                | 1         |
| `Localidad`     | «SANT JOAN DE MORÓ»                                                                                 | «SANT JOAN DE MORO»                                                                                | 1         |
| `Localidad`     | «ALMERÍA»                                                                                           | «ALMERIA»                                                                                          | 1         |
| `Localidad`     | «ALCALÁ DE HENARES»                                                                                 | «ALCALA DE HENARES»                                                                                | 1         |
| `Localidad`     | «ALGEMESÍ»                                                                                          | «ALGEMESI»                                                                                         | 1         |
| `Localidad`     | «LEGANÉS»                                                                                           | «LEGANES»                                                                                          | 1         |
| `Localidad`     | «LEÓN»                                                                                              | «LEON»                                                                                             | 1         |
| `Localidad`     | «LALÍN (CASCO URBANO)»                                                                              | «LALIN (CASCO URBANO)»                                                                             | 1         |
| `OrigenFondos`  | «Susceptible FEDER 2021-27 »                                                                        | «Susceptible FEDER 2021-27»                                                                        | 199       |

## Comprobaciones de consistencia

| Comprobación                                                 | Resultado                     |
| ------------------------------------------------------------ | ----------------------------- |
| Duplicados lógicos (mismo NIF + título + fecha)              | 1 grupos (1 filas extra)      |
| Registros con aportación > presupuesto                       | 0                             |
| Registros sin % de aportación calculable                     | 56                            |
| Códigos postales corregidos (4 dígitos → 5 con cero inicial) | 0                             |
| Códigos postales aún inválidos (≠ 5 dígitos)                 | 0                             |
| % de aportación (mín / mediana / media / máx)                | 3.17 / 75.00 / 73.33 / 100.00 |
| Presupuesto (mín / máx)                                      | 0 € / 80.521.957 €            |

## Empresas con más proyectos

| Empresa                                      | NIF       | Proyectos | Aportación total |
| -------------------------------------------- | --------- | --------- | ---------------- |
| AIRBUS DEFENCE AND SPACE SAU                 | A28006104 | 55        | 77.816.491 €     |
| AIRBUS OPERATIONS SL                         | B82875055 | 52        | 161.107.540 €    |
| TORRECID SA                                  | A12011946 | 45        | 23.641.866 €     |
| INGETEAM POWER TECHNOLOGY SOCIEDAD ANONIMA   | A95663852 | 41        | 36.812.858 €     |
| LABORATORIOS CINFA, S.A.                     | A31025398 | 36        | 34.443.533 €     |
| BSH ELECTRODOMESTICOS ESPAÑA SA              | A28893550 | 35        | 51.617.263 €     |
| REPSOL SA                                    | A78374725 | 33        | 23.936.626 €     |
| NOKIA SPAIN SA                               | A28016921 | 32        | 27.048.816 €     |
| INDUSTRIAS CARNICAS LORIENTE PIQUERAS, S.A.U | A16009870 | 31        | 12.054.725 €     |
| MAGTEL OPERACIONES SL                        | B14932305 | 31        | 10.950.467 €     |
