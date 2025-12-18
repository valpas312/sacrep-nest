import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Borrando datos previos...');

  await prisma.producto_vehiculos.deleteMany();
  await prisma.productos.deleteMany();
  await prisma.vehiculos.deleteMany();
  await prisma.categorias.deleteMany();
  await prisma.marcas.deleteMany();
  await prisma.fabricantes.deleteMany();

  console.log('✔ Tablas limpiadas');

  // ---------------------------------------------
  // FABRICANTES
  // ---------------------------------------------
  const fabricantes = ['Volkswagen', 'Peugeot', 'Fiat', 'Renault'];

  for (const nombre of fabricantes) {
    await prisma.fabricantes.create({
      data: { nombre },
    });
  }

  console.log('✔ Fabricantes listos');

  // ---------------------------------------------
  // MARCAS
  // ---------------------------------------------
  const marcas = [
    {
      nombre: 'LUK',
      imagen:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
    },
    {
      nombre: 'Frasle',
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
    },
    {
      nombre: 'Mazfren',
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
    },
    {
      nombre: 'Fremax',
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
    },
    {
      nombre: 'Corven',
      imagen:
        'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
    },
  ];

  for (const marca of marcas) {
    await prisma.marcas.create({ data: marca });
  }

  console.log('✔ Marcas listas');

  // ---------------------------------------------
  // CATEGORÍAS
  // ---------------------------------------------
  const categorias = ['Discos', 'Pastillas', 'Embragues', 'Amortiguadores'];

  for (const nombre of categorias) {
    await prisma.categorias.create({ data: { nombre } });
  }

  console.log('✔ Categorías listas');

  // ---------------------------------------------
  // VEHÍCULOS
  // ---------------------------------------------
  const vehiculos = [
    { nombre: 'Gol', desde: 1995, hasta: 2021, fabricante: 'Volkswagen' },
    { nombre: 'Vento', desde: 2006, hasta: 2024, fabricante: 'Volkswagen' },
    { nombre: 'Amarok', desde: 2010, hasta: 2024, fabricante: 'Volkswagen' },
    { nombre: 'Fox', desde: 2004, hasta: 2021, fabricante: 'Volkswagen' },

    { nombre: '208', desde: 2013, hasta: 2024, fabricante: 'Peugeot' },
    { nombre: '308', desde: 2012, hasta: 2024, fabricante: 'Peugeot' },
    { nombre: 'Partner', desde: 1997, hasta: 2024, fabricante: 'Peugeot' },
    { nombre: '206', desde: 1998, hasta: 2016, fabricante: 'Peugeot' },

    { nombre: 'Cronos', desde: 2018, hasta: 2024, fabricante: 'Fiat' },
    { nombre: 'Argo', desde: 2017, hasta: 2024, fabricante: 'Fiat' },
    { nombre: 'Palio', desde: 1996, hasta: 2018, fabricante: 'Fiat' },
    { nombre: 'Fiorino', desde: 1990, hasta: 2024, fabricante: 'Fiat' },

    { nombre: 'Clio', desde: 1996, hasta: 2016, fabricante: 'Renault' },
    { nombre: 'Kangoo', desde: 1998, hasta: 2024, fabricante: 'Renault' },
    { nombre: 'Sandero', desde: 2008, hasta: 2024, fabricante: 'Renault' },
    { nombre: 'Logan', desde: 2004, hasta: 2024, fabricante: 'Renault' },
  ];

  for (const v of vehiculos) {
    const fab = await prisma.fabricantes.findFirst({
      where: { nombre: v.fabricante },
    });

    await prisma.vehiculos.create({
      data: {
        nombre: v.nombre,
        desde: v.desde,
        hasta: v.hasta,
        fabricante_id: fab!.id,
      },
    });
  }

  console.log('✔ Vehículos listos');

  // ---------------------------------------------
  // PRODUCTOS (40)
  // ---------------------------------------------
  const productos = [
    // 1 - 10
    {
      sku: 'LUK-6001',
      nombre: 'Kit de embrague LUK para VW Gol',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Volkswagen',
      precio: 145000,
      imagen:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Gol',
    },
    {
      sku: 'LUK-6002',
      nombre: 'Kit de embrague LUK para Peugeot 208',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Peugeot',
      precio: 158000,
      imagen:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: '208',
    },

    {
      sku: 'FRA-8001',
      nombre: 'Pastillas de freno Frasle para VW Vento',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Volkswagen',
      precio: 19500,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Vento',
    },

    {
      sku: 'MAZ-9001',
      nombre: 'Pastillas Mazfren para Renault Clio',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Renault',
      precio: 16800,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: 'Clio',
    },

    {
      sku: 'FRX-3001',
      nombre: 'Discos Fremax para Fiat Cronos',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Fiat',
      precio: 46000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Cronos',
    },

    {
      sku: 'FRX-3002',
      nombre: 'Discos Fremax para VW Amarok',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Volkswagen',
      precio: 71000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Amarok',
    },

    {
      sku: 'COR-7001',
      nombre: 'Amortiguador Corven delantero para Sandero',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Renault',
      precio: 39500,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: 'Sandero',
    },

    {
      sku: 'COR-7002',
      nombre: 'Amortiguador Corven trasero para Fiorino',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Fiat',
      precio: 42000,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: 'Fiorino',
    },

    {
      sku: 'FRA-8002',
      nombre: 'Pastillas Frasle para Fiat Argo',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Fiat',
      precio: 18200,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Argo',
    },

    {
      sku: 'MAZ-9002',
      nombre: 'Pastillas Mazfren para Renault Logan',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Renault',
      precio: 17500,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: 'Logan',
    },

    // SIGUEN LOS 30 PRODUCTOS RESTANTES...
        // ---------------------------------------------
    // 11–20
    // ---------------------------------------------
    {
      sku: 'LUK-6003',
      nombre: 'Kit de embrague LUK para VW Fox',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Volkswagen',
      precio: 142000,
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Fox',
    },
    {
      sku: 'LUK-6004',
      nombre: 'Kit de embrague LUK para Renault Kangoo',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Renault',
      precio: 168500,
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Kangoo',
    },
    {
      sku: 'LUK-6005',
      nombre: 'Kit de embrague LUK para Fiat Palio',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Fiat',
      precio: 133000,
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Palio',
    },
    {
      sku: 'LUK-6006',
      nombre: 'Kit de embrague LUK para Peugeot Partner',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Peugeot',
      precio: 170000,
      imagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Partner',
    },
    {
      sku: 'FRA-8003',
      nombre: 'Pastillas Frasle para VW Amarok',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Volkswagen',
      precio: 23000,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Amarok',
    },
    {
      sku: 'FRA-8004',
      nombre: 'Pastillas Frasle para Renault Sandero',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Renault',
      precio: 21000,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Sandero',
    },
    {
      sku: 'FRA-8005',
      nombre: 'Pastillas Frasle para Fiat Cronos',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Fiat',
      precio: 19500,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Cronos',
    },
    {
      sku: 'FRA-8006',
      nombre: 'Pastillas Frasle para Peugeot 308',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Peugeot',
      precio: 21800,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: '308',
    },
    {
      sku: 'MAZ-9003',
      nombre: 'Pastillas Mazfren para Renault Kangoo',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Renault',
      precio: 16900,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: 'Kangoo',
    },
    {
      sku: 'MAZ-9004',
      nombre: 'Pastillas Mazfren para Fiat Argo',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Fiat',
      precio: 17800,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: 'Argo',
    },

    // ---------------------------------------------
    // 21–30
    // ---------------------------------------------
    {
      sku: 'MAZ-9005',
      nombre: 'Pastillas Mazfren para VW Vento',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Volkswagen',
      precio: 22500,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: 'Vento',
    },
    {
      sku: 'MAZ-9006',
      nombre: 'Pastillas Mazfren para Peugeot 208',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Peugeot',
      precio: 18100,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: '208',
    },
    {
      sku: 'FRX-3003',
      nombre: 'Discos Fremax para Renault Logan',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Renault',
      precio: 55500,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Logan',
    },
    {
      sku: 'FRX-3004',
      nombre: 'Discos Fremax para Fiat Argo',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Fiat',
      precio: 49200,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Argo',
    },
    {
      sku: 'FRX-3005',
      nombre: 'Discos Fremax para VW Fox',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Volkswagen',
      precio: 47000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Fox',
    },
    {
      sku: 'FRX-3006',
      nombre: 'Discos Fremax para Peugeot Partner',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Peugeot',
      precio: 53000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Partner',
    },
    {
      sku: 'COR-7003',
      nombre: 'Amortiguador Corven para Renault Logan',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Renault',
      precio: 45500,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: 'Logan',
    },
    {
      sku: 'COR-7004',
      nombre: 'Amortiguador Corven para Peugeot 206',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Peugeot',
      precio: 38500,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: '206',
    },
    {
      sku: 'COR-7005',
      nombre: 'Amortiguador Corven para VW Gol',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Volkswagen',
      precio: 39900,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: 'Gol',
    },
    {
      sku: 'COR-7006',
      nombre: 'Amortiguador Corven para Fiat Fiorino',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Fiat',
      precio: 41000,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: 'Fiorino',
    },

    // ---------------------------------------------
    // 31–40
    // ---------------------------------------------
    {
      sku: 'LUK-6007',
      nombre: 'Kit de embrague LUK para Renault Sandero',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Renault',
      precio: 162000,
      imagen:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Sandero',
    },
    {
      sku: 'FRX-3007',
      nombre: 'Discos Fremax para VW Vento',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Volkswagen',
      precio: 62000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Vento',
    },
    {
      sku: 'FRA-8007',
      nombre: 'Pastillas Frasle para Renault Kangoo',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Renault',
      precio: 20500,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Kangoo',
    },
    {
      sku: 'MAZ-9007',
      nombre: 'Pastillas Mazfren para Fiat Fiorino',
      marca: 'Mazfren',
      categoria: 'Pastillas',
      fabricante: 'Fiat',
      precio: 17800,
      imagen:
        'https://lh5.googleusercontent.com/proxy/L51WrtFWyz_Xt3GQ85kI9l1yoVCdc12w0cQSCuZiLZwm7NSPPLNRJlfumdKV-UH1jtjjeCZyLvW8S-zIlLYCfGxklhMLkVs29hk10ReGASDtLR38q6y4vm1dVeZwZWjeKg',
      vehiculo: 'Fiorino',
    },
    {
      sku: 'COR-7007',
      nombre: 'Amortiguador Corven para VW Amarok',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Volkswagen',
      precio: 59000,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: 'Amarok',
    },
    {
      sku: 'FRX-3008',
      nombre: 'Discos Fremax para Renault Clio',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Renault',
      precio: 52000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: 'Clio',
    },
    {
      sku: 'FRA-8008',
      nombre: 'Pastillas Frasle para Fiat Palio',
      marca: 'Frasle',
      categoria: 'Pastillas',
      fabricante: 'Fiat',
      precio: 18700,
      imagen: 'https://rofren.com.bo/wp-content/uploads/2024/12/Logo-Frasle-PNG.png',
      vehiculo: 'Palio',
    },
    {
      sku: 'LUK-6008',
      nombre: 'Kit de embrague LUK para VW Amarok',
      marca: 'LUK',
      categoria: 'Embragues',
      fabricante: 'Volkswagen',
      precio: 185000,
      imagen:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/LuK_logo.svg/1200px-LuK_logo.svg.png',
      vehiculo: 'Amarok',
    },
    {
      sku: 'FRX-3009',
      nombre: 'Discos de freno Fremax para Peugeot 208',
      marca: 'Fremax',
      categoria: 'Discos',
      fabricante: 'Peugeot',
      precio: 51000,
      imagen: 'https://www.autoexperts.parts/images/fremax.svg',
      vehiculo: '208',
    },
    {
      sku: 'COR-7008',
      nombre: 'Amortiguador Corven delantero para Peugeot 308',
      marca: 'Corven',
      categoria: 'Amortiguadores',
      fabricante: 'Peugeot',
      precio: 44500,
      imagen: 'https://www.martinmorris.ar/images/500/brand/corvenautopartes.png',
      vehiculo: '308',
    },
  ];

  console.log('✔ Productos listos, insertando compatibilidades...');

  // ---------------------------------------------
  // INSERTAR PRODUCTOS + COMPATIBILIDADES
  // ---------------------------------------------
  for (const p of productos) {
    const marca = await prisma.marcas.findFirst({ where: { nombre: p.marca } });
    const categoria = await prisma.categorias.findFirst({
      where: { nombre: p.categoria },
    });
    const fabricante = await prisma.fabricantes.findFirst({
      where: { nombre: p.fabricante },
    });
    const vehiculo = await prisma.vehiculos.findFirst({
      where: { nombre: p.vehiculo },
    });

    const nuevoProducto = await prisma.productos.create({
      data: {
        sku: p.sku,
        nombre: p.nombre,
        imagen: p.imagen,
        hay_stock: true,
        precio: p.precio,
        marca: marca!.id,
        categoria: categoria!.id,
        fabricante: fabricante!.id,
      },
    });

    await prisma.producto_vehiculos.create({
      data: {
        producto_id: nuevoProducto.id,
        vehiculo_id: vehiculo!.id,
      },
    });
  }

  console.log('🎉 SEED COMPLETO: Todo cargado correctamente.');
}

// Ejecutar
main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
  });
