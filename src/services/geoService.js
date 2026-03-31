export const GeoService = {
    async obtenerProvincias() {
        const resp = await fetch('https://apis.datos.gob.ar/georef/api/provincias');
        const data = await resp.json();
        return data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre));
    },

    async obtenerMunicipios(provinciaId) {
        const resp = await fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provinciaId}&max=500`);
        const data = await resp.json();
        return data.municipios.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
};