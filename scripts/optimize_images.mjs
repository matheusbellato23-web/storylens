import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const filesToOptimize = [
  {
    input: 'assets/images/logo.png',
    outputs: [
      { file: 'assets/images/logo.webp', width: 400, format: 'webp', quality: 90 }
    ]
  },
  {
    input: 'assets/images/bts-ana-1.jpeg',
    outputs: [
      { file: 'assets/images/bts-ana-1.webp', width: 900, format: 'webp', quality: 82 }
    ]
  },
  {
    input: 'assets/images/foto-producao-1.jpeg',
    outputs: [
      { file: 'assets/images/foto-producao-1.webp', width: 800, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/foto_andressa_.jpg.jpeg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/foto_andressa_.webp', width: 800, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/aba_nova_ensaio_e_roteiro_externo/4bc0779c-0bbc-4913-ab55-d46768731187.jpg.jpeg',
    outputs: [
      { file: 'assets/drive_assets/aba_nova_ensaio_e_roteiro_externo/roteiro-foto.webp', width: 800, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/images/bts-bastidores-4.jpeg',
    outputs: [
      { file: 'assets/images/bts-bastidores-4.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/images/foto-camera.jpeg',
    outputs: [
      { file: 'assets/images/foto-camera.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/evento_3_.jpg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/evento_3_.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/foto_gi_.jpg.jpeg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/foto_gi_.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/andre_ia_.jpg.jpeg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/andre_ia_.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/img_3071.jpg.jpeg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/img_3071.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/evento_5_.jpg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/evento_5_.webp', width: 700, format: 'webp', quality: 80 }
    ]
  },
  {
    input: 'assets/drive_assets/bastidores/foto_.jpg__1_.jpeg',
    outputs: [
      { file: 'assets/drive_assets/bastidores/foto_prod_bastidor.webp', width: 700, format: 'webp', quality: 80 }
    ]
  }
];

async function run() {
  for (const item of filesToOptimize) {
    if (!fs.existsSync(item.input)) {
      console.warn('File not found:', item.input);
      continue;
    }
    const origStat = fs.statSync(item.input);
    for (const out of item.outputs) {
      const transformer = sharp(item.input);
      if (out.width) {
        transformer.resize({ width: out.width, withoutEnlargement: true });
      }
      transformer.webp({ quality: out.quality });
      await transformer.toFile(out.file);
      const newStat = fs.statSync(out.file);
      console.log(`Converted ${item.input} (${Math.round(origStat.size/1024)}KB) -> ${out.file} (${Math.round(newStat.size/1024)}KB)`);
    }
  }
  console.log('Optimization complete!');
}

run().catch(console.error);
