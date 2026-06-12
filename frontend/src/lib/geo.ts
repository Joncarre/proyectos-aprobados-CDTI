import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import ccaaTopo from '../assets/geo/ccaa.topo.json';
import provinciasTopo from '../assets/geo/provincias.topo.json';
import { echarts } from './echarts';
import { normalize } from './text';

export const CCAA_MAP = 'es-ccaa';
export const PROVINCIAS_MAP = 'es-provincias';

/**
 * The atlas (es-atlas, IGN-derived) uses official bilingual names; the database
 * uses the canonical names produced by the ingest. Features are renamed to the
 * canonical DB value so ECharts joins data by name with zero ambiguity.
 */
const EXPLICIT_ALIASES: Record<string, string> = {
  bizkaia: 'VIZCAYA',
  gipuzkoa: 'GUIPUZCOA',
  'illes balears': 'BALEARES', // province-level name in the DB
  'santa cruz de tenerife': 'STA. C. DE TENERIFE',
};

/** «PALMAS, LAS» → «las palmas» so it matches the atlas «Las Palmas». */
const matchKey = (name: string): string => {
  const inverted = name.replace(/^(.+), (EL|LA|LAS|LOS|L')$/i, '$2 $1');
  return normalize(inverted.trim());
};

/**
 * Resolves an atlas name (possibly bilingual, «Cataluña/Catalunya») to the
 * canonical DB name; returns the original name when there is no match
 * (e.g. Ceuta as CCAA: rendered, but without data).
 */
function resolveName(atlasName: string, canonicalByKey: Map<string, string>): string | null {
  if (atlasName.startsWith('Gibraltar')) return null; // not part of any dataset
  for (const part of atlasName.split('/')) {
    const key = normalize(part.trim());
    const explicit = EXPLICIT_ALIASES[key];
    if (explicit !== undefined) return explicit;
    const canonical = canonicalByKey.get(key);
    if (canonical !== undefined) return canonical;
  }
  return atlasName.split('/')[0] ?? atlasName;
}

function toGeoJson(
  topology: unknown,
  objectName: string,
  canonicalNames: string[],
): FeatureCollection {
  const topo = topology as Topology;
  const collection = feature(
    topo,
    topo.objects[objectName] as GeometryCollection<{ name: string }>,
  ) as FeatureCollection<Geometry, { name: string }>;

  const canonicalByKey = new Map(canonicalNames.map((name) => [matchKey(name), name]));
  const features = collection.features.flatMap((item) => {
    const resolved = resolveName(item.properties.name, canonicalByKey);
    if (resolved === null) return [];
    return [{ ...item, properties: { name: resolved } }];
  });
  return { type: 'FeatureCollection', features };
}

let registered = false;

/** Registers both Spain maps in ECharts, renaming regions to canonical DB names. */
export function registerSpainMaps(canonicalCcaa: string[], canonicalProvincias: string[]): void {
  if (registered) return;
  registered = true;
  echarts.registerMap(
    CCAA_MAP,
    toGeoJson(ccaaTopo, 'autonomous_regions', canonicalCcaa) as Parameters<
      typeof echarts.registerMap
    >[1],
  );
  echarts.registerMap(
    PROVINCIAS_MAP,
    toGeoJson(provinciasTopo, 'provinces', canonicalProvincias) as Parameters<
      typeof echarts.registerMap
    >[1],
  );
}
