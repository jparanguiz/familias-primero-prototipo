/**
 * Regiones y comunas de Chile (16 regiones, 346 comunas), ordenadas de norte a sur.
 * El orden sirve para estimar cercanía entre regiones (vecinas = índices consecutivos).
 */
export interface Region {
  /** Número de la región (ej. "13" = Metropolitana). */
  id: string;
  name: string;
  comunas: string[];
}

export const REGIONS: Region[] = [
  { id: '15', name: "Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre", "General Lagos"] },
  { id: '1', name: "Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"] },
  { id: '2', name: "Antofagasta", comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"] },
  { id: '3', name: "Atacama", comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"] },
  { id: '4', name: "Coquimbo", comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"] },
  { id: '5', name: "Valparaíso", comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"] },
  { id: '13', name: "Metropolitana de Santiago", comunas: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"] },
  { id: '6', name: "Libertador Gral. Bernardo O’Higgins", comunas: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"] },
  { id: '7', name: "Maule", comunas: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"] },
  { id: '16', name: "Ñuble", comunas: ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Treguaco", "Bulnes", "Chillán Viejo", "Chillán", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"] },
  { id: '8', name: "Biobío", comunas: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"] },
  { id: '9', name: "Araucanía", comunas: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"] },
  { id: '14', name: "Los Ríos", comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"] },
  { id: '10', name: "Los Lagos", comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"] },
  { id: '11', name: "Aysén del Gral. Carlos Ibáñez del Campo", comunas: ["Coihaique", "Lago Verde", "Aisén", "Cisnes", "Guaitecas", "Cochrane", "O’Higgins", "Tortel", "Chile Chico", "Río Ibáñez"] },
  { id: '12', name: "Magallanes y de la Antártica Chilena", comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"] },
];

export function getRegion(id?: string | null): Region | undefined {
  return id ? REGIONS.find((r) => r.id === id) : undefined;
}

/** Minúsculas, sin tildes ni espacios sobrantes (para comparar textos). */
export function normGeo(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Busca una región por número o nombre ("13", "Metropolitana", "Región del Maule"). */
export function findRegion(text: string): Region | undefined {
  const t = normGeo(text).replace(/^region (de la |del |de los |de )?/, '');
  if (!t) return undefined;
  return REGIONS.find((r) => r.id === t || normGeo(r.name) === t || normGeo(r.name).startsWith(t));
}

/** Devuelve la comuna con su ortografía oficial si existe en la región. */
export function findComuna(regionId: string | undefined, text: string): string | undefined {
  const region = getRegion(regionId);
  const t = normGeo(text);
  return region?.comunas.find((c) => normGeo(c) === t);
}

export type Proximity = 'comuna' | 'region' | 'vecina' | 'lejana';

export interface ZoneSuggestion<Z> {
  zone: Z;
  proximity: Proximity;
}

export const PROXIMITY_LABEL: Record<Proximity, string> = {
  comuna: 'En tu comuna',
  region: 'En tu región',
  vecina: 'Región vecina',
  lejana: 'Otra región',
};

/**
 * Ordena las zonas por cercanía a la comuna del niño:
 * misma comuna → misma región → regiones vecinas (por distancia norte-sur) → resto.
 * Zonas sin ubicación quedan al final como "otra región".
 */
export function suggestZones<Z extends { name: string; regionId?: string; comuna?: string }>(
  zones: Z[],
  regionId: string,
  comuna: string
): ZoneSuggestion<Z>[] {
  const idx = (id?: string) => REGIONS.findIndex((r) => r.id === id);
  const home = idx(regionId);
  const score = (z: Z): { proximity: Proximity; rank: number } => {
    if (z.regionId === regionId && z.comuna && normGeo(z.comuna) === normGeo(comuna)) return { proximity: 'comuna', rank: 0 };
    if (z.regionId === regionId) return { proximity: 'region', rank: 1 };
    const zi = idx(z.regionId);
    if (zi < 0 || home < 0) return { proximity: 'lejana', rank: 1000 };
    const dist = Math.abs(zi - home);
    return { proximity: dist === 1 ? 'vecina' : 'lejana', rank: 1 + dist };
  };
  return zones
    .map((zone) => ({ zone, ...score(zone) }))
    .sort((a, b) => a.rank - b.rank || a.zone.name.localeCompare(b.zone.name))
    .map(({ zone, proximity }) => ({ zone, proximity }));
}
